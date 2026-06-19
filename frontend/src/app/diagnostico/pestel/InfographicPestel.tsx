"use client";

import React from "react";

const PESTEL_CATEGORIES = [
  { id: "politico", label: "Político", color: "#ef4444", icon: "🏛️" },
  { id: "economico", label: "Económico", color: "#3b82f6", icon: "📈" },
  { id: "social", label: "Social", color: "#f59e0b", icon: "👥" },
  { id: "tecnologico", label: "Tecnológico", color: "#8b5cf6", icon: "💻" },
  { id: "ecologico", label: "Ecológico", color: "#10b981", icon: "🌱" },
  { id: "legal", label: "Legal", color: "#f97316", icon: "⚖️" }
];

function getRiskColor(score: number): string {
  if (score >= 49) return "#ef4444";
  if (score >= 25) return "#f59e0b";
  return "#10b981";
}

export default function InfographicPestel({ data }: { data: any[] }) {
  
  const stats = PESTEL_CATEGORIES.reduce((acc, cat) => {
    const items = data.filter((f) => f.category === cat.id);
    const avgRisk = items.length === 0 ? 0 : 
      items.reduce((s, f) => s + ((f.impact_level || 5) * (f.probability || 5)), 0) / items.length;
    acc[cat.id] = { ...cat, items, avgRisk };
    return acc;
  }, {} as Record<string, any>);

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
        marginBottom: "3rem",
        background: "linear-gradient(90deg, #3b82f6, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Análisis Macroambiental (PESTEL)
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
      }}>
        {PESTEL_CATEGORIES.map(cat => {
          const stat = stats[cat.id];
          return (
            <div key={cat.id} style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: `1px solid ${cat.color}40`,
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 8px 32px 0 ${cat.color}15`,
              backdropFilter: "blur(12px)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              cursor: "default"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = `0 12px 40px 0 ${cat.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 8px 32px 0 ${cat.color}15`;
            }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2rem" }}>{cat.icon}</span>
                  <h3 style={{ margin: 0, color: cat.color, fontSize: "1.3rem", fontWeight: 700 }}>{cat.label}</h3>
                </div>
                <div style={{
                  background: `${getRiskColor(stat.avgRisk)}20`,
                  color: getRiskColor(stat.avgRisk),
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 800
                }}>
                  Riesgo: {stat.avgRisk.toFixed(1)}
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                {stat.items.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>No hay factores registrados.</p>
                ) : (
                  <ul style={{ paddingLeft: "20px", margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    {stat.items.slice(0, 3).map((item: any, i: number) => (
                      <li key={i} style={{ marginBottom: "8px" }}>
                        {item.description}
                      </li>
                    ))}
                    {stat.items.length > 3 && (
                      <li style={{ listStyle: "none", color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "8px" }}>
                        + {stat.items.length - 3} factor(es) más...
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
