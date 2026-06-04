"""Tests for scraper/nav_extractor.py."""

from __future__ import annotations

from pathlib import Path

from bs4 import BeautifulSoup

from scraper.nav_extractor import NavItem, extract_nav

# ---------------------------------------------------------------------------
# HTML fixtures
# ---------------------------------------------------------------------------

_HEADER_TEMPLATE = """\
<html><body>
<header id="atIdViewHeader">
  <nav id="yuynLe" class="JzO0Vc">
    <ul class="jYxBte Fpy8Db">
      {items}
    </ul>
  </nav>
</header>
</body></html>
"""

_ANCHOR = "<a href='{href}'>{label}</a>"


def _li(label: str, href: str, *children: tuple[str, str]) -> str:
    """Build a top-level `<li>` with an optional list of child anchors.

    Mirrors the Google Sites markup: the parent anchor lives in a `<div>`,
    and L2 children sit as later `<a>` descendants inside the same `<li>`.
    """
    head = _ANCHOR.format(href=href, label=label)
    rest = "".join(_ANCHOR.format(href=c_href, label=c_label) for c_label, c_href in children)
    return f"<li><div>{head}</div>{rest}</li>"


def _html(*items: tuple[str, str]) -> str:
    """Build a minimal header HTML with the given (label, href) pairs."""
    rendered = "\n      ".join(_li(label, href) for label, href in items)
    return _HEADER_TEMPLATE.format(items=rendered)


def _html_with_children(
    *items: tuple[str, str, tuple[tuple[str, str], ...]],
) -> str:
    """Build a minimal header HTML where each top-level item can have children."""
    rendered = "\n      ".join(
        _li(label, href, *children) for label, href, children in items
    )
    return _HEADER_TEMPLATE.format(items=rendered)


def _parse(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "html.parser")


# Common fixture data
_INICIO = NavItem(label="Inicio", href="/")
_CALENDARIO = NavItem(label="Calendario", href="/calendario")
_EVENTOS = NavItem(label="Eventos", href="/eventos")
_PRESTAMOS = NavItem(label="Préstamos", href="/prestamos")
_PRESTAMOS_INFO = NavItem(label="Préstamos Info", href="/prestamos-info")

_HAPPY_HTML = _html(
    ("Inicio", "/"),
    ("Calendario", "/calendario"),
    ("Eventos", "/eventos"),
    ("Préstamos", "/prestamos"),
)
_HAPPY_EXPECTED = (_INICIO, _CALENDARIO, _EVENTOS)


class TestNavExtractor:
    # ------------------------------------------------------------------
    # Happy path
    # ------------------------------------------------------------------

    def test_happy_path_returns_non_prestamos_items_in_order(self) -> None:
        doc = _parse(_HAPPY_HTML)
        assert extract_nav(doc) == _HAPPY_EXPECTED

    # ------------------------------------------------------------------
    # Empty / missing header
    # ------------------------------------------------------------------

    def test_empty_nav_ul_returns_empty_tuple(self) -> None:
        doc = _parse(_HEADER_TEMPLATE.format(items=""))
        assert extract_nav(doc) == ()

    def test_missing_header_returns_empty_tuple(self) -> None:
        doc = _parse("<html><body><p>no header here</p></body></html>")
        assert extract_nav(doc) == ()

    def test_wrong_nav_id_returns_empty_tuple(self) -> None:
        html = """\
<html><body>
<header id="atIdViewHeader">
  <nav id="otherNav">
    <ul><li><a href="/inicio">Inicio</a></li></ul>
  </nav>
</header>
</body></html>"""
        doc = _parse(html)
        assert extract_nav(doc) == ()

    # ------------------------------------------------------------------
    # Skip rules
    # ------------------------------------------------------------------

    def test_fragment_only_href_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Jump", "#section-1"),
                ("Calendario", "/calendario"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _CALENDARIO)

    def test_absolute_external_url_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("External", "https://example.com/page"),
                ("Calendario", "/calendario"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _CALENDARIO)

    def test_http_absolute_url_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("External HTTP", "http://example.com/x"),
            )
        )
        assert extract_nav(doc) == (_INICIO,)

    def test_prestamos_exact_excluded(self) -> None:
        doc = _parse(_html(("Inicio", "/"), ("Préstamos", "/prestamos")))
        assert extract_nav(doc) == (_INICIO,)

    def test_prestamos_subpath_excluded(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Catálogo", "/prestamos/"),
                ("Mis préstamos", "/prestamos/my-loans"),
            )
        )
        assert extract_nav(doc) == (_INICIO,)

    def test_prestamos_info_boundary_kept(self) -> None:
        """'/prestamos-info' must NOT be excluded — exclusion is prefix-anchored."""
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Préstamos Info", "/prestamos-info"),
                ("Préstamos", "/prestamos"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _PRESTAMOS_INFO)

    # ------------------------------------------------------------------
    # Deduplication
    # ------------------------------------------------------------------

    def test_duplicate_items_deduplicated_first_wins(self) -> None:
        doc = _parse(
            _html(
                ("Inicio", "/"),
                ("Calendario", "/calendario"),
                ("Inicio", "/"),
            )
        )
        assert extract_nav(doc) == (_INICIO, _CALENDARIO)

    def test_same_href_different_labels_not_deduplicated(self) -> None:
        """Dedup key is (label, href). Same href + different label → two items."""
        item_a = NavItem(label="Home", href="/")
        item_b = NavItem(label="Inicio", href="/")
        doc = _parse(_html(("Home", "/"), ("Inicio", "/")))
        assert extract_nav(doc) == (item_a, item_b)


