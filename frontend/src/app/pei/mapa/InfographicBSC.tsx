"use client";

import React from "react";

interface KPI {
  id: number;
  nombre: string;
  semaforo: string;
}

interface Objetivo {
  id: number;
  description: string;
  indicadores: KPI[];
}

interface EjeMapa {
  id: number;
  name: string;
  perspectiva_bsc: string | null;
  peso_ponderado: number;
  objetivos: Objetivo[];
}

const PERSPECTIVAS = [
  { key: "financiera", label: "Financiera", color: "#3b82f6" },
  { key: "clientes", label: "Clientes", color: "#10b981" },
  { key: "procesos", label: "Procesos Internos", color: "#f59e0b" },
  { key: "aprendizaje", label: "Aprendizaje y Crecimiento", color: "#8b5cf6" },
];

export default function InfographicBSC({ data }: { data: EjeMapa[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
        No hay datos para el Mapa BSC.
      </div>
    );
  }

  const ejesByPerspectiva = (key: string) => {
    return data.filter((e) => (e.perspectiva_bsc || "").toLowerCase() === key.toLowerCase());
  };

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
        background: "linear-gradient(90deg, #10b981, #3b82f6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Mapa Estratégico (Balanced Scorecard)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Estructura de la estrategia organizacional a través de las 4 perspectivas del BSC.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {PERSPECTIVAS.map((persp) => {
          const ejes = ejesByPerspectiva(persp.key);
          const allObjetivos = ejes.flatMap((e) => e.objetivos || []);
          
          return (
            <div key={persp.key} style={{
              display: "flex",
              borderRadius: "16px",
              overflow: "hidden",
              border: `1px solid ${persp.color}40`,
              background: "rgba(255,255,255,0.02)",
              boxShadow: `0 10px 30px ${persp.color}10`,
            }}>
              {/* Perspective Label (Left Side) */}
              <div style={{
                width: "60px",
                background: `linear-gradient(180deg, ${persp.color}dd, ${persp.color}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)"
                }}>
                  {persp.label}
                </span>
              </div>

              {/* Objectives Area */}
              <div style={{ padding: "24px", flex: 1 }}>
                {allObjetivos.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
                    Sin objetivos en esta perspectiva.
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {allObjetivos.map((obj) => (
                      <div key={obj.id} style={{
                        background: "rgba(0,0,0,0.2)",
                        border: `1px solid ${persp.color}60`,
                        borderRadius: "12px",
                        padding: "16px",
                        width: "240px",
                        position: "relative",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                        boxShadow: `inset 0 2px 10px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = `inset 0 2px 10px rgba(0,0,0,0.2), 0 8px 20px ${persp.color}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = `inset 0 2px 10px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)`;
                      }}
                      >
                        {/* Status Dot */}
                        <div style={{
                          position: "absolute",
                          top: "12px",
                          right: "12px",
                          display: "flex",
                          gap: "4px"
                        }}>
                          {(obj.indicadores || []).map((kpi, idx) => (
                            <div key={idx} title={kpi.nombre} style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: kpi.semaforo === "verde" ? "#10b981" : kpi.semaforo === "amarillo" ? "#f59e0b" : kpi.semaforo === "rojo" ? "#ef4444" : "#6b7280",
                              boxShadow: `0 0 6px ${kpi.semaforo === "verde" ? "#10b981" : kpi.semaforo === "amarillo" ? "#f59e0b" : kpi.semaforo === "rojo" ? "#ef4444" : "#6b7280"}`
                            }} />
                          ))}
                        </div>

                        <div style={{ fontSize: "0.7rem", color: persp.color, fontWeight: 700, textTransform: "uppercase", marginBottom: "8px" }}>
                          Objetivo
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          {obj.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
