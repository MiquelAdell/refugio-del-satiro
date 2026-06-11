import { Link } from "react-router-dom";
import type { RpgItem } from "../types/rpg";
import "./RpgCard.css";

interface RpgCardProps {
  readonly item: RpgItem;
}

export function RpgCard({ item }: RpgCardProps) {
  return (
    <article className="rpg-card">
      <Link
        to={`/rol/${item.slug}`}
        className="rpg-card-link"
        aria-label={item.name}
      >
        <div className="rpg-card-cover">
          {item.image_url || item.thumbnail_url ? (
            <img
              className="rpg-card-cover-img"
              src={item.image_url || item.thumbnail_url}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="rpg-card-cover-img rpg-card-placeholder">
              <span aria-hidden="true">{item.name.charAt(0)}</span>
            </div>
          )}
          {item.bgg_rating > 0 && (
            <span className="rpg-card-rating-scrim">
              <span className="rpg-card-rating">
                {item.bgg_rating.toFixed(1)}
              </span>
            </span>
          )}
        </div>
        <div className="rpg-card-body">
          <div className="rpg-card-name">{item.name}</div>
          {item.year_published > 0 && (
            <div className="rpg-card-year">{item.year_published}</div>
          )}
        </div>
      </Link>
    </article>
  );
}
