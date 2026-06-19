"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicIdentidad from "./InfographicIdentidad";

interface Valor {
  id: number;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

const inputStyle: React.CSSProperties = {
  padding: "10px",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-sm)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  width: "100%",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
};

export default function IdentidadPage() {
  const { toast } = useToast();
  const [tenantName, setTenantName] = useState("");
  const [mision, setMision] = useState("");
  const [vision, setVision] = useState("");
  const [valores, setValores] = useState<Valor[]>([]);
  const [saving, setSaving] = useState(false);
  const [newValor, setNewValor] = useState({ nombre: "", descripcion: "" });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const [identidad, vals] = await Promise.all([
      api.getIdentidad().catch(() => null),
      api.getValores().catch(() => []),
    ]);
    if (identidad) {
      setTenantName(identidad.tenant_name || "");
      setMision(identidad.mision || "");
      setVision(identidad.vision || "");
    }
    setValores(vals);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveIdentidad = async () => {
    setSaving(true);
    try {
      await api.updateIdentidad({ mision, vision });
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateValor = async () => {
    if (!newValor.nombre.trim()) return;
    try {
      await api.createValor({
        nombre: newValor.nombre,
        descripcion: newValor.descripcion || undefined,
      });
      setNewValor({ nombre: "", descripcion: "" });
      loadData();
    } catch (e: any) {
      toast.error("Error al crear valor: " + e.message);
    }
  };

  const handleDeleteValor = async (id: number) => {
    if (!confirm("Eliminar este valor institucional?")) return;
    try {
      await api.deleteValor(id);
      loadData();
    } catch (e: any) {
      toast.error("Error al eliminar: " + e.message);
    }
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaIdentidad();
      toast.success("Identidad generada. Revise el Inbox IA para aprobar mision, vision y valores.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header">
          <h2 className="header-title">Identidad Institucional</h2>
        </header>
        <div className="page-content">
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">
          {tenantName ? `${tenantName} - Identidad Institucional` : "Identidad Institucional"}
        </h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            background: "var(--bg-secondary)",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)"
          }}>
            <button
              onClick={() => setViewMode("gestion")}
              style={{
                background: viewMode === "gestion" ? "var(--bg-tertiary)" : "transparent",
                color: viewMode === "gestion" ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: viewMode === "gestion" ? 600 : 400,
                transition: "all 0.2s ease"
              }}
            >
              Datos
            </button>
            <button
              onClick={() => setViewMode("infografia")}
              style={{
                background: viewMode === "infografia" ? "var(--bg-tertiary)" : "transparent",
                color: viewMode === "infografia" ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: viewMode === "infografia" ? 600 : 400,
                transition: "all 0.2s ease"
              }}
            >
              Infografía
            </button>
          </div>
          {viewMode === "gestion" && (
            <button
              className="btn btn-primary"
              onClick={handleRunIA}
              disabled={iaLoading}
              style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {iaLoading ? "Generando..." : "Generar Identidad (IA)"}
            </button>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicIdentidad data={{ tenantName, mision, vision, valores }} />
        ) : (
          <>
            {/* Mision y Vision */}
            <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Mision y Vision</h3>
          </div>

          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "6px",
                  color: "var(--text-secondary)",
                }}
              >
                Mision
              </label>
              <textarea
                value={mision}
                onChange={(e) => setMision(e.target.value)}
                placeholder="Declaracion de la mision institucional..."
                rows={4}
                style={textareaStyle}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "6px",
                  color: "var(--text-secondary)",
                }}
              >
                Vision
              </label>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Declaracion de la vision institucional..."
                rows={4}
                style={textareaStyle}
              />
            </div>

            <div>
              <button
                className="btn btn-primary"
                onClick={handleSaveIdentidad}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar Mision y Vision"}
              </button>
            </div>
          </div>
        </div>

        {/* Valores Institucionales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Valores Institucionales</h3>
          </div>

          {/* Add form */}
          <div
            style={{
              padding: "16px",
              background: "var(--bg-tertiary)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 2fr",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Nombre
                </label>
                <input
                  type="text"
                  value={newValor.nombre}
                  onChange={(e) =>
                    setNewValor({ ...newValor, nombre: e.target.value })
                  }
                  placeholder="Ej: Transparencia"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Descripcion
                </label>
                <input
                  type="text"
                  value={newValor.descripcion}
                  onChange={(e) =>
                    setNewValor({ ...newValor, descripcion: e.target.value })
                  }
                  placeholder="Breve descripcion del valor..."
                  style={inputStyle}
                />
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleCreateValor}>
              Agregar Valor
            </button>
          </div>

          {/* List */}
          {valores.length === 0 ? (
            <p
              style={{
                color: "var(--text-muted)",
                fontStyle: "italic",
                fontSize: "0.85rem",
              }}
            >
              No hay valores registrados. Agrega el primero.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {valores.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "var(--bg-secondary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {v.nombre}
                    </span>
                    {v.descripcion && (
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {v.descripcion}
                      </p>
                    )}
                  </div>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: "0.75rem", padding: "4px 12px" }}
                    onClick={() => handleDeleteValor(v.id)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </>
  );
}
