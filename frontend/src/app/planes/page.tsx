"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../components/Toast";

interface Plan {
  id: number;
  nombre: string;
  descripcion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado: string;
  mision?: string;
  vision?: string;
  created_at?: string;
}

const ESTADO_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  FORMULACION: {
    label: "Formulacion",
    bg: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
  },
  APROBADO: {
    label: "Aprobado",
    bg: "rgba(234, 179, 8, 0.15)",
    color: "#facc15",
  },
  VIGENTE: {
    label: "Vigente",
    bg: "rgba(34, 197, 94, 0.15)",
    color: "#4ade80",
  },
  EN_REVISION: {
    label: "En Revision",
    bg: "rgba(249, 115, 22, 0.15)",
    color: "#fb923c",
  },
  CERRADO: {
    label: "Cerrado",
    bg: "rgba(156, 163, 175, 0.15)",
    color: "#9ca3af",
  },
  ARCHIVADO: {
    label: "Archivado",
    bg: "rgba(107, 114, 128, 0.12)",
    color: "#6b7280",
  },
};

export default function PlanesPage() {
  const { toast } = useToast();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getPlanes().catch(() => []);
      setPlanes(data);
      // Select vigente plan by default if exists
      const vigente = data.find((p: Plan) => p.estado === "VIGENTE");
      if (vigente && !selectedPlan) {
        setSelectedPlan(vigente);
      }
    } catch {
      setPlanes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setFormData({ nombre: "", descripcion: "", fecha_inicio: "", fecha_fin: "" });
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre del plan es requerido.");
      return;
    }
    try {
      if (editingPlan) {
        await api.updatePlan(editingPlan.id, formData);
        toast.success("Plan actualizado correctamente.");
      } else {
        await api.createPlan(formData);
        toast.success("Plan creado correctamente.");
      }
      resetForm();
      loadData();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion || "",
      fecha_inicio: plan.fecha_inicio || "",
      fecha_fin: plan.fecha_fin || "",
    });
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Eliminar el plan "${plan.nombre}"? Esta accion no se puede deshacer.`)) return;
    if (!confirm("Confirmacion final: Se eliminara el plan y todos sus datos asociados. Continuar?")) return;
    try {
      await api.deletePlan(plan.id);
      toast.success("Plan eliminado.");
      if (selectedPlan?.id === plan.id) setSelectedPlan(null);
      loadData();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const handleTransition = async (planId: number, action: string, label: string) => {
    setActionLoading(planId);
    try {
      switch (action) {
        case "aprobar":
          await api.aprobarPlan(planId);
          break;
        case "activar":
          await api.activarPlan(planId);
          break;
        case "revisar":
          await api.revisarPlan(planId);
          break;
        case "cerrar":
          await api.cerrarPlan(planId);
          break;
        case "archivar":
          await api.archivarPlan(planId);
          break;
      }
      toast.success(`Plan: ${label} exitoso.`);
      loadData();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
    setActionLoading(null);
  };

  const getActions = (plan: Plan) => {
    const actions: { label: string; action: string; style: React.CSSProperties }[] = [];

    switch (plan.estado) {
      case "FORMULACION":
        actions.push(
          {
            label: "Editar",
            action: "edit",
            style: { background: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", border: "1px solid rgba(59, 130, 246, 0.25)" },
          },
          {
            label: "Aprobar",
            action: "aprobar",
            style: { background: "rgba(234, 179, 8, 0.12)", color: "#facc15", border: "1px solid rgba(234, 179, 8, 0.25)" },
          },
          {
            label: "Eliminar",
            action: "delete",
            style: { background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)" },
          }
        );
        break;
      case "APROBADO":
        actions.push({
          label: "Activar",
          action: "activar",
          style: { background: "rgba(34, 197, 94, 0.12)", color: "#4ade80", border: "1px solid rgba(34, 197, 94, 0.25)" },
        });
        break;
      case "VIGENTE":
        actions.push({
          label: "Pasar a Revision",
          action: "revisar",
          style: { background: "rgba(249, 115, 22, 0.12)", color: "#fb923c", border: "1px solid rgba(249, 115, 22, 0.25)" },
        });
        break;
      case "EN_REVISION":
        actions.push({
          label: "Cerrar",
          action: "cerrar",
          style: { background: "rgba(156, 163, 175, 0.12)", color: "#9ca3af", border: "1px solid rgba(156, 163, 175, 0.25)" },
        });
        break;
      case "CERRADO":
        actions.push({
          label: "Archivar",
          action: "archivar",
          style: { background: "rgba(107, 114, 128, 0.12)", color: "#6b7280", border: "1px solid rgba(107, 114, 128, 0.25)" },
        });
        break;
    }

    return actions;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "--";
    try {
      return new Date(dateStr).toLocaleDateString("es-DO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <>
        <header className="header">
          <h2 className="header-title">Planes Estrategicos - Ciclo de Vida</h2>
        </header>
        <div className="page-content">
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Planes Estrategicos - Ciclo de Vida</h2>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          + Nuevo Plan
        </button>
      </header>

      <div className="page-content animate-fade-in">
        {/* Lifecycle visual indicator */}
        <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}>
            {Object.entries(ESTADO_BADGES).map(([key, badge], idx) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  background: badge.bg,
                  color: badge.color,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  border: `1px solid ${badge.color}22`,
                }}>
                  {badge.label}
                </div>
                {idx < Object.keys(ESTADO_BADGES).length - 1 && (
                  <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                    {">"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inline form */}
        {showForm && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h3 className="card-title">
                {editingPlan ? `Editar Plan: ${editingPlan.nombre}` : "Nuevo Plan Estrategico"}
              </h3>
            </div>
            <div style={{ padding: "20px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", margin: "0 0 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Nombre del Plan *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Plan Estrategico Institucional 2025-2028"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Descripcion</label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripcion breve del plan..."
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={labelStyle}>Fecha de Inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Fecha de Fin</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-primary" onClick={handleSubmit}>
                  {editingPlan ? "Actualizar Plan" : "Crear Plan"}
                </button>
                <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Plans table */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Planes Registrados</h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {planes.length} plan{planes.length !== 1 ? "es" : ""}
            </span>
          </div>

          {planes.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "16px" }}>
              No hay planes estrategicos. Crea el primero para comenzar.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Nombre", "Estado", "Periodo", "Creado", "Acciones"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planes.map((plan) => {
                    const badge = ESTADO_BADGES[plan.estado] || ESTADO_BADGES.FORMULACION;
                    const actions = getActions(plan);
                    const isSelected = selectedPlan?.id === plan.id;

                    return (
                      <tr
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        style={{
                          cursor: "pointer",
                          background: isSelected ? "rgba(99, 102, 241, 0.06)" : "transparent",
                          transition: "background 0.2s ease",
                          borderBottom: "1px solid var(--border-color)",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                              {plan.nombre}
                            </div>
                            {plan.descripcion && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                {plan.descripcion}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            borderRadius: "999px",
                            background: badge.bg,
                            color: badge.color,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.3px",
                            textTransform: "uppercase",
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {formatDate(plan.fecha_inicio)} - {formatDate(plan.fecha_fin)}
                        </td>
                        <td style={{ ...tdStyle, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {formatDate(plan.created_at)}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                            {actions.map((act) => (
                              <button
                                key={act.action}
                                disabled={actionLoading === plan.id}
                                onClick={() => {
                                  if (act.action === "edit") {
                                    handleEdit(plan);
                                  } else if (act.action === "delete") {
                                    handleDelete(plan);
                                  } else {
                                    handleTransition(plan.id, act.action, act.label);
                                  }
                                }}
                                style={{
                                  ...act.style,
                                  padding: "4px 10px",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  cursor: actionLoading === plan.id ? "wait" : "pointer",
                                  opacity: actionLoading === plan.id ? 0.5 : 1,
                                  fontFamily: "inherit",
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {actionLoading === plan.id ? "..." : act.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected plan detail: mision/vision */}
        {selectedPlan && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h3 className="card-title">
                Detalle: {selectedPlan.nombre}
              </h3>
              <span style={{
                padding: "4px 12px",
                borderRadius: "999px",
                background: (ESTADO_BADGES[selectedPlan.estado] || ESTADO_BADGES.FORMULACION).bg,
                color: (ESTADO_BADGES[selectedPlan.estado] || ESTADO_BADGES.FORMULACION).color,
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}>
                {(ESTADO_BADGES[selectedPlan.estado] || ESTADO_BADGES.FORMULACION).label}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "4px 0" }}>
              <div style={{
                padding: "20px",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
              }}>
                <h4 style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--primary-400)",
                  marginBottom: "10px",
                }}>
                  Mision
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {selectedPlan.mision || "Sin mision definida. Se establecera en la identidad institucional del PEI."}
                </p>
              </div>
              <div style={{
                padding: "20px",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
              }}>
                <h4 style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--primary-400)",
                  marginBottom: "10px",
                }}>
                  Vision
                </h4>
                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {selectedPlan.vision || "Sin vision definida. Se establecera en la identidad institucional del PEI."}
                </p>
              </div>
            </div>

            {selectedPlan.descripcion && (
              <div style={{
                padding: "16px 20px",
                background: "var(--bg-tertiary)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-color)",
                marginTop: "16px",
              }}>
                <h4 style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}>
                  Descripcion
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {selectedPlan.descripcion}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Shared inline styles ──
const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
  color: "var(--text-secondary)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-color)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "var(--text-muted)",
  borderBottom: "1px solid var(--border-color)",
  background: "var(--bg-tertiary)",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  verticalAlign: "middle",
};
