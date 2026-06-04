"""Admin-only content-mirror resync endpoint with SSE progress stream."""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.api.dependencies import CurrentMember
from backend.config import Settings
from backend.domain.entities.member import Member
from scraper.config import ScraperConfig, default_config
from scraper.events import ScraperEvent
from scraper.orchestrator import run as run_scraper

router = APIRouter(prefix="/api/admin/content", tags=["admin", "content"])


_settings = Settings()


def _require_admin(member: CurrentMember) -> Member:
    if not member.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accés restringit a administradors.",
        )
    return member


AdminMember = Annotated[Member, Depends(_require_admin)]


@dataclass
class _RunState:
    """In-process singleton. One scrape at a time; subscribers fan out from here."""

    task: asyncio.Task[None] | None = None
    started_at: str | None = None
    finished_at: str | None = None
    events: list[ScraperEvent] = field(default_factory=list)
    subscribers: set[asyncio.Queue[ScraperEvent | None]] = field(default_factory=set)
    lock: asyncio.Lock = field(default_factory=asyncio.Lock)

    def running(self) -> bool:
        return self.task is not None and not self.task.done()


_state = _RunState()


def _build_config() -> ScraperConfig:
    output_dir = Path(_settings.content_mirror_dir)
    defaults = default_config()
    return ScraperConfig(
        origin=defaults.origin,
        output_dir=output_dir,
        assets_subdir=defaults.assets_subdir,
        manifest_file=defaults.manifest_file,
        user_agent=defaults.user_agent,
        request_timeout_s=defaults.request_timeout_s,
        max_retries=defaults.max_retries,
        concurrent_requests=defaults.concurrent_requests,
        max_crawl_depth=defaults.max_crawl_depth,
        max_page_deletion_ratio=defaults.max_page_deletion_ratio,
    )


async def _sink(event: ScraperEvent) -> None:
    _state.events.append(event)
    dead: list[asyncio.Queue[ScraperEvent | None]] = []
    for queue in _state.subscribers:
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            dead.append(queue)
    for queue in dead:
        _state.subscribers.discard(queue)


async def _run_scrape_task() -> None:
    config = _build_config()
    try:
        await run_scraper(config, sink=_sink)
    finally:
        _state.finished_at = datetime.now(UTC).isoformat(timespec="seconds")
        for queue in list(_state.subscribers):
            queue.put_nowait(None)


class StartResponse(BaseModel):
    started: bool
    already_running: bool
    started_at: str | None


@router.post("/resync", response_model=StartResponse)
async def start_resync(_admin: AdminMember) -> StartResponse:
    async with _state.lock:
        if _state.running():
            return StartResponse(
                started=False,
                already_running=True,
                started_at=_state.started_at,
            )
        _state.events = []
        _state.started_at = datetime.now(UTC).isoformat(timespec="seconds")
        _state.finished_at = None
        _state.task = asyncio.create_task(_run_scrape_task())
    return StartResponse(
        started=True,
        already_running=False,
        started_at=_state.started_at,
    )


class StatusResponse(BaseModel):
    running: bool
    started_at: str | None
    finished_at: str | None
    event_count: int


@router.get("/status", response_model=StatusResponse)
def get_status(_admin: AdminMember) -> StatusResponse:
    return StatusResponse(
        running=_state.running(),
        started_at=_state.started_at,
        finished_at=_state.finished_at,
        event_count=len(_state.events),
    )


async def _event_stream() -> AsyncIterator[bytes]:
    # Replay buffered events so a late subscriber sees the full run.
    queue: asyncio.Queue[ScraperEvent | None] = asyncio.Queue(maxsize=1024)
    for event in list(_state.events):
        queue.put_nowait(event)
    if not _state.running() and _state.finished_at is not None:
        queue.put_nowait(None)
    _state.subscribers.add(queue)
    try:
        while True:
            event = await queue.get()
            if event is None:
                yield b"event: done\ndata: {}\n\n"
                return
            payload = json.dumps(event.as_json(), ensure_ascii=False)
            yield f"event: {event.kind}\ndata: {payload}\n\n".encode()
    finally:
        _state.subscribers.discard(queue)


@router.get("/events")
async def stream_events(_admin: AdminMember) -> StreamingResponse:
    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
