"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicMcKinsey from "./InfographicMcKinsey";

const ELEMENT_TYPES = [
  { value: "strategy", label: "Estrategia", shortLabel: "STR", color: "var(--primary-500)", group: "hard" },
  { value: "structure", label: "Estructura", shortLabel: "STR", color: "var(--success)", group: "hard" },
  { value: "systems", label: "Sistemas", shortLabel: "SYS", color: "var(--warning)", group: "hard" },
  { value: "shared_values", label: "Valores Compartidos", shortLabel: "VAL", color: "var(--danger)", group: "soft" },
  { value: "style", label: "Estilo", shortLabel: "STY", color: "#8b5cf6", group: "soft" },
  { value: "staff", label: "Personal", shortLabel: "STA", color: "#06b6d4", group: "soft" },
  { value: "skills", label: "Habilidades", shortLabel: "SKL", color: "#f97316", group: "soft" },
];

const ALIGNMENT_LABELS: Record<number, string> = {
  1: "Muy Bajo",
  2: "Bajo",
  3: "Medio",
  4: "Alto",
  5: "Muy Alto",
};

function getAlignmentColor(score: number): string {
  if (score >= 4) return "var(--success)";
  if (score === 3) return "var(--warning)";
  return "var(--danger)";
}

function getAlignmentBg(score: number): string {
  if (score >= 4) return "rgba(16,185,129,0.15)";
  if (score === 3) return "rgba(245,158,11,0.15)";
  return "rgba(239,68,68,0.15)";
}

