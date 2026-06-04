import "./FilterControl.css";

export type FilterValue = "all" | "available" | "lent";

interface FilterControlProps {
  readonly value: FilterValue;
  readonly onChange: (value: FilterValue) => void;
}

const FILTER_OPTIONS: readonly { readonly value: FilterValue; readonly label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "available", label: "Disponible" },
  { value: "lent", label: "Prestado" },
];

export function FilterControl({ value, onChange }: FilterControlProps) {
  return (
    <div className="filter-control" role="group" aria-label="Filtro de disponibilidad">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={value === option.value ? "active" : ""}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
