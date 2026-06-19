"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";

const ESTADO_COLORS: Record<string, string> = {
  FORMULACION: "#60a5fa",
  APROBADO: "#facc15",
  VIGENTE: "#4ade80",
  EN_REVISION: "#fb923c",
  CERRADO: "#9ca3af",
  ARCHIVADO: "#6b7280",
};

const ESTADO_LABELS: Record<string, string> = {
  FORMULACION: "Formulacion",
  APROBADO: "Aprobado",
  VIGENTE: "Vigente",
  EN_REVISION: "En Revision",
  CERRADO: "Cerrado",
  ARCHIVADO: "Archivado",
};

interface PlanInfo {
  id: number;
  nombre: string;
  estado: string;
}

export default function PlanIndicator() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);

  useEffect(() => {
    api.getPlanVigente()
      .then((p: PlanInfo) => setPlan(p))
      .catch(() => setPlan(null));
  }, []);

  if (!plan) return null;

  const color = ESTADO_COLORS[plan.estado] || "#9ca3af";
  const label = ESTADO_LABELS[plan.estado] || plan.estado;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "6px 14px",
      background: "rgba(255,255,255,0.04)",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.08)",
      fontSize: "13px",
      color: "var(--text-secondary, #a1a1aa)",
    }}>
      <div style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}55`,
      }} />
      <span style={{ color: "var(--text-primary, #e4e4e7)", fontWeight: 500 }}>
        {plan.nombre}
      </span>
      <span style={{
        padding: "2px 8px",
        borderRadius: "4px",
        background: `${color}22`,
        color: color,
        fontSize: "11px",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        {label}
      </span>
    </div>
  );
}
