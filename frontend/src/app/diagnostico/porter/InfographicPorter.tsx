"use client";

import React from "react";

const FORCE_TYPES = [
  { value: "nuevos_entrantes", label: "Nuevos Entrantes", color: "var(--warning, #f59e0b)", position: "top" },
  { value: "poder_proveedores", label: "Proveedores", color: "var(--success, #10b981)", position: "left" },
  { value: "rivalidad", label: "Rivalidad Competitiva", color: "var(--danger, #ef4444)", position: "center" },
  { value: "poder_clientes", label: "Clientes", color: "#8b5cf6", position: "right" },
  { value: "sustitutos", label: "Sustitutos", color: "var(--primary-500, #3b82f6)", position: "bottom" },
];

function getPressureColor(score: number): string {
  if (score >= 16) return "#ef4444";
  if (score >= 9) return "#f59e0b";
  return "#10b981";
}

export default function InfographicPorter({ data }: { data: any[] }) {
  
  // Calcula promedios para cada fuerza
  const stats = FORCE_TYPES.reduce((acc, ft) => {
    const items = data.filter((f) => f.force_type === ft.value);
    const avgPressure = items.length === 0 ? 0 : 
      items.reduce((s, f) => s + ((f.intensity || 0) * (f.probability || 0)), 0) / items.length;
    acc[ft.value] = { ...ft, items, avgPressure };
    return acc;
  }, {} as Record<string, any>);

  const renderForceCard = (forceKey: string) => {
    const stat = stats[forceKey];
    if (!stat) return null;
    
    return (
      <div style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: `1px solid ${stat.color}40`,
        borderRadius: "16px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        boxShadow: `0 8px 32px 0 ${stat.color}15`,
        backdropFilter: "blur(12px)",
        height: "100%",
        minHeight: "180px",
        position: "relative",
        transition: "transform 0.3s ease",
      }}>
        <h4 style={{ 
          margin: "0 0 12px 0", 
          color: stat.color, 
          fontSize: forceKey === "rivalidad" ? "1.4rem" : "1.1rem",
          fontWeight: 800 
        }}>
          {stat.label}
        </h4>
        
        <div style={{
          fontSize: "2rem",
          fontWeight: 900,
          color: getPressureColor(stat.avgPressure),
          textShadow: `0 0 10px ${getPressureColor(stat.avgPressure)}40`,
          marginBottom: "8px"
        }}>
          {stat.avgPressure ? stat.avgPressure.toFixed(1) : "N/A"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
          Presión Promedio
        </div>
        
        {stat.items.length > 0 && (
          <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            {stat.items.length} factor{stat.items.length !== 1 ? 'es' : ''}
          </div>
        )}
      </div>
    );
  };

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
        background: "linear-gradient(90deg, #f59e0b, #ef4444)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        5 Fuerzas de Porter
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        gridTemplateRows: "1fr 1.2fr 1fr",
        gap: "24px",
        position: "relative",
        alignItems: "center"
      }}>
        {/* Conectores CSS (Cruces) */}
        <div style={{ position: "absolute", top: "50%", left: "15%", right: "15%", height: "2px", background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
        <div style={{ position: "absolute", left: "50%", top: "15%", bottom: "15%", width: "2px", background: "rgba(255,255,255,0.1)", zIndex: 0 }} />

        {/* Fila 1 */}
        <div />
        <div style={{ zIndex: 1 }}>{renderForceCard("nuevos_entrantes")}</div>
        <div />

        {/* Fila 2 */}
        <div style={{ zIndex: 1 }}>{renderForceCard("poder_proveedores")}</div>
        <div style={{ zIndex: 2, transform: "scale(1.05)" }}>{renderForceCard("rivalidad")}</div>
        <div style={{ zIndex: 1 }}>{renderForceCard("poder_clientes")}</div>

        {/* Fila 3 */}
        <div />
        <div style={{ zIndex: 1 }}>{renderForceCard("sustitutos")}</div>
        <div />
      </div>
    </div>
  );
}
