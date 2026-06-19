"use client";

import React from "react";

interface Indicador {
  id: number;
  nombre: string;
  unidad: string;
  linea_base: number;
  meta: number;
  valor_actual: number | null;
  frecuencia: string;
  tendencia: string;
  semaforo: string;
}

const SEMAFORO_COLORS: Record<string, string> = {
  verde: "#10b981",
  amarillo: "#f59e0b",
  rojo: "#ef4444",
  gris: "#6b7280",
};

export default function InfographicKPI({ data }: { data: Indicador[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
        No hay indicadores registrados.
      </div>
    );
  }

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
        background: "linear-gradient(90deg, #3b82f6, #ec4899)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Tablero de Indicadores Clave (KPI)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Visualización de avance estratégico. Monitoreo de Metas vs Ejecución Actual.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px",
      }}>
        {data.map((ind) => {
          const actual = ind.valor_actual ?? 0;
          let progress = 0;
          if (ind.meta !== 0) {
            progress = Math.min(Math.max((actual / ind.meta) * 100, 0), 100);
          }
          const semaforoColor = SEMAFORO_COLORS[ind.semaforo] || SEMAFORO_COLORS.gris;

          return (
            <div key={ind.id} style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${semaforoColor}40`,
              borderRadius: "16px",
              padding: "24px",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 8px 30px ${semaforoColor}15`,
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {/* Background Glow */}
              <div style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: semaforoColor,
                opacity: 0.1,
                filter: "blur(20px)",
                zIndex: 0,
              }} />

              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: 700, flex: 1, paddingRight: "16px", lineHeight: 1.3 }}>
                  {ind.nombre}
                </h3>
                <div style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: semaforoColor,
                  boxShadow: `0 0 10px ${semaforoColor}`,
                  flexShrink: 0,
                  marginTop: "4px"
                }} />
              </div>

              <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", marginBottom: "16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <div>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Tendencia</span>
                  <span style={{ fontWeight: 600 }}>{ind.tendencia}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Frecuencia</span>
                  <span style={{ fontWeight: 600 }}>{ind.frecuencia}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ position: "relative", zIndex: 1, marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem", fontWeight: 700 }}>
                  <span style={{ color: semaforoColor }}>{Math.round(progress)}% completado</span>
                  <span style={{ color: "var(--text-primary)" }}>{actual} <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.75rem" }}>/ {ind.meta} {ind.unidad}</span></span>
                </div>
                
                <div style={{
                  height: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)"
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${semaforoColor}80, ${semaforoColor})`,
                    borderRadius: "4px",
                    boxShadow: `0 0 10px ${semaforoColor}80`,
                    transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)"
                  }} />
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "8px", textAlign: "right" }}>
                  Línea base: {ind.linea_base}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
