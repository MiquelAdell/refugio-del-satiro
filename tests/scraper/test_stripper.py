from __future__ import annotations

from scraper.stripper import strip


def test_strip_removes_google_runtime_but_keeps_embedded_content() -> None:
    result = strip(
        """
        <html><head><title>Home - Refugio</title><script src="https://www.gstatic.com/runtime.js"></script></head>
        <body><div jsname="ZBtY8b">Visible content<iframe src="https://calendar.google.com/embed"></iframe></div>
        <noscript>Google fallback</noscript></body></html>
        """
    )

    assert result.title == "Refugio"
    assert result.document.select("script") == []
    assert result.document.select("noscript") == []
    assert result.document.select_one("iframe") is not None
    assert "Visible content" in result.document.get_text()
