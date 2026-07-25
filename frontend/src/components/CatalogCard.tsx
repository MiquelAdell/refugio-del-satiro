import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import type { TagPill } from "../lib/gameTags";
import type { CatalogView } from "../types/catalog";
import "./CatalogCard.css";

export interface CatalogCardMetaItem {
  readonly icon: ComponentType<{ readonly className: string }>;
  readonly label: string;
}

export type CatalogCardStatus = "available" | "lent";

interface CatalogCardProps {
  readonly to: string;
  readonly name: string;
  readonly status: CatalogCardStatus;
  /** Empty string renders the initial-letter placeholder instead. */
  readonly imageUrl: string;
  readonly rating: number;
  readonly description: string;
  readonly meta: readonly CatalogCardMetaItem[];
  readonly tagPill?: TagPill;
  readonly view?: CatalogView;
  /** Extra root class for caller-specific styling and e2e selectors. */
  readonly className?: string;
}

const STATUS_LABELS: Record<CatalogCardStatus, string> = {
  available: "Disponible",
  lent: "Prestado",
};

// Structured so a second ribbon variant (e.g. "reservado") is a one-liner.
const RIBBON_LABELS: Partial<Record<CatalogCardStatus, string>> = {
  lent: "EN PRÉSTAMO",
};

const RIBBON_CLASSES: Partial<Record<CatalogCardStatus, string>> = {
  lent: "game-card-ribbon-lent",
};

/**
 * Shared catalog grid/list cell (style-guide §5.6–§5.7) used by both the
 * board game and RPG book catalogs. GameCard/RpgCard map their entities to
 * these presentational props; this component owns the markup and CSS.
 */
export function CatalogCard({
  to,
  name,
  status,
  imageUrl,
  rating,
  description,
  meta,
  tagPill,
  view = "grid",
  className,
}: CatalogCardProps) {
  const ribbonLabel = RIBBON_LABELS[status];
  const rootClass = ["game-card", `game-card-${view}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={rootClass}>
      <Link
        to={to}
        className="game-card-link"
        aria-label={`${name} — ${STATUS_LABELS[status]}`}
      >
        <div className="game-card-cover">
          {imageUrl ? (
            <img
              className="game-card-cover-img"
              src={imageUrl}
              alt=""
              loading="lazy"
            />
          ) : (
            <div className="game-card-cover-img game-card-placeholder">
              <span aria-hidden="true">{name.charAt(0)}</span>
            </div>
          )}
          {ribbonLabel && (
            <span className={`game-card-ribbon ${RIBBON_CLASSES[status]}`}>
              {ribbonLabel}
            </span>
          )}
        </div>
        <div className="game-card-body">
          <span className="game-card-rating">
            {rating > 0 ? rating.toFixed(1) : "-"}
          </span>
          <h3 className="game-card-name">{name}</h3>
          {description && (
            <p className="game-card-description">{description}</p>
          )}
          <ul className="game-card-meta">
            {meta.map(({ icon: Icon, label }) => (
              <li key={label} className="game-card-meta-item">
                <Icon className="game-card-meta-icon" />
                {label}
              </li>
            ))}
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
