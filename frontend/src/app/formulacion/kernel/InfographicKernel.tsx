"use client";

import React from "react";

const KERNEL_COMPONENTS = [
  { value: "diagnosis", label: "Diagnóstico", subtitle: "Identificación de los retos críticos de la situación.", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "🎯" },
  { value: "guiding_policy", label: "Política Guía", subtitle: "El enfoque general elegido para hacer frente a los retos.", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", icon: "🧭" },
  { value: "coherent_actions", label: "Acción Coherente", subtitle: "Pasos coordinados que se respaldan mutuamente.", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "⚡" },
];

export default function InfographicKernel({ data }: { data: any[] }) {
  return (
    <div style={{
      width: "100%",
      maxWidth: "1100px",
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
        background: "linear-gradient(90deg, #ef4444, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Kernel de Rumelt (Núcleo Estratégico)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Toda estrategia efectiva tiene un núcleo compuesto por estos tres pilares secuenciales e inseparables.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "24px",
        position: "relative",
      }}>
        {/* Conector de fondo (línea horizontal) */}
        <div style={{
          position: "absolute",
          top: "40px", // Align with icons
          left: "16%",
          right: "16%",
          height: "4px",
          background: "linear-gradient(90deg, rgba(239,68,68,0.5), rgba(139,92,246,0.5), rgba(16,185,129,0.5))",
          zIndex: 0,
          borderRadius: "2px",
        }} />

        {KERNEL_COMPONENTS.map((c, idx) => {
          const items = data.filter((item) => item.component_type === c.value);
          
          return (
            <div key={c.value} style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              {/* Pillar Header / Icon */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--bg-primary)",
                  border: `4px solid ${c.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  boxShadow: `0 0 20px ${c.color}60`,
                  zIndex: 2,
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {c.icon}
                </div>
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", color: c.color, fontWeight: 800 }}>
                    {idx + 1}. {c.label}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {c.subtitle}
                  </p>
                </div>
              </div>

              {/* Pillar Content */}
              <div style={{
                background: c.bg,
                border: `1px solid ${c.color}30`,
                borderRadius: "16px",
                padding: "20px",
                minHeight: "300px",
                backdropFilter: "blur(10px)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: `inset 0 0 20px ${c.color}10`,
              }}>
                {items.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem", textAlign: "center", marginTop: "40px" }}>
                    Sin elementos.
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={{
                      background: "rgba(0,0,0,0.25)",
                      padding: "16px",
                      borderRadius: "12px",
                      borderTop: `3px solid ${c.color}`,
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                    >
                      <h4 style={{ 
                        margin: "0 0 8px 0", 
                        fontSize: "0.95rem", 
                        color: "var(--text-primary)", 
                        fontWeight: 700 
                      }}>
                        {item.title}
                      </h4>
                      <p style={{ 
                        margin: 0, 
                        fontSize: "0.85rem", 
                        color: "var(--text-secondary)", 
                        lineHeight: 1.5 
                      }}>
                        {item.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
