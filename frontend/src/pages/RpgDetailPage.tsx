import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { RpgItem } from "../types/rpg";
import "./RpgDetailPage.css";

export function RpgDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<RpgItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    apiFetch<RpgItem>(`/rol/${slug}`)
      .then(setItem)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="rpg-detail-page">
        <p className="rpg-detail-loading">Cargando...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="rpg-detail-page">
        <Link to="/juegos-de-rol" className="rpg-detail-back">
          &larr; Volver al catálogo
        </Link>
        <p className="rpg-detail-error">{error ?? "Libro no encontrado."}</p>
      </div>
    );
  }

  const descriptionParagraphs = item.description
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="rpg-detail-page">
      <Link to="/juegos-de-rol" className="rpg-detail-back">
        &larr; Volver al catálogo
      </Link>

      <div className="rpg-detail-hero">
        <div className="rpg-detail-cover">
          <img
            className="rpg-detail-cover-img"
            src={item.image_url || item.thumbnail_url}
            alt={item.name}
          />
        </div>

        <div className="rpg-detail-info">
          <h1 className="rpg-detail-name">{item.name}</h1>
          {item.year_published > 0 && (
            <div className="rpg-detail-year">{item.year_published}</div>
          )}
          {item.bgg_rating > 0 && (
            <div className="rpg-detail-rating">
              <span className="rpg-detail-rating-label">Valoración BGG:</span>
              <span className="rpg-detail-rating-value">
                {item.bgg_rating.toFixed(1)}
              </span>
            </div>
          )}
          <div className="rpg-detail-bgg">
            <a
              href={`https://rpggeek.com/rpgitem/${item.bgg_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver en RPGGeek
            </a>
          </div>
        </div>
      </div>

      {descriptionParagraphs.length > 0 && (
        <div className="rpg-detail-description">
          {descriptionParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
    </div>
  );
}
