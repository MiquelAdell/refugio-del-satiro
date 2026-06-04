from __future__ import annotations

import pytest

from backend.domain.slug import ensure_unique, slugify


class TestSlugify:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            ("Catan", "catan"),
            ("1,2,3! Now you see me...", "1-2-3-now-you-see-me"),
            ("Ticket to Ride: Europe", "ticket-to-ride-europe"),
            ("Brindis al amor (edición especial)", "brindis-al-amor-edicion-especial"),
            ("  spaced  out  ", "spaced-out"),
            ("---weird---", "weird"),
            ("Açaí & Café", "acai-cafe"),
            ("L'Île Mystérieuse", "l-ile-mysterieuse"),
        ],
    )
    def test_slugifies_known_inputs(self, value: str, expected: str) -> None:
        assert slugify(value) == expected

    def test_empty_input_falls_back_to_juego(self) -> None:
        assert slugify("") == "juego"

    def test_only_punctuation_falls_back_to_juego(self) -> None:
        assert slugify("!!!---???") == "juego"


class TestEnsureUnique:
    def test_returns_base_when_unused(self) -> None:
        assert ensure_unique("catan", []) == "catan"

    def test_appends_suffix_on_collision(self) -> None:
        assert ensure_unique("catan", ["catan"]) == "catan-2"

    def test_skips_used_suffixes(self) -> None:
        assert ensure_unique("catan", ["catan", "catan-2", "catan-3"]) == "catan-4"
