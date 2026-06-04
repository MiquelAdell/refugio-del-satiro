import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import type {
  AdminMember,
  CreateMemberRequest,
  CreateMemberResponse,
  SendLinkResponse,
  OkResponse,
} from "../types/admin";
import { Button } from "../ui/Button";
import "./AdminMembersPage.css";

export function AdminMembersPage() {
  const { member, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tokenBanner, setTokenBanner] = useState<{ url: string; label: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<keyof AdminMember>("display_name");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: keyof AdminMember) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null && bv === null) return 0;
    if (av === null) return sortAsc ? 1 : -1;
    if (bv === null) return sortAsc ? -1 : 1;
    if (typeof av === "string" && typeof bv === "string") {
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (typeof av === "number" && typeof bv === "number") {
      return sortAsc ? av - bv : bv - av;
    }
    if (typeof av === "boolean" && typeof bv === "boolean") {
      return sortAsc ? (av === bv ? 0 : av ? -1 : 1) : (av === bv ? 0 : av ? 1 : -1);
    }
    return 0;
  });

  const fetchMembers = useCallback(async () => {
    try {
      const data = await apiFetch<AdminMember[]>("/admin/members");
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando los socios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (member?.is_admin) {
      void fetchMembers();
    }
  }, [member, fetchMembers]);

  const handleToggleActive = async (m: AdminMember) => {
    setActionLoading(m.id);
    try {
      const action = m.is_active ? "disable" : "enable";
      await apiFetch<OkResponse>(`/admin/members/${m.id}/${action}`, {
        method: "PATCH",
      });
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando el estado.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendLink = async (m: AdminMember) => {
    setActionLoading(m.id);
    setTokenBanner(null);
    setSuccessMessage(null);
    try {
      const res = await apiFetch<SendLinkResponse>(
        `/admin/members/${m.id}/send-access-link`,
        { method: "POST" }
      );
      if (res.email_sent) {
        setSuccessMessage(`Correo enviado a ${m.email}`);
      } else {
        setTokenBanner({
          url: res.token_url,
          label: `Enlace de acceso para ${m.display_name}:`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error enviando el enlace.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  if (authLoading) {
    return (
      <div className="admin-members-page">
        <p className="admin-loading">Cargando...</p>
      </div>
    );
  }

  if (!member?.is_admin) {
    return (
      <div className="admin-members-page">
        <p className="admin-restricted">Acceso restringido</p>
      </div>
    );
  }

  const columnHeaders: readonly (readonly [keyof AdminMember, string])[] = [
    ["display_name", "Nombre"],
    ["email", "Email"],
    ["member_number", "Nº Socio"],
    ["is_active", "Estado"],
    ["active_loan_count", "Préstamos activos"],
  ];

  return (
    <div className="admin-members-page">
      <div className="admin-members-header">
        <h1>Gestión de socios</h1>
        <Button
          variant="primary"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setTokenBanner(null);
            setSuccessMessage(null);
          }}
        >
          {showCreateForm ? "Cancelar" : "Crear socio"}
        </Button>
      </div>

      {successMessage && (
        <div className="admin-success-banner">{successMessage}</div>
      )}

      {tokenBanner && (
        <div className="admin-token-banner">
          <p>{tokenBanner.label}</p>
          <div className="admin-token-url">
            <code>{tokenBanner.url}</code>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleCopy(tokenBanner.url)}
            >
              Copiar
            </Button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateMemberForm
          onCreated={(res) => {
            setShowCreateForm(false);
            setTokenBanner({
              url: res.token_url,
              label: `Enlace de acceso para ${res.member.display_name}:`,
            });
            void fetchMembers();
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {loading ? (
        <p className="admin-loading">Cargando socios...</p>
      ) : error ? (
        <p className="admin-error">{error}</p>
      ) : members.length === 0 ? (
        <p className="admin-empty">No hay socios registrados.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                {columnHeaders.map(([key, label]) => (
                  <th
                    key={key}
                    className="admin-th-sortable"
                    onClick={() => handleSort(key)}
                  >
                    {label} {sortKey === key ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((m) => (
                <tr key={m.id}>
                  <td>{m.display_name}</td>
                  <td>{m.email}</td>
                  <td>{m.member_number ?? "—"}</td>
                  <td>
                    <span
                      className={`admin-badge ${
                        m.is_active ? "admin-badge--active" : "admin-badge--inactive"
                      }`}
                    >
                      {m.is_active ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td>{m.active_loan_count}</td>
                  <td>
                    <div className="admin-actions">
                      <Button
                        variant={m.is_active ? "danger" : "primary"}
                        size="sm"
                        onClick={() => void handleToggleActive(m)}
                        disabled={actionLoading === m.id}
                      >
                        {m.is_active ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => void handleSendLink(m)}
                        disabled={actionLoading === m.id}
                      >
                        Enviar enlace de acceso
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---- Create member inline form ---- */

interface CreateMemberFormProps {
  readonly onCreated: (res: CreateMemberResponse) => void;
  readonly onCancel: () => void;
}

function CreateMemberForm({ onCreated, onCancel }: CreateMemberFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError("Nombre, apellidos y email son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const body: CreateMemberRequest = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        member_number: memberNumber.trim() ? Number(memberNumber.trim()) : null,
      };

      const res = await apiFetch<CreateMemberResponse>("/admin/members", {
        method: "POST",
        body: JSON.stringify(body),
      });
      onCreated(res);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error creando el socio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="admin-create-form" onSubmit={(e) => void handleSubmit(e)}>
      <h2>Nuevo socio</h2>
      <div className="admin-form-grid">
        <div className="admin-form-field">
          <label htmlFor="cf-first-name">Nombre *</label>
          <input
            id="cf-first-name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-last-name">Apellidos *</label>
          <input
            id="cf-last-name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-email">Email *</label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-nickname">Apodo</label>
          <input
            id="cf-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-phone">Teléfono</label>
          <input
            id="cf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-member-number">Nº Socio</label>
          <input
            id="cf-member-number"
            type="number"
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
          />
        </div>
        {formError && <p className="admin-form-error">{formError}</p>}
        <div className="admin-form-actions">
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? "Creando..." : "Crear socio"}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </form>
  );
}
