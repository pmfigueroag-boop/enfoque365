"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicTows from "./InfographicTows";

const TOWS_QUADRANTS = [
  { value: "fo", label: "FO - Ofensivas", subtitle: "Fortalezas x Oportunidades", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
  { value: "fa", label: "FA - Defensivas", subtitle: "Fortalezas x Amenazas", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  { value: "do", label: "DO - Reorientacion", subtitle: "Debilidades x Oportunidades", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { value: "da", label: "DA - Supervivencia", subtitle: "Debilidades x Amenazas", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
];

const PRIORITY_LABELS: Record<number, string> = {
  1: "Muy Baja", 2: "Baja", 3: "Media", 4: "Alta", 5: "Critica",
};

function getPriorityColor(p: number): string {
  if (p >= 4) return "#ef4444";
  if (p === 3) return "#f59e0b";
  return "#10b981";
}

export default function TowsPage() {
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ quadrant: "fo", strategy: "", priority: 3 });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const data = await api.getTows().catch(() => []);
    setStrategies(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newItem.strategy.trim()) return;
    await api.createTows(newItem);
    setNewItem({ quadrant: "fo", strategy: "", priority: 3 });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta estrategia TOWS?")) return;
    await api.deleteTows(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaTows();
      toast.success("Cruce TOWS ejecutado. Las estrategias propuestas se enviaron al Inbox IA.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Sintesis Estrategica - TOWS</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Sintesis Estrategica - TOWS</h2>
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
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: "0.85rem" }}>
                + Nueva Estrategia
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Cruzando..." : "Cruzar FODA (IA)"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        <div style={{
          padding: "12px 16px",
          marginBottom: "20px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}>
          <strong>TOWS cruza los 4 cuadrantes FODA</strong> para generar estrategias accionables.
          Necesita items FODA aprobados en al menos 2 cuadrantes.
        </div>

        {showForm && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Nueva Estrategia TOWS</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Cuadrante</label>
                <select
                  value={newItem.quadrant}
                  onChange={(e) => setNewItem({ ...newItem, quadrant: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {TOWS_QUADRANTS.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Prioridad (1-5)</label>
                <select
                  value={newItem.priority}
                  onChange={(e) => setNewItem({ ...newItem, priority: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} - {PRIORITY_LABELS[n]}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              value={newItem.strategy}
              onChange={(e) => setNewItem({ ...newItem, strategy: e.target.value })}
              placeholder="Describa la estrategia resultante del cruce..."
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* TOWS 2x2 Grid */}
        {viewMode === "infografia" ? (
          <InfographicTows data={strategies} />
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
          {TOWS_QUADRANTS.map((q) => {
            const items = strategies.filter((s: any) => s.quadrant === q.value);
            return (
              <div key={q.value} className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{
                  padding: "14px 20px",
                  borderBottom: `3px solid ${q.color}`,
                  background: "var(--bg-secondary)",
                }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: q.color, margin: 0 }}>
                    {q.label}
                  </h3>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {q.subtitle} | {items.length} estrategia{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  {items.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Sin estrategias. Ejecute el cruce IA o agregue manualmente.
                    </p>
                  ) : (
                    items.map((s: any) => (
                      <div key={s.id} style={{
                        padding: "10px 12px",
                        marginBottom: "8px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-tertiary)",
                        borderLeft: `3px solid ${q.color}`,
                        wordBreak: "break-word",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: "999px",
                            background: `${getPriorityColor(s.priority || 3)}22`,
                            color: getPriorityColor(s.priority || 3),
                          }}>
                            P{s.priority || 3} - {PRIORITY_LABELS[s.priority || 3]}
                          </span>
                          <button
                            onClick={() => handleDelete(s.id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                            title="Eliminar"
                          >
                            X
                          </button>
                        </div>
                        <p style={{ fontSize: "0.83rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
                          {s.strategy}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </>
  );
}
