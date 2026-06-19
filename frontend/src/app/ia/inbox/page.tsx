"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState, useMemo } from "react";
import { api } from "../../lib/api";

interface Proposal {
  id: number;
  ooda_phase: string;
  target_entity: string;
  proposed_payload: string;
  ai_reasoning: string | null;
  status: string;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

// ── Entity config: colors, icons, labels, field renderers ──
const ENTITY_CONFIG: Record<string, {
  label: string;
  icon: string;
  color: string;
  bgAlpha: string;
  borderAlpha: string;
}> = {
  pestel_factor: { label: "PESTEL", icon: "🌍", color: "#3b82f6", bgAlpha: "0.08", borderAlpha: "0.25" },
  porter_force:  { label: "Porter",  icon: "⚔️", color: "#ef4444", bgAlpha: "0.08", borderAlpha: "0.25" },
  foda_item:     { label: "FODA",    icon: "🎯", color: "#8b5cf6", bgAlpha: "0.08", borderAlpha: "0.25" },
  vrio_resource: { label: "VRIO",    icon: "💎", color: "#10b981", bgAlpha: "0.08", borderAlpha: "0.25" },
  mckinsey_7s_element: { label: "McKinsey 7S", icon: "🔧", color: "#f59e0b", bgAlpha: "0.08", borderAlpha: "0.25" },
  bcg_unit:      { label: "BCG",     icon: "📊", color: "#ec4899", bgAlpha: "0.08", borderAlpha: "0.25" },
  tows_strategy: { label: "TOWS",    icon: "🧭", color: "#06b6d4", bgAlpha: "0.08", borderAlpha: "0.25" },
  p2w_choice:    { label: "P2W",     icon: "🏆", color: "#84cc16", bgAlpha: "0.08", borderAlpha: "0.25" },
  kernel_component: { label: "Kernel", icon: "🧬", color: "#a855f7", bgAlpha: "0.08", borderAlpha: "0.25" },
  blue_ocean_action: { label: "Blue Ocean", icon: "🌊", color: "#0ea5e9", bgAlpha: "0.08", borderAlpha: "0.25" },
  identidad_mision: { label: "Misión", icon: "🚀", color: "#6366f1", bgAlpha: "0.08", borderAlpha: "0.25" },
  identidad_vision: { label: "Visión", icon: "🔭", color: "#8b5cf6", bgAlpha: "0.08", borderAlpha: "0.25" },
  identidad_valor: { label: "Valor Institucional", icon: "💎", color: "#14b8a6", bgAlpha: "0.08", borderAlpha: "0.25" },
  indicador_kpi: { label: "Indicador KPI", icon: "📈", color: "#f59e0b", bgAlpha: "0.08", borderAlpha: "0.25" },
  eje_estrategico: { label: "Eje Estratégico", icon: "🌳", color: "#10b981", bgAlpha: "0.08", borderAlpha: "0.25" },
  objetivo_estrategico: { label: "Objetivo", icon: "🎯", color: "#3b82f6", bgAlpha: "0.08", borderAlpha: "0.25" },
  key_result: { label: "OKR - Resultado Clave", icon: "🚩", color: "#f43f5e", bgAlpha: "0.08", borderAlpha: "0.25" },
};

const PESTEL_CAT_COLORS: Record<string, string> = {
  politico: "#818cf8", economico: "#34d399", social: "#f472b6",
  tecnologico: "#60a5fa", ecologico: "#a78bfa", legal: "#fbbf24",
};

const PORTER_FORCE_LABELS: Record<string, string> = {
  rivalidad: "Rivalidad", nuevos_entrantes: "Nuevos Entrantes",
  sustitutos: "Sustitutos", poder_proveedores: "Poder Proveedores",
  poder_clientes: "Poder Clientes",
};

const FODA_QUADRANT_LABELS: Record<string, { label: string; color: string }> = {
  fortaleza: { label: "Fortaleza", color: "#10b981" },
  oportunidad: { label: "Oportunidad", color: "#3b82f6" },
  debilidad: { label: "Debilidad", color: "#f59e0b" },
  amenaza: { label: "Amenaza", color: "#ef4444" },
};

function getRiskColor(score: number): string {
  if (score >= 49) return "#ef4444";
  if (score >= 25) return "#f59e0b";
  return "#22c55e";
}

function getRiskLabel(score: number): string {
  if (score >= 49) return "CRITICO";
  if (score >= 25) return "MONITOREO";
  return "BAJO";
}

function getPressureColor(score: number): string {
  if (score >= 16) return "#ef4444";
  if (score >= 9) return "#f59e0b";
  return "#22c55e";
}

function getPressureLabel(score: number): string {
  if (score >= 16) return "CRITICO";
  if (score >= 9) return "MODERADO";
  return "BAJO";
}

// ── Payload detail renderers per entity type ──
function renderPayloadDetails(entity: string, payload: any) {
  switch (entity) {
    case "pestel_factor": {
      const prob = payload.probability;
      const imp = payload.impact_level;
      const score = prob && imp ? prob * imp : null;
      const cat = payload.category || "";
      const catColor = PESTEL_CAT_COLORS[cat] || "#888";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            {cat && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
                borderRadius: "var(--radius-sm)", textTransform: "uppercase",
                background: `${catColor}22`, color: catColor, border: `1px solid ${catColor}44`,
              }}>
                {cat}
              </span>
            )}
            {score !== null && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                background: `${getRiskColor(score)}18`, color: getRiskColor(score),
                border: `1px solid ${getRiskColor(score)}44`,
              }}>
                P={prob} × I={imp} = {score} · {getRiskLabel(score)}
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {payload.description}
          </p>
          {payload.ai_rationale && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              💡 {payload.ai_rationale}
            </p>
          )}
        </div>
      );
    }

    case "porter_force": {
      const intensity = payload.intensity || 0;
      const probability = payload.probability || 0;
      const pressure = intensity * probability;
      const forceLabel = PORTER_FORCE_LABELS[payload.force_type] || payload.force_type;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(239,68,68,0.1)", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.3)",
            }}>
              {forceLabel}
            </span>
            {payload.canonical_subfactor && (
              <span style={{
                fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(99,102,241,0.1)", color: "var(--primary-400)",
              }}>
                {payload.canonical_subfactor}
              </span>
            )}
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: `${getPressureColor(pressure)}18`, color: getPressureColor(pressure),
              border: `1px solid ${getPressureColor(pressure)}44`,
            }}>
              I={intensity} × P={probability} = {pressure}/25 · {getPressureLabel(pressure)}
            </span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {payload.description}
          </p>
          {payload.ai_rationale && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              💡 {payload.ai_rationale}
            </p>
          )}
        </div>
      );
    }

    case "foda_item": {
      const q = FODA_QUADRANT_LABELS[payload.quadrant] || { label: payload.quadrant, color: "#888" };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", width: "fit-content",
            borderRadius: "var(--radius-sm)", textTransform: "uppercase",
            background: `${q.color}18`, color: q.color, border: `1px solid ${q.color}44`,
          }}>
            {q.label}
          </span>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {payload.description}
          </p>
          {payload.source_tool && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Fuente: {payload.source_tool}
            </span>
          )}
        </div>
      );
    }

    case "vrio_resource": {
      const checks = [
        { key: "valuable", label: "V", title: "Valioso" },
        { key: "rare", label: "R", title: "Raro" },
        { key: "inimitable", label: "I", title: "Inimitable" },
        { key: "organized", label: "O", title: "Organizado" },
      ];
      const trueCount = checks.filter(c => payload[c.key]).length;
      const implication = payload.competitive_implication || (
        trueCount === 4 ? "Ventaja competitiva sostenible" :
        trueCount === 3 ? "Ventaja competitiva temporal" :
        trueCount >= 1 ? "Paridad competitiva" : "Desventaja competitiva"
      );
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {checks.map((c) => (
              <span key={c.key} title={c.title} style={{
                width: "28px", height: "28px", display: "inline-flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 800,
                borderRadius: "6px",
                background: payload[c.key] ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
                color: payload[c.key] ? "#10b981" : "#ef4444",
                border: `1px solid ${payload[c.key] ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`,
              }}>
                {c.label}
              </span>
            ))}
            <span style={{
              fontSize: "0.72rem", fontWeight: 600, marginLeft: "6px",
              color: trueCount === 4 ? "#10b981" : trueCount === 3 ? "#f59e0b" : "#ef4444",
            }}>
              {implication}
            </span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            <strong>{payload.resource_name}</strong>
            {payload.description && <> — {payload.description}</>}
          </p>
        </div>
      );
    }

    case "mckinsey_7s_element": {
      const score = payload.alignment_score || 0;
      const etype = payload.element_type || "";
      const LABELS: Record<string, string> = {
        strategy: "Estrategia", structure: "Estructura", systems: "Sistemas",
        shared_values: "Valores Compartidos", style: "Estilo", staff: "Personal", skills: "Habilidades",
      };
      const HARD_S = ["strategy", "structure", "systems"];
      const isHard = HARD_S.includes(etype);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(245,158,11,0.1)", color: "#f59e0b",
            }}>
              {LABELS[etype] || etype.replace(/_/g, " ").toUpperCase()}
            </span>
            <span style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "2px 6px",
              borderRadius: "3px",
              background: isHard ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)",
              color: isHard ? "#3b82f6" : "#a855f7",
            }}>
              {isHard ? "Hard S" : "Soft S"}
            </span>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: score >= 4 ? "rgba(16,185,129,0.12)" : score >= 3 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
              color: score >= 4 ? "#10b981" : score >= 3 ? "#f59e0b" : "#ef4444",
            }}>
              Alineacion: {score}/5
            </span>
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {payload.description}
          </p>
          {payload.observations && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              🔗 {payload.observations}
            </p>
          )}
        </div>
      );
    }

    case "bcg_unit": {
      const qLabels: Record<string, { label: string; icon: string; color: string }> = {
        star:          { label: "Estrella",      icon: "⭐", color: "#f59e0b" },
        cash_cow:      { label: "Vaca Lechera",  icon: "🐄", color: "#10b981" },
        question_mark: { label: "Interrogación", icon: "❓", color: "#3b82f6" },
        dog:           { label: "Perro",          icon: "🐕", color: "#ef4444" },
      };
      const q = qLabels[payload.quadrant] || { label: payload.quadrant, icon: "📊", color: "#888" };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: `${q.color}18`, color: q.color,
              border: `1px solid ${q.color}44`,
            }}>
              {q.icon} {q.label}
            </span>
            {payload.market_growth != null && (
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Crec: {payload.market_growth}/5 · Part: {payload.market_share}/5
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            <strong>{payload.unit_name}</strong>
            {payload.description && <> — {payload.description}</>}
          </p>
          {payload.strategic_recommendation && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              📋 {payload.strategic_recommendation}
            </p>
          )}
        </div>
      );
    }

    case "identidad_mision":
    case "identidad_vision": {
      const text = entity === "identidad_mision" ? payload.mision : payload.vision;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.5, fontStyle: "italic" }}>
            "{text}"
          </p>
        </div>
      );
    }

    case "identidad_valor": {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>
            {payload.nombre}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {payload.descripcion}
          </p>
        </div>
      );
    }

    case "indicador_kpi": {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>
            {payload.nombre}
          </p>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>🎯 Meta: {payload.meta} {payload.unidad}</span>
            <span style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>📅 Frec: {payload.frecuencia}</span>
            <span style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>📈 Tend: {payload.tendencia}</span>
          </div>
        </div>
      );
    }

    case "key_result": {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>
            {payload.title}
          </p>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <span style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>🎯 Meta: {payload.target_value} {payload.unit}</span>
            {payload.objetivo_id && (
              <span style={{ background: "rgba(0,0,0,0.05)", padding: "2px 6px", borderRadius: "4px" }}>📍 Objetivo ID: {payload.objetivo_id}</span>
            )}
          </div>
        </div>
      );
    }

    // Default: generic payload renderer for tows, p2w, kernel, blue_ocean, etc.
    default: {
      const SUBTYPE_LABELS: Record<string, string> = {
        // TOWS
        fo: "FO · Ofensiva", fa: "FA · Defensiva", do: "DO · Reorientación", da: "DA · Supervivencia",
        // P2W
        winning_aspiration: "Aspiración Ganadora", where_to_play: "Dónde Jugar",
        how_to_win: "Cómo Ganar", core_capabilities: "Capacidades Clave",
        management_systems: "Sistemas de Gestión",
        // Kernel Rumelt
        diagnosis: "Diagnóstico", guiding_policy: "Política Guía",
        coherent_actions: "Acciones Coherentes",
        // Blue Ocean
        eliminate: "Eliminar", reduce: "Reducir", raise: "Incrementar", create: "Crear",
      };
      const desc = payload.description || payload.strategy || payload.factor || payload.resource_name || "";
      const subtype = payload.quadrant || payload.choice_type || payload.component_type || payload.action_type || payload.eje_name || payload.perspectiva_bsc || "";
      const subtypeLabel = SUBTYPE_LABELS[subtype] || subtype.replace(/_/g, " ");
      const title = payload.title || payload.name || payload.factor || "";
      const rationale = payload.rationale || payload.ai_rationale || "";
      const cfg2 = ENTITY_CONFIG[entity] || { color: "#888" };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {subtype && (
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", width: "fit-content",
              borderRadius: "var(--radius-sm)", textTransform: "uppercase",
              background: `${cfg2.color}18`, color: cfg2.color,
              border: `1px solid ${cfg2.color}44`,
            }}>
              {subtypeLabel}
            </span>
          )}
          {title && (
            <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 600, margin: 0 }}>
              {title}
            </p>
          )}
          <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4 }}>
            {desc}
          </p>
          {rationale && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              💡 {rationale}
            </p>
          )}
        </div>
      );
    }
  }
}

