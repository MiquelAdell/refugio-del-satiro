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


@dataclass(frozen=True)
class BggRpgItem:
    bgg_id: int
    name: str
    thumbnail_url: str
    image_url: str
    year_published: int
    bgg_rating: float
    description: str
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


_BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


class BggClient:
    XML_API_URL = "https://boardgamegeek.com/xmlapi2/collection"
    THING_API_URL = "https://boardgamegeek.com/xmlapi2/thing"
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
        """Parse games from the BGG collection HTML table."""
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
                thumb_el = item.find("thumbnail")
                thumbnail_url = (
                    thumb_el.text if thumb_el is not None and thumb_el.text else ""
                )

                min_p = _element_int_value(item, "minplayers")
                max_p = _element_int_value(item, "maxplayers")
                play_time = _element_int_value(item, "playingtime")

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
                )

            if i + batch_size < len(bgg_ids):
                time.sleep(1.0)

        return details

    def _parse_xml_collection(self, xml_text: str) -> list[BggGame]:
        root = ET.fromstring(xml_text)
        games: list[BggGame] = []
        for item in root.findall("item"):
            name_el = item.find("name")
            thumbnail_el = item.find("thumbnail")
            year_el = item.find("yearpublished")
            games.append(
                BggGame(
                    bgg_id=int(item.get("objectid", "0")),
                    name=(
                        name_el.text
                        if name_el is not None and name_el.text
                        else "Unknown"
                    ),
                    thumbnail_url=(
                        thumbnail_el.text
                        if thumbnail_el is not None and thumbnail_el.text
                        else ""
                    ),
                    year_published=(
                        int(year_el.text) if year_el is not None and year_el.text else 0
                    ),
                )
            )
        return games

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
                name=item.name,
                thumbnail_url=(
                    details[item.bgg_id].thumbnail_url or item.thumbnail_url
                    if item.bgg_id in details
                    else item.thumbnail_url
                ),
                image_url=(
                    details[item.bgg_id].image_url if item.bgg_id in details else ""
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
