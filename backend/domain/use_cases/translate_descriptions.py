from __future__ import annotations

import hashlib
from dataclasses import dataclass

from backend.domain.repositories.game_repository import GameRepository
from backend.domain.services.translation_service import TranslationService


def description_source_hash(description: str) -> str:
    return hashlib.sha256(description.encode("utf-8")).hexdigest()


@dataclass(frozen=True)
class TranslateDescriptionsResult:
    translated: int
    up_to_date: int
    without_source: int


class TranslateDescriptionsUseCase:
    """Translate English BGG descriptions to Spanish for every active item
    whose stored translation is missing or stale (source hash mismatch).

    The (description_es, description_es_source_hash) pair on the row is the
    cache: unchanged descriptions are never re-translated.
    """

    def __init__(
        self, game_repo: GameRepository, translator: TranslationService
    ) -> None:
        self._game_repo = game_repo
        self._translator = translator

    def execute(self) -> TranslateDescriptionsResult:
        active = [g for g in self._game_repo.list_all() if g.is_active]
        with_source = [g for g in active if g.description]
        pending = [
            g
            for g in with_source
            if description_source_hash(g.description) != g.description_es_source_hash
        ]

        translations = (
            self._translator.translate([g.description for g in pending])
            if pending
            else []
        )
        for game, translation in zip(pending, translations, strict=True):
            self._game_repo.update_translation(
                game.id,
                description_es=translation,
                source_hash=description_source_hash(game.description),
            )

        return TranslateDescriptionsResult(
            translated=len(pending),
            up_to_date=len(with_source) - len(pending),
            without_source=len(active) - len(with_source),
        )
