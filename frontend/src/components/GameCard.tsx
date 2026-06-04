import { Link } from "react-router-dom";
import type { GameWithStatus } from "../types/game";
import "./GameCard.css";

interface GameCardProps {
  readonly game: GameWithStatus;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div className="game-card">
      <Link to={`/juegos/${game.slug}`} className="game-card-link">
        <div className="game-card-thumbnail-wrapper">
          {game.thumbnail_url ? (
            <img
              className="game-card-thumbnail"
              src={game.thumbnail_url}
              alt={game.name}
              loading="lazy"
            />
          ) : (
            <div className="game-card-thumbnail game-card-placeholder">
              <span>{game.name.charAt(0)}</span>
            </div>
          )}
          {game.bgg_rating > 0 && (
            <span className="game-card-rating">
              {`${game.bgg_rating.toFixed(1)} ★`}
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
              <span className="game-card-players">
                {`${game.min_players}-${game.max_players} jugadores`}
              </span>
            )}
            {game.playing_time > 0 && (
              <span className="game-card-time">
                {`${game.playing_time} min`}
              </span>
            )}
          </div>
          <span className={`game-card-status ${game.status}`}>
            {game.status === "available" ? "Disponible" : "Prestado"}
          </span>
        </div>
      </Link>
    </div>
  );
}
