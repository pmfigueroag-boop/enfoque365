"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState, useRef } from "react";
import { api } from "../../lib/api";
import InfographicFoda from "./InfographicFoda";

const FODA_QUADRANTS = [
  { value: "fortaleza", label: "Fortaleza", color: "var(--fortaleza, #10b981)" },
  { value: "oportunidad", label: "Oportunidad", color: "var(--oportunidad, #3b82f6)" },
  { value: "debilidad", label: "Debilidad", color: "var(--debilidad, #f59e0b)" },
  { value: "amenaza", label: "Amenaza", color: "var(--amenaza, #ef4444)" },
];

const QUADRANT_LABELS: Record<string, string> = {
  fortaleza: "Fortalezas",
  oportunidad: "Oportunidades",
  debilidad: "Debilidades",
  amenaza: "Amenazas",
};

const SOURCE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  pestel: { label: "PESTEL", bg: "rgba(99,102,241,0.15)", color: "#6366f1" },
  porter: { label: "PORTER", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  vrio: { label: "VRIO", bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  "7s": { label: "7S", bg: "rgba(139,92,246,0.15)", color: "#8b5cf6" },
  bcg: { label: "BCG", bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  manual: { label: "Manual", bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
};

export default function FodaPage() {
  const { toast } = useToast();
  const [foda, setFoda] = useState<any[]>([]);
  const [showFodaForm, setShowFodaForm] = useState(false);
  const [newFoda, setNewFoda] = useState({ quadrant: "fortaleza", description: "", priority: 1 });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  // Delete flow state
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  // Drag & drop state
  const [dragItemId, setDragItemId] = useState<number | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);

  // Fallback "Mover a..." dropdown state
  const [moveDropdownId, setMoveDropdownId] = useState<number | null>(null);
  const moveDropdownRef = useRef<HTMLDivElement | null>(null);

  const loadData = async () => {
    const f = await api.getFoda().catch(() => []);
    setFoda(f);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Close move dropdown when clicking outside
  useEffect(() => {
    if (moveDropdownId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moveDropdownRef.current && !moveDropdownRef.current.contains(e.target as Node)) {
        setMoveDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moveDropdownId]);

  const handleCreateFoda = async () => {
    if (!newFoda.description.trim()) return;
    await api.createFoda(newFoda);
    setNewFoda({ quadrant: "fortaleza", description: "", priority: 1 });
    setShowFodaForm(false);
    loadData();
  };

  // Step 1: User clicks X → set target, attempt delete
  const handleDeleteFoda = async (id: number) => {
    setDeleteTarget(id);
    try {
      await api.deleteFoda(id);
      toast.success("Elemento FODA eliminado.");
      loadData();
      setDeleteTarget(null);
    } catch (e: any) {
      if (e?.status === 409 || e?.message?.includes("CRITICO")) {
        // Need justification → show modal
        setShowJustifyModal(true);
      } else {
        toast.error("Error al eliminar: " + (e?.message || "Error desconocido"));
        setDeleteTarget(null);
      }
    }
  };

  // Step 2: User submits justification from modal
  const handleConfirmJustifiedDelete = async () => {
    if (!deleteTarget || justification.trim().length < 10) return;
    try {
      await api.deleteFoda(deleteTarget, justification.trim());
      toast.success("Eliminado con justificación registrada en auditoría.");
      loadData();
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "No se pudo eliminar."));
    } finally {
      setShowJustifyModal(false);
      setDeleteTarget(null);
      setJustification("");
    }
  };

  const handleCancelDelete = () => {
    setShowJustifyModal(false);
    setDeleteTarget(null);
    setJustification("");
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaFoda();
      toast.success("Sintesis FODA ejecutada. Las propuestas se enviaron al Inbox IA para su revision.");
    } catch (e: any) {
      const msg = e?.message || "Error desconocido";
      if (msg.includes("No hay datos") || msg.includes("no generaron")) {
        toast.info(msg + " Complete primero los analisis PESTEL, Porter, VRIO, 7S o BCG.");
      } else {
        toast.error("Error: " + msg);
      }
    } finally {
      setIaLoading(false);
    }
  };

  // ── Move logic (shared by DnD and fallback) ──
  const handleMoveItem = async (itemId: number, newQuadrant: string) => {
    const item = foda.find((f) => f.id === itemId);
    if (!item || item.quadrant === newQuadrant) return;

    const originalQuadrant = item.quadrant;
    const destLabel = QUADRANT_LABELS[newQuadrant] || newQuadrant;

    // Optimistic update
    setFoda((prev) =>
      prev.map((f) => (f.id === itemId ? { ...f, quadrant: newQuadrant } : f))
    );

    try {
      await api.moveFoda(itemId, newQuadrant);
      toast.action(`Movido a ${destLabel}`, {
        label: "Deshacer",
        onClick: async () => {
          // Revert optimistically
          setFoda((prev) =>
            prev.map((f) => (f.id === itemId ? { ...f, quadrant: originalQuadrant } : f))
          );
          try {
            await api.moveFoda(itemId, originalQuadrant);
            toast.success("Movimiento deshecho.");
          } catch {
            // Re-fetch on undo failure
            loadData();
            toast.error("Error al deshacer. Datos recargados.");
          }
        },
      });
    } catch (e: any) {
      // Revert on failure
      setFoda((prev) =>
        prev.map((f) => (f.id === itemId ? { ...f, quadrant: originalQuadrant } : f))
      );
      toast.error("Error al mover: " + (e?.message || "Error desconocido"));
    }
  };

  // ── HTML5 Drag & Drop handlers ──
  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    setDragItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(itemId));
    // Make the dragged element semi-transparent
    if (e.currentTarget instanceof HTMLElement) {
      setTimeout(() => {
        (e.currentTarget as HTMLElement).style.opacity = "0.4";
      }, 0);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragItemId(null);
    setDragOverQuadrant(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: React.DragEvent, quadrantValue: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Only highlight if it's a different quadrant from the dragged item's
    const draggedItem = foda.find((f) => f.id === dragItemId);
    if (draggedItem && draggedItem.quadrant !== quadrantValue) {
      setDragOverQuadrant(quadrantValue);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the quadrant container (not entering a child)
    const related = e.relatedTarget as Node | null;
    if (e.currentTarget instanceof HTMLElement && !e.currentTarget.contains(related)) {
      setDragOverQuadrant(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetQuadrant: string) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    const itemId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (!isNaN(itemId)) {
      handleMoveItem(itemId, targetQuadrant);
    }
    setDragItemId(null);
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Sintesis Estrategica - FODA</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h2 className="header-title">Sintesis Estrategica - FODA</h2>
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
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={() => setShowFodaForm(!showFodaForm)} style={{ fontSize: "0.85rem" }}>
                + Nuevo Elemento
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Sintetizando..." : "Sintetizar desde Analisis"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {/* Info banner */}
        <div style={{
          padding: "12px 16px",
          marginBottom: "20px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}>
          <strong>FODA es la sintesis.</strong> Usa "Sintetizar desde Analisis" para derivar automaticamente
          Fortalezas, Oportunidades, Debilidades y Amenazas desde PESTEL, Porter, VRIO, 7S y BCG.
          Las propuestas iran al <strong>Inbox IA</strong> para tu aprobacion.
          <span style={{ display: "block", marginTop: "6px", color: "var(--text-muted)", fontSize: "0.75rem" }}>
            💡 Arrastra elementos entre cuadrantes para reclasificarlos, o usa el botón ↔ en cada elemento.
          </span>
        </div>

        {showFodaForm && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Agregar Elemento FODA (Manual)</h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Cuadrante</label>
              <select
                value={newFoda.quadrant}
                onChange={(e) => setNewFoda({ ...newFoda, quadrant: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                {FODA_QUADRANTS.map((q) => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={newFoda.description}
              onChange={(e) => setNewFoda({ ...newFoda, description: e.target.value })}
              placeholder="Descripcion del elemento FODA..."
              rows={2}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreateFoda}>Guardar</button>
              <button className="btn btn-ghost" onClick={() => setShowFodaForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
        
        {viewMode === "infografia" ? (
          <InfographicFoda data={foda} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>
          {FODA_QUADRANTS.map((q) => {
            const items = foda.filter((f: any) => f.quadrant === q.value);
            const isDropTarget = dragOverQuadrant === q.value;
            const draggedItem = foda.find((f) => f.id === dragItemId);
            const isSameQuadrant = draggedItem?.quadrant === q.value;
            return (
              <div
                key={q.value}
                className="card"
                onDragOver={(e) => handleDragOver(e, q.value)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, q.value)}
                style={{
                  padding: "0",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  border: isDropTarget && !isSameQuadrant
                    ? `2px dashed ${q.color}`
                    : "1px solid var(--border-color)",
                  boxShadow: isDropTarget && !isSameQuadrant
                    ? `0 0 20px ${q.color}33, inset 0 0 30px ${q.color}08`
                    : undefined,
                }}
              >
                <div style={{
                  padding: "14px 20px",
                  borderBottom: `3px solid ${q.color}`,
                  background: "var(--bg-secondary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: q.color, margin: 0 }}>
                    {q.label}s
                  </h3>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: `${q.color}22`,
                    color: q.color,
                  }}>
                    {items.length}
                  </span>
                </div>
                <div style={{ padding: "16px", minHeight: "60px" }}>
                  {/* Drop hint when dragging over empty quadrant */}
                  {isDropTarget && !isSameQuadrant && items.length === 0 && (
                    <p style={{
                      fontSize: "0.8rem",
                      color: q.color,
                      fontStyle: "italic",
                      textAlign: "center",
                      padding: "12px 0",
                      opacity: 0.7,
                    }}>
                      Soltar aquí para mover a {q.label}
                    </p>
                  )}
                  {items.length === 0 && !isDropTarget ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Sin elementos. Ejecute la sintesis IA o agregue manualmente.
                    </p>
                  ) : (
                    items.map((f: any) => {
                      const src = SOURCE_BADGES[f.source_tool || "manual"] || SOURCE_BADGES["manual"];
                      const isDragging = dragItemId === f.id;
                      return (
                        <div
                          key={f.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, f.id)}
                          onDragEnd={handleDragEnd}
                          style={{
                            padding: "10px 12px",
                            marginBottom: "8px",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--bg-tertiary)",
                            borderLeft: `3px solid ${q.color}`,
                            wordBreak: "break-word",
                            cursor: "grab",
                            opacity: isDragging ? 0.4 : 1,
                            transition: "opacity 0.15s ease, transform 0.15s ease",
                            position: "relative",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              {/* Drag handle indicator */}
                              <span style={{
                                color: "var(--text-muted)",
                                fontSize: "0.7rem",
                                cursor: "grab",
                                userSelect: "none",
                                opacity: 0.5,
                                lineHeight: 1,
                              }} title="Arrastrar para mover">
                                ⠿
                              </span>
                              {f.source_tool && (
                                <span style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  padding: "1px 6px",
                                  borderRadius: "999px",
                                  background: src.bg,
                                  color: src.color,
                                  letterSpacing: "0.5px",
                                }}>
                                  {src.label}
                                </span>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              {/* Fallback: "Mover a..." button */}
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMoveDropdownId(moveDropdownId === f.id ? null : f.id);
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    padding: "2px 4px",
                                    borderRadius: "4px",
                                    transition: "color 0.15s ease, background 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.target as HTMLElement).style.color = "var(--text-primary)";
                                    (e.target as HTMLElement).style.background = "var(--bg-secondary)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.color = "var(--text-muted)";
                                    (e.target as HTMLElement).style.background = "none";
                                  }}
                                  title="Mover a otro cuadrante"
                                >
                                  ↔
                                </button>
                                {/* Dropdown */}
                                {moveDropdownId === f.id && (
                                  <div
                                    ref={moveDropdownRef}
                                    style={{
                                      position: "absolute",
                                      top: "100%",
                                      right: 0,
                                      marginTop: "4px",
                                      background: "var(--bg-primary)",
                                      border: "1px solid var(--border-color)",
                                      borderRadius: "8px",
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                                      zIndex: 100,
                                      minWidth: "150px",
                                      overflow: "hidden",
                                      animation: "fadeIn 0.15s ease",
                                    }}
                                  >
                                    <div style={{
                                      padding: "6px 12px",
                                      fontSize: "0.7rem",
                                      fontWeight: 600,
                                      color: "var(--text-muted)",
                                      borderBottom: "1px solid var(--border-color)",
                                      letterSpacing: "0.5px",
                                      textTransform: "uppercase",
                                    }}>
                                      Mover a...
                                    </div>
                                    {FODA_QUADRANTS.filter((qOpt) => qOpt.value !== f.quadrant).map((qOpt) => (
                                      <button
                                        key={qOpt.value}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMoveDropdownId(null);
                                          handleMoveItem(f.id, qOpt.value);
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                          width: "100%",
                                          padding: "8px 12px",
                                          background: "none",
                                          border: "none",
                                          color: "var(--text-primary)",
                                          fontSize: "0.8rem",
                                          fontFamily: "inherit",
                                          cursor: "pointer",
                                          textAlign: "left",
                                          transition: "background 0.1s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                          (e.target as HTMLElement).style.background = `${qOpt.color}11`;
                                        }}
                                        onMouseLeave={(e) => {
                                          (e.target as HTMLElement).style.background = "none";
                                        }}
                                      >
                                        <span style={{
                                          width: "8px",
                                          height: "8px",
                                          borderRadius: "50%",
                                          background: qOpt.color,
                                          flexShrink: 0,
                                        }} />
                                        {qOpt.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteFoda(f.id)}
                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                                title="Eliminar"
                              >
                                X
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: "0.83rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
                            {f.description}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {/* ── Modal: Justificación para borrado de PESTEL Crítico ── */}
        {showJustifyModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}>
            <div className="card" style={{
              padding: "28px", maxWidth: "480px", width: "90%",
              animation: "fadeIn 0.2s ease",
            }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px", color: "var(--warning)" }}>
                ⚠️ Trazabilidad Doctrinal
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
                Este elemento FODA proviene de un factor PESTEL <strong>CRÍTICO</strong>.
                Para eliminarlo, debe proporcionar una justificación documentada (mínimo 10 caracteres).
              </p>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Escriba la justificación aquí..."
                rows={3}
                autoFocus
                style={{
                  width: "100%", padding: "10px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)", fontSize: "0.85rem",
                  fontFamily: "inherit", resize: "vertical", marginBottom: "12px",
                  background: "var(--bg-secondary)", color: "var(--text-primary)",
                }}
              />
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={handleCancelDelete}>
                  Cancelar
                </button>
                <button
                  className="btn"
                  disabled={justification.trim().length < 10}
                  onClick={handleConfirmJustifiedDelete}
                  style={{
                    background: justification.trim().length >= 10
                      ? "var(--danger, #ef4444)" : "var(--text-muted)",
                    color: "#fff", fontWeight: 600,
                    cursor: justification.trim().length >= 10 ? "pointer" : "not-allowed",
                  }}
                >
                  Confirmar Eliminación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
