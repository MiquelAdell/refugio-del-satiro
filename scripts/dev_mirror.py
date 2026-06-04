"""Development content-mirror server.

Wraps `http.server.SimpleHTTPRequestHandler` to mirror the `redir` rules
defined in `Caddyfile`, so dev behaviour matches production. Keep
`REDIRECTS` in sync with the `redir` lines in `Caddyfile`.

Run via `dev.sh`; not intended for direct invocation in production (Caddy
handles those redirects there).
"""

from __future__ import annotations

import http.server
import socketserver
import sys
from functools import partial
from pathlib import Path
from urllib.parse import unquote

PORT = 8080
MIRROR_DIR = Path(__file__).resolve().parent.parent / "frontend" / "public" / "content-mirror"

# Mirror of the `redir` lines in Caddyfile. Keys are matched against the
# *decoded* URL path, so percent-encoded variants (e.g. `campa%C3%B1as`) are
# handled by the same entry as the literal `campañas`.
REDIRECTS: dict[str, str] = {
    "/inicio": "/",
    "/inicio/": "/",
    "/socios/ludoteca": "/ludoteca",
    "/socios/ludoteca/": "/ludoteca",
    "/Validacion-Membresia": "/validacion",
    "/Validacion-Membresia/": "/validacion",
    "/juegos-de-rol/campañas": "/juegos-de-rol/campanas",
    "/juegos-de-rol/campañas/": "/juegos-de-rol/campanas/",
}


def redirect_target(path: str) -> str | None:
    """Extract redirect target for a path, or None if no redirect applies.

    Args:
        path: The request path (may be percent-encoded, may have query string).
              Query strings are stripped before lookup.

    Returns:
        The target path if a redirect applies, or None otherwise.
    """
    decoded = unquote(path.split("?", 1)[0])
    return REDIRECTS.get(decoded)


class MirrorHandler(http.server.SimpleHTTPRequestHandler):
    def _redirect_target(self) -> str | None:
        return redirect_target(self.path)

    def do_GET(self) -> None:  # noqa: N802 — http.server API
        target = self._redirect_target()
        if target is not None:
            self.send_response(301)
            self.send_header("Location", target)
            self.end_headers()
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802 — http.server API
        target = self._redirect_target()
        if target is not None:
            self.send_response(301)
            self.send_header("Location", target)
            self.end_headers()
            return
        super().do_HEAD()


def main() -> int:
    if not MIRROR_DIR.is_dir():
        print(f"Mirror directory not found: {MIRROR_DIR}", file=sys.stderr)
        return 1

    handler_cls = partial(MirrorHandler, directory=str(MIRROR_DIR))
    with socketserver.TCPServer(("", PORT), handler_cls) as httpd:
        print(f"Dev mirror serving {MIRROR_DIR} at http://localhost:{PORT}")
        httpd.serve_forever()
    return 0


if __name__ == "__main__":
    sys.exit(main())
