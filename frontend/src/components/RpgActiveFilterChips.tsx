import { Chip } from "../ui/Chip";
import { AVAILABILITY_OPTIONS } from "../types/catalog";
import {
  DEFAULT_RPG_QUERY,
  RPG_GENRE_OPTIONS,
  RPG_PUBLICATION_OPTIONS,
  RPG_SORT_OPTIONS,
  type RpgQuery,
} from "../types/rpg";
import "./ActiveFilterChips.css";

interface RpgActiveFilterChipsProps {
  readonly query: RpgQuery;
  readonly onChange: (query: RpgQuery) => void;
}

interface ActiveChip {
  readonly key: string;
  readonly label: string;
  readonly cleared: RpgQuery;
}

function optionLabel(
  options: readonly { readonly value: string; readonly label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function activeChips(query: RpgQuery): readonly ActiveChip[] {
  const candidates: readonly (ActiveChip | null)[] = [
    query.genre !== DEFAULT_RPG_QUERY.genre
      ? {
          key: "genre",
          label: `Género: ${optionLabel(RPG_GENRE_OPTIONS, query.genre)}`,
          cleared: { ...query, genre: DEFAULT_RPG_QUERY.genre },
        }
      : null,
    query.publicationKind !== DEFAULT_RPG_QUERY.publicationKind
      ? {
          key: "publication-kind",
          label: `Tipo: ${optionLabel(
            RPG_PUBLICATION_OPTIONS,
            query.publicationKind,
          )}`,
          cleared: {
            ...query,
            publicationKind: DEFAULT_RPG_QUERY.publicationKind,
          },
        }
      : null,
    query.availability !== DEFAULT_RPG_QUERY.availability
      ? {
          key: "availability",
          label: optionLabel(AVAILABILITY_OPTIONS, query.availability),
          cleared: { ...query, availability: DEFAULT_RPG_QUERY.availability },
        }
      : null,
    query.minRating > DEFAULT_RPG_QUERY.minRating
      ? {
          key: "rating",
          label: `Valoración ≥ ${query.minRating.toFixed(1)}`,
          cleared: { ...query, minRating: DEFAULT_RPG_QUERY.minRating },
        }
      : null,
    query.sort !== DEFAULT_RPG_QUERY.sort
      ? {
          key: "sort",
          label: `Orden: ${optionLabel(RPG_SORT_OPTIONS, query.sort)}`,
          cleared: { ...query, sort: DEFAULT_RPG_QUERY.sort },
        }
      : null,
  ];

  return candidates.filter((candidate): candidate is ActiveChip => candidate !== null);
}

export function RpgActiveFilterChips({
  query,
  onChange,
}: RpgActiveFilterChipsProps) {
  const chips = activeChips(query);

  if (chips.length === 0) return null;

  return (
    <div className="active-filter-chips" aria-label="Filtros activos">
      {chips.map((chip) => (
        <Chip key={chip.key} onRemove={() => onChange(chip.cleared)}>
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
