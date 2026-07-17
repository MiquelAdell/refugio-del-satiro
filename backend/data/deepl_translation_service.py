from __future__ import annotations

from collections.abc import Sequence

import httpx

from backend.domain.services.translation_service import TranslationError

DEEPL_FREE_BASE_URL = "https://api-free.deepl.com"

# DeepL's /v2/translate accepts at most 50 texts per request.
_MAX_TEXTS_PER_REQUEST = 50
_REQUEST_TIMEOUT_SECONDS = 60.0


class DeepLTranslationService:
    """TranslationService implementation against the DeepL REST API
    (API Free plan: 500,000 characters/month)."""

    def __init__(
        self,
        api_key: str,
        base_url: str = DEEPL_FREE_BASE_URL,
        client: httpx.Client | None = None,
    ) -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._client = client if client is not None else httpx.Client()

    def translate(self, texts: Sequence[str]) -> list[str]:
        chunks = [
            texts[start : start + _MAX_TEXTS_PER_REQUEST]
            for start in range(0, len(texts), _MAX_TEXTS_PER_REQUEST)
        ]
        return [
            translation
            for chunk in chunks
            for translation in self._translate_chunk(chunk)
        ]

    def _translate_chunk(self, texts: Sequence[str]) -> list[str]:
        try:
            response = self._client.post(
                f"{self._base_url}/v2/translate",
                headers={"Authorization": f"DeepL-Auth-Key {self._api_key}"},
                json={"text": list(texts), "target_lang": "ES"},
                timeout=_REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise TranslationError(f"DeepL request failed: {exc}") from exc

        translations = [item["text"] for item in response.json()["translations"]]
        if len(translations) != len(texts):
            raise TranslationError(
                f"DeepL returned {len(translations)} translations "
                f"for {len(texts)} texts"
            )
        return translations
