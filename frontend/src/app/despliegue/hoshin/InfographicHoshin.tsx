"use client";

import React from "react";

interface HoshinItem {
  id: number;
  objetivo_estrategico_desc: string;
  perspectiva: string;
  objetivo_tactico: string;
  responsable: string;
  meta_corto_plazo: string;
  estado: "pendiente" | "en_progreso" | "completado";
}

const PERSP_COLORS: Record<string, string> = {
  financiera: "#3b82f6",
  clientes: "#10b981",
  procesos: "#f59e0b",
  aprendizaje: "#8b5cf6",
};

export default function InfographicHoshin({ data }: { data: HoshinItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
        No hay datos para la matriz Hoshin Kanri.
      </div>
    );
  }

  // Group by Estrategic Objective
  const groupedData: Record<string, HoshinItem[]> = {};
  data.forEach(item => {
    if (!groupedData[item.objetivo_estrategico_desc]) {
      groupedData[item.objetivo_estrategico_desc] = [];
    }
    groupedData[item.objetivo_estrategico_desc].push(item);
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
        background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Matriz de Despliegue (Hoshin Kanri)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Alineación visual de objetivos estratégicos con tácticas, responsables y estado de avance.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {Object.entries(groupedData).map(([objDesc, items]) => {
          const perspectiva = items[0]?.perspectiva || "gris";
          const pColor = PERSP_COLORS[perspectiva] || "#6b7280";

          return (
            <div key={objDesc} style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${pColor}40`,
              borderRadius: "16px",
              padding: "24px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Background gradient hint */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, bottom: 0,
                width: "6px",
                background: pColor,
              }} />

              {/* Header */}
              <div style={{ marginBottom: "20px", paddingLeft: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                    color: pColor,
                    background: `${pColor}15`,
                    padding: "4px 8px",
                    borderRadius: "4px"
                  }}>
                    {perspectiva}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>OBJETIVO ESTRATÉGICO</span>
                </div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
                  {objDesc}
                </h3>
              </div>

              {/* Tactics Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
                paddingLeft: "16px"
              }}>
                {items.map(item => {
                  let statusColor = "#ef4444";
                  if (item.estado === "en_progreso") statusColor = "#f59e0b";
                  if (item.estado === "completado") statusColor = "#10b981";

                  return (
                    <div key={item.id} style={{
                      background: "rgba(0,0,0,0.2)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      padding: "16px",
                      position: "relative",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                    >
                      {/* Status indicator */}
                      <div style={{
                        position: "absolute",
                        top: "16px", right: "16px",
                        width: "12px", height: "12px",
                        borderRadius: "50%",
                        background: statusColor,
                        boxShadow: `0 0 8px ${statusColor}`
                      }} title={`Estado: ${item.estado.replace("_", " ")}`} />

                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px", fontWeight: 600 }}>
                        Táctica / Iniciativa
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "16px", lineHeight: 1.3, paddingRight: "16px" }}>
                        {item.objetivo_tactico}
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "var(--text-secondary)", minWidth: "80px" }}>Responsable:</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 500, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "4px" }}>
                            {item.responsable}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ color: "var(--text-secondary)", minWidth: "80px" }}>Meta:</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                            {item.meta_corto_plazo}
                          </span>
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
