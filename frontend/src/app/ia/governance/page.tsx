"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface EndpointUsage {
  name: string;
  calls: number;
  tokens: number;
  avg_latency: number;
}

interface DailyUsage {
  date: string;
  calls: number;
  tokens: number;
}

interface TelemetryData {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  fallback_calls: number;
  total_tokens: number;
  budget_limit: number;
  budget_used_pct: number;
  estimated_cost_usd: number;
  avg_latency_ms: number;
  by_endpoint: EndpointUsage[];
  by_day: DailyUsage[];
}

export default function GovernancePage() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAITelemetry()
      .then((d: TelemetryData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <>
        <header className="header">
          <h2 className="header-title">Gobernanza IA</h2>
        </header>
        <div className="page-content">
          <p style={{ color: "var(--text-muted)" }}>Cargando telemetria...</p>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <header className="header">
          <h2 className="header-title">Gobernanza IA</h2>
        </header>
        <div className="page-content">
          <div className="card" style={{ padding: "24px" }}>
            <p style={{ color: "var(--danger)" }}>
              Error al cargar telemetria: {error || "Sin datos"}
            </p>
          </div>
        </div>
      </>
    );
  }

  const maxDailyCalls = Math.max(...data.by_day.map((d) => d.calls), 1);

  const budgetColor =
    data.budget_used_pct >= 90
      ? "var(--danger)"
      : data.budget_used_pct >= 70
        ? "var(--warning)"
        : "var(--success)";

  return (
    <>
      <header className="header">
        <h2 className="header-title">Gobernanza IA</h2>
      </header>

      <div className="page-content animate-fade-in">
        {/* ── Summary Metric Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Card: Total llamadas */}
          <div className="card" style={{ padding: "20px" }}>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Total llamadas LLM
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              {data.total_calls.toLocaleString()}
            </div>
            <div
              style={{
                display: "flex",
                gap: "12px",
                fontSize: "0.75rem",
              }}
            >
              <span style={{ color: "var(--success)" }}>
                {data.successful_calls} exitosas
              </span>
              <span style={{ color: "var(--danger)" }}>
                {data.failed_calls} errores
              </span>
              <span style={{ color: "var(--warning)" }}>
                {data.fallback_calls} fallback
              </span>
            </div>
          </div>

          {/* Card: Tokens consumidos */}
          <div className="card" style={{ padding: "20px" }}>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Tokens consumidos
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              {data.total_tokens.toLocaleString()}
            </div>
            <div style={{ marginBottom: "6px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                <span>Presupuesto</span>
                <span style={{ color: budgetColor, fontWeight: 600 }}>
                  {data.budget_used_pct.toFixed(1)}%
                </span>
              </div>
              <div
                style={{
                  height: "6px",
                  borderRadius: "3px",
                  background: "var(--bg-tertiary)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(data.budget_used_pct, 100)}%`,
                    borderRadius: "3px",
                    background: budgetColor,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card: Costo estimado */}
          <div className="card" style={{ padding: "20px" }}>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Costo estimado
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              ${data.estimated_cost_usd.toFixed(2)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              USD acumulado
            </div>
          </div>

          {/* Card: Latencia promedio */}
          <div className="card" style={{ padding: "20px" }}>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--text-muted)",
                marginBottom: "8px",
              }}
            >
              Latencia promedio
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1.1,
                marginBottom: "12px",
              }}
            >
              {data.avg_latency_ms.toFixed(0)}
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 400,
                  color: "var(--text-muted)",
                  marginLeft: "4px",
                }}
              >
                ms
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Promedio global
            </div>
          </div>
        </div>

        {/* ── Endpoint Usage Table ── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Uso por Endpoint</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr>
                  {["Endpoint", "Llamadas", "Tokens", "Latencia Avg"].map(
                    (col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: col === "Endpoint" ? "left" : "right",
                          padding: "12px 16px",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "var(--text-muted)",
                          borderBottom: "1px solid var(--border-color)",
                        }}
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {data.by_endpoint.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "24px 16px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      Sin datos de endpoints
                    </td>
                  </tr>
                ) : (
                  data.by_endpoint.map((ep, idx) => (
                    <tr
                      key={ep.name}
                      style={{
                        borderBottom:
                          idx < data.by_endpoint.length - 1
                            ? "1px solid var(--border-color)"
                            : "none",
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
                          padding: "12px 16px",
                          fontWeight: 500,
                          color: "var(--primary-400)",
                          fontFamily: "monospace",
                          fontSize: "0.8rem",
                        }}
                      >
                        {ep.name}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          color: "var(--text-primary)",
                        }}
                      >
                        {ep.calls.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          color: "var(--text-primary)",
                        }}
                      >
                        {ep.tokens.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {ep.avg_latency.toFixed(0)} ms
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Daily Usage Bar Chart (CSS-only) ── */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Llamadas diarias (ultimos 30 dias)</h3>
          </div>
          {data.by_day.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              Sin datos de uso diario
            </div>
          ) : (
            <div style={{ padding: "16px" }}>
              {/* Y-axis max label */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                  padding: "0 2px",
                }}
              >
                <span>{maxDailyCalls} llamadas</span>
                <span>0</span>
              </div>

              {/* Chart container */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "2px",
                  height: "180px",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "0",
                }}
              >
                {data.by_day.map((day) => {
                  const heightPct = (day.calls / maxDailyCalls) * 100;
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.calls} llamadas, ${day.tokens.toLocaleString()} tokens`}
                      style={{
                        flex: 1,
                        minWidth: "4px",
                        height: `${Math.max(heightPct, 1)}%`,
                        background:
                          heightPct > 80
                            ? "var(--primary-400)"
                            : heightPct > 40
                              ? "var(--primary-500)"
                              : "var(--primary-600)",
                        borderRadius: "2px 2px 0 0",
                        transition: "height 0.4s ease, opacity 0.2s ease",
                        opacity: 0.85,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.boxShadow =
                          "0 0 8px rgba(99, 102, 241, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.85";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  marginTop: "6px",
                  padding: "0 2px",
                }}
              >
                {data.by_day.length > 0 && (
                  <>
                    <span>
                      {data.by_day[0].date.slice(5)}
                    </span>
                    {data.by_day.length > 1 && (
                      <span>
                        {data.by_day[data.by_day.length - 1].date.slice(5)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
