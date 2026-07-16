from __future__ import annotations

import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from html import unescape

import httpx


@dataclass(frozen=True)
class BggGame:
    bgg_id: int
    name: str
    thumbnail_url: str
    year_published: int
    collection_id: int | None = None
    # BGG's per-copy collection entry id ("collid") — unique per owned item,
    # unlike bgg_id/objectid, which BGG can share across distinct products
    # (e.g. reskinned variants). None when scraped from HTML (no collid
    # available there); the importer falls back to bgg_id-keyed matching.
    image_url: str = ""
    # Full-size image captured from this entry's own collection XML <image>,
    # distinct per copy even when several copies share one objectid.


@dataclass(frozen=True)
class BggGameDetails:
    bgg_id: int
    image_url: str
    thumbnail_url: str
    min_players: int
    max_players: int
    playing_time: int
    bgg_rating: float
    description: str
    categories: tuple[str, ...]
    min_age: int = 0
    primary_tag: str = ""


@dataclass(frozen=True)
class BggRpgItem:
    bgg_id: int
    name: str
    thumbnail_url: str
    image_url: str
    year_published: int
    bgg_rating: float
    description: str
    collection_id: int | None = None
    categories: tuple[str, ...] = ()
    publication_types: tuple[str, ...] = ()
    details_loaded: bool = True


@dataclass(frozen=True)
class _RpgDetails:
    """Internal typed container for RPG item details fetched from the thing API."""

    image_url: str
    thumbnail_url: str
    year_published: int
    bgg_rating: float
    description: str
    categories: tuple[str, ...]
    publication_types: tuple[str, ...]


def _normalize_classifications(values: list[str]) -> tuple[str, ...]:
    cleaned = sorted(
        (value.strip() for value in values if value.strip()),
        key=lambda value: (value.casefold(), value),
    )
    return tuple(
        value
        for index, value in enumerate(cleaned)
        if index == 0 or value.casefold() != cleaned[index - 1].casefold()
    )


def _element_int_value(item: ET.Element, element_name: str) -> int:
    element = item.find(element_name)
    if element is None:
        return 0
    return int(element.get("value", "0") or element.text or "0")


def _rank_value(rank: ET.Element) -> int | None:
    """Parse a <rank>'s numeric value attribute, or None if unranked/unparsable."""
    try:
        return int(rank.get("value", ""))
    except ValueError:
        return None


def _primary_tag(item: ET.Element) -> str:
    """Resolve the game's primary BGG subdomain (family rank) tag.

    Selection hierarchy: among all `rank type="family"` entries, pick the one
    with the best (lowest) numeric rank value; entries with an unparsable
    ("Not Ranked") value lose to any numeric one, and if all are unranked,
    the first family entry wins. Returns "" when there is no family rank.
    """
    family_ranks = [
        rank
        for rank in item.findall("statistics/ratings/ranks/rank")
        if rank.get("type") == "family"
    ]
    if not family_ranks:
        return ""

    ranked = [(rank, _rank_value(rank)) for rank in family_ranks]
    numeric = [(rank, value) for rank, value in ranked if value is not None]
    if numeric:
        best_rank, _ = min(numeric, key=lambda pair: pair[1])
        return best_rank.get("name", "") or ""
    return family_ranks[0].get("name", "") or ""


_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


_IMAGE_ID_PATTERN = re.compile(r"pic(\d+)\.")


