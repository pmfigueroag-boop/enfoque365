"use client";

import React from "react";

const TOWS_QUADRANTS = [
  { value: "fo", label: "FO - Ofensivas", subtitle: "Maxi-Maxi", desc: "Aprovechar Fortalezas para explotar Oportunidades", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: "🚀" },
  { value: "fa", label: "FA - Defensivas", subtitle: "Maxi-Mini", desc: "Usar Fortalezas para mitigar Amenazas", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "🛡️" },
  { value: "do", label: "DO - Adaptativas", subtitle: "Mini-Maxi", desc: "Superar Debilidades para aprovechar Oportunidades", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "🔄" },
  { value: "da", label: "DA - Supervivencia", subtitle: "Mini-Mini", desc: "Reducir Debilidades y evitar Amenazas", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: "🆘" },
];

export default function InfographicTows({ data }: { data: any[] }) {
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
        background: "linear-gradient(90deg, #3b82f6, #f97316)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Matriz TOWS (Estrategias Cruzadas)
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px"
      }}>
        {TOWS_QUADRANTS.map((q) => {
          const items = data.filter((item) => item.quadrant === q.value);
          // Sort by priority descending
          items.sort((a, b) => (b.priority || 0) - (a.priority || 0));

          return (
            <div key={q.value} style={{
              background: q.bg,
              border: `1px solid ${q.color}40`,
              borderRadius: "16px",
              padding: "24px",
              position: "relative",
              overflow: "hidden",
              boxShadow: `inset 0 0 40px ${q.color}10`,
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = `inset 0 0 40px ${q.color}20, 0 10px 30px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `inset 0 0 40px ${q.color}10`;
            }}
            >
              {/* Marca de agua */}
              <div style={{
                position: "absolute",
                top: "10px",
                right: "20px",
                fontSize: "60px",
                opacity: 0.1,
                userSelect: "none",
                pointerEvents: "none",
              }}>
                {q.icon}
              </div>

              <h3 style={{ margin: "0 0 4px 0", color: q.color, fontSize: "1.3rem", fontWeight: 800 }}>
                {q.icon} {q.label}
              </h3>
              <div style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "4px",
                letterSpacing: "1px",
                textTransform: "uppercase"
              }}>
                {q.subtitle}
              </div>
              <div style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                marginBottom: "20px",
              }}>
                {q.desc}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.length === 0 ? (
                  <div style={{ 
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    fontSize: "0.9rem"
                  }}>
                    Sin estrategias de este tipo
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={{
                      background: "rgba(0,0,0,0.2)",
                      padding: "12px",
                      borderRadius: "8px",
                      borderLeft: `4px solid ${q.color}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}>
                      <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.4" }}>
                        {item.strategy}
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <span style={{ 
                          fontSize: "0.7rem", 
                          fontWeight: 700, 
                          color: q.color,
                          background: `${q.color}20`,
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}>
                          P {item.priority}
                        </span>
                      </div>
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
