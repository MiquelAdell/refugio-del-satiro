"""HTTP client for the scraper.

Kept tiny: a single async `get_text` + `get_bytes` that handle retries and
timeouts. The scraper is a read-mostly workload against one origin.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class FetchResult:
    url: str
    status: int
    body: bytes
    content_type: str


class Fetcher:
    def __init__(
        self,
        *,
        user_agent: str,
        timeout_s: float,
        max_retries: int,
    ) -> None:
        self._client = httpx.AsyncClient(
            headers={"User-Agent": user_agent, "Accept-Language": "es,ca;q=0.8"},
            timeout=timeout_s,
            follow_redirects=True,
        )
        self._max_retries = max_retries

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> Fetcher:
        return self

    async def __aexit__(self, *_exc: object) -> None:
        await self.close()

    async def get(self, url: str) -> FetchResult:
        """GET with exponential backoff on 5xx / network errors.

        Raises `httpx.HTTPStatusError` for 4xx, `httpx.RequestError` after retries
        exhaust for transient failures.
        """
        backoff = 1.0
        last_exc: Exception | None = None
        for attempt in range(self._max_retries):
            try:
                response = await self._client.get(url)
                if 500 <= response.status_code < 600:
                    raise httpx.HTTPStatusError(
                        "server error",
                        request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                return FetchResult(
                    url=str(response.url),
                    status=response.status_code,
                    body=response.content,
                    content_type=response.headers.get("content-type", ""),
                )
            except httpx.HTTPStatusError as exc:
                if 400 <= exc.response.status_code < 500:
                    raise
                last_exc = exc
            except httpx.RequestError as exc:
                last_exc = exc
            if attempt < self._max_retries - 1:
                await asyncio.sleep(backoff)
                backoff *= 2
        assert last_exc is not None
        raise last_exc
