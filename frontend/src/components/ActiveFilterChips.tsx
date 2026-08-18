import { Chip } from "../ui/Chip";
import { Button } from "../ui/Button";
import {
  AVAILABILITY_OPTIONS,
  DEFAULT_CATALOG_QUERY,
  LOCATION_OPTIONS,
  PLAYER_BOUNDS,
  TIME_PRESET_OPTIONS,
  type CatalogQuery,
} from "../types/catalog";
import "./ActiveFilterChips.css";

interface ActiveFilterChipsProps {
  readonly query: CatalogQuery;
  readonly onChange: (query: CatalogQuery) => void;
}

interface ActiveChip {
  readonly key: string;
  readonly label: string;
  readonly cleared: CatalogQuery;
}

function optionLabel(
  options: readonly { readonly value: string; readonly label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function activeChips(query: CatalogQuery): readonly ActiveChip[] {
  const playerRangeActive =
    query.playersMin > PLAYER_BOUNDS.min ||
    query.playersMax < PLAYER_BOUNDS.max;
  const playerMaxLabel =
    query.playersMax >= PLAYER_BOUNDS.max
      ? `${PLAYER_BOUNDS.max}+`
      : String(query.playersMax);

  const candidates: readonly (ActiveChip | null)[] = [
    query.search.trim() !== ""
      ? {
          key: "search",
          label: `Palabra clave: “${query.search.trim()}”`,
          cleared: { ...query, search: "" },
        }
      : null,
    query.availability !== "all"
      ? {
          key: "availability",
          label: optionLabel(AVAILABILITY_OPTIONS, query.availability),
          cleared: { ...query, availability: "all" },
        }
      : null,
    query.location !== "all"
      ? {
          key: "location",
          label: `Ubicación: ${optionLabel(LOCATION_OPTIONS, query.location)}`,
          cleared: { ...query, location: "all" },
        }
      : null,
    playerRangeActive
      ? {
          key: "players",
          label: `Jugadores: ${query.playersMin} – ${playerMaxLabel}`,
          cleared: {
            ...query,
            playersMin: PLAYER_BOUNDS.min,
            playersMax: PLAYER_BOUNDS.max,
          },
        }
      : null,
    query.timePreset !== "all"
      ? {
          key: "time",
          label: `Tiempo: ${optionLabel(TIME_PRESET_OPTIONS, query.timePreset)}`,
          cleared: { ...query, timePreset: "all" },
        }
      : null,
    query.minRating > 0
      ? {
          key: "rating",
          label: `Valoración ≥ ${query.minRating.toFixed(1)}`,
          cleared: { ...query, minRating: 0 },
        }
      : null,
    query.playerAge !== null
      ? {
          key: "player-age",
          label: `Edad, a partir de: ${query.playerAge} años`,
          cleared: { ...query, playerAge: null },
        }
      : null,
  ];

  return candidates.filter((c): c is ActiveChip => c !== null);
}

export function ActiveFilterChips({ query, onChange }: ActiveFilterChipsProps) {
  const chips = activeChips(query);

  if (chips.length === 0) return null;

  return (
    <div className="active-filter-chips" aria-label="Filtros activos">
      {chips.map((chip) => (
        <Chip key={chip.key} onRemove={() => onChange(chip.cleared)}>
          {chip.label}
        </Chip>
      ))}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onChange({ ...DEFAULT_CATALOG_QUERY, sort: query.sort })}
      >
        Limpiar búsqueda y filtros
      </Button>
    </div>
  );
}
