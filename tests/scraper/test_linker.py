"""Tests for scraper.linker URL classification and normalization."""

from __future__ import annotations

import pytest

from scraper.linker import canonicalize_path, is_internal_href, rewrite_href


class TestKnownSiteHosts:
    @pytest.mark.parametrize(
        ("href", "expected"),
        (
            (
                "https://sites.google.com/view/refugiodelsatiro/calendario",
                "/calendario",
            ),
            ("/view/refugiodelsatiro/calendario", "/calendario"),
            ("https://refugiodelsatiro.es/calendario", "/calendario"),
            ("https://www.refugiodelsatiro.es/calendario", "/calendario"),
            ("https://test.refugiodelsatiro.es/calendario", "/calendario"),
        ),
    )
    def test_internal_links_rewrite_to_canonical_local_paths(
        self, href: str, expected: str
    ) -> None:
        assert is_internal_href(href) is True
        assert rewrite_href(href) == expected

    def test_google_sites_root_rewrites_to_local_root(self) -> None:
        href = "https://sites.google.com/view/refugiodelsatiro/"

        assert rewrite_href(href) == "/"

    def test_unrelated_google_site_remains_external(self) -> None:
        href = "https://sites.google.com/view/another-site/calendario"

        assert is_internal_href(href) is False
        assert rewrite_href(href) == href


class TestCanonicalizeGoogleSitesPath:
    @pytest.mark.parametrize(
        "href",
        (
            "/view/refugiodelsatiro/Juegos-de-Rol/campa%C3%B1as",
            "https://sites.google.com/view/refugiodelsatiro/Juegos-de-Rol/campa%C3%B1as",
        ),
    )
    def test_mount_prefix_is_removed_before_path_normalization(self, href: str) -> None:
        assert canonicalize_path(href) == "/juegos-de-rol/campanas"
