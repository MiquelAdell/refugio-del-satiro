import { AgeIcon, ClockIcon, PlayersIcon } from "./MetaIcons";
import { CatalogCard, type CatalogCardMetaItem } from "./CatalogCard";
import { displayDescription } from "../lib/description";
import { resolveTagPill } from "../lib/gameTags";
import type { GameWithStatus } from "../types/game";
import type { CatalogView } from "../types/catalog";

interface GameCardProps {
  readonly game: GameWithStatus;
  readonly view?: CatalogView;
  /**
   * Fallback tag label to show when the game has no `primary_tag` — the
   * game's own most-common BGG category, ranked across the loaded catalog.
   * Computed by the caller (CatalogPage), not by this component.
   */
  readonly fallbackCategory?: string;
}

export function GameCard({ game, view = "grid", fallbackCategory }: GameCardProps) {
  const meta: readonly CatalogCardMetaItem[] = [
    ...(game.min_age > 0 ? [{ icon: AgeIcon, label: `${game.min_age}+` }] : []),
    ...(game.playing_time > 0
      ? [{ icon: ClockIcon, label: `${game.playing_time}min` }]
      : []),
    ...(game.min_players > 0 && game.max_players > 0
      ? [{ icon: PlayersIcon, label: `${game.min_players}-${game.max_players}` }]
      : []),
  ];

  return (
    <CatalogCard
      to={`/juegos/${game.slug}`}
      name={game.name}
      status={game.status}
      imageUrl={game.image_url || game.thumbnail_url}
      rating={game.bgg_rating}
      description={displayDescription(game)}
      meta={meta}
      tagPill={resolveTagPill(game.primary_tag, fallbackCategory)}
      view={view}
    />
  );
}
