"use client";

import React from "react";

const QUADRANTS = [
  { id: "star", title: "Estrella", desc: "Alta Inversión, Alto Retorno", color: "#f59e0b", icon: "🌟", bg: "rgba(245, 158, 11, 0.1)" },
  { id: "question_mark", title: "Interrogante", desc: "Alta Inversión, Retorno Incierto", color: "#3b82f6", icon: "❓", bg: "rgba(59, 130, 246, 0.1)" },
  { id: "cash_cow", title: "Vaca Lechera", desc: "Baja Inversión, Alto Retorno", color: "#10b981", icon: "🐄", bg: "rgba(16, 185, 129, 0.1)" },
  { id: "dog", title: "Perro", desc: "Baja Inversión, Bajo Retorno", color: "#ef4444", icon: "🐕", bg: "rgba(239, 68, 68, 0.1)" }
];

export default function InfographicBcg({ data }: { data: any[] }) {

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
      position: "relative",
    }}>
      <h2 style={{ 
        textAlign: "center", 
        fontSize: "2rem", 
        fontWeight: 800, 
        marginBottom: "3rem",
        background: "linear-gradient(90deg, #10b981, #f59e0b)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Matriz BCG (Portafolio)
      </h2>

      {/* Grid Container */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: "20px",
        position: "relative",
        padding: "20px 0 0 20px"
      }}>
        {/* Ejes */}
        <div style={{
          position: "absolute",
          left: 0,
          top: "20px",
          bottom: 0,
          width: "2px",
          background: "linear-gradient(to bottom, #10b981, #ef4444)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ 
            position: "absolute", 
            transform: "rotate(-90deg) translateY(-20px)", 
            whiteSpace: "nowrap",
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--text-secondary)",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}>
            Tasa de Crecimiento del Mercado (Alto a Bajo)
          </span>
        </div>
        <div style={{
          position: "absolute",
          left: "20px",
          right: 0,
          bottom: "-20px",
          height: "2px",
          background: "linear-gradient(to right, #10b981, #ef4444)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <span style={{ 
            position: "absolute", 
            transform: "translateY(15px)", 
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "var(--text-secondary)",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}>
            Participación Relativa de Mercado (Alta a Baja)
          </span>
        </div>

        {QUADRANTS.map((quad) => {
          const items = data.filter(d => d.quadrant === quad.id);
          
          return (
            <div key={quad.id} style={{
              background: quad.bg,
              border: `1px solid ${quad.color}40`,
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              boxShadow: `inset 0 0 40px ${quad.color}10`,
              minHeight: "250px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = `inset 0 0 40px ${quad.color}20, 0 10px 30px rgba(0,0,0,0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `inset 0 0 40px ${quad.color}10`;
            }}
            >
              {/* Marca de agua */}
              <div style={{
                position: "absolute",
                top: "-10%",
                right: "-10%",
                fontSize: "120px",
                opacity: 0.1,
                userSelect: "none",
                pointerEvents: "none"
              }}>
                {quad.icon}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "1.5rem" }}>{quad.icon}</span>
                <div>
                  <h3 style={{ margin: 0, color: quad.color, fontSize: "1.2rem", fontWeight: 800 }}>
                    {quad.title}
                  </h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    {quad.desc}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                {items.length === 0 ? (
                  <div style={{ 
                    flex: 1, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                    fontSize: "0.9rem"
                  }}>
                    Sin unidades de negocio
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={{
                      background: "rgba(0,0,0,0.2)",
                      padding: "12px",
                      borderRadius: "8px",
                      borderLeft: `4px solid ${quad.color}`
                    }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                        {item.unit_name}
                      </div>
                      <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <span>Cuota: <strong>{item.market_share}</strong>/5</span>
                        <span>Crecimiento: <strong>{item.market_growth}</strong>/5</span>
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
