"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicPorter from "./InfographicPorter";

const FORCE_TYPES = [
  { value: "rivalidad", label: "Rivalidad entre Competidores", color: "var(--danger)", description: "Mide la intensidad de la competencia actual. Define el potencial de rentabilidad del sector." },
  { value: "nuevos_entrantes", label: "Amenaza de Nuevos Entrantes", color: "var(--warning)", description: "Evalua la solidez de las barreras de entrada. Determina la viabilidad a largo plazo." },
  { value: "sustitutos", label: "Productos/Servicios Sustitutos", color: "var(--primary-500)", description: "Identifica alternativas fuera del sector que establecen un techo o limite a los precios." },
  { value: "poder_proveedores", label: "Poder de Proveedores", color: "var(--success)", description: "Grado en que los proveedores pueden extraer valor subiendo precios o bajando calidad." },
  { value: "poder_clientes", label: "Poder de Clientes/Usuarios", color: "#8b5cf6", description: "Capacidad de los clientes para presionar los precios a la baja o exigir mayor calidad." },
];

const CANONICAL_SUBFACTORS: Record<string, string[]> = {
  rivalidad: ["Crecimiento de la industria", "Costos fijos", "Diferenciacion de producto", "Costos de cambio", "Concentracion", "Barreras de salida", "Otro"],
  nuevos_entrantes: ["Economias de escala", "Requisitos de capital", "Acceso a canales de distribucion", "Politica gubernamental", "Represalias esperadas", "Otro"],
  sustitutos: ["Desempeno relativo de precio/valor", "Costos de cambio", "Propension del comprador", "Otro"],
  poder_proveedores: ["Concentracion de proveedores", "Volumen de compra", "Diferenciacion de insumos", "Costos de cambio", "Amenaza de integracion hacia adelante", "Otro"],
  poder_clientes: ["Concentracion de clientes", "Volumen", "Sensibilidad al precio", "Costos de cambio", "Amenaza de integracion hacia atras", "Otro"],
};

const INTENSITY_LABELS: Record<number, string> = {
  1: "Muy Baja",
  2: "Baja",
  3: "Media",
  4: "Alta",
  5: "Muy Alta",
};

const PROBABILITY_LABELS: Record<number, string> = {
  1: "Improbable",
  2: "Poco probable",
  3: "Posible",
  4: "Probable",
  5: "Casi seguro",
};

function getPressureColor(score: number): string {
  if (score >= 16) return "var(--danger)";
  if (score >= 9) return "var(--warning)";
  return "var(--success)";
}

function getPressureBg(score: number): string {
  if (score >= 16) return "rgba(239,68,68,0.15)";
  if (score >= 9) return "rgba(245,158,11,0.15)";
  return "rgba(16,185,129,0.15)";
}

function getPressureLabel(score: number): string {
  if (score >= 16) return "CRITICO";
  if (score >= 9) return "MODERADO";
  return "BAJO";
}

function getIntensityColor(level: number): string {
  if (level >= 4) return "var(--danger)";
  if (level === 3) return "var(--warning)";
  return "var(--success)";
}

function getIntensityBg(level: number): string {
  if (level >= 4) return "rgba(239,68,68,0.15)";
  if (level === 3) return "rgba(245,158,11,0.15)";
  return "rgba(16,185,129,0.15)";
}

