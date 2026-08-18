import * as Slider from "@radix-ui/react-slider";
import { Select } from "../ui/Select";
import {
  AVAILABILITY_OPTIONS,
  LOCATION_OPTIONS,
  PLAYER_AGE_OPTIONS,
  PLAYER_BOUNDS,
  TIME_PRESET_OPTIONS,
  type AvailabilityValue,
  type CatalogQuery,
  type LocationValue,
  type TimePreset,
} from "../types/catalog";
import "./FilterPanel.css";

interface FilterPanelProps {
  readonly query: CatalogQuery;
  readonly onChange: (query: CatalogQuery) => void;
  readonly hasPlayerData: boolean;
  readonly hasAgeData: boolean;
  readonly hasTimeData: boolean;
}

export function FilterPanel({
  query,
  onChange,
  hasPlayerData,
  hasAgeData,
  hasTimeData,
}: FilterPanelProps) {
  const playerMaxLabel =
    query.playersMax >= PLAYER_BOUNDS.max
      ? `${PLAYER_BOUNDS.max}+`
      : String(query.playersMax);

  return (
    <div className="filter-panel" role="group" aria-label="Filtros">
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

      <Select
        label="Ubicación"
        options={LOCATION_OPTIONS}
        value={query.location}
        onChange={(e) =>
          onChange({ ...query, location: e.target.value as LocationValue })
        }
      />

      {hasPlayerData && (
        <div className="filter-panel-field">
          <span className="filter-panel-label" id="players-range-label">
            Jugadores: {query.playersMin} – {playerMaxLabel}
          </span>
          <Slider.Root
            className="filter-panel-slider"
            min={PLAYER_BOUNDS.min}
            max={PLAYER_BOUNDS.max}
            step={1}
            value={[query.playersMin, query.playersMax]}
            onValueChange={([playersMin, playersMax]) =>
              onChange({ ...query, playersMin, playersMax })
            }
            aria-labelledby="players-range-label"
          >
            <Slider.Track className="filter-panel-slider-track">
              <Slider.Range className="filter-panel-slider-range" />
            </Slider.Track>
            <Slider.Thumb
              className="filter-panel-slider-thumb"
              aria-label="Jugadores mínimo"
            />
            <Slider.Thumb
              className="filter-panel-slider-thumb"
              aria-label="Jugadores máximo"
            />
          </Slider.Root>
        </div>
      )}

      {hasAgeData && (
        <Select
          label="Edad, a partir de"
          options={PLAYER_AGE_OPTIONS}
          value={query.playerAge ?? ""}
          onChange={(e) =>
            onChange({
              ...query,
              playerAge: e.target.value === "" ? null : Number(e.target.value),
            })
          }
        />
      )}

      {hasTimeData && (
        <Select
          label="Tiempo de juego"
          options={TIME_PRESET_OPTIONS}
          value={query.timePreset}
          onChange={(e) =>
            onChange({ ...query, timePreset: e.target.value as TimePreset })
          }
        />
      )}

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