export default function McKinsey7sPage() {
  const { toast } = useToast();
  const [elements, setElements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<"data" | "infographic">("data");
  const [newElement, setNewElement] = useState({
    element_type: "strategy",
    description: "",
    alignment_score: 3,
    observations: "",
  });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);

  const loadData = async () => {
    const data = await api.getMckinsey7s().catch(() => []);
    setElements(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newElement.description.trim()) return;
    await api.createMckinsey7s(newElement);
    setNewElement({ element_type: "strategy", description: "", alignment_score: 3, observations: "" });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este elemento 7S?")) return;
    await api.deleteMckinsey7s(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaMckinsey7s();
      toast.success("Analisis IA ejecutado. Las propuestas se enviaron al Inbox IA.");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setIaLoading(false);
    }
  };

  const hardElements = ELEMENT_TYPES.filter((et) => et.group === "hard");
  const softElements = ELEMENT_TYPES.filter((et) => et.group === "soft");

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Diagnostico Interno - McKinsey 7S</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  const renderElementCard = (et: typeof ELEMENT_TYPES[number]) => {
    const items = elements.filter((e: any) => e.element_type === et.value);
    return (
      <div key={et.value} className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{
          padding: "14px 20px",
          borderBottom: `3px solid ${et.color}`,
          background: "var(--bg-secondary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: et.color, margin: 0 }}>
              {et.label}
            </h3>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {items.length} elemento{items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px",
            borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.06em",
            background: et.group === "hard" ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)",
            color: et.group === "hard" ? "#3b82f6" : "#a855f7",
          }}>
            {et.group === "hard" ? "Hard S" : "Soft S"}
          </span>
        </div>
        <div style={{ padding: "16px" }}>
          {items.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              Sin elementos registrados.
            </p>
          ) : (
            items.map((el: any) => (
              <div key={el.id} style={{
                padding: "12px",
                marginBottom: "8px",
                borderRadius: "var(--radius-sm)",
                background: "var(--bg-tertiary)",
                borderLeft: `3px solid ${et.color}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: getAlignmentBg(el.alignment_score),
                    color: getAlignmentColor(el.alignment_score),
                  }}>
                    Alineacion {el.alignment_score}/5 - {ALIGNMENT_LABELS[el.alignment_score] || ""}
                  </span>
                  <button
                    onClick={() => handleDelete(el.id)}
                    style={{
                      background: "none", border: "none", color: "var(--text-muted)",
                      cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px",
                    }}
                    title="Eliminar"
                  >
                    X
                  </button>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {el.description}
                </p>
                {el.observations && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                    🔗 {el.observations}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="header">
        <div>
          <h2 className="header-title">Diagnostico Interno - McKinsey 7S</h2>
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
            + Nuevo Elemento
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
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Agregar Elemento 7S</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Tipo de Elemento</label>
                <select
                  value={newElement.element_type}
                  onChange={(e) => setNewElement({ ...newElement, element_type: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {ELEMENT_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>{et.label} ({et.group === "hard" ? "Hard" : "Soft"})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Alineacion (1-5)</label>
                <select
                  value={newElement.alignment_score}
                  onChange={(e) => setNewElement({ ...newElement, alignment_score: parseInt(e.target.value) })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} - {ALIGNMENT_LABELS[n]}</option>
                  ))}
                </select>
              </div>
            </div>
            <textarea
              value={newElement.description}
              onChange={(e) => setNewElement({ ...newElement, description: e.target.value })}
              placeholder="Descripcion del elemento organizacional..."
              rows={2}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <input
              type="text"
              value={newElement.observations}
              onChange={(e) => setNewElement({ ...newElement, observations: e.target.value })}
              placeholder="Observaciones: analisis de alineacion con otros elementos..."
              style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar Elemento</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Hard S Group */}
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Hard S — Estrategia, Estructura, Sistemas
          <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px", textTransform: "none", letterSpacing: "0" }}>
            (mas faciles de cambiar)
          </span>
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px", marginBottom: "28px" }}>
          {hardElements.map(renderElementCard)}
        </div>

        {/* Soft S Group */}
        <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Soft S — Valores Compartidos, Estilo, Personal, Habilidades
          <span style={{ fontSize: "0.72rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px", textTransform: "none", letterSpacing: "0" }}>
            (mas dificiles pero mas impactantes)
          </span>
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px", marginBottom: "28px" }}>
          {softElements.map(renderElementCard)}
        </div>

        {/* ═══ Synthesis Card: Organizational Alignment Radar ═══ */}
        {(() => {
          const stats = ELEMENT_TYPES.map((et) => {
            const items = elements.filter((e: any) => e.element_type === et.value);
            if (items.length === 0) return null;
            const avgScore = items.reduce((s: number, e: any) => s + (e.alignment_score || 0), 0) / items.length;
            return { ...et, avgScore: Math.round(avgScore * 10) / 10, count: items.length };
          }).filter(Boolean) as (typeof ELEMENT_TYPES[number] & { avgScore: number; count: number })[];

          if (stats.length < 5) return null;

          const hardStats = stats.filter(s => s.group === "hard");
          const softStats = stats.filter(s => s.group === "soft");
          const overallAvg = stats.reduce((s, e) => s + e.avgScore, 0) / stats.length;
          const hardAvg = hardStats.length ? hardStats.reduce((s, e) => s + e.avgScore, 0) / hardStats.length : 0;
          const softAvg = softStats.length ? softStats.reduce((s, e) => s + e.avgScore, 0) / softStats.length : 0;

          const sorted = [...stats].sort((a, b) => a.avgScore - b.avgScore);
          const weakest = sorted[0];
          const strongest = sorted[sorted.length - 1];
          const gap = strongest.avgScore - weakest.avgScore;

          // Coherence assessment
          const coherenceLabel = gap <= 1 ? "Alta" : gap <= 2 ? "Moderada" : "Baja";
          const coherenceColor = gap <= 1 ? "var(--success)" : gap <= 2 ? "var(--warning)" : "var(--danger)";

          // Implications
          const implications: string[] = [];
          if (gap >= 2.5) {
            implications.push(`Brecha critica entre ${strongest.label} (${strongest.avgScore}) y ${weakest.label} (${weakest.avgScore}). La organizacion opera con fricciones internas significativas.`);
          }
          if (hardAvg > softAvg + 1) {
            implications.push("Las Hard S superan a las Soft S — riesgo de cambios estructurales que la cultura no absorbe.");
          } else if (softAvg > hardAvg + 1) {
            implications.push("Las Soft S superan a las Hard S — buena cultura pero infraestructura insuficiente para ejecutar.");
          }
          if (weakest.avgScore <= 2) {
            implications.push(`${weakest.label} es el punto mas debil (${weakest.avgScore}/5). Priorizar intervencion en este elemento.`);
          }
          if (implications.length === 0) {
            implications.push(`Organizacion razonablemente alineada (${overallAvg.toFixed(1)}/5). Mantener monitoreo continuo de coherencia.`);
          }

          return (
            <div className="card" style={{
              padding: "0", overflow: "hidden",
              border: "1px solid rgba(168,85,247,0.25)",
              background: "linear-gradient(135deg, var(--bg-primary) 0%, rgba(168,85,247,0.03) 100%)",
            }}>
              {/* Header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "2px solid rgba(168,85,247,0.2)",
                background: "rgba(168,85,247,0.05)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#a855f7", margin: 0 }}>
                    🔬 Diagnostico de Alineacion Organizacional
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Sintesis de {stats.length} elementos evaluados · Modelo McKinsey 7S
                  </p>
                </div>
                <div style={{
                  padding: "6px 14px", borderRadius: "var(--radius-sm)",
                  background: `${coherenceColor}15`, border: `1px solid ${coherenceColor}`,
                }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)", display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Coherencia
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: coherenceColor }}>
                    {coherenceLabel}
                  </span>
                </div>
              </div>

              <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left: Alignment bars (radar substitute) */}
                <div>
                  <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Alineacion por Elemento
                  </h4>
                  {stats.map((stat) => {
                    const barWidth = (stat.avgScore / 5) * 100;
                    return (
                      <div key={stat.value} style={{ marginBottom: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500 }}>
                              {stat.label}
                            </span>
                            <span style={{
                              fontSize: "0.6rem", fontWeight: 700, padding: "1px 5px",
                              borderRadius: "3px",
                              background: stat.group === "hard" ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)",
                              color: stat.group === "hard" ? "#3b82f6" : "#a855f7",
                            }}>
                              {stat.group === "hard" ? "H" : "S"}
                            </span>
                          </div>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 700,
                            color: getAlignmentColor(Math.round(stat.avgScore)),
                          }}>
                            {stat.avgScore.toFixed(1)}/5
                          </span>
                        </div>
                        <div style={{
                          height: "6px", borderRadius: "3px",
                          background: "var(--bg-tertiary)", overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", width: `${barWidth}%`,
                            borderRadius: "3px", background: stat.color,
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

                  {/* Overall alignment */}
                  <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>Alineacion Global</span>
                      <span style={{
                        fontSize: "0.88rem", fontWeight: 800,
                        color: getAlignmentColor(Math.round(overallAvg)),
                      }}>
                        {overallAvg.toFixed(1)}/5 — {ALIGNMENT_LABELS[Math.round(overallAvg)] || ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div key={n} style={{
                          flex: 1, height: "4px", borderRadius: "2px",
                          background: n <= Math.round(overallAvg)
                            ? getAlignmentColor(Math.round(overallAvg))
                            : "var(--bg-secondary)",
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* Hard vs Soft comparison */}
                  <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                      Hard S vs Soft S
                    </span>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                          <span style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 600 }}>Hard</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: getAlignmentColor(Math.round(hardAvg)) }}>
                            {hardAvg.toFixed(1)}
                          </span>
                        </div>
                        <div style={{ height: "5px", borderRadius: "3px", background: "var(--bg-secondary)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(hardAvg / 5) * 100}%`, borderRadius: "3px", background: "#3b82f6" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>vs</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                          <span style={{ fontSize: "0.72rem", color: "#a855f7", fontWeight: 600 }}>Soft</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: getAlignmentColor(Math.round(softAvg)) }}>
                            {softAvg.toFixed(1)}
                          </span>
                        </div>
                        <div style={{ height: "5px", borderRadius: "3px", background: "var(--bg-secondary)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${(softAvg / 5) * 100}%`, borderRadius: "3px", background: "#a855f7" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strongest & Weakest */}
                  <div style={{ padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--bg-tertiary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Mas fuerte</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--success)" }}>
                          {strongest.label} ({strongest.avgScore.toFixed(1)})
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Mas debil</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--danger)" }}>
                          {weakest.label} ({weakest.avgScore.toFixed(1)})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Brecha:</span>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700,
                        color: gap <= 1 ? "var(--success)" : gap <= 2 ? "var(--warning)" : "var(--danger)",
                      }}>
                        {gap.toFixed(1)} puntos
                      </span>
                    </div>
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
                  Diagnostico de Coherencia
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
      </div>
      ) : (
        <div style={{ marginTop: "20px" }} className="animate-fade-in">
          <InfographicMcKinsey data={elements} />
        </div>
      )}
    </>
  );
}
