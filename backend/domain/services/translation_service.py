from __future__ import annotations

from collections.abc import Sequence
from typing import Protocol


class TranslationError(Exception):
    """Translation failed (network, quota, auth). Callers must degrade
    gracefully: an untranslated description is served in English."""


class TranslationService(Protocol):
    def translate(self, texts: Sequence[str]) -> list[str]: ...

    # Returns one translation per input text, in the same order.
    # Raises TranslationError on any failure — never partial results.
