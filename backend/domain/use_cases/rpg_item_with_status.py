from __future__ import annotations

from dataclasses import dataclass

from backend.domain.entities.game import Game
from backend.domain.repositories.loan_repository import LoanRepository
from backend.domain.repositories.member_repository import MemberRepository


@dataclass(frozen=True)
class RpgItemWithStatus:
    id: int
    bgg_id: int
    name: str
    slug: str
    thumbnail_url: str
    image_url: str
    year_published: int
    bgg_rating: float
    description: str
    description_es: str
    categories: tuple[str, ...]
    publication_types: tuple[str, ...]
    status: str  # "available" | "lent"
    borrower_display_name: str | None
    loan_id: int | None


def build_rpg_with_status(
    game: Game,
    loan_repo: LoanRepository,
    member_repo: MemberRepository,
) -> RpgItemWithStatus:
    active_loan = loan_repo.get_active_by_game_id(game.id)
    if active_loan is None:
        return RpgItemWithStatus(
            id=game.id,
            bgg_id=game.bgg_id,
            name=game.name,
            slug=game.slug,
            thumbnail_url=game.thumbnail_url,
            image_url=game.image_url,
            year_published=game.year_published,
            bgg_rating=game.bgg_rating,
            description=game.description,
            description_es=game.description_es,
            categories=game.categories,
            publication_types=game.publication_types,
            status="available",
            borrower_display_name=None,
            loan_id=None,
        )

    member = member_repo.get_by_id(active_loan.member_id)
    return RpgItemWithStatus(
        id=game.id,
        bgg_id=game.bgg_id,
        name=game.name,
        slug=game.slug,
        thumbnail_url=game.thumbnail_url,
        image_url=game.image_url,
        year_published=game.year_published,
        bgg_rating=game.bgg_rating,
        description=game.description,
        description_es=game.description_es,
        categories=game.categories,
        publication_types=game.publication_types,
        status="lent",
        borrower_display_name=member.display_name if member else None,
        loan_id=active_loan.id,
    )
