"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicVrio from "./InfographicVrio";

function getCompetitiveImplication(v: boolean, r: boolean, i: boolean, o: boolean): { label: string; color: string; bg: string } {
  if (v && r && i && o) return { label: "Ventaja competitiva sostenible", color: "var(--success)", bg: "rgba(16,185,129,0.15)" };
  if (v && r && i) return { label: "Ventaja temporal (no organizado)", color: "var(--warning)", bg: "rgba(245,158,11,0.15)" };
  if (v && r) return { label: "Ventaja temporal", color: "#f97316", bg: "rgba(249,115,22,0.15)" };
  if (v) return { label: "Paridad competitiva", color: "var(--text-muted)", bg: "rgba(148,163,184,0.15)" };
  return { label: "Desventaja competitiva", color: "var(--danger)", bg: "rgba(239,68,68,0.15)" };
}

const VRIO_CRITERIA = [
  { key: "valuable", letter: "V", label: "Valioso", color: "var(--success)" },
  { key: "rare", letter: "R", label: "Raro", color: "var(--primary-500)" },
  { key: "inimitable", letter: "I", label: "Inimitable", color: "#8b5cf6" },
  { key: "organized", letter: "O", label: "Organizado", color: "var(--warning)" },
];

export default function VrioPage() {
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newResource, setNewResource] = useState({
    resource_name: "",
    description: "",
    valuable: false,
    rare: false,
    inimitable: false,
    organized: false,
  });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const data = await api.getVrio().catch(() => []);
    setResources(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newResource.resource_name.trim()) return;
    const implication = getCompetitiveImplication(newResource.valuable, newResource.rare, newResource.inimitable, newResource.organized);
    await api.createVrio({ ...newResource, competitive_implication: implication.label });
    setNewResource({ resource_name: "", description: "", valuable: false, rare: false, inimitable: false, organized: false });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este recurso VRIO?")) return;
    await api.deleteVrio(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaVrio();
      toast.success("Analisis IA ejecutado. Las propuestas se enviaron al Inbox IA.");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Diagnostico Interno - VRIO</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Diagnostico Interno - VRIO</h2>
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
              <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ fontSize: "0.85rem" }}>
                + Nuevo Recurso
              </button>
              <button className="btn btn-primary" onClick={handleRunIA} disabled={iaLoading} style={{ fontSize: "0.85rem" }}>
                {iaLoading ? "Analizando..." : "ANALISIS"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicVrio data={resources} />
        ) : (
          <>
        {/* Add Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: "24px", padding: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Agregar Recurso / Capacidad</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Nombre del Recurso</label>
                <input
                  type="text"
                  value={newResource.resource_name}
                  onChange={(e) => setNewResource({ ...newResource, resource_name: e.target.value })}
                  placeholder="Ej: Marca reconocida, Tecnologia propia..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Criterios VRIO</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", height: "36px" }}>
                  {VRIO_CRITERIA.map((c) => (
                    <label key={c.key} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: (newResource as any)[c.key] ? c.color : "var(--text-muted)" }}>
                      <input
                        type="checkbox"
                        checked={(newResource as any)[c.key]}
                        onChange={(e) => setNewResource({ ...newResource, [c.key]: e.target.checked })}
                        style={{ accentColor: c.color, cursor: "pointer" }}
                      />
                      {c.letter}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <textarea
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              placeholder="Descripcion del recurso o capacidad..."
              rows={2}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar Recurso</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {resources.length === 0 ? (
          <div className="card" style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              No hay recursos registrados. Agrega uno manualmente o ejecuta el Analisis IA.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {resources.map((r: any) => {
              const impl = getCompetitiveImplication(r.valuable, r.rare, r.inimitable, r.organized);
              return (
                <div key={r.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                  <div style={{
                    padding: "14px 20px",
                    borderBottom: `3px solid ${impl.color}`,
                    background: "var(--bg-secondary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <h3 style={{
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        margin: 0,
                        marginBottom: "4px",
                      }}>
                        {r.resource_name}
                      </h3>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: impl.bg,
                        color: impl.color,
                      }}>
                        {impl.label}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        padding: "2px 6px",
                      }}
                      title="Eliminar"
                    >
                      X
                    </button>
                  </div>
                  <div style={{ padding: "16px" }}>
                    {/* VRIO Badges */}
                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                      {VRIO_CRITERIA.map((c) => {
                        const active = (r as any)[c.key];
                        return (
                          <span key={c.key} style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "999px",
                            background: active ? c.color : "var(--bg-tertiary)",
                            color: active ? "#fff" : "var(--text-muted)",
                            border: active ? "none" : "1px solid var(--border-color)",
                            transition: "all 0.2s ease",
                          }}>
                            {c.letter} - {c.label}
                          </span>
                        );
                      })}
                    </div>
                    {r.description && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                        {r.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
