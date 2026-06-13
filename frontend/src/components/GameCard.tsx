import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { ClockIcon, PlayersIcon } from "./MetaIcons";
import type { GameWithStatus } from "../types/game";
import type { CatalogView } from "../types/catalog";
import "./GameCard.css";

interface GameCardProps {
  readonly game: GameWithStatus;
  readonly view?: CatalogView;
}

export function GameCard({ game, view = "grid" }: GameCardProps) {
  const statusLabel = game.status === "available" ? "Disponible" : "Prestado";

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
          <Badge variant={game.status} className="game-card-status">
            {statusLabel}
          </Badge>
          {game.bgg_rating > 0 && (
            <span className="game-card-rating-scrim">
              <span className="game-card-rating">
                {game.bgg_rating.toFixed(1)}
              </span>
            </span>
          )}
        </div>
        <div className="game-card-body">
          <div className="game-card-name">{game.name}</div>
          {game.year_published > 0 && (
            <div className="game-card-year">{game.year_published}</div>
          )}
          <div className="game-card-meta">
            {game.min_players > 0 && game.max_players > 0 && (
              <span className="game-card-meta-item">
                <PlayersIcon className="game-card-meta-icon" />
                {`${game.min_players}-${game.max_players} jugadores`}
              </span>
            )}
            {game.playing_time > 0 && (
              <span className="game-card-meta-item">
                <ClockIcon className="game-card-meta-icon" />
                {`${game.playing_time} min`}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