class BggClient:
    XML_API_URL = "https://boardgamegeek.com/xmlapi2/collection"
    THING_API_URL = "https://boardgamegeek.com/xmlapi2/thing"
    IMAGES_API_URL = "https://api.geekdo.com/api/images"
    WEB_URL = "https://boardgamegeek.com/collection/user"
    MAX_RETRIES = 5
    INITIAL_BACKOFF = 5.0

    def __init__(self, username: str, bearer_token: str | None = None) -> None:
        self._username = username
        self._bearer_token = bearer_token

    def fetch_owned_games(self) -> list[BggGame]:
        """Try XML API first, fall back to HTML scraping if blocked."""
        games = self._try_xml_api()
        if games is not None:
            return games
        return self._scrape_collection_page()

    def _get_auth_headers(self) -> dict[str, str]:
        if self._bearer_token:
            return {"Authorization": f"Bearer {self._bearer_token}"}
        return {}

    def _try_xml_api(self) -> list[BggGame] | None:
        url = f"{self.XML_API_URL}?username={self._username}&own=1&stats=0"
        headers = self._get_auth_headers()
        backoff = self.INITIAL_BACKOFF

        for _attempt in range(self.MAX_RETRIES):
            try:
                response = httpx.get(url, headers=headers, timeout=30.0)
            except httpx.HTTPError:
                return None

            if response.status_code == 200:
                return self._parse_xml_collection(response.text)

            if response.status_code == 202:
                time.sleep(backoff)
                backoff *= 2
                continue

            # API is blocking us (401, 403, etc.) — fall back
            return None

        return None

    def _scrape_collection_page(self) -> list[BggGame]:
        """Scrape the BGG collection HTML page as a fallback."""
        games: list[BggGame] = []
        page = 1

        while True:
            url = (
                f"{self.WEB_URL}/{self._username}"
                f"?subtype=boardgame&own=1&ff=1&pageID={page}"
            )
            response = httpx.get(
                url, headers=_BROWSER_HEADERS, timeout=30.0, follow_redirects=True
            )
            response.raise_for_status()

            page_games = self._parse_html_collection(response.text)
            if not page_games:
                break

            games.extend(page_games)
            page += 1

            # Safety limit
            if page > 50:
                break

        return games

    def _parse_html_collection(self, html: str) -> list[BggGame]:
        """Parse games from the BGG collection HTML table.

        No per-copy collection entry id is available from this page, so
        ``collection_id`` stays ``None`` — the importer degrades to
        bgg_id-keyed matching for this fallback path, same as before
        collection-id-based identity was introduced.
        """
        games: list[BggGame] = []

        # Find all rows with game links: /boardgame/12345/game-name
        game_pattern = re.compile(
            r'href="/boardgame/(\d+)[^"]*"[^>]*>\s*([^<]+)</a>',
        )
        # Thumbnail pattern
        thumb_pattern = re.compile(
            r'<img[^>]+src="(https://cf\.geekdo-images\.com/[^"]+)"[^>]*/?>',
        )
        # Year pattern — typically in parentheses like (2017)
        year_pattern = re.compile(r"\((\d{4})\)")

        # Split by table rows to associate data
        rows = re.split(r"<tr\s", html)

        for row in rows:
            game_match = game_pattern.search(row)
            if not game_match:
                continue

            bgg_id = int(game_match.group(1))
            name = unescape(game_match.group(2).strip())

            thumb_match = thumb_pattern.search(row)
            thumbnail = thumb_match.group(1) if thumb_match else ""

            year_match = year_pattern.search(row)
            year = int(year_match.group(1)) if year_match else 0

            games.append(
                BggGame(
                    bgg_id=bgg_id,
                    name=name,
                    thumbnail_url=thumbnail,
                    year_published=year,
                )
            )

        return games

    def _resolve_display_image_url(self, image_url: str) -> str:
        """Resolve a BGG image URL to the "medium" (fit-in 500x500) variant.

        BGG's own <image>/<thumbnail> XML fields only offer the full-resolution
        original or a tiny 200x150 crop — nothing sized for a catalog card. The
        geekdo images API exposes a "medium" preset that's much closer to what
        we display, so we look it up by image id and fall back to the original
        URL if that lookup fails for any reason.
        """
        match = _IMAGE_ID_PATTERN.search(image_url)
        if not match:
            return image_url

        try:
            response = httpx.get(
                f"{self.IMAGES_API_URL}/{match.group(1)}", timeout=15.0
            )
        except httpx.HTTPError:
            return image_url

        if response.status_code != 200:
            return image_url

        try:
            return response.json()["images"]["medium"]["url"] or image_url
        except (KeyError, TypeError, ValueError):
            return image_url

    def fetch_details(
        self, bgg_ids: list[int], batch_size: int = 20
    ) -> dict[int, BggGameDetails]:
        """Fetch complete board-game details from the BGG thing API.

        Returns a mapping of bgg_id → BggGameDetails.
        """
        headers = self._get_auth_headers()
        details: dict[int, BggGameDetails] = {}

        for i in range(0, len(bgg_ids), batch_size):
            batch = bgg_ids[i : i + batch_size]
            ids_param = ",".join(str(bid) for bid in batch)
            url = f"{self.THING_API_URL}?id={ids_param}&stats=1"

            try:
                response = httpx.get(url, headers=headers, timeout=30.0)
            except httpx.HTTPError:
                continue

            if response.status_code != 200:
                continue

            root = ET.fromstring(response.text)
            for item in root.findall("item"):
                bgg_id = int(item.get("id", "0"))
                image_el = item.find("image")
                image_url = (
                    image_el.text if image_el is not None and image_el.text else ""
                )
                if image_url:
                    image_url = self._resolve_display_image_url(image_url)
                thumb_el = item.find("thumbnail")
                thumbnail_url = (
                    thumb_el.text if thumb_el is not None and thumb_el.text else ""
                )

                min_p = _element_int_value(item, "minplayers")
                max_p = _element_int_value(item, "maxplayers")
                play_time = _element_int_value(item, "playingtime")
                min_age = _element_int_value(item, "minage")
                primary_tag = _primary_tag(item)

                # Rating is in statistics/ratings/average
                rating = 0.0
                stats = item.find("statistics")
                if stats is not None:
                    ratings = stats.find("ratings")
                    if ratings is not None:
                        avg = ratings.find("average")
                        if avg is not None:
                            rating = float(avg.get("value", "0") or "0")

                description_el = item.find("description")
                description = (
                    unescape(description_el.text)
                    if description_el is not None and description_el.text
                    else ""
                )
                categories = _normalize_classifications(
                    [
                        link.get("value", "")
                        for link in item.findall("link")
                        if link.get("type") == "boardgamecategory"
                    ]
                )

                details[bgg_id] = BggGameDetails(
                    bgg_id=bgg_id,
                    image_url=image_url,
                    thumbnail_url=thumbnail_url,
                    min_players=min_p,
                    max_players=max_p,
                    playing_time=play_time,
                    bgg_rating=round(rating, 2),
                    description=description,
                    categories=categories,
                    min_age=min_age,
                    primary_tag=primary_tag,
                )

            if i + batch_size < len(bgg_ids):
                time.sleep(1.0)

        return details

    def _parse_xml_collection(self, xml_text: str) -> list[BggGame]:
        root = ET.fromstring(xml_text)

        def _text(item: ET.Element, tag: str) -> str:
            el = item.find(tag)
            return el.text if el is not None and el.text else ""

        return [
            BggGame(
                bgg_id=int(item.get("objectid", "0")),
                collection_id=(
                    int(collection_id)
                    if (collection_id := item.get("collid")) is not None
                    else None
                ),
                name=_text(item, "name") or "Unknown",
                thumbnail_url=_text(item, "thumbnail"),
                image_url=_text(item, "image"),
                year_published=(
                    int(_text(item, "yearpublished"))
                    if _text(item, "yearpublished")
                    else 0
                ),
            )
            for item in root.findall("item")
        ]

    def fetch_owned_rpg_items(self) -> list[BggRpgItem]:
        """Fetch RPG items (libros de rol) owned by the collection user from BGG."""
        collection_items = self._fetch_rpg_collection()
        if not collection_items:
            return []

        bgg_ids = [item.bgg_id for item in collection_items]
        details = self._fetch_rpg_details(bgg_ids)

        return [
            BggRpgItem(
                bgg_id=item.bgg_id,
                collection_id=item.collection_id,
                name=item.name,
                # Prefer this entry's own image/thumbnail (per copy, from the
                # collection XML) over the shared thing-API details, which
                # BGG can pool across several distinct owned items sharing
                # one bgg_id (see BggGame.collection_id).
                thumbnail_url=(
                    item.thumbnail_url
                    or (
                        details[item.bgg_id].thumbnail_url
                        if item.bgg_id in details
                        else ""
                    )
                ),
                image_url=(
                    item.image_url
                    or (
                        details[item.bgg_id].image_url if item.bgg_id in details else ""
                    )
                ),
                year_published=(
                    details[item.bgg_id].year_published or item.year_published
                    if item.bgg_id in details
                    else item.year_published
                ),
                bgg_rating=(
                    details[item.bgg_id].bgg_rating if item.bgg_id in details else 0.0
                ),
                description=(
                    details[item.bgg_id].description if item.bgg_id in details else ""
                ),
                categories=(
                    details[item.bgg_id].categories if item.bgg_id in details else ()
                ),
                publication_types=(
                    details[item.bgg_id].publication_types
                    if item.bgg_id in details
                    else ()
                ),
                details_loaded=item.bgg_id in details,
            )
            for item in collection_items
        ]

    def _fetch_rpg_collection(self) -> list[BggGame]:
        """Fetch the RPG collection via the XML API. Raises on failure after retries."""
        url = (
            f"{self.XML_API_URL}"
            f"?username={self._username}&subtype=rpgitem&own=1&stats=1"
        )
        headers = self._get_auth_headers()
        backoff = self.INITIAL_BACKOFF

        for _attempt in range(self.MAX_RETRIES):
            try:
                response = httpx.get(url, headers=headers, timeout=30.0)
            except httpx.HTTPError as exc:
                raise RuntimeError(
                    f"HTTP error fetching RPG collection: {exc}"
                ) from exc

            if response.status_code == 200:
                return self._parse_xml_collection(response.text)

            if response.status_code == 202:
                time.sleep(backoff)
                backoff *= 2
                continue

            response.raise_for_status()

        raise RuntimeError(
            f"BGG RPG collection API did not respond after {self.MAX_RETRIES} retries"
        )

    def _fetch_rpg_details(
        self, bgg_ids: list[int], batch_size: int = 20
    ) -> dict[int, _RpgDetails]:
        """Fetch RPG item details from the BGG thing API in batches."""
        headers = self._get_auth_headers()
        details: dict[int, _RpgDetails] = {}

        for i in range(0, len(bgg_ids), batch_size):
            batch = bgg_ids[i : i + batch_size]
            ids_param = ",".join(str(bid) for bid in batch)
            url = f"{self.THING_API_URL}?id={ids_param}&stats=1"

            try:
                response = httpx.get(url, headers=headers, timeout=30.0)
            except httpx.HTTPError:
                continue

            if response.status_code != 200:
                continue

            root = ET.fromstring(response.text)
            for item in root.findall("item"):
                bgg_id = int(item.get("id", "0"))

                image_el = item.find("image")
                image_url = (
                    image_el.text if image_el is not None and image_el.text else ""
                )
                if image_url:
                    image_url = self._resolve_display_image_url(image_url)
                thumb_el = item.find("thumbnail")
                thumbnail_url = (
                    thumb_el.text if thumb_el is not None and thumb_el.text else ""
                )
                year_el = item.find("yearpublished")
                year_published = (
                    int(year_el.get("value", "0") or "0") if year_el is not None else 0
                )
                desc_el = item.find("description")
                description = (
                    unescape(desc_el.text)
                    if desc_el is not None and desc_el.text
                    else ""
                )
                categories = _normalize_classifications(
                    [
                        link.get("value", "")
                        for link in item.findall("link")
                        if link.get("type") == "rpggenre"
                    ]
                )
                publication_types = _normalize_classifications(
                    [
                        link.get("value", "")
                        for link in item.findall("link")
                        if link.get("type") == "rpgcategory"
                    ]
                )

                rating = 0.0
                stats = item.find("statistics")
                if stats is not None:
                    ratings = stats.find("ratings")
                    if ratings is not None:
                        avg = ratings.find("average")
                        if avg is not None:
                            rating = float(avg.get("value", "0") or "0")

                details[bgg_id] = _RpgDetails(
                    image_url=image_url,
                    thumbnail_url=thumbnail_url,
                    year_published=year_published,
                    bgg_rating=round(rating, 2),
                    description=description,
                    categories=categories,
                    publication_types=publication_types,
                )

            if i + batch_size < len(bgg_ids):
                time.sleep(1.0)

        return details
