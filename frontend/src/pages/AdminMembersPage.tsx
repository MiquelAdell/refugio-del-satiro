import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch, apiUpload } from "../api/client";
import type {
  AdminMember,
  CreateMemberRequest,
  CreateMemberResponse,
  EditMemberRequest,
  ImportMembersResponse,
  MemberGender,
  SendLinkResponse,
  OkResponse,
} from "../types/admin";
import { memberGenders } from "../types/admin";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import "./AdminMembersPage.css";

const CSV_COLUMNS =
  "Nº Socio,Apellidos,Nombre,Apodo,Telefóno,Email,admin,Última cuota,Género,Pagada";

const SAMPLE_MEMBERS_CSV = `${CSV_COLUMNS}
1,García López,Carla,Carla,600 00 00 01,carla@example.com,,24/01/2026,Femenino,Sí
2,Torres Ruiz,Jorge,Jordi,600 00 00 02,jorge@example.com,yes,24/01/2026,Masculino,Sí
`;

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_MEMBERS_CSV], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ejemplo-socios.csv";
  link.click();
  URL.revokeObjectURL(url);
}

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
  const [editTarget, setEditTarget] = useState<AdminMember | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportMembersResponse | null>(null);
  const [showImportHelp, setShowImportHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setTokenBanner(null);
    setSuccessMessage(null);
    setImportResult(null);
    setError(null);
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiUpload<ImportMembersResponse>(
        "/admin/members/import",
        formData
      );
      if (res.created.length === 0) {
        setSuccessMessage(
          "Importación completada. Ningún socio nuevo (socios existentes actualizados)."
        );
      } else {
        setImportResult(res);
      }
      void fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error importando el CSV.");
    } finally {
      setImporting(false);
    }
  };

  const handleEditSave = async (id: number, req: EditMemberRequest) => {
    try {
      await apiFetch<OkResponse>(`/admin/members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(req),
      });
      setEditTarget(null);
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error actualizando el socio.");
    }
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
        <div className="admin-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="admin-file-input"
            aria-label="Seleccionar archivo CSV de socios"
            onChange={(e) => void handleImportFile(e)}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importando..." : "Importar CSV"}
          </Button>
          <Button
            variant="secondary"
            aria-label="Ayuda sobre el formato del CSV"
            onClick={() => setShowImportHelp(true)}
          >
            ?
          </Button>
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

      {importResult && (
        <div className="admin-token-banner">
          <p>
            {`${importResult.created.length} socios nuevos, ${importResult.skipped_rows} filas omitidas de ${importResult.total_rows}`}
          </p>
          <ul className="admin-import-list">
            {importResult.created.map((imported) => (
              <li key={imported.email} className="admin-import-item">
                <span className="admin-import-name">{imported.display_name}</span>
                <div className="admin-token-url">
                  <code>{imported.token_url}</code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopy(imported.token_url)}
                  >
                    Copiar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditTarget(m)}
                        disabled={actionLoading === m.id}
                      >
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={showImportHelp}
        onOpenChange={setShowImportHelp}
        title="¿Cómo preparar el CSV?"
        description="El archivo debe tener el mismo formato que la exportación CSV de la hoja de cálculo de socios."
      >
        <div className="admin-import-help">
          <p>Columnas esperadas (la primera fila debe ser la cabecera):</p>
          <code className="admin-import-help-columns">{CSV_COLUMNS}</code>
          <ul>
            <li>
              Las filas sin <strong>Email</strong> se omiten.
            </li>
            <li>
              Si el email ya existe, se actualizan los datos del socio (no se
              duplica).
            </li>
            <li>
              Los socios nuevos reciben un enlace para establecer su
              contraseña, que se muestra tras la importación.
            </li>
            <li>
              La columna <code>admin</code> con valor <code>yes</code> marca al
              socio como administrador (solo aplica a socios nuevos; los
              existentes conservan su estado de administrador).
            </li>
            <li>
              La columna <code>Pagada</code> con valor <code>No</code> marca
              al socio como inactivo (no ha pagado la cuota). Cualquier otro
              valor (<code>Sí</code>, <code>Honorífic</code> o vacío) lo deja
              activo.
            </li>
          </ul>
          <div className="admin-import-help-actions">
            <Button variant="secondary" onClick={downloadSampleCsv}>
              Descargar CSV de ejemplo
            </Button>
          </div>
        </div>
      </Dialog>

      {editTarget && (
        <EditMemberDialog
          member={editTarget}
          onSave={(req) => void handleEditSave(editTarget.id, req)}
          onClose={() => setEditTarget(null)}
        />
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
  const [lastPayment, setLastPayment] = useState("");
  const [gender, setGender] = useState<MemberGender>("");
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
        last_payment: lastPayment.trim() || null,
        gender: gender || null,
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
        <div className="admin-form-field">
          <label htmlFor="cf-last-payment">Última cuota</label>
          <input
            id="cf-last-payment"
            type="text"
            value={lastPayment}
            onChange={(e) => setLastPayment(e.target.value)}
            placeholder="ej. 5/02/2022"
          />
        </div>
        <div className="admin-form-field">
          <label htmlFor="cf-gender">Género</label>
          <select
            id="cf-gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as MemberGender)}
            className="admin-form-select"
          >
            {memberGenders.map((g) => (
              <option key={g} value={g}>
                {g || "— Sin especificar —"}
              </option>
            ))}
          </select>
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

/* ---- Edit member dialog ---- */

interface EditMemberDialogProps {
  readonly member: AdminMember;
  readonly onSave: (req: EditMemberRequest) => void;
  readonly onClose: () => void;
}

function EditMemberDialog({ member, onSave, onClose }: EditMemberDialogProps) {
  const [firstName, setFirstName] = useState(member.first_name);
  const [lastName, setLastName] = useState(member.last_name);
  const [email, setEmail] = useState(member.email);
  const [nickname, setNickname] = useState(member.nickname ?? "");
  const [phone, setPhone] = useState(member.phone ?? "");
  const [memberNumber, setMemberNumber] = useState(
    member.member_number !== null ? String(member.member_number) : ""
  );
  const [lastPayment, setLastPayment] = useState(member.last_payment ?? "");
  const [gender, setGender] = useState<MemberGender>(
    (member.gender as MemberGender | undefined | null) ?? ""
  );
  const [isAdmin, setIsAdmin] = useState(member.is_admin);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError("Nombre, apellidos y email son obligatorios.");
      return;
    }

    onSave({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      nickname: nickname.trim() || null,
      phone: phone.trim() || null,
      member_number: memberNumber.trim() ? Number(memberNumber.trim()) : null,
      last_payment: lastPayment.trim() || null,
      gender: gender || null,
      is_admin: isAdmin,
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Editar socio: ${member.display_name}`}
      description="Actualiza los datos del socio o socia."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="admin-edit-form">
        <div className="admin-form-grid">
          <div className="admin-form-field">
            <label htmlFor="em-first-name">Nombre *</label>
            <input
              id="em-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-last-name">Apellidos *</label>
            <input
              id="em-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-email">Email *</label>
            <input
              id="em-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-nickname">Apodo</label>
            <input
              id="em-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-phone">Teléfono</label>
            <input
              id="em-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-member-number">Nº Socio</label>
            <input
              id="em-member-number"
              type="number"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-last-payment">Última cuota</label>
            <input
              id="em-last-payment"
              type="text"
              value={lastPayment}
              onChange={(e) => setLastPayment(e.target.value)}
              placeholder="ej. 5/02/2022"
            />
          </div>
          <div className="admin-form-field">
            <label htmlFor="em-gender">Género</label>
            <select
              id="em-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as MemberGender)}
              className="admin-form-select"
            >
              {memberGenders.map((g) => (
                <option key={g} value={g}>
                  {g || "— Sin especificar —"}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-field admin-form-field--checkbox">
            <label htmlFor="em-is-admin">
              <input
                id="em-is-admin"
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              Administrador
            </label>
          </div>
        </div>
        {formError && <p className="admin-form-error">{formError}</p>}
        <div className="admin-form-actions">
          <Button variant="primary" type="submit">
            Guardar
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
