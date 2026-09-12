#!/usr/bin/env bash
# Create, validate, upload, and rotate production database snapshots.
set -euo pipefail

umask 077

readonly PROJECT_DIR="${PROJECT_DIR:-/root/refugio-del-satiro}"
readonly SERVICE="${BACKUP_COMPOSE_SERVICE:-app}"
readonly CONTAINER_DB_PATH="${BACKUP_CONTAINER_DB_PATH:-/app/data/db/refugio.db}"
readonly STAGING_DIR="${BACKUP_STAGING_DIR:-/var/lib/refugio-backup}"
readonly LOCK_FILE="${BACKUP_LOCK_FILE:-/run/lock/refugio-backup.lock}"
readonly RCLONE_CONFIG="${RCLONE_CONFIG:-/root/.config/rclone/rclone.conf}"
readonly REMOTE_DIR="${BACKUP_REMOTE_DIR:-refugio-drive:Backups/refugio-del-satiro/database}"
readonly RETAIN_COUNT="${BACKUP_RETAIN_COUNT:-14}"

if ! [[ "$RETAIN_COUNT" =~ ^[1-9][0-9]*$ ]]; then
    echo "BACKUP_RETAIN_COUNT must be a positive integer." >&2
    exit 2
fi

dry_run=false
case "${1:-}" in
    "") ;;
    --dry-run) dry_run=true ;;
    -h|--help)
        echo "Usage: $0 [--dry-run]"
        echo "  --dry-run  Create and validate a staged snapshot without using rclone."
        exit 0
        ;;
    *)
        echo "Unknown argument: $1" >&2
        exit 2
        ;;
esac

compose() {
    docker compose --project-directory "$PROJECT_DIR" "$@"
}

mkdir -p "$STAGING_DIR" "$(dirname "$LOCK_FILE")"
chmod 0700 "$STAGING_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "Another database backup is already running." >&2
    exit 1
fi

readonly snapshot_name="refugio-$(date -u +%Y%m%dT%H%M%SZ).db"
container_snapshot="/tmp/${snapshot_name}"
staged_snapshot="${STAGING_DIR}/${snapshot_name}"
rotation_list=""
keep_staged=false

cleanup() {
    local exit_status=$?
    trap - EXIT INT TERM

    if [[ -n "$container_snapshot" ]]; then
        compose exec -T "$SERVICE" rm -f "$container_snapshot" >/dev/null 2>&1 || true
    fi
    if [[ -n "$rotation_list" ]]; then
        rm -f "$rotation_list"
    fi
    if [[ "$keep_staged" != true && -n "$staged_snapshot" ]]; then
        rm -f "$staged_snapshot"
    fi

    exit "$exit_status"
}
trap cleanup EXIT INT TERM

if [[ -e "$staged_snapshot" ]]; then
    echo "Snapshot already exists: $staged_snapshot" >&2
    exit 1
fi

echo "Creating consistent SQLite snapshot $snapshot_name"
compose exec -T "$SERVICE" python - "$CONTAINER_DB_PATH" "$container_snapshot" <<'PY'
import os
import sqlite3
import sys

source_path, snapshot_path = sys.argv[1:]
source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
snapshot = sqlite3.connect(snapshot_path)
try:
    source.backup(snapshot)
finally:
    snapshot.close()
    source.close()

os.chmod(snapshot_path, 0o600)
check = sqlite3.connect(f"file:{snapshot_path}?mode=ro", uri=True)
try:
    result = check.execute("PRAGMA quick_check").fetchall()
finally:
    check.close()

if result != [("ok",)]:
    raise SystemExit(f"SQLite quick_check failed: {result!r}")
PY

# The SQLite connections are closed before the snapshot leaves the container.
compose cp "${SERVICE}:${container_snapshot}" "$staged_snapshot"
chmod 0600 "$staged_snapshot"

snapshot_size=$(wc -c <"$staged_snapshot" | tr -d '[:space:]')
if [[ "$snapshot_size" -le 0 ]]; then
    echo "Snapshot is empty: $staged_snapshot" >&2
    exit 1
fi

if [[ "$dry_run" == true ]]; then
    keep_staged=true
    echo "Dry run complete; validated snapshot retained at $staged_snapshot ($snapshot_size bytes)."
    exit 0
fi

echo "Uploading $snapshot_name"
rclone --config "$RCLONE_CONFIG" copyto "$staged_snapshot" "${REMOTE_DIR}/${snapshot_name}"

# rclone size returns one object for the exact remote file. Verify both object
# count and byte count before any retention deletion is allowed to run.
remote_size_json=$(rclone --config "$RCLONE_CONFIG" size "${REMOTE_DIR}/${snapshot_name}" --json)
read -r remote_count remote_size < <(
    python3 -c 'import json, sys; value=json.load(sys.stdin); print(value["count"], value["bytes"])' \
        <<<"$remote_size_json"
)
if [[ "$remote_count" != 1 || "$remote_size" != "$snapshot_size" ]]; then
    echo "Remote verification failed (count=$remote_count, bytes=$remote_size, expected=$snapshot_size)." >&2
    exit 1
fi

rotation_list=$(mktemp "${STAGING_DIR}/rotation.XXXXXX")
rclone --config "$RCLONE_CONFIG" lsf "$REMOTE_DIR" --files-only >"$rotation_list"

# Timestamp names sort chronologically. The strict pattern deliberately ignores
# all unrelated files in the backup directory.
mapfile -t expired_snapshots < <(
    sed -n '/^refugio-[0-9]\{8\}T[0-9]\{6\}Z\.db$/p' "$rotation_list" \
        | LC_ALL=C sort -r \
        | tail -n "+$((RETAIN_COUNT + 1))"
)

for expired_snapshot in "${expired_snapshots[@]}"; do
    echo "Deleting expired snapshot $expired_snapshot"
    rclone --config "$RCLONE_CONFIG" deletefile "${REMOTE_DIR}/${expired_snapshot}"
done

echo "Backup complete: ${REMOTE_DIR}/${snapshot_name} ($snapshot_size bytes)"
