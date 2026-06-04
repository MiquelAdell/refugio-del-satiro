"""Configuration for the content-mirror scraper.

Isolates site-specific selectors and URL rules so when Google Sites renames a
class or we rearrange output, only this module needs to change.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# Origin we scrape. No trailing slash.
SOURCE_ORIGIN = "https://www.refugiodelsatiro.es"

# Canonical list of paths we must always emit, in the canonical form used by
# our Caddy routing table. The enumerator treats this as both a seed and a
# post-crawl assertion — any missing page is fetched explicitly.
REQUIRED_PATHS: tuple[str, ...] = (
    "/",
    "/calendario",
    "/juegos-de-rol",
    "/juegos-de-rol/campanas",
    "/juegos-de-rol/oneshots",
    "/juegos-de-mesa",
    "/juegos-de-mesa/dias-de-juegos",
    "/eventos",
    "/eventos/diurnes-satir",
    "/eventos/festa-major",
    "/eventos/24h-mesa",
    "/faq",
    "/faq/normas-de-conducta",
    "/socios",
    "/socios/entidades-amigas",
)

# Paths we refuse to scrape. They either duplicate content (/inicio) or are
# slated for replacement by our own React routes and redirected in Caddy.
SKIP_PATHS: frozenset[str] = frozenset(
    {
        "/inicio",
        "/socios/ludoteca",
        "/validacion-membresia",
    }
)

# Strategy: keep the *entire* Sites document (head + body) so inline styles,
# Google Fonts links, and the gstatic CSS bundle continue to style the page.
# Strip only known Sites chrome that is either JS-only (non-functional without
# scripts) or branded as "Google Sites" (Report-abuse trailer, Site-actions
# bar, edit toolbar). Everything else — header nav, user footer, OG meta
# tags, etc. — is preserved verbatim.

# Deliberately empty: we keep Sites' output verbatim — scripts, iframes,
# cookie notice, "Report abuse" trailer, "Last edited" indicator, everything.
# The only transformations we perform are link rewriting (to canonical local
# paths), image rehosting (to `_assets/`), and a `<base>` strip so those link
# rewrites aren't undone. Notes + functionality match the live Sites site
# 1:1.
STRIP_SELECTORS: tuple[str, ...] = ()

# The content shell we still use for *sanity checking* after a strip: if this
# element isn't present in the resulting page, something went very wrong and
# we'd rather fail loud than write a chrome-only page.
SANITY_CONTENT_SELECTOR = 'div[jsname="ZBtY8b"]'

# Host patterns we rehost locally (images + background-image urls).
REHOSTED_IMAGE_HOST_SUBSTRINGS: tuple[str, ...] = (
    "googleusercontent.com",
    "ggpht.com",
    "gstatic.com/images",
)

# Redirect rules written into Caddy. Maps an old path to the canonical one.
REDIRECTS: tuple[tuple[str, str], ...] = (
    ("/inicio", "/"),
    ("/inicio/", "/"),
    ("/socios/ludoteca", "/ludoteca"),
    ("/socios/ludoteca/", "/ludoteca"),
    ("/Validacion-Membresia", "/validacion"),
    ("/Validacion-Membresia/", "/validacion"),
    ("/juegos-de-rol/campa%C3%B1as", "/juegos-de-rol/campanas"),
    ("/juegos-de-rol/campañas", "/juegos-de-rol/campanas"),
)


@dataclass(frozen=True)
class ScraperConfig:
    """Runtime knobs. Immutable; call replace() to override in tests."""

    origin: str = SOURCE_ORIGIN
    output_dir: Path = field(
        default_factory=lambda: Path("frontend/public/content-mirror")
    )
    assets_subdir: str = "_assets"
    manifest_file: str = "_manifest.json"
    user_agent: str = (
        "refugio-del-satiro-content-scraper/0.1 "
        "(+https://github.com/MiquelAdell/refugio-del-satiro)"
    )
    request_timeout_s: float = 30.0
    max_retries: int = 3
    concurrent_requests: int = 5
    max_crawl_depth: int = 4
    # If a run deletes more than this fraction of previously emitted pages,
    # the writer aborts the run. Guard against a Sites outage wiping the
    # mirror in a single sweep.
    max_page_deletion_ratio: float = 0.5


def default_config() -> ScraperConfig:
    return ScraperConfig()
