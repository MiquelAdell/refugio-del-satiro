"""Tests for the dev content-mirror wrapper.

Three layers:
  - unit tests: redirect_target() pure function with concrete values
  - drift test: the REDIRECTS map in scripts/dev_mirror.py covers every
    `redir <left> <right>` line in Caddyfile (excluding root-level redirects
    Caddy still serves but dev doesn't expose).
  - integration test: spin up the MirrorHandler in-process and assert the
    accented (`campañas`) and percent-encoded (`campa%C3%B1as`) paths both
    return 301 → `/juegos-de-rol/campanas/`.
"""

from __future__ import annotations

import re
import threading
from http.client import HTTPConnection
from http.server import HTTPServer
from pathlib import Path
from urllib.parse import unquote

import pytest

from scripts.dev_mirror import REDIRECTS, MirrorHandler, redirect_target

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
CADDYFILE = REPO_ROOT / "Caddyfile"


class TestRedirectTarget:
    """Unit tests for redirect_target() pure function."""

    # url-1: Accented URL redirect
    def test_redirect_target_accented_campanas_with_slash(self) -> None:
        result = redirect_target("/juegos-de-rol/campañas/")
        assert result == "/juegos-de-rol/campanas/"

    def test_redirect_target_accented_campanas_without_slash(self) -> None:
        result = redirect_target("/juegos-de-rol/campañas")
        assert result == "/juegos-de-rol/campanas"

    # url-2: Percent-encoded variant
    def test_redirect_target_encoded_campanas_with_slash(self) -> None:
        result = redirect_target("/juegos-de-rol/campa%C3%B1as/")
        assert result == "/juegos-de-rol/campanas/"

    def test_redirect_target_encoded_campanas_without_slash(self) -> None:
        result = redirect_target("/juegos-de-rol/campa%C3%B1as")
        assert result == "/juegos-de-rol/campanas"

    # Additional: inicio redirects
    def test_redirect_target_inicio_without_slash(self) -> None:
        result = redirect_target("/inicio")
        assert result == "/"

    def test_redirect_target_inicio_with_slash(self) -> None:
        result = redirect_target("/inicio/")
        assert result == "/"

    # Additional: socios/ludoteca redirects
    def test_redirect_target_socios_ludoteca_without_slash(self) -> None:
        result = redirect_target("/socios/ludoteca")
        assert result == "/ludoteca"

    def test_redirect_target_socios_ludoteca_with_slash(self) -> None:
        result = redirect_target("/socios/ludoteca/")
        assert result == "/ludoteca"

    # Additional: Validacion-Membresia redirects (case-sensitive)
    def test_redirect_target_validacion_membresia_without_slash(self) -> None:
        result = redirect_target("/Validacion-Membresia")
        assert result == "/ludoteca/validacion"

    def test_redirect_target_validacion_membresia_with_slash(self) -> None:
        result = redirect_target("/Validacion-Membresia/")
        assert result == "/ludoteca/validacion"

    def test_redirect_target_validacion_membresia_legacy_casing(self) -> None:
        result = redirect_target("/Validacion-membresia")
        assert result == "/ludoteca/validacion"

    def test_redirect_target_validacion_shorthand(self) -> None:
        result = redirect_target("/validacion")
        assert result == "/ludoteca/validacion"

    # Additional: prestamos → ludoteca redirect
    def test_redirect_target_prestamos(self) -> None:
        result = redirect_target("/prestamos")
        assert result == "/ludoteca/"

    # Non-redirected path should return None
    def test_redirect_target_non_redirected_path(self) -> None:
        result = redirect_target("/calendario")
        assert result is None

    def test_redirect_target_non_redirected_path_with_slash(self) -> None:
        result = redirect_target("/calendario/")
        assert result is None

    # Query strings should be stripped
    def test_redirect_target_with_query_string(self) -> None:
        result = redirect_target("/inicio?foo=bar")
        assert result == "/"

    def test_redirect_target_campanas_with_query_string(self) -> None:
        result = redirect_target("/juegos-de-rol/campañas?v=1")
        assert result == "/juegos-de-rol/campanas"


