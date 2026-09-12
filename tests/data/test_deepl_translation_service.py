from __future__ import annotations

import json

import httpx
import pytest

from backend.data.deepl_translation_service import DeepLTranslationService
from backend.domain.services.translation_service import TranslationError

API_KEY = "test-key:fx"
TRANSLATE_URL = "https://api-free.deepl.com/v2/translate"


def make_service(handler: httpx.MockTransport) -> DeepLTranslationService:
    return DeepLTranslationService(API_KEY, client=httpx.Client(transport=handler))


class TestDeepLTranslationService:
    def test_translates_texts(self) -> None:
        captured: list[httpx.Request] = []

        def handler(request: httpx.Request) -> httpx.Response:
            captured.append(request)
            texts = json.loads(request.content)["text"]
            return httpx.Response(
                200,
                json={"translations": [{"text": f"ES: {t}"} for t in texts]},
            )

        service = make_service(httpx.MockTransport(handler))

        result = service.translate(["Hello", "World"])

        assert result == ["ES: Hello", "ES: World"]
        assert str(captured[0].url) == TRANSLATE_URL
        assert captured[0].headers["Authorization"] == f"DeepL-Auth-Key {API_KEY}"
        assert json.loads(captured[0].content) == {
            "text": ["Hello", "World"],
            "target_lang": "ES",
        }

    def test_chunks_requests_of_more_than_fifty_texts(self) -> None:
        batch_sizes: list[int] = []

        def handler(request: httpx.Request) -> httpx.Response:
            texts = json.loads(request.content)["text"]
            batch_sizes.append(len(texts))
            return httpx.Response(
                200,
                json={"translations": [{"text": f"ES: {t}"} for t in texts]},
            )

        service = make_service(httpx.MockTransport(handler))

        result = service.translate([f"text {i}" for i in range(120)])

        assert batch_sizes == [50, 50, 20]
        assert result == [f"ES: text {i}" for i in range(120)]

    def test_raises_translation_error_on_http_error(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(456, json={"message": "Quota exceeded"})

        service = make_service(httpx.MockTransport(handler))

        with pytest.raises(TranslationError):
            service.translate(["Hello"])

    def test_raises_translation_error_on_count_mismatch(self) -> None:
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"translations": []})

        service = make_service(httpx.MockTransport(handler))

        with pytest.raises(TranslationError):
            service.translate(["Hello"])
