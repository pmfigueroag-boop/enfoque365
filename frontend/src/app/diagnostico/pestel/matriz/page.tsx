"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import { useToast } from "../../../components/Toast";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

interface PestelFactor {
  id: string;
  dbId?: number;
  categoria: string;
  nombre: string;
  probabilidad: number;
  impacto: number;
  ia_sugiere: string;
  validado: boolean;
}

const CATEGORY_PREFIX: Record<string, string> = {
  politico: "P",
  economico: "E",
  social: "S",
  tecnologico: "T",
  ecologico: "Ec",
  legal: "L",
};

const CATEGORY_COLORS: Record<string, string> = {
  P: "#818cf8",
  E: "#34d399",
  S: "#f472b6",
  T: "#60a5fa",
  Ec: "#a78bfa",
  L: "#fbbf24",
};

/* ------------------------------------------------------------------ */
/*  Heatmap zone color (background)                                    */
/* ------------------------------------------------------------------ */

function zoneColor(x: number, y: number): string {
  const score = x * y;
  if (score >= 49) return "rgba(239, 68, 68, 0.18)";   // critico
  if (score >= 25) return "rgba(245, 158, 11, 0.12)";  // monitoreo
  return "rgba(34, 197, 94, 0.08)";                     // irrelevante
}

function zoneLabel(prob: number, imp: number): string {
  const score = prob * imp;
  if (score >= 49) return "Critico";
  if (score >= 25) return "Monitoreo";
  return "Bajo";
}

