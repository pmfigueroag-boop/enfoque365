"use client";

import { useEffect, useState } from "react";
import { api } from "./lib/api";

/* ── Types ── */
interface Phase {
  name: string;
  items: number;
  done: boolean;
}

interface DashboardData {
  ejes: number;
  objetivos: number;
  kpis: number;
  hoshin: number;
  foda: number;
  pestel: number;
  documentos: number;
  key_results: number;
  porter: number;
  vrio: number;
  tows: number;
  semaforo: { verde: number; amarillo: number; rojo: number; gris: number };
  hoshin_status: { pendiente: number; en_progreso: number; completado: number };
  phases: Phase[];
  phases_done: number;
  phases_total: number;
  completion_pct: number;
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  /* Layout */
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "28px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
    marginBottom: "28px",
  },

  /* Metric card */
  metricCard: {
    background: "var(--bg-card, #1a1a2e)",
    border: "1px solid var(--border-color, #2a2a4a)",
    borderRadius: "16px",
    padding: "28px 24px",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  metricLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--text-muted, #8888aa)",
    marginBottom: "8px",
  },
  metricValue: {
    fontSize: "2.8rem",
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: "4px",
  },
  metricGlow: {
    position: "absolute" as const,
    top: 0,
    right: 0,
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    filter: "blur(40px)",
    opacity: 0.18,
    pointerEvents: "none" as const,
  },

  /* Section card */
  sectionCard: {
    background: "var(--bg-card, #1a1a2e)",
    border: "1px solid var(--border-color, #2a2a4a)",
    borderRadius: "16px",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "var(--text-muted, #8888aa)",
    marginBottom: "16px",
  },

  /* Bars */
  barTrack: {
    width: "100%",
    height: "28px",
    borderRadius: "14px",
    background: "var(--bg-tertiary, #12121f)",
    overflow: "hidden",
    display: "flex",
    marginBottom: "12px",
  },
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "8px",
  },
  barLegendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "6px",
    verticalAlign: "middle",
  },
  barLegendText: {
    fontSize: "0.78rem",
    color: "var(--text-secondary, #aaaacc)",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },

  /* Pipeline */
  pipeline: {
    display: "flex",
    alignItems: "center",
    gap: "0",
    overflowX: "auto" as const,
    paddingBottom: "8px",
  },
  phaseNode: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    minWidth: "120px",
    position: "relative" as const,
  },
  phaseCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "1rem",
    border: "3px solid",
    transition: "all 0.3s ease",
    zIndex: 1,
  },
  phaseName: {
    marginTop: "10px",
    fontSize: "0.72rem",
    fontWeight: 600,
    textAlign: "center" as const,
    color: "var(--text-secondary, #aaaacc)",
    maxWidth: "110px",
  },
  phaseItems: {
    marginTop: "2px",
    fontSize: "0.68rem",
    color: "var(--text-muted, #8888aa)",
  },
  phaseLine: {
    flex: 1,
    height: "3px",
    minWidth: "24px",
    borderRadius: "2px",
    transition: "background 0.3s ease",
  },

  /* Completion ring */
  completionWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0",
  },
  completionRing: {
    position: "relative" as const,
    width: "160px",
    height: "160px",
  },
  completionCenter: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  completionPct: {
    fontSize: "2.6rem",
    fontWeight: 800,
    lineHeight: 1,
    color: "var(--text-primary, #eeeeff)",
  },
  completionLabel: {
    fontSize: "0.72rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "var(--text-muted, #8888aa)",
    marginTop: "4px",
  },

  /* Loading */
  loadingWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--border-color, #2a2a4a)",
    borderTopColor: "var(--primary-500, #6366f1)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

/* ── Colors ── */
const COLORS = {
  ejes: "#6366f1",
  objetivos: "#22d3ee",
  kpis: "#f59e0b",
  hoshin: "#a855f7",
  verde: "#22c55e",
  amarillo: "#eab308",
  rojo: "#ef4444",
  gris: "#6b7280",
  pendiente: "#6b7280",
  en_progreso: "#3b82f6",
  completado: "#22c55e",
  done: "#22c55e",
  pending: "#374151",
};

/* ── Checkmark SVG ── */
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 10.5L8.5 14L15 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Component ── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message || "Error al cargar el panel"));
  }, []);

  /* Loading */
  if (!data && !error) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <header className="header">
          <h2 className="header-title">Panel Estrat&eacute;gico</h2>
        </header>
        <div className="page-content" style={S.loadingWrapper}>
          <div style={S.spinner} />
        </div>
      </>
    );
  }

  /* Error */
  if (error || !data) {
    return (
      <>
        <header className="header">
          <h2 className="header-title">Panel Estrat&eacute;gico</h2>
        </header>
        <div className="page-content" style={S.loadingWrapper}>
          <div style={{ ...S.sectionCard, maxWidth: 420, textAlign: "center" }}>
            <p style={{ color: "var(--danger, #ef4444)", fontWeight: 600, marginBottom: 8 }}>
              No se pudieron cargar los datos
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  /* Computed values */
  const semTotal = data.semaforo.verde + data.semaforo.amarillo + data.semaforo.rojo + data.semaforo.gris;
  const hosTotal = data.hoshin_status.pendiente + data.hoshin_status.en_progreso + data.hoshin_status.completado;
  const pct = Math.min(Math.max(data.completion_pct, 0), 100);

  /* SVG ring */
  const ringRadius = 64;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - pct / 100);
  const ringColor =
    pct >= 80 ? COLORS.verde : pct >= 50 ? COLORS.amarillo : pct >= 20 ? COLORS.en_progreso : COLORS.gris;

  /* Metric cards config */
  const metrics = [
    { label: "Ejes Estrategicos", value: data.ejes, color: COLORS.ejes },
    { label: "Objetivos Estrategicos", value: data.objetivos, color: COLORS.objetivos },
    { label: "Indicadores KPI", value: data.kpis, color: COLORS.kpis },
    { label: "Items Hoshin Kanri", value: data.hoshin, color: COLORS.hoshin },
  ];

  /* Bar segment helper */
  function barSegment(value: number, total: number, color: string, isFirst: boolean, isLast: boolean) {
    if (total === 0 || value === 0) return null;
    const w = `${(value / total) * 100}%`;
    return (
      <div
        key={color}
        style={{
          width: w,
          height: "100%",
          background: color,
          borderRadius: isFirst && isLast ? "14px" : isFirst ? "14px 0 0 14px" : isLast ? "0 14px 14px 0" : "0",
          transition: "width 0.6s ease",
        }}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dash-in {
          from { stroke-dashoffset: ${ringCircumference}; }
          to   { stroke-dashoffset: ${ringOffset}; }
        }
        .metric-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.25);
        }
        .phase-node:hover .phase-circle-el {
          transform: scale(1.12);
        }
      `}</style>

      <header className="header">
        <h2 className="header-title">Panel Estrat&eacute;gico</h2>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {data.phases_done}/{data.phases_total} fases completadas
        </span>
      </header>

      <div className="page-content animate-fade-in">
        {/* ── Row 1: Metric Cards ── */}
        <div style={S.grid4}>
          {metrics.map((m) => (
            <div key={m.label} className="metric-card-hover" style={S.metricCard}>
              <div style={{ ...S.metricGlow, background: m.color }} />
              <div style={S.metricLabel}>{m.label}</div>
              <div style={{ ...S.metricValue, color: m.color }}>{m.value}</div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: `linear-gradient(90deg, ${m.color}, transparent)`,
                  opacity: 0.5,
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Row 2: Semaforo + Hoshin Status ── */}
        <div style={S.grid2}>
          {/* Semaforo */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>Distribucion Semaforo KPI</div>
            <div style={S.barTrack}>
              {(() => {
                const entries = [
                  { v: data.semaforo.verde, c: COLORS.verde },
                  { v: data.semaforo.amarillo, c: COLORS.amarillo },
                  { v: data.semaforo.rojo, c: COLORS.rojo },
                  { v: data.semaforo.gris, c: COLORS.gris },
                ].filter((e) => e.v > 0);
                return entries.map((e, i) => barSegment(e.v, semTotal, e.c, i === 0, i === entries.length - 1));
              })()}
              {semTotal === 0 && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--border-color, #2a2a4a)",
                    borderRadius: "14px",
                  }}
                />
              )}
            </div>
            <div style={S.barLabel}>
              {[
                { label: "Verde", v: data.semaforo.verde, c: COLORS.verde },
                { label: "Amarillo", v: data.semaforo.amarillo, c: COLORS.amarillo },
                { label: "Rojo", v: data.semaforo.rojo, c: COLORS.rojo },
                { label: "Sin datos", v: data.semaforo.gris, c: COLORS.gris },
              ].map((l) => (
                <span key={l.label} style={S.barLegendText}>
                  <span style={{ ...S.barLegendDot, background: l.c }} />
                  {l.label}: {l.v}
                </span>
              ))}
            </div>
          </div>

          {/* Hoshin Status */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>Estado Hoshin Kanri</div>
            <div style={S.barTrack}>
              {(() => {
                const entries = [
                  { v: data.hoshin_status.completado, c: COLORS.completado },
                  { v: data.hoshin_status.en_progreso, c: COLORS.en_progreso },
                  { v: data.hoshin_status.pendiente, c: COLORS.pendiente },
                ].filter((e) => e.v > 0);
                return entries.map((e, i) => barSegment(e.v, hosTotal, e.c, i === 0, i === entries.length - 1));
              })()}
              {hosTotal === 0 && (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "var(--border-color, #2a2a4a)",
                    borderRadius: "14px",
                  }}
                />
              )}
            </div>
            <div style={S.barLabel}>
              {[
                { label: "Completado", v: data.hoshin_status.completado, c: COLORS.completado },
                { label: "En progreso", v: data.hoshin_status.en_progreso, c: COLORS.en_progreso },
                { label: "Pendiente", v: data.hoshin_status.pendiente, c: COLORS.pendiente },
              ].map((l) => (
                <span key={l.label} style={S.barLegendText}>
                  <span style={{ ...S.barLegendDot, background: l.c }} />
                  {l.label}: {l.v}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Phase Pipeline + Completion Ring ── */}
        <div style={{ ...S.grid2, gridTemplateColumns: "1fr 220px" }}>
          {/* Pipeline */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>Fases del Plan Estrategico</div>
            <div style={S.pipeline}>
              {data.phases.map((phase, i) => {
                const done = phase.done;
                const circleColor = done ? COLORS.done : COLORS.pending;
                return (
                  <div key={phase.name} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div className="phase-node" style={S.phaseNode}>
                      <div
                        className="phase-circle-el"
                        style={{
                          ...S.phaseCircle,
                          borderColor: circleColor,
                          background: done ? circleColor : "transparent",
                          color: done ? "#fff" : circleColor,
                          boxShadow: done ? `0 0 16px ${circleColor}44` : "none",
                        }}
                      >
                        {done ? <CheckIcon /> : i + 1}
                      </div>
                      <div style={S.phaseName}>{phase.name}</div>
                      <div style={S.phaseItems}>{phase.items} items</div>
                    </div>
                    {i < data.phases.length - 1 && (
                      <div
                        style={{
                          ...S.phaseLine,
                          background: done && data.phases[i + 1]?.done
                            ? COLORS.done
                            : done
                              ? `linear-gradient(90deg, ${COLORS.done}, ${COLORS.pending})`
                              : COLORS.pending,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Ring */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>Avance General</div>
            <div style={S.completionWrapper}>
              <div style={S.completionRing}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {/* Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={ringRadius}
                    fill="none"
                    stroke="var(--bg-tertiary, #12121f)"
                    strokeWidth="12"
                  />
                  {/* Progress */}
                  <circle
                    cx="80"
                    cy="80"
                    r={ringRadius}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    transform="rotate(-90 80 80)"
                    style={{ animation: "dash-in 1.2s ease-out forwards", filter: `drop-shadow(0 0 6px ${ringColor}66)` }}
                  />
                </svg>
                <div style={S.completionCenter}>
                  <span style={{ ...S.completionPct, color: ringColor }}>{pct}%</span>
                  <span style={S.completionLabel}>Completado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 4: Diagnostico stats ── */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "4px",
          }}
        >
          {[
            { label: "PESTEL", value: data.pestel },
            { label: "Porter", value: data.porter || 0 },
            { label: "FODA", value: data.foda },
            { label: "VRIO", value: data.vrio || 0 },
            { label: "TOWS", value: data.tows || 0 },
            { label: "Key Results", value: data.key_results || 0 },
            { label: "Documentos", value: data.documentos || 0 },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "8px 18px",
                borderRadius: "12px",
                background: "var(--bg-card, #1a1a2e)",
                border: `1px solid ${item.value > 0 ? "rgba(99,102,241,0.25)" : "var(--border-color, #2a2a4a)"}`,
                fontSize: "0.78rem",
                color: item.value > 0 ? "var(--text-secondary, #aaaacc)" : "var(--text-muted, #666688)",
                fontWeight: 600,
                transition: "border-color 0.2s",
              }}
            >
              {item.label}: <span style={{ color: item.value > 0 ? "var(--text-primary, #eeeeff)" : "inherit", fontVariantNumeric: "tabular-nums" }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
