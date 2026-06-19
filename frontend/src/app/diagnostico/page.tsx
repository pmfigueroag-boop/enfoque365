"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";

interface ToolInfo {
  key: string;
  name: string;
  description: string;
  subtitle: string;
  href: string;
  fetcher: () => Promise<any[]>;
  count: number;
  loaded: boolean;
}

const TOOL_SECTIONS: {
  title: string;
  accent: string;
  tools: Omit<ToolInfo, "count" | "loaded">[];
}[] = [
  {
    title: "Diagnostico Externo",
    accent: "var(--primary-500)",
    tools: [
      {
        key: "pestel",
        name: "PESTEL",
        description: "Analisis de factores macroambientales que impactan la organizacion",
        subtitle: "6 categorias",
        href: "/diagnostico/pestel",
        fetcher: () => api.getPestel(),
      },
      {
        key: "porter",
        name: "Porter",
        description: "Evaluacion de las fuerzas competitivas del sector industrial",
        subtitle: "5 fuerzas",
        href: "/diagnostico/porter",
        fetcher: () => api.getPorter(),
      },
    ],
  },
  {
    title: "Diagnostico Interno",
    accent: "#a78bfa",
    tools: [
      {
        key: "vrio",
        name: "VRIO",
        description: "Valoracion de recursos y capacidades para ventaja competitiva",
        subtitle: "recursos",
        href: "/diagnostico/vrio",
        fetcher: () => api.getVrio(),
      },
      {
        key: "mckinsey7s",
        name: "McKinsey 7S",
        description: "Alineacion de los siete elementos organizacionales clave",
        subtitle: "elementos",
        href: "/diagnostico/mckinsey7s",
        fetcher: () => api.getMckinsey7s(),
      },
      {
        key: "bcg",
        name: "Matriz BCG",
        description: "Clasificacion de unidades de negocio por crecimiento y participacion",
        subtitle: "unidades",
        href: "/diagnostico/bcg",
        fetcher: () => api.getBcg(),
      },
    ],
  },
  {
    title: "Sintesis",
    accent: "#34d399",
    tools: [
      {
        key: "foda",
        name: "FODA",
        description: "Identificacion de fortalezas, oportunidades, debilidades y amenazas",
        subtitle: "cuadrantes",
        href: "/diagnostico/foda",
        fetcher: () => api.getFoda(),
      },
      {
        key: "tows",
        name: "TOWS",
        description: "Estrategias cruzadas derivadas del analisis FODA",
        subtitle: "estrategias",
        href: "/diagnostico/tows",
        fetcher: () => api.getTows(),
      },
    ],
  },
];

