import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card } from "../ui/Card";
import { PageTitle } from "../ui/PageTitle";
import "./ProfilePage.css";

const UNAVAILABLE = "No disponible";

export function ProfilePage() {
  const { member, loading } = useAuth();

  if (loading) {
    return (
      <div className="profile-page">
        <PageTitle>Mi perfil</PageTitle>
        <p className="profile-loading">Cargando perfil...</p>
      </div>
    );
  }

  if (member === null) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="profile-page">
      <PageTitle>Mi perfil</PageTitle>

      <Card
        as="section"
        className="profile-card"
        aria-labelledby="profile-details-title"
      >
        <div className="profile-card-heading">
          <h2 id="profile-details-title">Datos de membresía</h2>
          <span
            className={`profile-status profile-status--${member.is_active ? "active" : "inactive"}`}
          >
            {member.is_active ? "Activo" : "Inactivo"}
          </span>
        </div>

        <dl className="profile-fields">
          <div>
            <dt>Número de socio</dt>
            <dd>{member.member_number ?? UNAVAILABLE}</dd>
          </div>
          <div>
            <dt>Nombre</dt>
            <dd>{member.first_name}</dd>
          </div>
          <div>
            <dt>Apellidos</dt>
            <dd>{member.last_name}</dd>
          </div>
          <div>
            <dt>Apodo</dt>
            <dd>{member.nickname ?? UNAVAILABLE}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${member.email}`}>{member.email}</a>
            </dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              {member.phone ? (
                <a href={`tel:${member.phone}`}>{member.phone}</a>
              ) : (
                UNAVAILABLE
              )}
            </dd>
          </div>
          <div>
            <dt>Estado de membresía</dt>
            <dd>{member.is_active ? "Activo" : "Inactivo"}</dd>
          </div>
          <div>
            <dt>Última cuota</dt>
            <dd>{member.last_payment ?? UNAVAILABLE}</dd>
          </div>
        </dl>
      </Card>

      <nav className="profile-links" aria-label="Acciones del perfil">
        <Link to="/my-loans">Mis préstamos</Link>
        <Link to="/change-password">Cambiar contraseña</Link>
      </nav>
    </div>
  );
}
