"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicArbol from "./InfographicArbol";

interface Eje {
  id: number;
  name: string;
  description: string | null;
  objetivos: { id: number; description: string }[];
}

export default function ArbolEstrategicoPage() {
  const { toast } = useToast();
  const [arbol, setArbol] = useState<Eje[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [showNewEje, setShowNewEje] = useState(false);
  const [showNewObj, setShowNewObj] = useState<number | null>(null);
  const [newEje, setNewEje] = useState({ name: "", description: "", perspectiva_bsc: "financiera", peso_ponderado: 0.25 });
  const [newObj, setNewObj] = useState({ description: "", eje_id: 0 });
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadArbol = async () => {
    const data = await api.getArbol().catch(() => []);
    setArbol(data);
    setLoading(false);
  };

  useEffect(() => { loadArbol(); }, []);

  const handleCreateEje = async () => {
    if (!newEje.name.trim()) return;
    await api.createEje(newEje);
    setNewEje({ name: "", description: "", perspectiva_bsc: "financiera", peso_ponderado: 0.25 });
    setShowNewEje(false);
    loadArbol();
  };

  const handleCreateObjetivo = async (ejeId: number) => {
    if (!newObj.description.trim()) return;
    await api.createObjetivo({ description: newObj.description, eje_id: ejeId });
    setNewObj({ description: "", eje_id: 0 });
    setShowNewObj(null);
    loadArbol();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaArbol();
      toast.success("Arbol estrategico generado. Revise el Inbox IA para aprobar ejes y objetivos.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  const handleDeleteEje = async (id: number) => {
    if (!confirm("Eliminar este eje y todos sus objetivos?")) return;
    await api.deleteEje(id);
    loadArbol();
  };

  const handleDeleteObjetivo = async (id: number) => {
    await api.deleteObjetivo(id);
    loadArbol();
  };

  return (
    <>
      <header className="header">
        <h2 className="header-title">Arbol Estrategico (PEI)</h2>
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
              <button className="btn btn-primary" onClick={() => setShowNewEje(!showNewEje)}>
                + Nuevo Eje Estrat&eacute;gico
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Generando..." : "Generar Arbol (IA)"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicArbol data={arbol} />
        ) : (
          <>
        {/* Form: New Eje */}
        {showNewEje && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <h3 className="card-title" style={{ marginBottom: "16px" }}>Crear Eje Estrat&eacute;gico (Perspectiva BSC)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                value={newEje.name}
                onChange={(e) => setNewEje({ ...newEje, name: e.target.value })}
                placeholder="Nombre del Eje (ej: Perspectiva Financiera)"
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                }}
              />
              <textarea
                value={newEje.description}
                onChange={(e) => setNewEje({ ...newEje, description: e.target.value })}
                placeholder="Descripci&oacute;n (opcional)"
                rows={2}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Perspectiva BSC</label>
                  <select
                    value={newEje.perspectiva_bsc}
                    onChange={(e) => setNewEje({ ...newEje, perspectiva_bsc: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit" }}
                  >
                    <option value="financiera">Financiera</option>
                    <option value="clientes">Clientes</option>
                    <option value="procesos">Procesos Internos</option>
                    <option value="aprendizaje">Aprendizaje y Crecimiento</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Peso Ponderado</label>
                  <input
                    type="number" min={0} max={1} step={0.05}
                    value={newEje.peso_ponderado}
                    onChange={(e) => setNewEje({ ...newEje, peso_ponderado: parseFloat(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-primary" onClick={handleCreateEje}>Guardar Eje</button>
                <button className="btn btn-ghost" onClick={() => setShowNewEje(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Tree */}
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando &aacute;rbol estrat&eacute;gico...</p>
        ) : arbol.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "16px", fontWeight: 700, color: "var(--primary-500)" }}>PEI</div>
            <h3 style={{ marginBottom: "8px" }}>&Aacute;rbol vac&iacute;o</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Crea tu primer Eje Estrat&eacute;gico para comenzar a construir la doctrina institucional.
            </p>
          </div>
        ) : (
          <div className="tree-container">
            {arbol.map((eje) => (
              <div key={eje.id} className="tree-eje animate-slide-in">
                <div className="tree-eje-header">

                  <div>
                    <div>{eje.name}</div>
                    {eje.description && (
                      <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "2px" }}>{eje.description}</div>
                    )}
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                      {eje.objetivos?.length || 0} objetivos
                    </span>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "6px 12px", color: "white", borderColor: "rgba(255,255,255,0.2)" }}
                      onClick={() => { setShowNewObj(showNewObj === eje.id ? null : eje.id); setNewObj({ description: "", eje_id: eje.id }); }}
                    >
                      + Objetivo
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: "0.75rem", padding: "6px 12px", color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}
                      onClick={() => handleDeleteEje(eje.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {/* Form: New Objetivo */}
                {showNewObj === eje.id && (
                  <div style={{
                    marginLeft: "32px",
                    marginTop: "8px",
                    padding: "16px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                  }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                      Doctrina FR-200: Este objetivo quedar&aacute; anclado al eje &ldquo;{eje.name}&rdquo;.
                    </p>
                    <textarea
                      value={newObj.description}
                      onChange={(e) => setNewObj({ ...newObj, description: e.target.value })}
                      placeholder="Descripci&oacute;n del objetivo estrat&eacute;gico..."
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-color)",
                        fontSize: "0.85rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                      }}
                    />
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button className="btn btn-success" onClick={() => handleCreateObjetivo(eje.id)}>
                        Guardar Objetivo
                      </button>
                      <button className="btn btn-ghost" onClick={() => setShowNewObj(null)}>Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Objetivos */}
                <div className="tree-objetivos">
                  {(eje.objetivos || []).map((obj) => (
                    <div key={obj.id} className="tree-objetivo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ flex: 1, wordBreak: "break-word", lineHeight: 1.5 }}>{obj.description}</span>
                      <button
                        onClick={() => handleDeleteObjetivo(obj.id)}
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px", flexShrink: 0 }}
                        title="Eliminar objetivo"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