export default function DiagnosticoPage() {
  const [toolData, setToolData] = useState<Record<string, { count: number; loaded: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allTools = TOOL_SECTIONS.flatMap((s) => s.tools);
    const initial: Record<string, { count: number; loaded: boolean }> = {};
    allTools.forEach((t) => {
      initial[t.key] = { count: 0, loaded: false };
    });
    setToolData(initial);

    Promise.allSettled(
      allTools.map((t) =>
        t.fetcher().then((items) => ({ key: t.key, count: Array.isArray(items) ? items.length : 0 }))
          .catch(() => ({ key: t.key, count: 0 }))
      )
    ).then((results) => {
      const updated: Record<string, { count: number; loaded: boolean }> = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          updated[r.value.key] = { count: r.value.count, loaded: true };
        }
      });
      setToolData((prev) => ({ ...prev, ...updated }));
      setLoading(false);
    });
  }, []);

  const allTools = TOOL_SECTIONS.flatMap((s) => s.tools);
  const totalTools = allTools.length;
  const completedTools = allTools.filter((t) => (toolData[t.key]?.count ?? 0) > 0).length;
  const progressPercent = totalTools > 0 ? (completedTools / totalTools) * 100 : 0;

  return (
    <>
      <header className="header">
        <h2 className="header-title">Centro de Diagnostico Estrategico</h2>
      </header>

      <div className="page-content animate-fade-in">
        {/* ── Progress Overview ── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 50%, rgba(52,211,153,0.06) 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "var(--radius-lg, 16px)",
          padding: "28px 32px",
          marginBottom: "32px",
          backdropFilter: "blur(16px)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, marginBottom: "4px" }}>
                Progreso del Diagnostico
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                {loading ? "Calculando..." : `${completedTools} de ${totalTools} herramientas completadas`}
              </p>
            </div>
            <div style={{
              fontSize: "2rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, var(--primary-500), #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
            }}>
              {loading ? "--" : `${Math.round(progressPercent)}%`}
            </div>
          </div>
          <div style={{
            width: "100%",
            height: "8px",
            background: "rgba(255,255,255,0.06)",
            borderRadius: "999px",
            overflow: "hidden",
          }}>
            <div style={{
              width: loading ? "0%" : `${progressPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--primary-500), #a78bfa, #34d399)",
              borderRadius: "999px",
              transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }} />
          </div>
        </div>

        {/* ── Tool Sections ── */}
        {TOOL_SECTIONS.map((section) => (
          <div key={section.title} style={{ marginBottom: "36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              <div style={{
                width: "4px",
                height: "24px",
                borderRadius: "2px",
                background: section.accent,
                flexShrink: 0,
              }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, letterSpacing: "0.02em" }}>
                {section.title}
              </h3>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}>
              {section.tools.map((tool) => {
                const data = toolData[tool.key];
                const count = data?.count ?? 0;
                const isLoaded = data?.loaded ?? false;
                const hasItems = count > 0;

                return (
                  <Link
                    key={tool.key}
                    href={tool.href}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div
                      className="diag-tool-card"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "var(--radius-md, 12px)",
                        padding: "24px",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      {/* Subtle top accent line */}
                      <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: `linear-gradient(90deg, ${section.accent}, transparent)`,
                        opacity: 0.6,
                      }} />

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, marginBottom: "4px" }}>
                            {tool.name}
                          </h4>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: section.accent,
                            opacity: 0.9,
                          }}>
                            {tool.subtitle}
                          </span>
                        </div>

                        {/* Status indicator */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {isLoaded && (
                            <span style={{
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              color: hasItems ? "var(--success, #34d399)" : "var(--text-muted)",
                              background: hasItems ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                              padding: "3px 10px",
                              borderRadius: "999px",
                              whiteSpace: "nowrap",
                            }}>
                              {count} {count === 1 ? "item" : "items"}
                            </span>
                          )}
                          <div style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: !isLoaded
                              ? "rgba(255,255,255,0.1)"
                              : hasItems
                                ? "var(--success, #34d399)"
                                : "rgba(255,255,255,0.15)",
                            boxShadow: hasItems && isLoaded
                              ? "0 0 8px rgba(52,211,153,0.4)"
                              : "none",
                            flexShrink: 0,
                            transition: "all 0.4s ease",
                          }} />
                        </div>
                      </div>

                      <p style={{
                        fontSize: "0.83rem",
                        color: "var(--text-muted)",
                        margin: 0,
                        lineHeight: 1.5,
                      }}>
                        {tool.description}
                      </p>

                      {/* Arrow indicator */}
                      <div style={{
                        position: "absolute",
                        bottom: "16px",
                        right: "20px",
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        opacity: 0.4,
                        transition: "all 0.3s ease",
                      }}
                        className="diag-card-arrow"
                      >
                        &rarr;
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Scoped Styles ── */}
      <style jsx>{`
        .diag-tool-card:hover {
          transform: translateY(-3px) scale(1.015);
          border-color: rgba(255, 255, 255, 0.14) !important;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.25),
            0 0 20px rgba(99, 102, 241, 0.08);
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.06) 0%,
            rgba(255, 255, 255, 0.02) 100%
          ) !important;
        }
        .diag-tool-card:hover .diag-card-arrow {
          opacity: 1 !important;
          color: var(--primary-500) !important;
          transform: translateX(4px);
        }
        .diag-tool-card:active {
          transform: translateY(-1px) scale(1.005);
        }
      `}</style>
    </>
  );
}
