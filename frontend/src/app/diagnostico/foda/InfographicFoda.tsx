"use client";

import React from "react";

const FODA_QUADRANTS = [
  { value: "fortaleza", label: "Fortalezas", color: "#10b981", bg: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)" },
  { value: "debilidad", label: "Debilidades", color: "#f59e0b", bg: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)" },
  { value: "oportunidad", label: "Oportunidades", color: "#3b82f6", bg: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)" },
  { value: "amenaza", label: "Amenazas", color: "#ef4444", bg: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)" },
];

export default function InfographicFoda({ data }: { data: any[] }) {
  return (
    <div style={{
      width: "100%",
      maxWidth: "1000px",
      margin: "0 auto",
      background: "var(--bg-secondary)",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
    }}>
      <h2 style={{ 
        textAlign: "center", 
        fontSize: "2rem", 
        fontWeight: 800, 
        marginBottom: "2rem",
        background: "linear-gradient(90deg, #10b981, #3b82f6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Matriz FODA
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}>
        {FODA_QUADRANTS.map((q) => {
          const items = data.filter((item) => item.quadrant === q.value);
          return (
            <div key={q.value} style={{
              background: q.bg,
              border: `1px solid ${q.color}40`,
              borderRadius: "12px",
              padding: "24px",
              minHeight: "250px",
              backdropFilter: "blur(10px)",
              transition: "transform 0.3s ease",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: `${q.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: q.color,
                  fontWeight: "bold",
                  fontSize: "1.2rem",
                  boxShadow: `0 0 15px ${q.color}40`
                }}>
                  {q.label.charAt(0)}
                </div>
                <h3 style={{ margin: 0, fontSize: "1.4rem", color: q.color }}>{q.label}</h3>
              </div>
              
              <ul style={{ 
                margin: 0, 
                paddingLeft: "1.5rem", 
                listStyleType: "none",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                {items.length === 0 ? (
                  <li style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.95rem" }}>
                    No hay elementos definidos.
                  </li>
                ) : (
                  items.map((item, idx) => (
                    <li key={item.id} style={{ 
                      position: "relative",
                      fontSize: "0.95rem",
                      color: "var(--text-primary)",
                      lineHeight: "1.5",
                      paddingLeft: "16px"
                    }}>
                      <span style={{
                        position: "absolute",
                        left: 0,
                        top: "8px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: q.color,
                        boxShadow: `0 0 5px ${q.color}`
                      }} />
                      {item.description}
                    </li>
                  ))
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
