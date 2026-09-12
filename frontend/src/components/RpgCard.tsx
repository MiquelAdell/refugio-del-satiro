import { BookIcon, CalendarIcon, QuillIcon } from "./MetaIcons";
import { CatalogCard, type CatalogCardMetaItem } from "./CatalogCard";
import { displayDescription } from "../lib/description";
import { resolveRpgTagPill, rpgPublicationKinds } from "../lib/rpgTags";
import type { RpgItem } from "../types/rpg";
import type { CatalogView } from "../types/catalog";
import "./RpgCard.css";

interface RpgCardProps {
  readonly item: RpgItem;
  readonly view?: CatalogView;
  /**
   * Fallback tag label: the item's own most-common RPGGeek category, ranked
   * across the loaded catalog. Computed by the caller (RpgCatalogPage).
   */
  readonly fallbackCategory?: string;
}

export function RpgCard({ item, view = "grid", fallbackCategory }: RpgCardProps) {
  const kinds = rpgPublicationKinds(item.publication_types);
  const meta: readonly CatalogCardMetaItem[] = [
    ...(kinds.rulebook ? [{ icon: BookIcon, label: "Manual" }] : []),
    ...(kinds.adventure ? [{ icon: QuillIcon, label: "Aventura" }] : []),
    ...(item.year_published > 0
      ? [{ icon: CalendarIcon, label: String(item.year_published) }]
      : []),
  ];

  return (
    <CatalogCard
      className="rpg-card"
      to={`/rol/${item.slug}`}
      name={item.name}
      status={item.status}
      imageUrl={item.image_url || item.thumbnail_url}
      rating={item.bgg_rating}
      description={displayDescription(item)}
      meta={meta}
      tagPill={resolveRpgTagPill(fallbackCategory)}
      view={view}
    />
  );
}
