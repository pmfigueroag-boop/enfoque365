"use client";

import React from "react";

interface Objetivo {
  id: number;
  description: string;
}

interface Eje {
  id: number;
  name: string;
  description: string | null;
  objetivos: Objetivo[];
}

export default function InfographicArbol({ data }: { data: Eje[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontStyle: "italic" }}>
        No hay ejes estratégicos definidos.
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      background: "var(--bg-secondary)",
      borderRadius: "16px",
      padding: "40px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      overflowX: "auto"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        fontSize: "2rem", 
        fontWeight: 800, 
        marginBottom: "1rem",
        background: "linear-gradient(90deg, #10b981, #3b82f6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Árbol Estratégico
      </h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
        Despliegue jerárquico de Ejes y Objetivos Institucionales
      </p>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "40px",
        position: "relative"
      }}>
        {/* Línea conectora central vertical (detrás) */}
        <div style={{
          position: "absolute",
          top: "0",
          bottom: "0",
          left: "24px",
          width: "2px",
          background: "linear-gradient(to bottom, rgba(59,130,246,0.5), rgba(16,185,129,0.5))",
          zIndex: 0
        }} />

        {data.map((eje, idx) => (
          <div key={eje.id} style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            {/* Nodo Eje (Padre) */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px"
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
                color: "white",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
                flexShrink: 0,
                zIndex: 2
              }}>
                {idx + 1}
              </div>
              
              <div style={{
                background: "linear-gradient(145deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: "12px",
                padding: "16px 24px",
                flex: 1,
                boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                position: "relative"
              }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "1.2rem", color: "#60a5fa", fontWeight: 700 }}>
                  {eje.name}
                </h3>
                {eje.description && (
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    {eje.description}
                  </p>
                )}
              </div>
            </div>

            {/* Nodos Objetivos (Hijos) */}
            {eje.objetivos && eje.objetivos.length > 0 && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "16px",
                paddingLeft: "68px"
              }}>
                {eje.objetivos.map((obj, oIdx) => (
                  <div key={obj.id} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderLeft: "4px solid #10b981",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    transition: "transform 0.2s ease, background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.transform = "translateX(5px)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  }}
                  >
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(16,185,129,0.2)",
                      color: "#34d399",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      flexShrink: 0
                    }}>
                      {idx + 1}.{oIdx + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {obj.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
