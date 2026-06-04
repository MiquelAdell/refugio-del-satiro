import { useEffect, useRef, useState } from "react";
import "./SearchBar.css";

interface SearchBarProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const resolvedPlaceholder = placeholder ?? "Buscar juegos...";
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="search-bar">
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedPlaceholder}
      />
    </div>
  );
}
