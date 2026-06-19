"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicP2W from "./InfographicP2W";

const P2W_CHOICES = [
  { value: "winning_aspiration", label: "1. Aspiracion de Victoria", subtitle: "Cual es nuestra aspiracion ganadora?", color: "#6366f1" },
  { value: "where_to_play", label: "2. Donde Jugar", subtitle: "En que mercados/segmentos competimos?", color: "#3b82f6" },
  { value: "how_to_win", label: "3. Como Ganar", subtitle: "Cual es nuestra ventaja competitiva?", color: "#10b981" },
  { value: "core_capabilities", label: "4. Capacidades Requeridas", subtitle: "Que capacidades son necesarias?", color: "#f59e0b" },
  { value: "management_systems", label: "5. Sistemas de Gestion", subtitle: "Que sistemas sostienen la estrategia?", color: "#ef4444" },
];

export default function P2WPage() {
  const { toast } = useToast();
  const [choices, setChoices] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ choice_type: "winning_aspiration", description: "", rationale: "" });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadData = async () => {
    const data = await api.getP2w().catch(() => []);
    setChoices(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    if (!newItem.description.trim()) return;
    await api.createP2w(newItem);
    setNewItem({ choice_type: "winning_aspiration", description: "", rationale: "" });
    setShowForm(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar esta eleccion P2W?")) return;
    await api.deleteP2w(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaP2w();
      toast.success("Elecciones P2W generadas. Revise el Inbox IA para aprobar.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Formulacion - Playing to Win</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Formulacion - Playing to Win</h2>
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
                + Nueva Eleccion
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Generando..." : "Generar Elecciones (IA)"}
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
          <strong>Playing to Win (Lafley y Martin):</strong> 5 elecciones en cascada que definen la estrategia.
          Cada eleccion informa y restringe la siguiente.
        </div>

        {showForm && (
          <div className="card" style={{ padding: "20px", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "16px", color: "var(--text-primary)" }}>Nueva Eleccion Estrategica</h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>Tipo de Eleccion</label>
              <select
                value={newItem.choice_type}
                onChange={(e) => setNewItem({ ...newItem, choice_type: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                {P2W_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <textarea
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Describa la eleccion estrategica..."
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <input
              value={newItem.rationale}
              onChange={(e) => setNewItem({ ...newItem, rationale: e.target.value })}
              placeholder="Razonamiento / justificacion..."
              style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px", background: "var(--bg-secondary)", color: "var(--text-primary)" }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Cascading choices - vertical flow */}
        {viewMode === "infografia" ? (
          <InfographicP2W data={choices} />
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {P2W_CHOICES.map((c, idx) => {
            const items = choices.filter((ch: any) => ch.choice_type === c.value);
            return (
              <div key={c.value} className="card" style={{ padding: "0", overflow: "hidden" }}>
                <div style={{
                  padding: "14px 20px",
                  borderLeft: `4px solid ${c.color}`,
                  background: "var(--bg-secondary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: c.color, margin: 0 }}>
                      {c.label}
                    </h3>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{c.subtitle}</span>
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
                {/* Cascade arrow connector (except last) */}
                <div style={{ padding: "16px" }}>
                  {items.length === 0 ? (
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Sin elecciones definidas.
                    </p>
                  ) : (
                    items.map((ch: any) => (
                      <div key={ch.id} style={{
                        padding: "10px 12px",
                        marginBottom: "8px",
                        borderRadius: "var(--radius-sm)",
                        background: "var(--bg-tertiary)",
                        borderLeft: `3px solid ${c.color}`,
                        wordBreak: "break-word",
                      }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
                          <button
                            onClick={() => handleDelete(ch.id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                            title="Eliminar"
                          >
                            X
                          </button>
                        </div>
                        <p style={{ fontSize: "0.83rem", color: "var(--text-primary)", margin: "0 0 6px 0", lineHeight: 1.5 }}>
                          {ch.description}
                        </p>
                        {ch.rationale && (
                          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                            Razon: {ch.rationale}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {idx < P2W_CHOICES.length - 1 && (
                  <div style={{ textAlign: "center", padding: "0 0 4px 0", color: "var(--text-muted)", fontSize: "1.2rem" }}>
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
