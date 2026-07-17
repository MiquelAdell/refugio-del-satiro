import { Link } from "react-router-dom";
import { AgeIcon, ClockIcon, PlayersIcon } from "./MetaIcons";
import { displayDescription } from "../lib/description";
import { resolveTagPill } from "../lib/gameTags";
import type { GameWithStatus } from "../types/game";
import type { CatalogView } from "../types/catalog";
import "./GameCard.css";

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

// Structured so a second ribbon variant (e.g. "reservado") is a one-liner.
const RIBBON_LABELS: Partial<Record<GameWithStatus["status"], string>> = {
  lent: "EN PRÉSTAMO",
};

const RIBBON_CLASSES: Partial<Record<GameWithStatus["status"], string>> = {
  lent: "game-card-ribbon-lent",
};

export function GameCard({ game, view = "grid", fallbackCategory }: GameCardProps) {
  const statusLabel = game.status === "available" ? "Disponible" : "Prestado";
  const ribbonLabel = RIBBON_LABELS[game.status];
  const tagPill = resolveTagPill(game.primary_tag, fallbackCategory);
  const description = displayDescription(game);

  return (
    <article className={`game-card game-card-${view}`}>
      <Link
        to={`/juegos/${game.slug}`}
        className="game-card-link"
        aria-label={`${game.name} — ${statusLabel}`}
      >
        <div className="game-card-cover">
          {game.image_url || game.thumbnail_url ? (
            <img
              className="game-card-cover-img"
              src={game.image_url || game.thumbnail_url}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="game-card-cover-img game-card-placeholder">
              <span aria-hidden="true">{game.name.charAt(0)}</span>
            </div>
          )}
          {ribbonLabel && (
            <span
              className={`game-card-ribbon ${RIBBON_CLASSES[game.status]}`}
            >
              {ribbonLabel}
            </span>
          )}
        </div>
        <div className="game-card-body">
          {game.bgg_rating > 0 && (
            <span className="game-card-rating">
              {game.bgg_rating.toFixed(1)}
            </span>
          )}
          <h3 className="game-card-name">{game.name}</h3>
          {description && (
            <p className="game-card-description">{description}</p>
          )}
          <ul className="game-card-meta">
            {game.min_age > 0 && (
              <li className="game-card-meta-item">
                <AgeIcon className="game-card-meta-icon" />
                {`${game.min_age}+`}
              </li>
            )}
            {game.playing_time > 0 && (
              <li className="game-card-meta-item">
                <ClockIcon className="game-card-meta-icon" />
                {`${game.playing_time}min`}
              </li>
            )}
            {game.min_players > 0 && game.max_players > 0 && (
              <li className="game-card-meta-item">
                <PlayersIcon className="game-card-meta-icon" />
                {`${game.min_players}-${game.max_players}`}
              </li>
            )}
          </ul>
          {tagPill && (
            <span className={`game-card-tag ${tagPill.colorClass}`}>
              {tagPill.label}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
