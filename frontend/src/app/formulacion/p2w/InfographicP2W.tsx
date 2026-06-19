"use client";

import React from "react";

const P2W_CHOICES = [
  { value: "winning_aspiration", label: "1. Aspiración de Victoria", subtitle: "¿Cuál es nuestra aspiración ganadora?", color: "#6366f1", bg: "rgba(99,102,241,0.15)" },
  { value: "where_to_play", label: "2. Dónde Jugar", subtitle: "¿En qué mercados/segmentos competimos?", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  { value: "how_to_win", label: "3. Cómo Ganar", subtitle: "¿Cuál es nuestra ventaja competitiva?", color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  { value: "core_capabilities", label: "4. Capacidades Requeridas", subtitle: "¿Qué capacidades son necesarias?", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  { value: "management_systems", label: "5. Sistemas de Gestión", subtitle: "¿Qué sistemas sostienen la estrategia?", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
];

export default function InfographicP2W({ data }: { data: any[] }) {
  return (
    <div style={{
      width: "100%",
      maxWidth: "900px",
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
        background: "linear-gradient(90deg, #6366f1, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Playing to Win (Cascada Estratégica)
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Las 5 elecciones fundamentales que definen y conectan la estrategia.
      </p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {P2W_CHOICES.map((c, idx) => {
          const items = data.filter((item) => item.choice_type === c.value);
          
          return (
            <React.Fragment key={c.value}>
              <div style={{
                width: "100%",
                maxWidth: "600px",
                background: c.bg,
                border: `1px solid ${c.color}50`,
                borderRadius: "12px",
                padding: "20px",
                position: "relative",
                boxShadow: `0 10px 25px ${c.color}20`,
                backdropFilter: "blur(8px)",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: `2px solid ${c.color}40`, paddingBottom: "12px", marginBottom: "16px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: c.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    boxShadow: `0 0 15px ${c.color}80`
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", color: c.color, fontWeight: 800 }}>{c.label.split(". ")[1]}</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{c.subtitle}</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem", textAlign: "center", padding: "10px" }}>
                      No definido
                    </div>
                  ) : (
                    items.map(item => (
                      <div key={item.id} style={{
                        background: "var(--bg-primary)",
                        padding: "16px",
                        borderRadius: "8px",
                        borderLeft: `4px solid ${c.color}`,
                        position: "relative",
                      }}>
                        <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: "1.5" }}>
                          {item.description}
                        </div>
                        {item.rationale && (
                          <div style={{ 
                            marginTop: "8px", 
                            fontSize: "0.8rem", 
                            color: "var(--text-muted)", 
                            background: "var(--bg-secondary)", 
                            padding: "8px", 
                            borderRadius: "6px",
                            border: "1px dashed var(--border-color)"
                          }}>
                            <strong>Rationale:</strong> {item.rationale}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cascade arrow */}
              {idx < P2W_CHOICES.length - 1 && (
                <div style={{
                  height: "40px",
                  width: "4px",
                  background: `linear-gradient(to bottom, ${c.color}, ${P2W_CHOICES[idx + 1].color})`,
                  margin: "0 auto",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute",
                    bottom: "-4px",
                    left: "-6px",
                    width: "0",
                    height: "0",
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: `8px solid ${P2W_CHOICES[idx + 1].color}`,
                  }} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
