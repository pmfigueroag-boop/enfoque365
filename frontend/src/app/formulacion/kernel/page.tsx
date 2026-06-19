"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import InfographicKernel from "./InfographicKernel";

const KERNEL_COMPONENTS = [
  { value: "diagnosis", label: "1. Diagnostico", subtitle: "Cual es el desafio critico?", color: "#ef4444", icon: "D" },
  { value: "guiding_policy", label: "2. Politica Guia", subtitle: "Cual es el enfoque general para abordarlo?", color: "#6366f1", icon: "P" },
  { value: "coherent_actions", label: "3. Acciones Coherentes", subtitle: "Que pasos concretos y coordinados tomamos?", color: "#10b981", icon: "A" },
];

export default function KernelPage() {
  const { toast } = useToast();
  const [components, setComponents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ component_type: "diagnosis", title: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const data = await api.getKernel().catch(() => []);
    setComponents(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newItem.title.trim() || !newItem.description.trim()) return;
    await api.createKernel(newItem);
    setNewItem({ component_type: "diagnosis", title: "", description: "" });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar este componente Kernel?")) return;
    await api.deleteKernel(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaKernel();
      toast.success("Kernel generado. Revise el Inbox IA para aprobar los componentes.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Formulacion - Kernel (Rumelt)</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Formulacion - Kernel (Rumelt)</h2>
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
                + Nuevo Componente
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Generando..." : "Generar Kernel (IA)"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        <div style={{
          padding: "12px 16px",
          marginBottom: "20px",
          borderRadius: "var(--radius-sm)",
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
        }}>
          <strong>Kernel de Rumelt:</strong> El nucleo de una buena estrategia tiene 3 componentes inseparables.
          Un diagnostico honesto del desafio, una politica guia clara, y acciones coherentes que se refuercen mutuamente.
        </div>

        {showForm && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Nuevo Componente Kernel</h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Componente</label>
              <select
                value={newItem.component_type}
                onChange={(e) => setNewItem({ ...newItem, component_type: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                {KERNEL_COMPONENTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <input
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Titulo del componente..."
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Descripcion detallada..."
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Kernel 3-part structure */}
        {viewMode === "infografia" ? (
          <InfographicKernel data={components} />
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {KERNEL_COMPONENTS.map((c, idx) => {
            const items = components.filter((comp: any) => comp.component_type === c.value);
            return (
              <div key={c.value}>
                <div className="card" style={{ padding: "0", overflow: "hidden", borderRadius: idx === 0 ? "var(--radius-sm) var(--radius-sm) 0 0" : idx === 2 ? "0 0 var(--radius-sm) var(--radius-sm)" : "0" }}>
                  <div style={{
                    padding: "16px 20px",
                    background: `${c.color}11`,
                    borderLeft: `5px solid ${c.color}`,
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                  }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: c.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}>
                      {c.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                        {c.label}
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.subtitle}</span>
                    </div>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: `${c.color}22`,
                      color: c.color,
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div style={{ padding: "16px 20px 16px 81px" }}>
                    {items.length === 0 ? (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        Sin componentes definidos.
                      </p>
                    ) : (
                      items.map((comp: any) => (
                        <div key={comp.id} style={{
                          padding: "12px",
                          marginBottom: "8px",
                          borderRadius: "var(--radius-sm)",
                          background: "var(--bg-tertiary)",
                          borderLeft: `3px solid ${c.color}`,
                          wordBreak: "break-word",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                              {comp.title}
                            </h4>
                            <button
                              onClick={() => handleDelete(comp.id)}
                              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                              title="Eliminar"
                            >
                              X
                            </button>
                          </div>
                          <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                            {comp.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {idx < KERNEL_COMPONENTS.length - 1 && (
                  <div style={{ textAlign: "center", padding: "2px 0", color: c.color, fontSize: "1.4rem", lineHeight: 1 }}>
                    |
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </>
  );
}