def _caddyfile_redirects() -> dict[str, str]:
    """Extract `redir <left> <right> [permanent]` pairs from the Caddyfile.

    Keys are the decoded source path so they match the dev wrapper's
    decoded-path lookup.
    """
    pattern = re.compile(r"^\s*redir\s+(\S+)\s+(\S+)(?:\s+\S+)?\s*$")
    pairs: dict[str, str] = {}
    for line in CADDYFILE.read_text().splitlines():
        match = pattern.match(line)
        if match is None:
            continue
        source, target = match.group(1), match.group(2)
        # Skip matcher-token redirects — named matchers (`redir
        # @needs_trailing_slash …`) and wildcards (`redir * …` inside a
        # `handle` block) — which are not literal path-to-path mappings.
        if source.startswith("@") or source == "*":
            continue
        pairs[unquote(source)] = target
    return pairs


class TestCaddyfileDrift:
    """url-3: Verify REDIRECTS map matches Caddyfile redir rules."""

    def test_dev_redirects_match_caddyfile_redirects(self) -> None:
        """Assert every Caddy `redir` line has a corresponding REDIRECTS entry.

        Regex pattern matches `redir <path> <target> [permanent]` syntax.
        Named matchers (e.g., `@needs_trailing_slash`) are skipped since they
        are not literal path-to-path mappings that dev's REDIRECTS can express.
        """
        caddy = _caddyfile_redirects()
        assert caddy == REDIRECTS, (
            "scripts/dev_mirror.py REDIRECTS has drifted from Caddyfile. "
            f"Missing from dev: {set(caddy) - set(REDIRECTS)}; "
            f"extra in dev: {set(REDIRECTS) - set(caddy)}"
        )


@pytest.fixture
def mirror_server(tmp_path: Path):
    handler_cls = lambda *args, **kw: MirrorHandler(  # noqa: E731
        *args, directory=str(tmp_path), **kw
    )
    server = HTTPServer(("127.0.0.1", 0), handler_cls)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_address
    finally:
        server.shutdown()
        server.server_close()


class TestMirrorHandlerIntegration:
    """Integration tests: spin up MirrorHandler and verify HTTP redirects."""

    @pytest.mark.parametrize(
        "request_path,expected_location",
        [
            # url-1: Percent-encoded accented URL (raw non-ASCII is rejected
            # by http.client at the client side — a harness limitation, not a
            # server bug. Raw-ñ paths are covered by TestRedirectTarget unit
            # tests calling the pure function directly.)
            ("/juegos-de-rol/campa%C3%B1as/", "/juegos-de-rol/campanas/"),
            ("/juegos-de-rol/campa%C3%B1as", "/juegos-de-rol/campanas"),
            # inicio
            ("/inicio", "/"),
            ("/inicio/", "/"),
            # socios/ludoteca
            ("/socios/ludoteca", "/ludoteca"),
            ("/socios/ludoteca/", "/ludoteca"),
            # Validacion-Membresia (case-sensitive)
            ("/Validacion-Membresia", "/ludoteca/validacion"),
            ("/Validacion-Membresia/", "/ludoteca/validacion"),
            ("/Validacion-membresia", "/ludoteca/validacion"),
            ("/validacion", "/ludoteca/validacion"),
            # prestamos → ludoteca
            ("/prestamos", "/ludoteca/"),
        ],
    )
    def test_mirror_handler_redirects(
        self, mirror_server: tuple[str, int], request_path: str, expected_location: str
    ) -> None:
        host, port = mirror_server
        conn = HTTPConnection(host, port)
        conn.request("GET", request_path)
        response = conn.getresponse()
        response.read()
        conn.close()
        assert response.status == 301
        assert response.getheader("Location") == expected_location
