import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { ValidateMemberResponse } from "../types/member";
import { Button } from "../ui/Button";
import { PageTitle } from "../ui/PageTitle";
import "./ValidacionPage.css";

// ── Page states ───────────────────────────────────────────────────────────────

type ValidacionState =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "found"; readonly member: ValidateMemberResponse }
  | { readonly kind: "not-found"; readonly number: string }
  | { readonly kind: "error"; readonly message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function verdictText(active: boolean, genderLabel: string): string {
  return active ? `ES ${genderLabel.toUpperCase()}` : `NO ES ${genderLabel.toUpperCase()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SearchInputProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly onClear: () => void;
  readonly onSubmit: () => void;
}

function SearchInput({ value, onChange, onClear, onSubmit }: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="validacion-search-box">
      <svg
        className="validacion-search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 L20.5 20.5" strokeLinecap="round" />
      </svg>
      <input
        id="validacion-input"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar socio/a por número..."
        aria-label="Número de socio"
        className="validacion-input"
      />
      {value && (
        <button
          type="button"
          className="validacion-clear-btn"
          onClick={onClear}
          aria-label="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
}

interface FoundResultProps {
  readonly member: ValidateMemberResponse;
}

function FoundResult({ member }: FoundResultProps) {
  const fullName = `${member.first_name} ${member.last_name}`.toUpperCase();

  return (
    <section className="validacion-result" aria-label="Resultado de validación">
      <h2 className="validacion-result-name">
        {fullName} #{member.member_number}
      </h2>
      <p
        className={`validacion-verdict ${
          member.active ? "validacion-verdict--active" : "validacion-verdict--inactive"
        }`}
      >
        {verdictText(member.active, member.gender_label)}
      </p>
      {member.last_payment !== null && (
        <div className="validacion-payment">
          <p className="validacion-payment-label">ÚLTIMA CUOTA PAGADA:</p>
          <p className="validacion-payment-date">{member.last_payment}</p>
        </div>
      )}
    </section>
  );
}

interface NotFoundResultProps {
  readonly number: string;
}

function NotFoundResult({ number }: NotFoundResultProps) {
  return (
    <section className="validacion-result" aria-label="Resultado de validación">
      <p className="validacion-not-found-text">
        No se ha encontrado al socio o socia con número
      </p>
      <p className="validacion-not-found-number">{number}</p>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ValidacionPage() {
  const [searchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState<string>(() => searchParams.get("id") ?? "");
  const [state, setState] = useState<ValidacionState>({ kind: "idle" });
  const hasAutoSearched = useRef(false);

  const handleSearch = async (numberStr: string) => {
    const trimmed = numberStr.trim();
    if (!trimmed) return;

    setState({ kind: "loading" });
    try {
      const member = await apiFetch<ValidateMemberResponse>(
        `/members/validate?number=${encodeURIComponent(trimmed)}`
      );
      setState({ kind: "found", member });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      // apiFetch throws with the response error message; a 404 produces
      // "Error 404" or the server's own message — distinguish not-found from
      // other network errors by checking for 404 in the message.
      if (message.includes("404") || message.toLowerCase().includes("not found")) {
        setState({ kind: "not-found", number: trimmed });
      } else {
        setState({ kind: "error", message: message || "Error de conexión." });
      }
    }
  };

  // Auto-search when ?id=<n> is present on mount
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam && !hasAutoSearched.current) {
      hasAutoSearched.current = true;
      void handleSearch(idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = () => {
    setInputValue("");
    setState({ kind: "idle" });
  };

  const isEmpty = inputValue.trim() === "";

  return (
    <div className="validacion-page">
      <PageTitle>Validar Membresía</PageTitle>

      <hr className="validacion-divider" />

      <p className="validacion-intro">
        Introduce el número de socio en el siguiente campo para validar la membresía del socio o socia.
      </p>

      <div className="validacion-form">
        <SearchInput
          value={inputValue}
          onChange={setInputValue}
          onClear={handleClear}
          onSubmit={() => void handleSearch(inputValue)}
        />
        <Button
          variant={isEmpty ? "secondary" : "primary"}
          disabled={isEmpty || state.kind === "loading"}
          onClick={() => void handleSearch(inputValue)}
          className="validacion-submit-btn"
        >
          {state.kind === "loading" ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {state.kind === "found" && <FoundResult member={state.member} />}
      {state.kind === "not-found" && <NotFoundResult number={state.number} />}
      {state.kind === "error" && (
        <p className="validacion-error" role="alert">
          {state.message}
        </p>
      )}

      <div className="validacion-disclaimer">
        <p>
          La membresía de un socio o socia tiene una duración mínima de 1 año natural o hasta que se realice la próxima reunión.
        </p>
        <p>
          Ser socio o socia permite el acceso libre a la ludoteca del club además de otorgar ciertos beneficios que pueden ir cambiando segun la temporada y los acuerdo realizados con los socios y otras entidades implicadas.
        </p>
      </div>
    </div>
  );
}
