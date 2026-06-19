"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicBcg from "./InfographicBcg";

const QUADRANT_TYPES = [
  { value: "star", label: "⭐ Estrella", color: "var(--warning)", subtitle: "Alto Crecimiento + Alta Participacion" },
  { value: "cash_cow", label: "🐄 Vaca Lechera", color: "var(--success)", subtitle: "Bajo Crecimiento + Alta Participacion" },
  { value: "question_mark", label: "❓ Interrogacion", color: "var(--primary-500)", subtitle: "Alto Crecimiento + Baja Participacion" },
  { value: "dog", label: "🐕 Perro", color: "var(--danger)", subtitle: "Bajo Crecimiento + Baja Participacion" },
];

const LEVEL_LABELS: Record<number, string> = {
  1: "Muy Bajo",
  2: "Bajo",
  3: "Medio",
  4: "Alto",
  5: "Muy Alto",
};

export default function BcgPage() {
  const { toast } = useToast();
  const [units, setUnits] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"data" | "infographic">("data");
  const [newUnit, setNewUnit] = useState({
    unit_name: "",
    quadrant: "star",
    market_growth: 3,
    market_share: 3,
    description: "",
    strategic_recommendation: "",
  });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);

  const loadData = async () => {
    const data = await api.getBcg().catch(() => []);
    setUnits(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newUnit.unit_name.trim()) return;
    await api.createBcg(newUnit);
    setNewUnit({ unit_name: "", quadrant: "star", market_growth: 3, market_share: 3, description: "", strategic_recommendation: "" });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta unidad BCG?")) return;
    await api.deleteBcg(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaBcg();
      toast.success("Analisis IA ejecutado. Las propuestas se enviaron al Inbox IA.");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Diagnostico Interno - BCG Matrix</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <div>
          <h2 className="header-title">Diagnostico Interno - BCG Matrix</h2>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {/* Toggle View Mode */}
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "8px",
            padding: "4px",
            marginRight: "10px"
          }}>
            <button 
              onClick={() => setViewMode("data")}
              style={{
                background: viewMode === "data" ? "var(--bg-secondary)" : "transparent",
                color: viewMode === "data" ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: viewMode === "data" ? 600 : 400,
                transition: "all 0.2s"
              }}
            >
              Datos
            </button>
            <button 
              onClick={() => setViewMode("infographic")}
              style={{
                background: viewMode === "infographic" ? "var(--bg-secondary)" : "transparent",
                color: viewMode === "infographic" ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: viewMode === "infographic" ? 600 : 400,
                transition: "all 0.2s"
              }}
            >
              Infografía
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: "0.85rem" }}>
            + Nueva Unidad
          </button>
          <button className="btn btn-primary" onClick={handleRunIA} disabled={iaLoading} style={{ fontSize: "0.85rem" }}>
            {iaLoading ? "Analizando..." : "ANALISIS"}
          </button>
        </div>
      </header>

      {viewMode === "data" ? (
        <div className="page-content animate-fade-in">
        {/* Add Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Agregar Unidad de Negocio</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Nombre de Unidad/Producto</label>
                <input
                  type="text"
                  value={newUnit.unit_name}
                  onChange={(e) => setNewUnit({ ...newUnit, unit_name: e.target.value })}
                  placeholder="Nombre del producto o unidad..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Cuadrante</label>
                <select
                  value={newUnit.quadrant}
                  onChange={(e) => setNewUnit({ ...newUnit, quadrant: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {QUADRANT_TYPES.map((qt) => (
                    <option key={qt.value} value={qt.value}>{qt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Crecimiento de Mercado (1-5)</label>
                <select
                  value={newUnit.market_growth}
                  onChange={(e) => setNewUnit({ ...newUnit, market_growth: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} - {LEVEL_LABELS[n]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Participacion de Mercado (1-5)</label>
                <select
                  value={newUnit.market_share}
                  onChange={(e) => setNewUnit({ ...newUnit, market_share: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} - {LEVEL_LABELS[n]}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              value={newUnit.description}
              onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
              placeholder="Descripcion de la unidad o producto..."
              rows={2}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              value={newUnit.strategic_recommendation}
              onChange={(e) => setNewUnit({ ...newUnit, strategic_recommendation: e.target.value })}
              placeholder="Recomendacion estrategica..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar Unidad</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* 2x2 Quadrant Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {QUADRANT_TYPES.map((qt) => {
            const items = units.filter((u: any) => u.quadrant === qt.value);
            return (
              <div key={qt.value} className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{
                  padding: "14px 20px",
                  borderBottom: `3px solid ${qt.color}`,
                  background: "var(--bg-secondary)",
                }}>
                  <h3 style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: qt.color,
                    margin: 0,
                  }}>
                    {qt.label}
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {qt.subtitle} · {items.length} unidad{items.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  {items.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Sin unidades registradas.
                    </p>
                  ) : (
                    items.map((u: any) => (
                      <div key={u.id} style={{
                        padding: "12px",
                        marginBottom: "8px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-tertiary)",
                        borderLeft: `3px solid ${qt.color}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}>
                            {u.unit_name}
                          </span>
                          <button
                            onClick={() => handleDelete(u.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              padding: "2px 6px",
                            }}
                            title="Eliminar"
                          >
                            X
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "rgba(245,158,11,0.15)",
                            color: "var(--warning)",
                          }}>
                            Crecimiento {u.market_growth}/5
                          </span>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "rgba(59,130,246,0.15)",
                            color: "var(--primary-500)",
                          }}>
                            Participacion {u.market_share}/5
                          </span>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                          {u.description}
                        </p>
                        {u.strategic_recommendation && (
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Estrategia: {u.strategic_recommendation}
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
      </div>
      ) : (
        <div style={{ marginTop: "20px" }} className="animate-fade-in">
          <InfographicBcg data={units} />
        </div>
      )}
    </>
  );
}
