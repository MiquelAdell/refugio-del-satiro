from datetime import datetime

from backend.domain.entities.game import Game


class TestGame:
    def test_create_game(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        game = Game(
            id=1,
            bgg_id=12345,
            name="Catan",
            slug="catan",
            thumbnail_url="https://example.com/catan.jpg",
            image_url="https://example.com/catan_full.jpg",
            year_published=1995,
            min_players=3,
            max_players=4,
            playing_time=90,
            bgg_rating=7.1,
            location="armari",
            created_at=now,
            updated_at=now,
        )
        assert game.id == 1
        assert game.bgg_id == 12345
        assert game.name == "Catan"
        assert game.thumbnail_url == "https://example.com/catan.jpg"
        assert game.image_url == "https://example.com/catan_full.jpg"
        assert game.year_published == 1995
        assert game.categories == ()
        assert game.publication_types == ()

    def test_game_is_frozen(self) -> None:
        now = datetime(2026, 1, 1, 12, 0, 0)
        game = Game(
            id=1,
            bgg_id=12345,
            name="Catan",
            slug="catan",
            thumbnail_url="https://example.com/catan.jpg",
            image_url="https://example.com/catan_full.jpg",
            year_published=1995,
            min_players=3,
            max_players=4,
            playing_time=90,
            bgg_rating=7.1,
            location="armari",
            created_at=now,
            updated_at=now,
        )
        try:
            game.name = "Modified"  # type: ignore[misc]
            raise AssertionError("Should have raised FrozenInstanceError")
        except AttributeError:
            pass