function zoneBadgeColor(prob: number, imp: number): string {
  const score = prob * imp;
  if (score >= 49) return "#ef4444";
  if (score >= 25) return "#f59e0b";
  return "#22c55e";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PestelMatrizPage() {
  const { toast } = useToast();
  const [factors, setFactors] = useState<PestelFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hitlCertified, setHitlCertified] = useState(false);

  // Load real PESTEL data from API and transform
  useEffect(() => {
    (async () => {
      try {
        const raw = await api.getPestel();
        if (raw && raw.length > 0) {
          const counters: Record<string, number> = {};
          const mapped: PestelFactor[] = raw.map((item: any) => {
            const prefix = CATEGORY_PREFIX[item.category] || item.category?.[0]?.toUpperCase() || "X";
            counters[prefix] = (counters[prefix] || 0) + 1;
            return {
              id: `${prefix}${counters[prefix]}`,
              dbId: item.id,
              categoria: item.category || "general",
              nombre: item.description || item.factor || "Factor sin nombre",
              probabilidad: item.probability ?? item.impact_level ?? 5,
              impacto: item.impact_level ?? 5,
              ia_sugiere: item.ai_rationale || "Sin sugerencia IA disponible.",
              validado: item.status === "aprobado",
            };
          });
          setFactors(mapped);
        } else {
          // Fallback: mock data
          setFactors([
            { id: "L1", categoria: "legal", nombre: "Ley de Facturacion Electronica", probabilidad: 9, impacto: 8, ia_sugiere: "Alta. Multas inminentes.", validado: true },
            { id: "T1", categoria: "tecnologico", nombre: "Adopcion de IA en Competencia", probabilidad: 7, impacto: 6, ia_sugiere: "Media. Riesgo de rezago operativo.", validado: true },
            { id: "E1", categoria: "economico", nombre: "Fluctuacion de Tasa de Cambio", probabilidad: 3, impacto: 4, ia_sugiere: "Baja. Cobertura financiera activa.", validado: false },
          ]);
        }
      } catch {
        setFactors([
          { id: "L1", categoria: "legal", nombre: "Ley de Facturacion Electronica", probabilidad: 9, impacto: 8, ia_sugiere: "Alta. Multas inminentes.", validado: true },
          { id: "T1", categoria: "tecnologico", nombre: "Adopcion de IA en Competencia", probabilidad: 7, impacto: 6, ia_sugiere: "Media. Riesgo de rezago operativo.", validado: true },
          { id: "E1", categoria: "economico", nombre: "Fluctuacion de Tasa de Cambio", probabilidad: 3, impacto: 4, ia_sugiere: "Baja. Cobertura financiera activa.", validado: false },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateFactor = useCallback((id: string, field: "probabilidad" | "impacto", value: number) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }, []);

  const toggleValidation = async (factor: PestelFactor) => {
    const newVal = !factor.validado;
    setFactors(prev => prev.map(f => f.id === factor.id ? { ...f, validado: newVal } : f));

    if (newVal && factor.dbId) {
      try {
        await api.updatePestel(factor.dbId, {
          impact_level: factor.impacto,
          probability: factor.probabilidad
        });
        toast.success(`Valores guardados para ${factor.id}`);
      } catch (err) {
        toast.error("Error al guardar valores en el servidor");
        setFactors(prev => prev.map(f => f.id === factor.id ? { ...f, validado: !newVal } : f));
      }
    }
  };

  const allFactorsValidated = factors.length > 0 && factors.every(f => f.validado);
  const allValidated = allFactorsValidated && hitlCertified;
  const validatedFactors = factors.filter(f => f.validado);

  const handleGenerateTOWS = async () => {
    toast.info("Generando analisis TOWS a partir de factores validados...");
    try {
      await api.iaTows();
      toast.success("Analisis TOWS generado exitosamente.");
    } catch {
      toast.error("Error al generar TOWS. Verifique que tiene factores FODA.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{
          width: 40, height: 40, border: "3px solid var(--border-color)",
          borderTop: "3px solid var(--primary-500)", borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{
            fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)",
            margin: 0, letterSpacing: "-0.02em",
          }}>
            Matriz de Impacto vs. Probabilidad
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "4px 0 0" }}>
            Califique y valide cada factor PESTEL para construir el mapa de riesgos
          </p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{
            fontSize: "0.75rem", color: "var(--text-muted)",
            background: "var(--bg-tertiary)", padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
          }}>
            {validatedFactors.length}/{factors.length} validados
          </span>

          {/* HITL Certification Checkbox (SOX/COSO Level 3) */}
          {allFactorsValidated && (
            <label
              style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: "0.78rem", color: hitlCertified ? "var(--success-600)" : "var(--warning-600)",
                cursor: "pointer", userSelect: "none",
                padding: "6px 14px",
                background: hitlCertified ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${hitlCertified ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`,
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="checkbox"
                checked={hitlCertified}
                onChange={(e) => setHitlCertified(e.target.checked)}
                style={{ accentColor: "var(--success-600)" }}
              />
              Certifico que he revisado y validado todos los factores
            </label>
          )}

          <button
            onClick={handleGenerateTOWS}
            disabled={!allValidated}
            style={{
              padding: "10px 20px",
              background: allValidated
                ? "linear-gradient(135deg, var(--primary-600), var(--primary-500))"
                : "var(--bg-tertiary)",
              color: allValidated ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: allValidated ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.2s ease",
              opacity: allValidated ? 1 : 0.6,
            }}
          >
            Guardar y Generar TOWS
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="matriz-split" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        alignItems: "start",
      }}>
        {/* ============ LEFT: Factor Cards ============ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 4,
          }}>
            Panel de Calificacion ({factors.length} factores)
          </div>

          {factors.map((factor) => {
            const prefix = CATEGORY_PREFIX[factor.categoria] || factor.categoria?.[0]?.toUpperCase() || "X";
            const dotColor = CATEGORY_COLORS[prefix] || "#94a3b8";
            const isHovered = hoveredId === factor.id;

            return (
              <div
                key={factor.id}
                onMouseEnter={() => setHoveredId(factor.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: isHovered
                    ? "rgba(30, 41, 59, 0.95)"
                    : "var(--bg-card)",
                  border: factor.validado
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : "1px solid var(--border-color)",
                  borderRadius: "var(--radius)",
                  padding: "16px 20px",
                  backdropFilter: "blur(12px)",
                  transition: "all 0.2s ease",
                  transform: isHovered ? "translateX(4px)" : "none",
                }}
              >
                {/* Card header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: dotColor, flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 700,
                    color: dotColor, letterSpacing: "0.5px",
                  }}>
                    [{factor.id}]
                  </span>
                  <span style={{
                    fontSize: "0.88rem", fontWeight: 600,
                    color: "var(--text-primary)", flex: 1,
                  }}>
                    {factor.nombre}
                  </span>
                  {factor.validado && (
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 600,
                      background: "rgba(34, 197, 94, 0.15)",
                      color: "#22c55e", padding: "3px 8px",
                      borderRadius: 6, letterSpacing: "0.3px",
                    }}>
                      VALIDADO
                    </span>
                  )}
                </div>

                {/* Sliders */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                  {/* Probabilidad */}
                  <div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      marginBottom: 6,
                    }}>
                      <label style={{
                        fontSize: "0.72rem", fontWeight: 600,
                        color: "var(--text-secondary)", textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}>
                        Probabilidad
                      </label>
                      <span style={{
                        fontSize: "0.95rem", fontWeight: 700,
                        color: zoneBadgeColor(factor.probabilidad, factor.impacto), fontVariantNumeric: "tabular-nums",
                      }}>
                        {factor.probabilidad}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1} max={10}
                      value={factor.probabilidad}
                      onChange={(e) => updateFactor(factor.id, "probabilidad", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--primary-500)" }}
                    />
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2,
                    }}>
                      <span>Baja</span><span>Alta</span>
                    </div>
                  </div>

                  {/* Impacto */}
                  <div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      marginBottom: 6,
                    }}>
                      <label style={{
                        fontSize: "0.72rem", fontWeight: 600,
                        color: "var(--text-secondary)", textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}>
                        Impacto
                      </label>
                      <span style={{
                        fontSize: "0.95rem", fontWeight: 700,
                        color: zoneBadgeColor(factor.probabilidad, factor.impacto), fontVariantNumeric: "tabular-nums",
                      }}>
                        {factor.impacto}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1} max={10}
                      value={factor.impacto}
                      onChange={(e) => updateFactor(factor.id, "impacto", Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#f59e0b" }}
                    />
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2,
                    }}>
                      <span>Bajo</span><span>Alto</span>
                    </div>
                  </div>
                </div>

                {/* AI Suggestion Box */}
                <div style={{
                  background: "rgba(99, 102, 241, 0.06)",
                  border: "1px dashed rgba(99, 102, 241, 0.2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  marginBottom: 12,
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700,
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "var(--primary-400)",
                    padding: "2px 6px", borderRadius: 4,
                    whiteSpace: "nowrap", marginTop: 1,
                  }}>
                    IA
                  </span>
                  <div>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: 600,
                      color: "var(--primary-300)",
                    }}>
                      Sugerencia: {factor.probabilidad}/{factor.impacto}
                    </span>
                    <span style={{
                      fontSize: "0.75rem", color: "var(--text-secondary)",
                      marginLeft: 6,
                    }}>
                      -- {factor.ia_sugiere}
                    </span>
                  </div>
                </div>

                {/* Validate Button */}
                <button
                  onClick={() => toggleValidation(factor)}
                  style={{
                    width: "100%",
                    padding: "8px 14px",
                    background: factor.validado
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(99, 102, 241, 0.08)",
                    border: factor.validado
                      ? "1px solid rgba(34, 197, 94, 0.3)"
                      : "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    color: factor.validado ? "#22c55e" : "var(--primary-400)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    letterSpacing: "0.3px",
                  }}
                >
                  {factor.validado ? "Validado -- Click para revocar" : "Validar y Aprobar"}
                </button>
              </div>
            );
          })}

          {factors.length === 0 && (
            <div style={{
              textAlign: "center", padding: 40,
              color: "var(--text-muted)", fontSize: "0.85rem",
            }}>
              No hay factores PESTEL registrados. Genere factores con IA desde la pagina PESTEL.
            </div>
          )}
        </div>

        {/* ============ RIGHT: Heatmap Matrix ============ */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{
            fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 12,
          }}>
            Matriz Visual (Heatmap)
          </div>

          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius)",
            padding: "24px",
            backdropFilter: "blur(12px)",
          }}>
            {/* Heatmap Grid */}
            <div style={{ display: "flex", gap: 0 }}>
              {/* Y-axis label */}
              <div style={{
                writingMode: "vertical-lr",
                transform: "rotate(180deg)",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "1px",
                textAlign: "center",
                paddingRight: 8,
                textTransform: "uppercase",
              }}>
                Impacto ↑
              </div>

              {/* Y-axis numbers + grid */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex" }}>
                  {/* Y numbers */}
                  <div style={{
                    display: "flex", flexDirection: "column-reverse",
                    justifyContent: "space-between", paddingRight: 6, width: 20,
                  }}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <div key={n} style={{
                        fontSize: "0.6rem", color: "var(--text-muted)",
                        textAlign: "right", height: 36, display: "flex",
                        alignItems: "center", justifyContent: "flex-end",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {n}
                      </div>
                    ))}
                  </div>

                  {/* The Grid */}
                  <div style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "repeat(10, 1fr)",
                    gridTemplateRows: "repeat(10, 1fr)",
                    gap: 1,
                    background: "var(--border-color)",
                    aspectRatio: "1",
                    position: "relative",
                  }}>
                    {/* Background cells */}
                    {Array.from({ length: 100 }, (_, i) => {
                      const col = (i % 10) + 1;        // probabilidad (x) 1-10
                      const row = 10 - Math.floor(i / 10); // impacto (y) 10-1
                      return (
                        <div
                          key={i}
                          style={{
                            background: zoneColor(col, row),
                            borderRadius: 2,
                            position: "relative",
                          }}
                        />
                      );
                    })}

                    {/* Plotted factors (overlay) */}
                    {factors.map((f) => {
                      const showAlways = f.validado;
                      const isPreview = !f.validado && hoveredId === f.id;
                      if (!showAlways && !isPreview) return null;

                      const prefix = CATEGORY_PREFIX[f.categoria] || f.categoria?.[0]?.toUpperCase() || "X";
                      const color = CATEGORY_COLORS[prefix] || "#94a3b8";
                      const left = ((f.probabilidad - 1) / 9) * 100;
                      const bottom = ((f.impacto - 1) / 9) * 100;

                      return (
                        <div
                          key={`dot-${f.id}`}
                          style={{
                            position: "absolute",
                            left: `${left}%`,
                            bottom: `${bottom}%`,
                            transform: "translate(-50%, 50%)",
                            zIndex: hoveredId === f.id ? 20 : 10,
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: isPreview ? 0.5 : 1,
                          }}
                        >
                          {/* Pulse ring for hovered */}
                          {hoveredId === f.id && (
                            <div style={{
                              position: "absolute",
                              width: 36, height: 36,
                              borderRadius: "50%",
                              border: `2px solid ${color}`,
                              top: "50%", left: "50%",
                              transform: "translate(-50%, -50%)",
                              opacity: 0.3,
                              animation: "pulse-ring 1.5s ease-out infinite",
                            }} />
                          )}
                          {/* Badge */}
                          <div
                            style={{
                              background: color,
                              color: "#0f172a",
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              padding: "3px 6px",
                              borderRadius: 4,
                              whiteSpace: "nowrap",
                              boxShadow: `0 0 8px ${color}40`,
                              cursor: "default",
                              lineHeight: 1,
                            }}
                            title={`${f.nombre} (${f.probabilidad}, ${f.impacto})`}
                          >
                            {f.id}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis numbers */}
                <div style={{
                  display: "grid", gridTemplateColumns: "repeat(10, 1fr)",
                  marginLeft: 26, marginTop: 4,
                }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <div key={n} style={{
                      fontSize: "0.6rem", color: "var(--text-muted)",
                      textAlign: "center", fontVariantNumeric: "tabular-nums",
                    }}>
                      {n}
                    </div>
                  ))}
                </div>

                {/* X-axis label */}
                <div style={{
                  textAlign: "center", marginTop: 6, marginLeft: 26,
                  fontSize: "0.7rem", fontWeight: 600,
                  color: "var(--text-secondary)",
                  letterSpacing: "1px", textTransform: "uppercase",
                }}>
                  Probabilidad →
                </div>
              </div>
            </div>

            {/* Zone Legend */}
            <div style={{
              display: "flex", gap: 16, marginTop: 20,
              justifyContent: "center", flexWrap: "wrap",
            }}>
              {[
                { label: "Critico (Alto/Alto)", color: "rgba(239, 68, 68, 0.25)", border: "#ef4444" },
                { label: "Monitoreo (Medio)", color: "rgba(245, 158, 11, 0.18)", border: "#f59e0b" },
                { label: "Bajo (Bajo/Bajo)", color: "rgba(34, 197, 94, 0.15)", border: "#22c55e" },
              ].map(z => (
                <div key={z.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 3,
                    background: z.color, border: `1px solid ${z.border}`,
                  }} />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    {z.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Factor Legend Table */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius)",
            padding: "16px 20px",
            marginTop: 12,
            backdropFilter: "blur(12px)",
          }}>
            <div style={{
              fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase",
              letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10,
            }}>
              Leyenda de Factores
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {factors.map(f => {
                const prefix = CATEGORY_PREFIX[f.categoria] || f.categoria?.[0]?.toUpperCase() || "X";
                const color = CATEGORY_COLORS[prefix] || "#94a3b8";
                return (
                  <div
                    key={f.id}
                    onMouseEnter={() => setHoveredId(f.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "6px 10px", borderRadius: 6,
                      background: hoveredId === f.id ? "rgba(255,255,255,0.04)" : "transparent",
                      transition: "background 0.15s ease",
                      cursor: "default",
                    }}
                  >
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 800,
                      color, minWidth: 28,
                    }}>
                      {f.id}
                    </span>
                    <span style={{
                      fontSize: "0.78rem", color: "var(--text-primary)", flex: 1,
                    }}>
                      {f.nombre}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 600,
                      color: zoneBadgeColor(f.probabilidad, f.impacto),
                      background: `${zoneBadgeColor(f.probabilidad, f.impacto)}18`,
                      padding: "2px 8px", borderRadius: 4,
                    }}>
                      {zoneLabel(f.probabilidad, f.impacto)}
                    </span>
                    <span style={{
                      fontSize: "0.65rem", color: "var(--text-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      ({f.probabilidad},{f.impacto})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        input[type="range"] {
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--bg-tertiary);
          border-radius: 4px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid var(--bg-primary);
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
        @media (max-width: 900px) {
          .matriz-split { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
