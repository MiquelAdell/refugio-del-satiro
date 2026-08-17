import * as Slider from "@radix-ui/react-slider";
import { Select } from "../ui/Select";
import { AVAILABILITY_OPTIONS, type AvailabilityValue } from "../types/catalog";
import {
  RPG_GENRE_OPTIONS,
  RPG_PUBLICATION_OPTIONS,
  type RpgGenreValue,
  type RpgPublicationValue,
  type RpgQuery,
} from "../types/rpg";
import "./FilterPanel.css";

interface RpgFilterPanelProps {
  readonly query: RpgQuery;
  readonly onChange: (query: RpgQuery) => void;
}

export function RpgFilterPanel({ query, onChange }: RpgFilterPanelProps) {
  return (
    <div className="filter-panel" role="group" aria-label="Filtros">
      <Select
        label="Género"
        options={RPG_GENRE_OPTIONS}
        value={query.genre}
        onChange={(e) =>
          onChange({ ...query, genre: e.target.value as RpgGenreValue })
        }
      />

      <Select
        label="Tipo de publicación"
        options={RPG_PUBLICATION_OPTIONS}
        value={query.publicationKind}
        onChange={(e) =>
          onChange({
            ...query,
            publicationKind: e.target.value as RpgPublicationValue,
          })
        }
      />

      <Select
        label="Disponibilidad"
        options={AVAILABILITY_OPTIONS}
        value={query.availability}
        onChange={(e) =>
          onChange({
            ...query,
            availability: e.target.value as AvailabilityValue,
          })
        }
      />

      <div className="filter-panel-field">
        <span className="filter-panel-label" id="min-rating-label">
          Valoración mínima: {query.minRating.toFixed(1)}
        </span>
        <Slider.Root
          className="filter-panel-slider"
          min={0}
          max={10}
          step={0.5}
          value={[query.minRating]}
          onValueChange={([minRating]) => onChange({ ...query, minRating })}
          aria-labelledby="min-rating-label"
        >
          <Slider.Track className="filter-panel-slider-track">
            <Slider.Range className="filter-panel-slider-range" />
          </Slider.Track>
          <Slider.Thumb
            className="filter-panel-slider-thumb"
            aria-label="Valoración mínima"
          />
        </Slider.Root>
      </div>
    </div>
  );
}
