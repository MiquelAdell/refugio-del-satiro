from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

ItemType = Literal["boardgame", "rpgitem"]


def parse_item_type(value: str) -> ItemType:
    if value == "boardgame":
        return "boardgame"
    if value == "rpgitem":
        return "rpgitem"
    raise ValueError(f"Unsupported item type: {value}")


@dataclass(frozen=True)
class Game:
    id: int
    bgg_id: int
    name: str
    slug: str
    thumbnail_url: str
    image_url: str
    year_published: int
    min_players: int
    max_players: int
    playing_time: int
    bgg_rating: float
    location: str
    created_at: datetime
    updated_at: datetime
    item_type: ItemType = field(default="boardgame")
    description: str = field(default="")
    categories: tuple[str, ...] = field(default=())
    publication_types: tuple[str, ...] = field(default=())
    is_active: bool = field(default=True)
    bgg_collection_id: int | None = field(default=None)
    min_age: int = field(default=0)
    primary_tag: str = field(default="")
    description_es: str = field(default="")
    description_es_source_hash: str = field(default="")
