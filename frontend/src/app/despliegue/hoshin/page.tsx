"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicHoshin from "./InfographicHoshin";

interface HoshinItem {
  id: number;
  objetivo_estrategico_desc: string;
  perspectiva: string;
  objetivo_tactico: string;
  responsable: string;
  meta_corto_plazo: string;
  estado: "pendiente" | "en_progreso" | "completado";
}

const PERSP_COLORS: Record<string, string> = {
  financiera: "#3b82f6",
  clientes: "#10b981",
  procesos: "#f59e0b",
  aprendizaje: "#8b5cf6",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pendiente: { bg: "#ef444420", color: "#ef4444", label: "Pendiente" },
  en_progreso: { bg: "#f59e0b20", color: "#f59e0b", label: "En progreso" },
  completado: { bg: "#10b98120", color: "#10b981", label: "Completado" },
};

const STATUS_CYCLE: Array<"pendiente" | "en_progreso" | "completado"> = [
  "pendiente",
  "en_progreso",
  "completado",
];

export default function HoshinKanriPage() {
  const [hoshinItems, setHoshinItems] = useState<HoshinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const fetchItems = async () => {
    try {
      const data = await api.getHoshin();
      setHoshinItems(data || []);
    } catch {
      setHoshinItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleGenerateHoshin = async () => {
    setIaLoading(true);
    try {
      await api.iaGenerarHoshin();
      await fetchItems();
    } catch {
      // generation failed – keep current items
    } finally {
      setIaLoading(false);
    }
  };

  const toggleStatus = async (item: HoshinItem) => {
    const currentIdx = STATUS_CYCLE.indexOf(item.estado);
    const newStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    // Optimistic update
    setHoshinItems((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, estado: newStatus } : h))
    );

    try {
      await api.updateHoshinStatus(item.id, newStatus);
    } catch {
      // Revert on failure
      setHoshinItems((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, estado: item.estado } : h))
      );
    }
  };

  return (
    <>
      <header className="header">
        <h2 className="header-title">Hoshin Kanri (Despliegue)</h2>
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
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerateHoshin}
                disabled={iaLoading || loading}
                style={{
                  background: iaLoading
                    ? "var(--text-muted)"
                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {iaLoading ? "Generando..." : "Generar Despliegue (IA)"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicHoshin data={hoshinItems} />
        ) : (
          <>
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        ) : hoshinItems.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "60px" }}
          >
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--primary-500)",
                marginBottom: "16px",
              }}
            >
              Matriz Hoshin Kanri
            </div>
            <h3 style={{ marginBottom: "8px" }}>Sin datos de despliegue</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Presione &quot;Generar Despliegue (IA)&quot; para cascadear los
              objetivos estrategicos en objetivos tacticos con responsables y
              metas a corto plazo.
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              {[
                {
                  label: "Total Items",
                  value: hoshinItems.length,
                  color: "#6366f1",
                },
                {
                  label: "Pendientes",
                  value: hoshinItems.filter((h) => h.estado === "pendiente")
                    .length,
                  color: "#ef4444",
                },
                {
                  label: "En Progreso",
                  value: hoshinItems.filter((h) => h.estado === "en_progreso")
                    .length,
                  color: "#f59e0b",
                },
                {
                  label: "Completados",
                  value: hoshinItems.filter((h) => h.estado === "completado")
                    .length,
                  color: "#10b981",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card"
                  style={{ padding: "16px", textAlign: "center" }}
                >
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: 700,
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Hoshin table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
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
                      background: "var(--bg-secondary)",
                      borderBottom: "1px solid var(--border-color)",
                    }}
                  >
                    <th style={thStyle}>Perspectiva</th>
                    <th style={thStyle}>Objetivo Estrategico</th>
                    <th style={thStyle}>Objetivo Tactico</th>
                    <th style={thStyle}>Responsable</th>
                    <th style={thStyle}>Meta Corto Plazo</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {hoshinItems.map((item) => {
                    const pColor =
                      PERSP_COLORS[item.perspectiva] || "#6b7280";
                    const status = STATUS_STYLES[item.estado] || STATUS_STYLES.pendiente;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                        }}
                      >
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: pColor,
                              textTransform: "capitalize",
                              fontSize: "0.8rem",
                            }}
                          >
                            {item.perspectiva}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, maxWidth: "220px" }}>
                          {item.objetivo_estrategico_desc.length > 60
                            ? item.objetivo_estrategico_desc.substring(0, 60) + "..."
                            : item.objetivo_estrategico_desc}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>
                          {item.objetivo_tactico}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              background: "var(--bg-secondary)",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.8rem",
                            }}
                          >
                            {item.responsable}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: "0.8rem" }}>
                          {item.meta_corto_plazo}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button
                            onClick={() => toggleStatus(item)}
                            style={{
                              background: status.bg,
                              color: status.color,
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "var(--radius-sm)",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            {status.label}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>
          </>
        )}
          </>
        )}
      </div>
    </>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: "0.8rem",
  color: "var(--text-secondary)",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  color: "var(--text-primary)",
};