export default function PorterPage() {
  const { toast } = useToast();
  const [forces, setForces] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newForce, setNewForce] = useState({
    force_type: "rivalidad",
    canonical_subfactor: "Crecimiento de la industria",
    description: "",
    intensity: 3,
    probability: 3,
    evidence: "",
  });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const data = await api.getPorter().catch(() => []);
    setForces(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newForce.description.trim()) return;
    await api.createPorter(newForce);
    setNewForce({ force_type: "rivalidad", canonical_subfactor: "Crecimiento de la industria", description: "", intensity: 3, probability: 3, evidence: "" });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este factor de fuerza?")) return;
    await api.deletePorter(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaPorter();
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
        <header className="header"><h2 className="header-title">Diagnostico Externo - Porter 5 Fuerzas</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h2 className="header-title">Diagnostico Externo - Porter 5 Fuerzas</h2>
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
                + Nuevo Factor
              </button>
              <button className="btn btn-primary" onClick={handleRunIA} disabled={iaLoading} style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {iaLoading ? "Analizando..." : "ANALISIS"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicPorter data={forces} />
        ) : (
          <>
        {/* Add Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Agregar Factor de Fuerza</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Tipo de Fuerza</label>
                <select
                  value={newForce.force_type}
                  onChange={(e) => {
                    const type = e.target.value;
                    setNewForce({ ...newForce, force_type: type, canonical_subfactor: CANONICAL_SUBFACTORS[type][0] });
                  }}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {FORCE_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Subfactor Teorico (Driver)</label>
                <select
                  value={newForce.canonical_subfactor}
                  onChange={(e) => setNewForce({ ...newForce, canonical_subfactor: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {CANONICAL_SUBFACTORS[newForce.force_type].map((sf) => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Intensidad (1-5)</label>
                <select
                  value={newForce.intensity}
                  onChange={(e) => setNewForce({ ...newForce, intensity: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} - {INTENSITY_LABELS[n]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Probabilidad (1-5)</label>
                <select
                  value={newForce.probability}
                  onChange={(e) => setNewForce({ ...newForce, probability: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} - {PROBABILITY_LABELS[n]}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              value={newForce.description}
              onChange={(e) => setNewForce({ ...newForce, description: e.target.value })}
              placeholder="Descripcion del factor competitivo..."
              rows={2}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              value={newForce.evidence}
              onChange={(e) => setNewForce({ ...newForce, evidence: e.target.value })}
              placeholder="Evidencia o fuente que sustenta este factor..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar Factor</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* 5 Forces Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {FORCE_TYPES.map((ft) => {
            const items = forces.filter((f: any) => f.force_type === ft.value);
            return (
              <div key={ft.value} className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{
                  padding: "14px 20px",
                  borderBottom: `3px solid ${ft.color}`,
                  background: "var(--bg-secondary)",
                }}>
                  <h3 style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: ft.color,
                    margin: 0,
                  }}>
                    {ft.label}
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px", marginBottom: "6px", lineHeight: 1.3 }}>
                    {ft.description}
                  </p>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {items.length} factor{items.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div style={{ padding: "16px" }}>
                  {items.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Sin factores registrados.
                    </p>
                  ) : (
                    items.map((f: any) => {
                      const pressure = (f.intensity || 0) * (f.probability || 0);
                      const hasPressure = f.probability != null && f.intensity != null;
                      return (
                        <div key={f.id} style={{
                          padding: "12px",
                          marginBottom: "8px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-tertiary)",
                          borderLeft: `3px solid ${ft.color}`,
                        }}>
                          {/* Header: badges + delete */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "6px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: "999px",
                                background: getIntensityBg(f.intensity),
                                color: getIntensityColor(f.intensity),
                              }}>
                                I:{f.intensity}/5
                              </span>
                              {f.probability != null && (
                                <span style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: "999px",
                                  background: getIntensityBg(f.probability),
                                  color: getIntensityColor(f.probability),
                                }}>
                                  P:{f.probability}/5
                                </span>
                              )}
                              {hasPressure && (
                                <span style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: "999px",
                                  background: getPressureBg(pressure),
                                  color: getPressureColor(pressure),
                                }}>
                                  {getPressureLabel(pressure)} ({pressure}/25)
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(f.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                padding: "2px 6px",
                                flexShrink: 0,
                              }}
                              title="Eliminar"
                            >
                              X
                            </button>
                          </div>
                          {/* Subfactor badge */}
                          {f.canonical_subfactor && (
                            <div style={{ marginBottom: "6px" }}>
                              <span style={{ fontSize: "0.7rem", fontWeight: 600, background: "rgba(99,102,241,0.1)", color: "var(--primary-400)", padding: "2px 6px", borderRadius: "4px" }}>
                                {f.canonical_subfactor}
                              </span>
                            </div>
                          )}
                          {/* Description */}
                          <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                            {f.description}
                          </p>
                          {/* AI Rationale */}
                          {f.ai_rationale && (
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "4px" }}>
                              💡 {f.ai_rationale}
                            </p>
                          )}
                          {/* Evidence */}
                          {f.evidence && (
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              📎 {f.evidence}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ 6th Card: Market Synthesis ═══ */}
        {(() => {
          // Compute per-force averages
          const forceStats = FORCE_TYPES.map((ft) => {
            const items = forces.filter((f: any) => f.force_type === ft.value);
            if (items.length === 0) return null;
            const avgIntensity = items.reduce((s: number, f: any) => s + (f.intensity || 0), 0) / items.length;
            const avgProbability = items.reduce((s: number, f: any) => s + (f.probability || f.intensity || 0), 0) / items.length;
            const avgPressure = avgIntensity * avgProbability;
            return {
              ...ft,
              avgIntensity: Math.round(avgIntensity * 10) / 10,
              avgProbability: Math.round(avgProbability * 10) / 10,
              avgPressure: Math.round(avgPressure * 10) / 10,
              count: items.length,
            };
          }).filter(Boolean) as { value: string; label: string; color: string; description: string; avgIntensity: number; avgProbability: number; avgPressure: number; count: number }[];

          if (forceStats.length < 3) return null;

          // Overall market attractiveness (inverse of average pressure)
          const overallPressure = forceStats.reduce((s, f) => s + f.avgPressure, 0) / forceStats.length;
          // Scale: 1-25 pressure → 5 to 1 attractiveness
          const attractiveness = Math.max(1, Math.min(5, Math.round((1 - (overallPressure - 1) / 24) * 4 + 1)));
          const attractivenessLabels: Record<number, string> = { 1: "Muy Bajo", 2: "Bajo", 3: "Moderado", 4: "Alto", 5: "Muy Alto" };

          // Sort by pressure to find dominant forces
          const sorted = [...forceStats].sort((a, b) => b.avgPressure - a.avgPressure);
          const dominant = sorted.slice(0, 2);
          const weakest = sorted[sorted.length - 1];

          // Determine overall rivalry level
          const rivalryLevel = overallPressure >= 16 ? "Alta" : overallPressure >= 9 ? "Moderada" : "Baja";
          const rivalryColor = overallPressure >= 16 ? "var(--danger)" : overallPressure >= 9 ? "var(--warning)" : "var(--success)";
          const rivalryBg = overallPressure >= 16 ? "rgba(239,68,68,0.12)" : overallPressure >= 9 ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)";

          // Generate strategic implication
          const dominantNames = dominant.map(d => d.label).join(" y ");
          const implications: string[] = [];
          if (dominant[0]?.avgPressure >= 16) {
            implications.push(`Presion critica en ${dominant[0].label.toLowerCase()}. Requiere atencion estrategica inmediata.`);
          }
          if (attractiveness <= 2) {
            implications.push("Mercado poco atractivo para nuevos entrantes — ventaja para incumbentes con posicion consolidada.");
          } else if (attractiveness >= 4) {
            implications.push("Mercado atractivo con oportunidades de captura de valor. Vigilar barreras de entrada.");
          }
          if (weakest && weakest.avgPressure < 6) {
            implications.push(`${weakest.label} presenta baja presion — area de ventaja competitiva potencial.`);
          }
          if (implications.length === 0) {
            implications.push(`Las fuerzas dominantes son ${dominantNames.toLowerCase()}. Enfocarse en diferenciacion y gestion de relaciones clave.`);
          }

          return (
            <div className="card" style={{
              marginTop: "24px",
              padding: "0",
              overflow: "hidden",
              border: "1px solid rgba(245,158,11,0.3)",
              background: "linear-gradient(135deg, var(--bg-primary) 0%, rgba(245,158,11,0.04) 100%)",
            }}>
              {/* Header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "2px solid rgba(245,158,11,0.25)",
                background: "rgba(245,158,11,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--warning)", margin: 0 }}>
                    📊 Caracterizacion del Mercado
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Sintesis derivada del analisis de {forceStats.length} fuerzas · {forces.length} factores evaluados
                  </p>
                </div>
                <div style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  background: rivalryBg,
                  border: `1px solid ${rivalryColor}`,
                }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Rivalidad General
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: rivalryColor }}>
                    {rivalryLevel}
                  </span>
                </div>
              </div>

              <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left: Force intensity bars */}
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Presion por Fuerza
                  </h4>
                  {sorted.map((stat) => {
                    const barWidth = Math.min(100, (stat.avgPressure / 25) * 100);
                    return (
                      <div key={stat.value} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500 }}>
                            {stat.label}
                          </span>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: getPressureColor(stat.avgPressure),
                          }}>
                            {stat.avgPressure.toFixed(1)}/25
                          </span>
                        </div>
                        <div style={{
                          height: "6px",
                          borderRadius: "3px",
                          background: "var(--bg-tertiary)",
                          overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${barWidth}%`,
                            borderRadius: "3px",
                            background: stat.color,
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Key metrics */}
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Metricas Clave
                  </h4>

                  {/* Attractiveness gauge */}
                  <div style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-tertiary)",
                    marginBottom: "10px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>Atractivo del Mercado</span>
                      <span style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: attractiveness >= 4 ? "var(--success)" : attractiveness >= 3 ? "var(--warning)" : "var(--danger)",
                      }}>
                        {attractiveness}/5 — {attractivenessLabels[attractiveness]}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} style={{
                          flex: 1,
                          height: "4px",
                          borderRadius: "2px",
                          background: n <= attractiveness
                            ? (attractiveness >= 4 ? "var(--success)" : attractiveness >= 3 ? "var(--warning)" : "var(--danger)")
                            : "var(--bg-secondary)",
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Pressure average */}
                  <div style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-tertiary)",
                    marginBottom: "10px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>Presion Promedio</span>
                      <span style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: getPressureColor(overallPressure),
                      }}>
                        {overallPressure.toFixed(1)}/25
                      </span>
                    </div>
                  </div>

                  {/* Dominant forces */}
                  <div style={{
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-tertiary)",
                  }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      Fuerzas Dominantes
                    </span>
                    {dominant.map((d) => (
                      <div key={d.value} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>{d.label}</span>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "999px",
                          background: getPressureBg(d.avgPressure),
                          color: getPressureColor(d.avgPressure),
                          marginLeft: "auto",
                        }}>
                          {d.avgPressure.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic implication */}
              <div style={{
                padding: "14px 20px",
                borderTop: "1px solid var(--border-color)",
                background: "rgba(99,102,241,0.04)",
              }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-400)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Implicacion Estrategica
                </span>
                {implications.map((imp, i) => (
                  <p key={i} style={{ fontSize: "0.83rem", color: "var(--text-primary)", margin: "6px 0 0", lineHeight: 1.4 }}>
                    → {imp}
                  </p>
                ))}
              </div>
            </div>
          );
        })()}
          </>
        )}
      </div>
    </>
  );
}
