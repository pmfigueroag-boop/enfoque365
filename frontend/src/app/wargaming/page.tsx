"use client";

import { useState } from "react";
import { api } from "../lib/api";

interface WargameResult {
  risk_level: string;
  impact_analysis: string;
  recommendations: string[];
  tactical_moves: string[];
  source: string;
}

export default function WargamingPage() {
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WargameResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.wargameSimulate(scenario);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Error al simular el escenario.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const normalized = level?.toLowerCase() || "";
    let bg = "rgba(16,185,129,0.15)";
    let color = "var(--success)";
    let label = level || "Desconocido";

    if (normalized.includes("alto") || normalized.includes("high")) {
      bg = "rgba(239,68,68,0.15)";
      color = "var(--danger)";
    } else if (normalized.includes("medio") || normalized.includes("medium")) {
      bg = "rgba(245,158,11,0.15)";
      color = "var(--warning)";
    }

    return (
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: 700,
          padding: "4px 14px",
          borderRadius: "999px",
          background: bg,
          color: color,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <>
      <header className="header">
        <h2 className="header-title">Wargaming AI - Simulacion de Escenarios</h2>
      </header>

      <div className="page-content animate-fade-in">
        {/* Input section */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Describir Escenario Competitivo</h3>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Describa el escenario competitivo que desea simular. Por ejemplo: Un competidor lanza un producto similar al nuestro con un precio 30% inferior en el mercado dominicano..."
              rows={6}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                fontFamily: "inherit",
                resize: "vertical",
                lineHeight: 1.6,
                transition: "border-color 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary-500)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-color)")}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "16px" }}>
              <button
                className="btn btn-primary"
                onClick={handleSimulate}
                disabled={loading || !scenario.trim()}
                style={{
                  opacity: loading || !scenario.trim() ? 0.5 : 1,
                  cursor: loading || !scenario.trim() ? "not-allowed" : "pointer",
                  minWidth: "180px",
                }}
              >
                {loading ? "Simulando..." : "Simular Escenario"}
              </button>

              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2.5px solid var(--border-color)",
                      borderTopColor: "var(--primary-500)",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Analizando escenario con IA...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="card"
            style={{
              marginBottom: "24px",
              padding: "16px 20px",
              borderLeft: "3px solid var(--danger)",
            }}
          >
            <p style={{ color: "var(--danger)", fontSize: "0.9rem", margin: 0 }}>
              Error: {error}
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Risk level + source */}
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Nivel de Riesgo
                  </span>
                  {getRiskBadge(result.risk_level)}
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "rgba(99,102,241,0.12)",
                    color: "var(--primary-400, #818cf8)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {result.source || "IA"}
                </span>
              </div>
            </div>

            {/* Impact analysis */}
            <div className="card" style={{ padding: "20px" }}>
              <h3
                className="card-title"
                style={{
                  fontSize: "0.85rem",
                  marginBottom: "12px",
                  paddingBottom: "10px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                Analisis de Impacto
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}
              >
                {result.impact_analysis}
              </p>
            </div>

            {/* Recommendations + Tactical moves grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Recommendations */}
              <div className="card" style={{ padding: "20px" }}>
                <h3
                  className="card-title"
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "12px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  Recomendaciones
                </h3>
                {result.recommendations && result.recommendations.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.recommendations.map((rec, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.6,
                        }}
                      >
                        {rec}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>
                    Sin recomendaciones disponibles.
                  </p>
                )}
              </div>

              {/* Tactical moves */}
              <div className="card" style={{ padding: "20px" }}>
                <h3
                  className="card-title"
                  style={{
                    fontSize: "0.85rem",
                    marginBottom: "12px",
                    paddingBottom: "10px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  Movimientos Tacticos
                </h3>
                {result.tactical_moves && result.tactical_moves.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.tactical_moves.map((move, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.6,
                        }}
                      >
                        {move}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>
                    Sin movimientos tacticos disponibles.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div
            className="card"
            style={{
              padding: "48px 24px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "8px" }}>
              Describa un escenario competitivo para obtener un analisis estrategico impulsado por IA.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", opacity: 0.7 }}>
              El motor de wargaming evaluara riesgos, impacto y movimientos tacticos recomendados.
            </p>
          </div>
        )}
      </div>

      {/* Spinner keyframes */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