# ---------------------------------------------------------------------------
# Real-DOM smoke: extract against the live scraped index.html
# ---------------------------------------------------------------------------

_REAL_MIRROR = Path(__file__).resolve().parents[2] / "frontend" / "public" / "content-mirror" / "index.html"


class TestRealMirror:
    def test_extracts_expected_top_level_and_children_from_real_index_html(
        self,
    ) -> None:
        """Guards the chosen DOM traversal against the actual scraped HTML."""
        doc = BeautifulSoup(_REAL_MIRROR.read_text(encoding="utf-8"), "lxml")
        assert extract_nav(doc) == (
            NavItem(label="Inicio", href="/inicio"),
            NavItem(label="Calendario", href="/calendario"),
            NavItem(
                label="Juegos de Rol",
                href="/juegos-de-rol",
                children=(
                    NavItem(label="Campañas", href="/juegos-de-rol/campanas"),
                    NavItem(label="Oneshots", href="/juegos-de-rol/oneshots"),
                ),
            ),
            NavItem(
                label="Juegos de Mesa",
                href="/juegos-de-mesa",
                children=(
                    NavItem(
                        label="Días de Juegos",
                        href="/juegos-de-mesa/dias-de-juegos",
                    ),
                ),
            ),
            NavItem(
                label="Eventos",
                href="/eventos",
                children=(
                    NavItem(label="Diürnes del Sàtir", href="/eventos/diurnes-satir"),
                    NavItem(label="Festa Major de Sabadell", href="/eventos/festa-major"),
                    NavItem(label="24h Juegos de Mesa", href="/eventos/24h-mesa"),
                ),
            ),
            NavItem(
                label="FAQ",
                href="/faq",
                children=(
                    NavItem(label="Normas de conducta", href="/faq/normas-de-conducta"),
                ),
            ),
            NavItem(
                label="Socios",
                href="/socios",
                children=(
                    NavItem(label="Entidades Amigas", href="/socios/entidades-amigas"),
                    NavItem(label="Ludoteca", href="/socios/ludoteca"),
                ),
            ),
        )

    def test_child_skip_rules_apply_independently(self) -> None:
        """Children inherit the same skip rules as parents (fragments, /prestamos, abs)."""
        html = _html_with_children(
            (
                "Eventos",
                "/eventos",
                (
                    ("Diürnes", "/eventos/diurnes-satir"),
                    ("Jump", "#section-1"),
                    ("External", "https://example.com/x"),
                    ("Prestamos sub", "/prestamos/foo"),
                    ("Boundary", "/prestamos-info"),
                ),
            ),
        )
        doc = _parse(html)
        result = extract_nav(doc)
        assert result == (
            NavItem(
                label="Eventos",
                href="/eventos",
                children=(
                    NavItem(label="Diürnes", href="/eventos/diurnes-satir"),
                    NavItem(label="Boundary", href="/prestamos-info"),
                ),
            ),
        )

    def test_top_level_without_children_has_empty_children_tuple(self) -> None:
        doc = _parse(_html(("Inicio", "/"), ("Calendario", "/calendario")))
        assert extract_nav(doc) == (
            NavItem(label="Inicio", href="/", children=()),
            NavItem(label="Calendario", href="/calendario", children=()),
        )

    def test_duplicate_children_deduplicated_first_wins(self) -> None:
        html = _html_with_children(
            (
                "Eventos",
                "/eventos",
                (
                    ("Diürnes", "/eventos/diurnes-satir"),
                    ("Diürnes", "/eventos/diurnes-satir"),
                    ("Festa Major", "/eventos/festa-major"),
                ),
            ),
        )
        doc = _parse(html)
        result = extract_nav(doc)
        assert result == (
            NavItem(
                label="Eventos",
                href="/eventos",
                children=(
                    NavItem(label="Diürnes", href="/eventos/diurnes-satir"),
                    NavItem(label="Festa Major", href="/eventos/festa-major"),
                ),
            ),
        )
