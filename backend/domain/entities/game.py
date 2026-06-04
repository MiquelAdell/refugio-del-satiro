from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


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
