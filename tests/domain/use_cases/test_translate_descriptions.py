from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime

from backend.domain.entities.game import Game
from backend.domain.use_cases.translate_descriptions import (
    TranslateDescriptionsResult,
    TranslateDescriptionsUseCase,
    description_source_hash,
)

NOW = datetime(2026, 7, 17, tzinfo=UTC)

ENGLISH_DESCRIPTION = "Trade and build across the island."
SPANISH_DESCRIPTION = "Comercia y construye por la isla."


def make_game(
    game_id: int,
    description: str = "",
    description_es: str = "",
    description_es_source_hash: str = "",
    is_active: bool = True,
) -> Game:
    return Game(
        id=game_id,
        bgg_id=game_id,
        name=f"Game {game_id}",
        slug=f"game-{game_id}",
        thumbnail_url="",
        image_url="",
        year_published=2020,
        min_players=2,
        max_players=4,
        playing_time=60,
        bgg_rating=7.5,
        location="armari",
        created_at=NOW,
        updated_at=NOW,
        description=description,
        is_active=is_active,
        description_es=description_es,
        description_es_source_hash=description_es_source_hash,
    )


class FakeGameRepository:
    def __init__(self, games: list[Game]) -> None:
        self._games = games
        self.translation_updates: list[tuple[int, str, str]] = []

    def list_all(self) -> list[Game]:
        return list(self._games)

    def update_translation(
        self, game_id: int, description_es: str, source_hash: str
    ) -> None:
        self.translation_updates.append((game_id, description_es, source_hash))


class FakeTranslator:
    def __init__(self) -> None:
        self.received: list[list[str]] = []

    def translate(self, texts: Sequence[str]) -> list[str]:
        self.received.append(list(texts))
        return [f"ES: {text}" for text in texts]


class TestTranslateDescriptionsUseCase:
    def test_translates_games_without_translation(self) -> None:
        repo = FakeGameRepository([make_game(1, description=ENGLISH_DESCRIPTION)])
        translator = FakeTranslator()

        result = TranslateDescriptionsUseCase(repo, translator).execute()

        assert result == TranslateDescriptionsResult(
            translated=1, up_to_date=0, without_source=0
        )
        assert translator.received == [[ENGLISH_DESCRIPTION]]
        assert repo.translation_updates == [
            (
                1,
                f"ES: {ENGLISH_DESCRIPTION}",
                description_source_hash(ENGLISH_DESCRIPTION),
            )
        ]

    def test_skips_games_with_current_translation(self) -> None:
        repo = FakeGameRepository(
            [
                make_game(
                    1,
                    description=ENGLISH_DESCRIPTION,
                    description_es=SPANISH_DESCRIPTION,
                    description_es_source_hash=description_source_hash(
                        ENGLISH_DESCRIPTION
                    ),
                )
            ]
        )
        translator = FakeTranslator()

        result = TranslateDescriptionsUseCase(repo, translator).execute()

        assert result == TranslateDescriptionsResult(
            translated=0, up_to_date=1, without_source=0
        )
        assert translator.received == []
        assert repo.translation_updates == []

    def test_retranslates_when_source_changed(self) -> None:
        changed_description = "A brand-new BGG description."
        repo = FakeGameRepository(
            [
                make_game(
                    1,
                    description=changed_description,
                    description_es=SPANISH_DESCRIPTION,
                    description_es_source_hash=description_source_hash(
                        ENGLISH_DESCRIPTION
                    ),
                )
            ]
        )
        translator = FakeTranslator()

        result = TranslateDescriptionsUseCase(repo, translator).execute()

        assert result == TranslateDescriptionsResult(
            translated=1, up_to_date=0, without_source=0
        )
        assert repo.translation_updates == [
            (
                1,
                f"ES: {changed_description}",
                description_source_hash(changed_description),
            )
        ]

    def test_ignores_empty_descriptions_and_inactive_games(self) -> None:
        repo = FakeGameRepository(
            [
                make_game(1, description=""),
                make_game(2, description=ENGLISH_DESCRIPTION, is_active=False),
            ]
        )
        translator = FakeTranslator()

        result = TranslateDescriptionsUseCase(repo, translator).execute()

        assert result == TranslateDescriptionsResult(
            translated=0, up_to_date=0, without_source=1
        )
        assert translator.received == []
        assert repo.translation_updates == []
