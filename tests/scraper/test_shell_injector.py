"""Tests for scraper.shell_injector."""

from __future__ import annotations

from bs4 import BeautifulSoup

from scraper.shell_injector import inject_site_shell

_SCRIPT_SRC = "/_assets/site-shell.js"
_MOUNT_ID = "site-shell-root"


def _make_soup(body_content: str = "<header><nav>nav</nav></header><main>content</main>") -> BeautifulSoup:
    html = f"<!doctype html><html><head></head><body>{body_content}</body></html>"
    return BeautifulSoup(html, "html.parser")


class TestInjectSiteShell:
    def test_inserts_mount_div_as_first_body_child(self) -> None:
        soup = _make_soup()
        inject_site_shell(soup)
        body = soup.find("body")
        assert body is not None
        first_child = next(body.children)  # type: ignore[union-attr]
        assert getattr(first_child, "get", lambda _: None)("id") == _MOUNT_ID

    def test_appends_script_before_body_close(self) -> None:
        soup = _make_soup()
        inject_site_shell(soup)
        scripts = soup.find_all("script", src=_SCRIPT_SRC)
        assert len(scripts) == 1
        assert scripts[0].get("defer") is not None or scripts[0].get("defer") == ""

    def test_marks_google_sites_header_with_data_attribute(self) -> None:
        soup = _make_soup()
        inject_site_shell(soup)
        header = soup.find("header")
        assert header is not None
        assert header.get("data-gs-header") == "1"

    def test_idempotent_mount_div(self) -> None:
        soup = _make_soup()
        inject_site_shell(soup)
        inject_site_shell(soup)
        mounts = soup.find_all(id=_MOUNT_ID)
        assert len(mounts) == 1

    def test_idempotent_script_tag(self) -> None:
        soup = _make_soup()
        inject_site_shell(soup)
        inject_site_shell(soup)
        scripts = soup.find_all("script", src=_SCRIPT_SRC)
        assert len(scripts) == 1

    def test_no_header_element_does_not_crash(self) -> None:
        soup = _make_soup(body_content="<main>no header here</main>")
        inject_site_shell(soup)
        assert soup.find(id=_MOUNT_ID) is not None

    def test_no_body_element_does_not_crash(self) -> None:
        soup = BeautifulSoup("<html><head></head></html>", "html.parser")
        inject_site_shell(soup)
        # Should silently do nothing without raising.

    def test_mount_div_positioned_before_original_header(self) -> None:
        soup = _make_soup()
        inject_site_shell(soup)
        body = soup.find("body")
        assert body is not None
        children = [c for c in body.children if hasattr(c, "name")]
        names = [c.name for c in children]
        assert names.index("div") < names.index("header")
