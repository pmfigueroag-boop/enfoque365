"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface UserItem {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = ["admin", "estratega", "auditor", "lector"];

const ROLE_COLORS: Record<string, string> = {
  admin: "#ef4444",
  estratega: "#6366f1",
  auditor: "#f59e0b",
  lector: "#64748b",
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("lector");

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e: any) {
      setError(e.message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    if (!formEmail || !formName || !formPassword) {
      setError("Todos los campos son requeridos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.createUser({
        email: formEmail,
        full_name: formName,
        password: formPassword,
        role: formRole,
      });
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      setFormRole("lector");
      setShowForm(false);
      await fetchUsers();
    } catch (e: any) {
      setError(e.message || "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (e: any) {
      setError(e.message || "Error al cambiar rol");
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md, 12px)",
    padding: "24px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "var(--radius-sm, 8px)",
    border: "1px solid var(--border-color)",
    background: "var(--bg-tertiary, #1a1a2e)",
    color: "var(--text-primary)",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Gestion de Usuarios
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              margin: "4px 0 0",
            }}
          >
            Administre los usuarios y roles de la institucion
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-sm, 8px)",
            border: "none",
            background: "var(--primary-600, #4f46e5)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          {showForm ? "Cancelar" : "+ Nuevo Usuario"}
        </button>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#ef4444",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#fca5a5",
            marginBottom: 16,
            padding: "12px 16px",
            fontSize: "0.85rem",
          }}
        >
          {error}
          <button
            onClick={() => setError("")}
            style={{
              float: "right",
              background: "none",
              border: "none",
              color: "#fca5a5",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            X
          </button>
        </div>
      )}

      {/* Formulario de creacion */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 16px",
            }}
          >
            Nuevo Usuario
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={labelStyle}>Nombre Completo</label>
              <input
                style={inputStyle}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Juan Perez"
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="juan@institucion.gob.do"
              />
            </div>
            <div>
              <label style={labelStyle}>Contrasena</label>
              <input
                style={inputStyle}
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
              />
            </div>
            <div>
              <label style={labelStyle}>Rol</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            style={{
              padding: "10px 24px",
              borderRadius: "var(--radius-sm, 8px)",
              border: "none",
              background: saving
                ? "var(--text-muted)"
                : "var(--primary-600, #4f46e5)",
              color: "#fff",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
            }}
          >
            {saving ? "Guardando..." : "Crear Usuario"}
          </button>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div style={cardStyle}>
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
            Cargando...
          </p>
        ) : users.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
            No hay usuarios registrados
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "10px 12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Nombre
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Email
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Rol
                </th>
                <th
                  style={{
                    padding: "10px 12px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Creado
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: ROLE_COLORS[u.role] || "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {u.full_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      {u.full_name}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {u.email}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={u.role}
                      onChange={(e) =>
                        handleRoleChange(u.id, e.target.value)
                      }
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: `1px solid ${ROLE_COLORS[u.role] || "#64748b"}44`,
                        background: `${ROLE_COLORS[u.role] || "#64748b"}18`,
                        color: ROLE_COLORS[u.role] || "#64748b",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-muted)",
                      fontSize: "0.8rem",
                    }}
                  >
                    {new Date(u.created_at).toLocaleDateString("es-DO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      {users.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          {ROLES.map((r) => {
            const count = users.filter((u) => u.role === r).length;
            if (count === 0) return null;
            return (
              <div
                key={r}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  background: `${ROLE_COLORS[r]}18`,
                  border: `1px solid ${ROLE_COLORS[r]}44`,
                  color: ROLE_COLORS[r],
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {count} {r.charAt(0).toUpperCase() + r.slice(1)}
                {count > 1 ? "s" : ""}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
