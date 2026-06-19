"use client";

import React from "react";

interface KeyResult {
  id: number;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  objetivo_id: number;
}

interface Objetivo {
  id: number;
  description: string;
  ejeName?: string;
}

interface OKRInfographicProps {
  data: KeyResult[];
  objetivos: Objetivo[];
}

export default function InfographicOKR({ data, objetivos }: OKRInfographicProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
        No hay Key Results registrados.
      </div>
    );
  }

  // Agrupar KRs por Objetivo
  const groupedKRs: Record<number, KeyResult[]> = {};
  data.forEach((kr) => {
    if (!groupedKRs[kr.objetivo_id]) {
      groupedKRs[kr.objetivo_id] = [];
    }
    groupedKRs[kr.objetivo_id].push(kr);
  });

  return (
    <div style={{
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      background: "var(--bg-secondary)",
      borderRadius: "16px",
      padding: "40px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
    }}>
      <h2 style={{ 
        textAlign: "center", 
        fontSize: "2rem", 
        fontWeight: 800, 
        marginBottom: "1rem",
        background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Panel de OKRs (Objectives and Key Results)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Monitoreo ágil de Resultados Clave agrupados por Objetivo Estratégico.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {Object.entries(groupedKRs).map(([objIdStr, krs]) => {
          const objId = parseInt(objIdStr);
          const obj = objetivos.find(o => o.id === objId);
          
          if (!obj) return null;

          return (
            <div key={objId} style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}>
              {/* Objective Header */}
              <div style={{ marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span style={{
                    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    letterSpacing: "0.05em"
                  }}>
                    OBJETIVO
                  </span>
                  {obj.ejeName && (
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Eje: {obj.ejeName}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: "1.3rem", color: "var(--text-primary)", fontWeight: 700, lineHeight: 1.4 }}>
                  {obj.description}
                </h3>
              </div>

              {/* Key Results Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}>
                {krs.map((kr) => {
                  let pct = 0;
                  if (kr.target_value) {
                    pct = Math.min(100, Math.round((kr.current_value / kr.target_value) * 100));
                  }
                  
                  let color = "#ef4444"; // Red
                  if (pct >= 80) color = "#10b981"; // Green
                  else if (pct >= 50) color = "#f59e0b"; // Yellow

                  return (
                    <div key={kr.id} style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      padding: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      transition: "transform 0.2s ease, background 0.2s ease",
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.background = "rgba(0,0,0,0.2)";
                    }}
                    >
                      {/* Progress Ring */}
                      <div style={{ position: "relative", width: "70px", height: "70px", flexShrink: 0 }}>
                        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                          {/* Background Circle */}
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="3"
                          />
                          {/* Progress Circle */}
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={color}
                            strokeWidth="3"
                            strokeDasharray={`${pct}, 100`}
                            style={{ transition: "stroke-dasharray 1s ease" }}
                          />
                        </svg>
                        <div style={{
                          position: "absolute",
                          top: "0", left: "0", right: "0", bottom: "0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                        }}>
                          <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)" }}>{pct}%</span>
                        </div>
                      </div>

                      {/* KR Details */}
                      <div>
                        <div style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: color,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "4px"
                        }}>
                          Key Result
                        </div>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                          {kr.title}
                        </h4>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{kr.current_value}</span> / {kr.target_value} {kr.unit}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
