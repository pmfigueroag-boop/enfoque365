"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicBlueOcean from "./InfographicBlueOcean";

const ERRC_QUADRANTS = [
  { value: "eliminate", label: "Eliminar", subtitle: "Factores que la industria da por sentado pero no agregan valor", color: "#ef4444" },
  { value: "reduce", label: "Reducir", subtitle: "Factores que deben reducirse muy por debajo del estandar", color: "#f59e0b" },
  { value: "raise", label: "Incrementar", subtitle: "Factores que deben elevarse muy por encima del estandar", color: "#3b82f6" },
  { value: "create", label: "Crear", subtitle: "Factores que la industria nunca ha ofrecido", color: "#10b981" },
];

export default function BlueOceanPage() {
  const { toast } = useToast();
  const [actions, setActions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ action_type: "eliminate", factor: "", description: "", current_level: 3, target_level: 0 });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const data = await api.getBlueOcean().catch(() => []);
    setActions(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newItem.factor.trim()) return;
    await api.createBlueOcean(newItem);
    setNewItem({ action_type: "eliminate", factor: "", description: "", current_level: 3, target_level: 0 });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta accion ERRC?")) return;
    await api.deleteBlueOcean(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaBlueOcean();
      toast.success("Grid ERRC generado. Revise el Inbox IA para aprobar.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Formulacion - Blue Ocean (ERRC)</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Formulacion - Blue Ocean (ERRC)</h2>
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
                + Nueva Accion
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Generando..." : "Generar ERRC (IA)"}
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
          <strong>Blue Ocean (Kim y Mauborgne):</strong> El grid ERRC define que factores Eliminar, Reducir, Incrementar y Crear
          para salir del oceano rojo de competencia y crear espacio de mercado nuevo.
        </div>

        {showForm && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Nueva Accion ERRC</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Accion</label>
                <select
                  value={newItem.action_type}
                  onChange={(e) => setNewItem({ ...newItem, action_type: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {ERRC_QUADRANTS.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Nivel Actual (0-5)</label>
                <select value={newItem.current_level} onChange={(e) => setNewItem({ ...newItem, current_level: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                  {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Nivel Objetivo (0-5)</label>
                <select value={newItem.target_level} onChange={(e) => setNewItem({ ...newItem, target_level: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                  {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <input
              value={newItem.factor}
              onChange={(e) => setNewItem({ ...newItem, factor: e.target.value })}
              placeholder="Factor competitivo..."
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Descripcion..."
              rows={2}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* ERRC 2x2 Grid */}
        {viewMode === "infografia" ? (
          <InfographicBlueOcean data={actions} />
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
          {ERRC_QUADRANTS.map((q) => {
            const items = actions.filter((a: any) => a.action_type === q.value);
            return (
              <div key={q.value} className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{
                  padding: "14px 20px",
                  borderBottom: `3px solid ${q.color}`,
                  background: "var(--bg-secondary)",
                }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: q.color, margin: 0 }}>
                    {q.label}
                  </h3>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {q.subtitle} | {items.length} factor{items.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  {items.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Sin factores definidos.
                    </p>
                  ) : (
                    items.map((a: any) => (
                      <div key={a.id} style={{
                        padding: "10px 12px",
                        marginBottom: "8px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-tertiary)",
                        borderLeft: `3px solid ${q.color}`,
                        wordBreak: "break-word",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                            {a.factor}
                          </h4>
                          <button
                            onClick={() => handleDelete(a.id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                            title="Eliminar"
                          >
                            X
                          </button>
                        </div>
                        {/* Level bars */}
                        <div style={{ display: "flex", gap: "12px", marginBottom: "6px", fontSize: "0.7rem" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: "var(--text-muted)" }}>Actual: </span>
                            <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-secondary)", marginTop: "2px" }}>
                              <div style={{ height: "100%", borderRadius: "3px", background: "var(--text-muted)", width: `${(a.current_level || 0) * 20}%`, transition: "width 0.3s" }} />
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: q.color }}>Objetivo: </span>
                            <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-secondary)", marginTop: "2px" }}>
                              <div style={{ height: "100%", borderRadius: "3px", background: q.color, width: `${(a.target_level || 0) * 20}%`, transition: "width 0.3s" }} />
                            </div>
                          </div>
                        </div>
                        {a.description && (
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                            {a.description}
                          </p>
                        )}
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
