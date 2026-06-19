"use client";

import React from "react";

const VRIO_IMPLICATIONS = [
  { id: "Sustained Competitive Advantage", label: "Ventaja Competitiva Sostenible", color: "var(--success, #10b981)", desc: "V + R + I + O" },
  { id: "Temporary Competitive Advantage", label: "Ventaja Temporal", color: "#f97316", desc: "V + R + I" },
  { id: "Temporary Competitive Advantage (Unorganized)", label: "Ventaja Temporal (No Organizado)", color: "var(--warning, #f59e0b)", desc: "V + R" },
  { id: "Competitive Parity", label: "Paridad Competitiva", color: "var(--text-muted, #94a3b8)", desc: "V" },
  { id: "Competitive Disadvantage", label: "Desventaja Competitiva", color: "var(--danger, #ef4444)", desc: "Ninguno" },
];

function getImplicationType(v: boolean, r: boolean, i: boolean, o: boolean) {
  if (v && r && i && o) return "Sustained Competitive Advantage";
  if (v && r && i) return "Temporary Competitive Advantage (Unorganized)";
  if (v && r) return "Temporary Competitive Advantage";
  if (v) return "Competitive Parity";
  return "Competitive Disadvantage";
}

export default function InfographicVrio({ data }: { data: any[] }) {
  
  const groupedData = VRIO_IMPLICATIONS.map(imp => {
    const items = data.filter(d => getImplicationType(d.valuable, d.rare, d.inimitable, d.organized) === imp.id);
    return { ...imp, items };
  });

  return (
    <div style={{
      width: "100%",
      maxWidth: "1000px",
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
        marginBottom: "3rem",
        background: "linear-gradient(90deg, #8b5cf6, #f97316)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Análisis Interno (VRIO)
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", position: "relative" }}>
        {/* Linea vertical de conexion */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "20px",
          bottom: "20px",
          width: "2px",
          background: "linear-gradient(to bottom, #10b981, #ef4444)",
          transform: "translateX(-50%)",
          zIndex: 0,
          opacity: 0.3
        }} />

        {groupedData.map((group, index) => {
          const isLeft = index % 2 === 0;
          return (
            <div key={group.id} style={{
              display: "flex",
              justifyContent: isLeft ? "flex-start" : "flex-end",
              position: "relative",
              zIndex: 1,
              width: "100%",
            }}>
              <div style={{
                width: "45%",
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${group.color}40`,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: `0 8px 32px 0 ${group.color}15`,
                backdropFilter: "blur(12px)",
                position: "relative",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = isLeft ? "translateX(10px)" : "translateX(-10px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
              >
                {/* Conector al centro */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  [isLeft ? "right" : "left"]: "-11%",
                  width: "11%",
                  height: "2px",
                  background: `${group.color}80`,
                  transform: "translateY(-50%)"
                }} />
                {/* Punto central */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  [isLeft ? "right" : "left"]: "-11%",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: group.color,
                  transform: isLeft ? "translate(50%, -50%)" : "translate(-50%, -50%)",
                  boxShadow: `0 0 10px ${group.color}`
                }} />

                <h3 style={{ margin: "0 0 8px 0", color: group.color, fontSize: "1.2rem", fontWeight: 800 }}>
                  {group.label}
                </h3>
                <div style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginBottom: "16px",
                  textTransform: "uppercase",
                  letterSpacing: "1px"
                }}>
                  Perfil: {group.desc}
                </div>

                {group.items.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.85rem", margin: 0 }}>
                    Ningún recurso en esta categoría.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {group.items.map((item: any, i: number) => (
                      <div key={i} style={{
                        background: "rgba(0,0,0,0.2)",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        color: "var(--text-primary)",
                        borderLeft: `3px solid ${group.color}`
                      }}>
                        <strong>{item.resource_name}</strong>
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
