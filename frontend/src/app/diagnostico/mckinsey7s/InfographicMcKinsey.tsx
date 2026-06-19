"use client";

import React from "react";

const MCKINSEY_LAYOUT = [
  { id: "shared_values", label: "Shared Values", type: "center" },
  { id: "strategy", label: "Strategy", type: "hard", angle: 270 },
  { id: "structure", label: "Structure", type: "hard", angle: 330 },
  { id: "systems", label: "Systems", type: "hard", angle: 30 },
  { id: "skills", label: "Skills", type: "soft", angle: 90 },
  { id: "staff", label: "Staff", type: "soft", angle: 150 },
  { id: "style", label: "Style", type: "soft", angle: 210 },
];

export default function InfographicMcKinsey({ data }: { data: any[] }) {
  
  const getItemsForElement = (elId: string) => {
    return data.filter(d => d.element_type === elId);
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
      position: "relative",
      minHeight: "700px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h2 style={{ 
        textAlign: "center", 
        fontSize: "2rem", 
        fontWeight: 800, 
        marginBottom: "2rem",
        background: "linear-gradient(90deg, #3b82f6, #ec4899)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        zIndex: 10
      }}>
        Alineación Institucional (McKinsey 7S)
      </h2>

      <div style={{
        position: "relative",
        width: "600px",
        height: "600px",
        marginTop: "20px"
      }}>
        {/* Conectores SVG */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <g stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none">
            {MCKINSEY_LAYOUT.filter(el => el.type !== "center").map(el => {
              const rad = (el.angle! * Math.PI) / 180;
              const r = 200; // Radio del circulo de posicionamiento
              const cx = 300; // Centro X
              const cy = 300; // Centro Y
              const x = cx + r * Math.cos(rad);
              const y = cy + r * Math.sin(rad);
              return <line key={`line-center-${el.id}`} x1={cx} y1={cy} x2={x} y2={y} />;
            })}
            {/* Conexiones en el anillo perimetral (Hard a Hard, Soft a Soft, etc) */}
            {MCKINSEY_LAYOUT.filter(el => el.type !== "center").map((el, idx, arr) => {
              const nextEl = arr[(idx + 1) % arr.length];
              const rad1 = (el.angle! * Math.PI) / 180;
              const rad2 = (nextEl.angle! * Math.PI) / 180;
              const r = 200;
              const cx = 300, cy = 300;
              return (
                <line 
                  key={`line-peri-${el.id}`} 
                  x1={cx + r * Math.cos(rad1)} 
                  y1={cy + r * Math.sin(rad1)} 
                  x2={cx + r * Math.cos(rad2)} 
                  y2={cy + r * Math.sin(rad2)} 
                  strokeDasharray="4 4"
                />
              );
            })}
          </g>
        </svg>

        {/* Nodos interactivos */}
        {MCKINSEY_LAYOUT.map(el => {
          const isCenter = el.type === "center";
          const isHard = el.type === "hard";
          
          let left = "50%", top = "50%";
          if (!isCenter) {
            const rad = (el.angle! * Math.PI) / 180;
            const r = 200;
            left = `calc(50% + ${r * Math.cos(rad)}px)`;
            top = `calc(50% + ${r * Math.sin(rad)}px)`;
          }

          const baseColor = isCenter ? "#10b981" : (isHard ? "#3b82f6" : "#f97316");
          const items = getItemsForElement(el.id);
          const scoreStr = items.length > 0 ? (items.reduce((acc, curr) => acc + (curr.alignment_score || 0), 0) / items.length).toFixed(1) : "-";

          return (
            <div key={el.id} style={{
              position: "absolute",
              left,
              top,
              transform: "translate(-50%, -50%)",
              width: isCenter ? "160px" : "140px",
              height: isCenter ? "160px" : "140px",
              background: "rgba(30, 41, 59, 0.8)",
              border: `2px solid ${baseColor}`,
              borderRadius: isCenter ? "50%" : "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 20px ${baseColor}30`,
              backdropFilter: "blur(8px)",
              padding: "10px",
              textAlign: "center",
              zIndex: 10,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-50%, -50%) scale(1.1)";
              e.currentTarget.style.boxShadow = `0 0 30px ${baseColor}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translate(-50%, -50%) scale(1)";
              e.currentTarget.style.boxShadow = `0 0 20px ${baseColor}30`;
            }}
            >
              <h4 style={{ margin: "0 0 5px 0", color: baseColor, fontSize: "1rem", fontWeight: 700 }}>
                {el.label}
              </h4>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                Score Promedio: <strong style={{ color: "#fff" }}>{scoreStr}</strong>
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {items.length > 0 ? items[0].description : "Sin datos registrados."}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: "40px", width: "100%", display: "flex", justifyContent: "center", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "50%" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Hard Elements</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", background: "#f97316", borderRadius: "50%" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Soft Elements</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "50%" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Core (Shared Values)</span>
        </div>
      </div>
    </div>
  );
}
