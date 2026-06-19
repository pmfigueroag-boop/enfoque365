"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicOKR from "./InfographicOKR";

interface KeyResult {
  id: number;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string | null;
  objetivo_id: number;
  tenant_id: number;
}

interface Objetivo {
  id: number;
  description: string;
  eje_id: number;
}

interface Eje {
  id: number;
  name: string;
  perspectiva_bsc: string;
  objetivos: Objetivo[];
}

export default function KeyResultsPage() {
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [tree, setTree] = useState<Eje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formUnit, setFormUnit] = useState("porcentaje");
  const [formObjetivoId, setFormObjetivoId] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  // Edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Delete
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // IA
  const [runningIA, setRunningIA] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");
  
  const toast = (msg: string, type: "success" | "error" = "success") => {
    // Basic toast fallback if no global toast is used
    alert(msg);
  };

  const loadData = async () => {
    try {
      const [krs, ejes] = await Promise.all([
        api.getKeyResults().catch(() => []),
        api.getArbol().catch(() => []),
      ]);
      setKeyResults(krs);
      setTree(ejes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const allObjetivos = tree.flatMap((e) =>
    (e.objetivos || []).map((o) => ({
      ...o,
      ejeName: e.name,
      perspectiva: e.perspectiva_bsc,
    }))
  );

  const getObjetivoLabel = (objId: number) => {
    const obj = allObjetivos.find((o) => o.id === objId);
    if (!obj) return `Objetivo #${objId}`;
    const short = obj.description.length > 60 ? obj.description.slice(0, 57) + "..." : obj.description;
    return short;
  };

  const getEjeForObjetivo = (objId: number) => {
    const obj = allObjetivos.find((o) => o.id === objId);
    return obj?.ejeName || "--";
  };

  const handleCreate = async () => {
    if (!formTitle.trim() || !formTarget || !formObjetivoId) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createKeyResult({
        title: formTitle.trim(),
        target_value: parseFloat(formTarget),
        unit: formUnit,
        objetivo_id: formObjetivoId,
      });
      setFormTitle(""); setFormTarget(""); setFormUnit("porcentaje"); setFormObjetivoId(0);
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      setError("Error al crear: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editValue) return;
    try {
      await api.updateKeyResult(id, parseFloat(editValue));
      setEditId(null);
      setEditValue("");
      await loadData();
    } catch (err: any) {
      setError("Error al actualizar: " + (err.message || "Error desconocido"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteKeyResult(id);
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      setError("Error al eliminar: " + (err.message || "Error desconocido"));
      setDeleteConfirmId(null);
    }
  };

  const handleRunIA = async () => {
    setRunningIA(true);
    setError(null);
    try {
      const res = await api.iaKeyResults();
      toast(`Se enviaron ${res.length} sugerencias de OKRs al Inbox IA para tu revision.`, "success");
    } catch (err: any) {
      setError("Error al ejecutar IA: " + (err.message || "Error desconocido"));
    } finally {
      setRunningIA(false);
    }
  };

  const getProgress = (kr: KeyResult) => {
    if (!kr.target_value) return 0;
    return Math.min(100, Math.round((kr.current_value / kr.target_value) * 100));
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return "var(--success)";
    if (pct >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Resultados Clave (OKR)</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)", fontSize: "0.85rem",
    fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <>
      <header className="header">
        <h2 className="header-title">Resultados Clave (OKR)</h2>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            background: "var(--bg-secondary)",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid var(--border-color)"
          }}>
            <button
              onClick={() => setViewMode("gestion")}
              style={{
                background: viewMode === "gestion" ? "var(--bg-tertiary)" : "transparent",
                color: viewMode === "gestion" ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: viewMode === "gestion" ? 600 : 400,
                transition: "all 0.2s ease"
              }}
            >
              Datos
            </button>
            <button
              onClick={() => setViewMode("infografia")}
              style={{
                background: viewMode === "infografia" ? "var(--bg-tertiary)" : "transparent",
                color: viewMode === "infografia" ? "var(--text-primary)" : "var(--text-muted)",
                border: "none",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: viewMode === "infografia" ? 600 : 400,
                transition: "all 0.2s ease"
              }}
            >
              Infografía
            </button>
          </div>
          {viewMode === "gestion" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn btn-secondary"
                onClick={handleRunIA}
                disabled={runningIA}
                style={{ fontSize: "0.82rem", background: "rgba(139, 92, 246, 0.15)", color: "#c4b5fd", border: "1px solid rgba(139, 92, 246, 0.3)" }}
              >
                {runningIA ? "Analizando..." : "✨ Analisis IA"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
                style={{ fontSize: "0.82rem" }}
              >
                {showForm ? "Cancelar" : "Nuevo Key Result"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicOKR data={keyResults} objetivos={allObjetivos} />
        ) : (
          <>
        {/* Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
              <h3 className="card-title">Crear Key Result</h3>
            </div>
            <div style={{ padding: "16px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Titulo del Key Result
                  </label>
                  <input
                    type="text" value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Incrementar ingresos por servicios en 25%"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Objetivo Estrategico
                  </label>
                  <select
                    value={formObjetivoId}
                    onChange={(e) => setFormObjetivoId(Number(e.target.value))}
                    style={inputStyle}
                  >
                    <option value={0}>-- Seleccionar objetivo --</option>
                    {tree.map((eje) => (
                      <optgroup key={eje.id} label={eje.name}>
                        {(eje.objetivos || []).map((obj) => (
                          <option key={obj.id} value={obj.id}>
                            {obj.description.length > 70 ? obj.description.slice(0, 67) + "..." : obj.description}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Meta (valor numerico)
                  </label>
                  <input
                    type="number" value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    placeholder="100"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Unidad de medida
                  </label>
                  <select value={formUnit} onChange={(e) => setFormUnit(e.target.value)} style={inputStyle}>
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="cantidad">Cantidad</option>
                    <option value="indice">Indice</option>
                    <option value="monto">Monto (RD$)</option>
                    <option value="dias">Dias</option>
                    <option value="horas">Horas</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleCreate}
                  disabled={saving || !formTitle.trim() || !formTarget || !formObjetivoId}
                >
                  {saving ? "Guardando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: "16px", padding: "10px 14px", borderRadius: "var(--radius-sm)",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "var(--danger)", fontSize: "0.83rem",
          }}>
            {error}
          </div>
        )}

        {/* Key Results List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Key Results</h3>
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "2px 10px",
              borderRadius: "999px", background: "rgba(99,102,241,0.12)", color: "var(--primary-500)",
            }}>
              {keyResults.length} resultado{keyResults.length !== 1 ? "s" : ""}
            </span>
          </div>

          {keyResults.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "16px 0" }}>
              No hay Key Results definidos. Crea el primero para medir el avance de los objetivos estrategicos.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
              {keyResults.map((kr) => {
                const pct = getProgress(kr);
                const color = getProgressColor(pct);
                return (
                  <div
                    key={kr.id}
                    style={{
                      padding: "16px", borderRadius: "var(--radius-sm)",
                      background: "var(--bg-tertiary)", border: "1px solid var(--border-color)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary-500)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600 }}>{kr.title}</h4>
                        <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {getEjeForObjetivo(kr.objetivo_id)} &gt; {getObjetivoLabel(kr.objetivo_id)}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                        <span style={{
                          fontSize: "1.1rem", fontWeight: 800, color,
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      height: "6px", borderRadius: "999px",
                      background: "rgba(255,255,255,0.06)", marginBottom: "10px", overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%", borderRadius: "999px",
                        width: `${pct}%`, background: color,
                        transition: "width 0.4s ease",
                      }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        <span>Actual: <strong style={{ color: "var(--text-primary)" }}>{kr.current_value}</strong></span>
                        <span>Meta: <strong style={{ color: "var(--text-primary)" }}>{kr.target_value}</strong></span>
                        <span>Unidad: <strong style={{ color: "var(--text-primary)" }}>{kr.unit}</strong></span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        {/* Update value */}
                        {editId === kr.id ? (
                          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                            <input
                              type="number" value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              style={{ ...inputStyle, width: "80px", padding: "4px 8px", fontSize: "0.78rem" }}
                              autoFocus
                              onKeyDown={(e) => e.key === "Enter" && handleUpdate(kr.id)}
                            />
                            <button
                              onClick={() => handleUpdate(kr.id)}
                              style={{
                                background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                                color: "var(--success)", cursor: "pointer", fontSize: "0.72rem",
                                fontWeight: 600, padding: "4px 8px", borderRadius: "var(--radius-sm)",
                                fontFamily: "inherit",
                              }}
                            >OK</button>
                            <button
                              onClick={() => { setEditId(null); setEditValue(""); }}
                              className="btn btn-ghost" style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                            >No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditId(kr.id); setEditValue(String(kr.current_value)); }}
                            style={{
                              background: "none", border: "1px solid var(--border-color)",
                              color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.72rem",
                              fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)",
                              fontFamily: "inherit", transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary-500)"; e.currentTarget.style.color = "var(--primary-400)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-color)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                          >Actualizar</button>
                        )}

                        {/* Delete */}
                        {deleteConfirmId === kr.id ? (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              onClick={() => handleDelete(kr.id)}
                              style={{
                                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                                color: "var(--danger)", cursor: "pointer", fontSize: "0.72rem",
                                fontWeight: 600, padding: "4px 8px", borderRadius: "var(--radius-sm)",
                                fontFamily: "inherit",
                              }}
                            >Confirmar</button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="btn btn-ghost" style={{ fontSize: "0.72rem", padding: "4px 8px" }}
                            >No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(kr.id)}
                            style={{
                              background: "none", border: "none", color: "var(--text-muted)",
                              cursor: "pointer", fontSize: "0.78rem", padding: "2px 6px",
                              transition: "color 0.15s",
                            }}
                            title="Eliminar"
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          >X</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </>
  );
}
