"use client";

import React from "react";

interface Valor {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface IdentidadProps {
  tenantName: string;
  mision: string;
  vision: string;
  valores: Valor[];
}

export default function InfographicIdentidad({ data }: { data: IdentidadProps }) {
  const { tenantName, mision, vision, valores } = data;

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
        fontSize: "2.2rem", 
        fontWeight: 800, 
        marginBottom: "2rem",
        background: "linear-gradient(90deg, #6366f1, #a855f7)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Identidad Institucional {tenantName ? `- ${tenantName}` : ""}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        {/* Misión */}
        <div style={{
          background: "linear-gradient(145deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02))",
          border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: "16px",
          padding: "32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            fontSize: "8rem",
            opacity: 0.05,
            transform: "rotate(15deg)",
            color: "#6366f1"
          }}>
            🎯
          </div>
          <h3 style={{ fontSize: "1.5rem", color: "#6366f1", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>🎯</span> Misión
          </h3>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic", fontWeight: 300 }}>
            "{mision || "No definida"}"
          </p>
        </div>

        {/* Visión */}
        <div style={{
          background: "linear-gradient(145deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02))",
          border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: "16px",
          padding: "32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
        }}>
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            fontSize: "8rem",
            opacity: 0.05,
            transform: "rotate(15deg)",
            color: "#a855f7"
          }}>
            👁️
          </div>
          <h3 style={{ fontSize: "1.5rem", color: "#a855f7", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.8rem" }}>👁️</span> Visión
          </h3>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, color: "var(--text-primary)", fontStyle: "italic", fontWeight: 300 }}>
            "{vision || "No definida"}"
          </p>
        </div>
      </div>

      {/* Valores Institucionales */}
      <div>
        <h3 style={{ fontSize: "1.3rem", color: "var(--text-secondary)", marginBottom: "20px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>⭐</span> Valores Institucionales
        </h3>
        
        {valores.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
            No hay valores definidos.
          </p>
        ) : (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center"
          }}>
            {valores.map((v, i) => {
              const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
              const color = colors[i % colors.length];
              return (
                <div key={v.id} style={{
                  background: `linear-gradient(145deg, ${color}20, transparent)`,
                  border: `1px solid ${color}40`,
                  borderRadius: "12px",
                  padding: "16px 24px",
                  minWidth: "200px",
                  maxWidth: "300px",
                  flex: "1 1 auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  boxShadow: `0 8px 20px ${color}10`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default"
                }}
                onMouseEnter={(e) => { 
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = `0 12px 25px ${color}30`;
                }}
                onMouseLeave={(e) => { 
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = `0 8px 20px ${color}10`;
                }}
                >
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: color, marginBottom: "8px" }}>
                    {v.nombre}
                  </span>
                  {v.descripcion && (
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                      {v.descripcion}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