export default function IAInboxPage() {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approvedPestelCount, setApprovedPestelCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const loadInbox = async () => {
    setLoading(true);
    const data = await api.getInbox().catch(() => []);
    setProposals(data);
    const pestelData = await api.getPestel().catch(() => []);
    setApprovedPestelCount(pestelData.length);
    setLoading(false);
  };

  useEffect(() => { loadInbox(); }, []);

  // Group proposals by entity type
  const grouped = useMemo(() => {
    const groups: Record<string, Proposal[]> = {};
    for (const p of proposals) {
      if (!groups[p.target_entity]) groups[p.target_entity] = [];
      groups[p.target_entity].push(p);
    }
    return groups;
  }, [proposals]);

  const entityTypes = useMemo(() => Object.keys(grouped), [grouped]);

  const filteredProposals = useMemo(() => {
    if (activeFilter === "all") return proposals;
    return proposals.filter(p => p.target_entity === activeFilter);
  }, [proposals, activeFilter]);

  const handleApprove = async (id: number) => {
    setProcessing(id);
    try {
      await api.approveProposal(id);
      await loadInbox();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setProcessing(rejectId);
    try {
      await api.rejectProposal(rejectId, rejectReason);
      setRejectId(null);
      setRejectReason("");
      await loadInbox();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setProcessing(null);
  };

  const handleAnalyze = async () => {
    setProcessing(-1);
    try {
      await api.analyzeIA();
      await loadInbox();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setProcessing(null);
  };

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearAll = async () => {
    setProcessing(-2);
    try {
      const res = await api.clearInbox();
      toast.success(`Se eliminaron ${res.deleted} propuestas del inbox.`);
      setConfirmClear(false);
      await loadInbox();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setProcessing(null);
  };

  return (
    <>
      <header className="header">
        <h2 className="header-title">Inbox IA - Friccion Intencional (HITL)</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {proposals.length > 0 && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                fontSize: "0.8rem", fontWeight: 600, fontFamily: "inherit",
                padding: "8px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                background: "rgba(239,68,68,0.1)", color: "var(--danger)",
                border: "1px solid rgba(239,68,68,0.25)", transition: "all 0.15s",
              }}
            >
              Limpiar todo
            </button>
          )}
          {confirmClear && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>Eliminar {proposals.length} propuestas?</span>
              <button
                onClick={handleClearAll}
                disabled={processing === -2}
                style={{
                  fontSize: "0.78rem", fontWeight: 700, fontFamily: "inherit",
                  padding: "6px 12px", borderRadius: "var(--radius-sm)", cursor: "pointer",
                  background: "var(--danger)", color: "#fff", border: "none",
                }}
              >
                {processing === -2 ? "Eliminando..." : "Confirmar"}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="btn btn-ghost"
                style={{ fontSize: "0.78rem", padding: "6px 10px" }}
              >
                Cancelar
              </button>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={processing === -1}>
            {processing === -1 ? "Analizando..." : "Ejecutar Agente Analitico"}
          </button>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando propuestas...</p>
        ) : proposals.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 40px" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "16px", fontWeight: 700, color: "var(--success)" }}>OK</div>
            <h3 style={{ marginBottom: "8px", color: "var(--text-primary)" }}>Inbox vac&iacute;o</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              No hay sugerencias de IA pendientes de revisi&oacute;n.
              Ejecuta el Agente Anal&iacute;tico para generar nuevas propuestas.
            </p>
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div style={{
              display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center",
            }}>
              <button
                onClick={() => setActiveFilter("all")}
                style={{
                  fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit",
                  padding: "6px 14px", borderRadius: "999px", cursor: "pointer",
                  border: "1px solid var(--border-color)",
                  background: activeFilter === "all" ? "var(--primary-500)" : "var(--bg-secondary)",
                  color: activeFilter === "all" ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                Todas ({proposals.length})
              </button>
              {entityTypes.map((entity) => {
                const cfg = ENTITY_CONFIG[entity] || { label: entity, icon: "📋", color: "#888" };
                const count = grouped[entity].length;
                const isActive = activeFilter === entity;
                return (
                  <button
                    key={entity}
                    onClick={() => setActiveFilter(entity)}
                    style={{
                      fontSize: "0.78rem", fontWeight: 600, fontFamily: "inherit",
                      padding: "6px 14px", borderRadius: "999px", cursor: "pointer",
                      border: `1px solid ${isActive ? cfg.color : "var(--border-color)"}`,
                      background: isActive ? `${cfg.color}22` : "var(--bg-secondary)",
                      color: isActive ? cfg.color : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            <p style={{ marginBottom: "20px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              <strong>{filteredProposals.length}</strong> sugerencia(s) del Agente Anal&iacute;tico esperan tu revisi&oacute;n.
              Ning&uacute;n dato se guarda en el sistema hasta que apruebes expl&iacute;citamente cada propuesta.
            </p>

            {/* Proposals list */}
            {filteredProposals.map((p) => {
              const payload = JSON.parse(p.proposed_payload);
              const cfg = ENTITY_CONFIG[p.target_entity] || { label: p.target_entity, icon: "📋", color: "#888", bgAlpha: "0.08", borderAlpha: "0.25" };
              const isPestel = p.target_entity === "pestel_factor" || p.target_entity === "pestel";
              return (
                <div
                  key={p.id}
                  className="animate-slide-in"
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid var(--border-color)`,
                    borderRadius: "var(--radius)",
                    padding: "0",
                    marginBottom: "12px",
                    borderLeft: `4px solid ${cfg.color}`,
                    overflow: "hidden",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Card header */}
                  <div style={{
                    padding: "10px 16px",
                    background: `${cfg.color}${cfg.bgAlpha === "0.08" ? "0a" : "12"}`,
                    borderBottom: `1px solid ${cfg.color}${cfg.borderAlpha === "0.25" ? "20" : "30"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1rem" }}>{cfg.icon}</span>
                      <span style={{
                        fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.06em", color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{
                        fontSize: "0.68rem", color: "var(--text-muted)",
                      }}>
                        · Fase OODA: {p.ooda_phase}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "0.68rem", color: "var(--text-muted)",
                    }}>
                      {new Date(p.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  {/* Card body: payload details */}
                  <div style={{ padding: "14px 16px" }}>
                    {renderPayloadDetails(p.target_entity, payload)}
                    {p.ai_reasoning && (
                      <div style={{
                        marginTop: "10px", padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(99,102,241,0.06)",
                        borderLeft: "3px solid rgba(99,102,241,0.3)",
                      }}>
                        <span style={{
                          fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.05em", color: "var(--primary-400)",
                          display: "block", marginBottom: "4px",
                        }}>
                          🧠 Razonamiento IA
                        </span>
                        <p style={{
                          fontSize: "0.78rem", color: "var(--text-secondary)",
                          lineHeight: 1.45, margin: 0,
                        }}>
                          {p.ai_reasoning}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{
                    padding: "10px 16px",
                    borderTop: "1px solid var(--border-color)",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}>
                    {(() => {
                      const isPestelLimitReached = isPestel && approvedPestelCount >= 12;
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <button
                            className="btn btn-success"
                            onClick={() => handleApprove(p.id)}
                            disabled={processing === p.id || isPestelLimitReached}
                            style={{ fontSize: "0.8rem", padding: "6px 16px" }}
                          >
                            {processing === p.id ? "Procesando..." : "✓ Aprobar"}
                          </button>
                          {isPestelLimitReached && (
                            <span style={{ fontSize: "0.7rem", color: "var(--danger)", fontWeight: 600 }}>
                              Limite de 12 factores PESTEL alcanzado.
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <button
                      className="btn btn-danger"
                      onClick={() => { setRejectId(p.id); setRejectReason(""); }}
                      disabled={processing === p.id}
                      style={{ fontSize: "0.8rem", padding: "6px 16px" }}
                    >
                      ✗ Rechazar
                    </button>
                  </div>

                  {/* Reject form */}
                  {rejectId === p.id && (
                    <div style={{
                      padding: "14px 16px",
                      background: "var(--bg-tertiary)",
                      borderTop: "1px solid var(--border-color)",
                    }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                        Motivo de rechazo (requerido para auditor&iacute;a):
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%", padding: "8px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          background: "var(--bg-primary)",
                          color: "var(--text-primary)",
                          fontFamily: "inherit", fontSize: "0.82rem", resize: "vertical",
                        }}
                        placeholder="Explique por que se descarta esta sugerencia..."
                      />
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim()} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
                          Confirmar Rechazo
                        </button>
                        <button className="btn btn-ghost" onClick={() => setRejectId(null)} style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
