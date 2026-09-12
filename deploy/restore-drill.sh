#!/usr/bin/env bash
# Download and validate an off-box SQLite snapshot without touching production.
# Usage: ./deploy/restore-drill.sh <snapshot-name> [--expect-members N] [--expect-games N] [--expect-loans N]
set -euo pipefail

readonly RCLONE_CONFIG="${RCLONE_CONFIG:-/root/.config/rclone/rclone.conf}"
readonly REMOTE_DIR="${BACKUP_REMOTE_DIR:-refugio-drive:Backups/refugio-del-satiro/database}"
readonly STAGING_DIR="${RESTORE_DRILL_STAGING_DIR:-/var/lib/refugio-restore}"

usage() {
    echo "Usage: $0 <refugio-YYYYMMDDTHHMMSSZ.db> [--expect-members N] [--expect-games N] [--expect-loans N]"
    echo "Downloads one snapshot, verifies its remote byte count and SQLite integrity, and prints core table counts."
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

snapshot_name="${1:-}"
if ! [[ "$snapshot_name" =~ ^refugio-[0-9]{8}T[0-9]{6}Z\.db$ ]]; then
    usage >&2
    exit 2
fi
shift

expected_members=""
expected_games=""
expected_loans=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --expect-members|--expect-games|--expect-loans)
            [[ $# -ge 2 && "$2" =~ ^[0-9]+$ ]] || { echo "Expected a non-negative integer after $1." >&2; exit 2; }
            case "$1" in
                --expect-members) expected_members="$2" ;;
                --expect-games) expected_games="$2" ;;
                --expect-loans) expected_loans="$2" ;;
            esac
            shift 2
            ;;
        *)
            echo "Unknown argument: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

mkdir -p "$STAGING_DIR"
chmod 0700 "$STAGING_DIR"
restore_dir=$(mktemp -d "${STAGING_DIR}/drill.XXXXXX")
snapshot_path="${restore_dir}/${snapshot_name}"

cleanup() {
    rm -f "$snapshot_path"
    rmdir "$restore_dir" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

remote_size_json=$(rclone --config "$RCLONE_CONFIG" size "${REMOTE_DIR}/${snapshot_name}" --json)
read -r remote_count remote_size < <(
    python3 -c 'import json, sys; value=json.load(sys.stdin); print(value["count"], value["bytes"])' \
        <<<"$remote_size_json"
)
if [[ "$remote_count" != 1 || ! "$remote_size" =~ ^[1-9][0-9]*$ ]]; then
    echo "Remote snapshot verification failed (count=$remote_count, bytes=$remote_size)." >&2
    exit 1
fi

echo "Downloading $snapshot_name for a non-destructive restore drill"
rclone --config "$RCLONE_CONFIG" copyto "${REMOTE_DIR}/${snapshot_name}" "$snapshot_path"
local_size=$(wc -c <"$snapshot_path" | tr -d '[:space:]')
if [[ "$local_size" != "$remote_size" ]]; then
    echo "Downloaded byte count ($local_size) does not match remote ($remote_size)." >&2
    exit 1
fi

SNAPSHOT_PATH="$snapshot_path" \
EXPECTED_MEMBERS="$expected_members" \
EXPECTED_GAMES="$expected_games" \
EXPECTED_LOANS="$expected_loans" \
python3 - <<'PY'
import os
import sqlite3

path = os.environ["SNAPSHOT_PATH"]
expected = {
    "members": os.environ["EXPECTED_MEMBERS"],
    "games": os.environ["EXPECTED_GAMES"],
    "loans": os.environ["EXPECTED_LOANS"],
}
required = {"games", "members", "loans", "password_tokens", "schema_migrations"}

db = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
try:
    integrity = db.execute("PRAGMA integrity_check").fetchall()
    tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}
    missing = required - tables
    if missing:
        raise SystemExit(f"missing expected tables: {sorted(missing)}")
    counts = {table: db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0] for table in expected}
finally:
    db.close()

if integrity != [("ok",)]:
    raise SystemExit(f"integrity_check failed: {integrity!r}")
for table, expected_count in expected.items():
    if expected_count and counts[table] != int(expected_count):
        raise SystemExit(f"{table} count is {counts[table]}, expected {expected_count}")

print("integrity_check: ok")
print("counts: " + ", ".join(f"{table}={counts[table]}" for table in sorted(counts)))
PY

echo "Restore drill passed: $snapshot_name ($local_size bytes)."
