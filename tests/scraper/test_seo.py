"""Tests for canonical metadata and search discovery files."""

from __future__ import annotations

from pathlib import Path

from bs4 import BeautifulSoup

from scraper.seo import canonical_url, inject_canonical_metadata
from scraper.writer import write_search_discovery


def test_canonical_url_uses_directory_style_paths() -> None:
    assert canonical_url("https://refugiodelsatiro.es/", "/") == (
        "https://refugiodelsatiro.es/"
    )
    assert canonical_url("https://refugiodelsatiro.es", "/calendario") == (
        "https://refugiodelsatiro.es/calendario/"
    )


def test_inject_canonical_metadata_replaces_upstream_value() -> None:
    soup = BeautifulSoup(
        '<html><head><link rel="canonical" href="https://sites.google.com/old">'
        "</head><body></body></html>",
        "html.parser",
    )

    inject_canonical_metadata(
        soup,
        canonical_origin="https://test.refugiodelsatiro.es",
        path="/calendario",
    )

    canonical_links = soup.select('link[rel="canonical"]')
    assert len(canonical_links) == 1
    assert canonical_links[0]["href"] == (
        "https://test.refugiodelsatiro.es/calendario/"
    )


def test_write_search_discovery_uses_only_configured_origin(tmp_path: Path) -> None:
    robots_path, sitemap_path = write_search_discovery(
        target_dir=tmp_path,
        canonical_origin="https://refugiodelsatiro.es",
        paths=("/calendario", "/"),
    )

    assert robots_path.read_text() == (
        "User-agent: *\n"
        "Allow: /\n"
        "Sitemap: https://refugiodelsatiro.es/sitemap.xml\n"
    )
    assert sitemap_path.read_text() == (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        "  <url><loc>https://refugiodelsatiro.es/</loc></url>\n"
        "  <url><loc>https://refugiodelsatiro.es/calendario/</loc></url>\n"
        "</urlset>\n"
    )
    assert not (tmp_path / "robots.txt.tmp").exists()
    assert not (tmp_path / "sitemap.xml.tmp").exists()
