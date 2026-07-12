"""Inject the React site-shell embed into a scraped static page.

Each static content-mirror page needs:
  1. A ``<div id="site-shell-root">`` as the first child of ``<body>`` — the
     mount point for the React SiteHeader bundle.
  2. A ``data-gs-header`` attribute on the original Google Sites ``<header>``
     element so the bundle's CSS can hide it without depending on obfuscated
     class names.
  3. A ``<script src="/_assets/site-shell.js" defer>`` tag before ``</body>``
     that loads the IIFE bundle.
  4. A ``<link rel="icon" href="/ludoteca/favicon.png">`` replacing any Google
     Sites icon links, so the tab icon matches the app's own favicon.

All mutations are applied in-place to the BeautifulSoup document passed
in.  The function is idempotent: calling it twice on the same document is safe
(duplicate ``#site-shell-root`` divs and script tags are not inserted).
"""

from __future__ import annotations

from bs4 import BeautifulSoup, Tag

_SCRIPT_SRC = "/_assets/site-shell.js"
_MOUNT_ID = "site-shell-root"
_FAVICON_HREF = "/ludoteca/favicon.png"


def inject_site_shell(soup: BeautifulSoup) -> None:
    """Mutate *soup* in-place to include the site-shell embed scaffolding."""
    body = soup.find("body")
    if not isinstance(body, Tag):
        return

    # 1. Mark the Google Sites <header> so the bundle can hide it via CSS
    #    without depending on obfuscated class names.
    header = soup.find("header")
    if isinstance(header, Tag) and not header.get("data-gs-header"):
        header["data-gs-header"] = "1"

    # 2. Insert the mount div as the very first child of <body> (idempotent).
    if not soup.find(id=_MOUNT_ID):
        mount_div = soup.new_tag("div", id=_MOUNT_ID)
        body.insert(0, mount_div)

    # 3. Append the script tag before </body> (idempotent).
    already_injected = any(
        isinstance(tag, Tag) and tag.get("src") == _SCRIPT_SRC
        for tag in body.find_all("script")
    )
    if not already_injected:
        script_tag = soup.new_tag("script", src=_SCRIPT_SRC, defer="")
        body.append(script_tag)

    # 4. Replace any Google Sites favicon with the app's own (idempotent:
    #    existing links pointing at _FAVICON_HREF are kept as-is).
    head = soup.find("head")
    if isinstance(head, Tag):
        icon_links = [
            tag
            for tag in head.find_all("link")
            if isinstance(tag, Tag)
            and any("icon" in rel.lower() for rel in tag.get("rel") or [])
        ]
        if not any(tag.get("href") == _FAVICON_HREF for tag in icon_links):
            for tag in icon_links:
                tag.decompose()
            favicon_tag = soup.new_tag(
                "link", rel="icon", type="image/png", href=_FAVICON_HREF
            )
            head.append(favicon_tag)
