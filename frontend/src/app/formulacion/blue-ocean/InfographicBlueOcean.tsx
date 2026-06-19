"use client";

import React from "react";

const ERRC_QUADRANTS = [
  { value: "eliminate", label: "Eliminar", subtitle: "Factores a eliminar por completo", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "#ef444450" },
  { value: "reduce", label: "Reducir", subtitle: "Factores a reducir por debajo del estándar", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#f59e0b50" },
  { value: "raise", label: "Incrementar", subtitle: "Factores a elevar por encima del estándar", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "#3b82f650" },
  { value: "create", label: "Crear", subtitle: "Nuevos factores nunca ofrecidos", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "#10b98150" },
];

export default function InfographicBlueOcean({ data }: { data: any[] }) {
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
        background: "linear-gradient(90deg, #ef4444, #3b82f6, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Matriz ERRC (Blue Ocean)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Esquema de las 4 acciones para crear una nueva curva de valor y escapar de la competencia.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "24px",
      }}>
        {ERRC_QUADRANTS.map((q) => {
          const items = data.filter((item) => item.action_type === q.value);
          
          return (
            <div key={q.value} style={{
              background: q.bg,
              border: `1px solid ${q.border}`,
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {/* Decoración de fondo */}
              <div style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: q.color,
                opacity: 0.1,
                filter: "blur(20px)",
                zIndex: 0,
              }} />

              <div style={{ position: "relative", zIndex: 1, borderBottom: `2px solid ${q.border}`, paddingBottom: "12px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.4rem", color: q.color, fontWeight: 800 }}>
                  {q.label}
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {q.subtitle}
                </p>
              </div>

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "12px", minHeight: "150px" }}>
                {items.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem", textAlign: "center", marginTop: "20px" }}>
                    No hay factores definidos.
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={{
                      background: "rgba(0,0,0,0.3)",
                      padding: "16px",
                      borderRadius: "12px",
                      borderLeft: `4px solid ${q.color}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: "1rem", 
                          color: "var(--text-primary)", 
                          fontWeight: 700 
                        }}>
                          {item.factor}
                        </h4>
                      </div>
                      {item.description && (
                        <p style={{ 
                          margin: "0 0 12px 0", 
                          fontSize: "0.85rem", 
                          color: "var(--text-secondary)", 
                          lineHeight: 1.4 
                        }}>
                          {item.description}
                        </p>
                      )}
                      
                      {/* Indicadores de Nivel */}
                      <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: "var(--text-muted)" }}>Nivel Actual ({item.current_level}/5)</span>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", marginTop: "4px" }}>
                            <div style={{ height: "100%", borderRadius: "2px", background: "var(--text-muted)", width: `${(item.current_level || 0) * 20}%` }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: q.color }}>Nivel Objetivo ({item.target_level}/5)</span>
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.1)", marginTop: "4px" }}>
                            <div style={{ height: "100%", borderRadius: "2px", background: q.color, width: `${(item.target_level || 0) * 20}%` }} />
                          </div>
                        </div>
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
