from __future__ import annotations

import logging
import math
import time
from collections import OrderedDict, deque
from collections.abc import Callable
from ipaddress import IPv4Network, IPv6Network, ip_address, ip_network
from threading import Lock
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel

from backend.api.dependencies import CurrentMember, GameRepo, LoanRepo, MemberRepo
from backend.config import Settings
from backend.domain.use_cases.get_member_loans import GetMemberLoansUseCase
from backend.domain.use_cases.validate_member import ValidateMemberUseCase

router = APIRouter(prefix="/api", tags=["members"])
logger = logging.getLogger(__name__)

RATE_LIMIT_DETAIL = "No se ha podido validar la membresía. Inténtalo más tarde."


class MemberValidationRateLimiter:
    def __init__(
        self,
        *,
        limit: int,
        window_seconds: int,
        max_clients: int,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        if min(limit, window_seconds, max_clients) < 1:
            raise ValueError("Rate-limit values must be greater than zero")
        self._limit = limit
        self._window_seconds = window_seconds
        self._max_clients = max_clients
        self._clock = clock
        self._requests: OrderedDict[str, deque[float]] = OrderedDict()
        self._lock = Lock()

    def check(self, client_identifier: str) -> int | None:
        """Record a request and return Retry-After seconds when it is limited."""
        with self._lock:
            now = self._clock()
            cutoff = now - self._window_seconds
            timestamps = self._requests.pop(client_identifier, deque())
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()

            if len(timestamps) >= self._limit:
                self._requests[client_identifier] = timestamps
                return max(1, math.ceil(timestamps[0] + self._window_seconds - now))

            timestamps.append(now)
            self._requests[client_identifier] = timestamps
            while len(self._requests) > self._max_clients:
                self._requests.popitem(last=False)
            return None


_settings = Settings()
_trusted_proxy_networks = tuple(
    ip_network(cidr, strict=False) for cidr in _settings.trusted_proxy_cidrs
)
_member_validation_limiter = MemberValidationRateLimiter(
    limit=_settings.member_validation_rate_limit,
    window_seconds=_settings.member_validation_rate_window_seconds,
    max_clients=_settings.member_validation_rate_max_clients,
)


def get_member_validation_limiter() -> MemberValidationRateLimiter:
    return _member_validation_limiter


def _is_trusted_proxy(
    address: str, networks: tuple[IPv4Network | IPv6Network, ...]
) -> bool:
    try:
        parsed_address = ip_address(address)
    except ValueError:
        return False
    return any(parsed_address in network for network in networks)


def _normalized_ip(address: str) -> str | None:
    try:
        return str(ip_address(address))
    except ValueError:
        return None


def _client_identifier(request: Request) -> str:
    peer = request.client.host if request.client is not None else "unknown"
    if not _is_trusted_proxy(peer, _trusted_proxy_networks):
        return peer

    forwarded_for = request.headers.get("x-forwarded-for", "")
    forwarded_chain = tuple(
        normalized
        for address in forwarded_for.split(",")
        if (normalized := _normalized_ip(address.strip())) is not None
    )
    return next(
        (
            address
            for address in reversed(forwarded_chain)
            if not _is_trusted_proxy(address, _trusted_proxy_networks)
        ),
        peer,
    )


class ValidateMemberResponse(BaseModel):
    member_number: int
    first_name: str
    last_name: str
    active: bool
    last_payment: str | None
    gender_label: str


def _gender_label(gender: str | None) -> str:
    if gender == "Masculino":
        return "socio"
    if gender == "Femenino":
        return "socia"
    return "socio/a"


@router.get("/members/validate", response_model=ValidateMemberResponse)
def validate_member(
    request: Request,
    member_repo: MemberRepo,
    limiter: Annotated[
        MemberValidationRateLimiter, Depends(get_member_validation_limiter)
    ],
    number: int = Query(..., ge=1, description="Número de socio"),
) -> ValidateMemberResponse:
    retry_after = limiter.check(_client_identifier(request))
    if retry_after is not None:
        logger.warning("Membership validation rate limit exceeded")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=RATE_LIMIT_DETAIL,
            headers={"Retry-After": str(retry_after)},
        )

    use_case = ValidateMemberUseCase(member_repo)
    member = use_case.execute(number)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Socio no encontrado.",
        )
    return ValidateMemberResponse(
        member_number=member.member_number,  # type: ignore[arg-type]
        first_name=member.first_name,
        last_name=member.last_name,
        active=member.is_active,
        last_payment=member.last_payment,
        gender_label=_gender_label(member.gender),
    )


class ActiveLoanResponse(BaseModel):
    loan_id: int
    game_id: int
    game_name: str
    game_slug: str
    item_type: Literal["boardgame", "rpgitem"]
    game_thumbnail_url: str
    game_image_url: str
    borrowed_at: str


@router.get("/my-loans", response_model=list[ActiveLoanResponse])
def get_my_loans(
    member: CurrentMember,
    loan_repo: LoanRepo,
    game_repo: GameRepo,
) -> list[ActiveLoanResponse]:
    use_case = GetMemberLoansUseCase(loan_repo, game_repo)
    loans = use_case.execute(member.id)
    return [
        ActiveLoanResponse(
            loan_id=loan.loan_id,
            game_id=loan.game_id,
            game_name=loan.game_name,
            game_slug=loan.game_slug,
            item_type=loan.item_type,
            game_thumbnail_url=loan.game_thumbnail_url,
            game_image_url=loan.game_image_url,
            borrowed_at=loan.borrowed_at,
        )
        for loan in loans
    ]
