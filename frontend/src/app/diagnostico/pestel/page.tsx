"use client";
import { useToast } from '../../components/Toast';
import Link from 'next/link';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicPestel from "./InfographicPestel";

const PESTEL_CATEGORIES = [
  { value: "politico", label: "Politico" },
  { value: "economico", label: "Economico" },
  { value: "social", label: "Social" },
  { value: "tecnologico", label: "Tecnologico" },
  { value: "ecologico", label: "Ecologico" },
  { value: "legal", label: "Legal" },
];

export default function PestelPage() {
  const { toast } = useToast();
  const [pestel, setPestel] = useState<any[]>([]);
  const [showPestelForm, setShowPestelForm] = useState(false);
  const [newPestel, setNewPestel] = useState({ category: "politico", description: "", impact_level: 3, source: "" });
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");
  
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const loadData = async () => {
    const p = await api.getPestel().catch(() => []);
    setPestel(p);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreatePestel = async () => {
    if (!newPestel.description.trim()) return;
    await api.createPestel(newPestel);
    setNewPestel({ category: "politico", description: "", impact_level: 3, source: "" });
    setShowPestelForm(false);
    loadData();
  };

  const handleDeletePestel = async (id: number) => {
    if (!confirm("Eliminar este factor PESTEL?")) return;
    await api.deletePestel(id);
    loadData();
  };

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      const proposals = await api.analyzeIA();
      toast.success(`Agente Analitico genero ${proposals.length} propuesta(s). Revisalas en el Inbox IA.`);
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setIaLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Diagnostico Externo - PESTEL</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Diagnostico Externo - PESTEL</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
          <Link href="/diagnostico/pestel/matriz" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--primary-400)',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}>
            MATRIZ
          </Link>
          {viewMode === "gestion" && (
            <button className="btn btn-primary" onClick={handleRunIA} disabled={iaLoading}>
              {iaLoading ? "Analizando..." : "ANALISIS"}
            </button>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicPestel data={pestel} />
        ) : (
          <>
        <div style={{ textAlign: "justify", marginBottom: "24px", color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
          <p style={{ marginBottom: "12px" }}>
            El análisis PESTEL, formalizado por Aguilar (1967) como ETPS y posteriormente ampliado por Fahey y Narayanan (1986), constituye un marco de exploración macroambiental que examina seis dimensiones exógenas: Política, Económica, Social, Tecnológica, Ecológica y Legal. Su fundamento epistemológico descansa en la teoría de sistemas abiertos (von Bertalanffy, 1968) y en el paradigma de racionalidad limitada de Simon (1955), reconociendo que las organizaciones operan como entidades permeables cuya viabilidad depende de la lectura sistemática de su entorno.
          </p>
          <p style={{ marginBottom: "12px" }}>
            Dentro del ciclo OODA (Boyd, 1987), PESTEL opera en la fase de Observación, proveyendo insumos factuales que alimentan el diagnóstico estratégico antes de cualquier formulación prescriptiva. Su rigor radica en la evidencia, no en la intuición.
          </p>
          <p>
            La correcta lectura de estas seis fuerzas permite anticipar disrupciones, identificar ventanas de oportunidad y reducir la incertidumbre decisional, dotando al estratega de una base empírica para formular respuestas institucionales proporcionadas al contexto real.
          </p>
        </div>
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Analisis PESTEL</h3>
            <button className="btn btn-primary" onClick={() => setShowPestelForm(!showPestelForm)} style={{ fontSize: "0.85rem" }}>
              + FACTOR
            </button>
          </div>

          {showPestelForm && (
            <div style={{ padding: "16px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Categoria</label>
                  <select
                    value={newPestel.category}
                    onChange={(e) => setNewPestel({ ...newPestel, category: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit" }}
                  >
                    {PESTEL_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: "4px" }}>Impacto (1-5)</label>
                  <input
                    type="number" min={1} max={5}
                    value={newPestel.impact_level}
                    onChange={(e) => setNewPestel({ ...newPestel, impact_level: parseInt(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit" }}
                  />
                </div>
              </div>
              <textarea
                value={newPestel.description}
                onChange={(e) => setNewPestel({ ...newPestel, description: e.target.value })}
                placeholder="Descripcion del factor externo..."
                rows={2}
                style={{ width: "100%", padding: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", resize: "vertical", marginBottom: "12px" }}
              />
              <input
                type="text"
                value={newPestel.source}
                onChange={(e) => setNewPestel({ ...newPestel, source: e.target.value })}
                placeholder="Fuente (ej: Banco Central, OPTIC...)"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", fontSize: "0.85rem", fontFamily: "inherit", marginBottom: "12px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-primary" onClick={handleCreatePestel}>Guardar Factor</button>
                <button className="btn btn-ghost" onClick={() => setShowPestelForm(false)}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Filter and Sort Controls */}
          {pestel.length > 0 && (
            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap", padding: "12px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Filtrar Categoria:</span>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8rem" }}
                >
                  <option value="all">Todas (PESTEL)</option>
                  {PESTEL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Ordenar por:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8rem" }}
                >
                  <option value="newest">Mas recientes (Default)</option>
                  <option value="risk_desc">Nivel de Riesgo (Prob x Imp) - Mayor a menor</option>
                  <option value="impact_desc">Impacto - Mayor a menor</option>
                  <option value="impact_asc">Impacto - Menor a mayor</option>
                  <option value="prob_desc">Probabilidad - Mayor a menor</option>
                  <option value="prob_asc">Probabilidad - Menor a mayor</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
            {pestel.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>No hay factores PESTEL. Agrega el primero para alimentar al Agente Analitico.</p>
            ) : (
              [...pestel]
                .filter(f => filterCategory === "all" || f.category === filterCategory)
                .sort((a, b) => {
                  const probA = a.probability ?? 5;
                  const probB = b.probability ?? 5;
                  if (sortBy === "impact_desc") return b.impact_level - a.impact_level;
                  if (sortBy === "impact_asc") return a.impact_level - b.impact_level;
                  if (sortBy === "prob_desc") return probB - probA;
                  if (sortBy === "prob_asc") return probA - probB;
                  if (sortBy === "risk_desc") return (probB * b.impact_level) - (probA * a.impact_level);
                  return b.id - a.id; // newest
                })
                .map((f: any) => {
                const cat = PESTEL_CATEGORIES.find(c => c.value === f.category);
                return (
                  <div key={f.id} className="card" style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--primary-500)" }}>
                        {cat?.label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                          background: "var(--bg-tertiary)",
                          color: "var(--primary-400)",
                        }}>
                          Prob {f.probability ?? 5}/10
                        </span>
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                          background: f.impact_level >= 8 ? "rgba(239,68,68,0.15)" : f.impact_level <= 4 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                          color: f.impact_level >= 8 ? "var(--danger)" : f.impact_level <= 4 ? "var(--success)" : "var(--warning)",
                        }}>
                          Imp {f.impact_level}/10
                        </span>
                        {(() => {
                          const risk = (f.probability ?? 5) * f.impact_level;
                          return (
                            <span style={{
                              fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: "999px",
                              background: risk >= 49 ? "rgba(239,68,68,0.2)" : risk >= 25 ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)",
                              color: risk >= 49 ? "var(--danger)" : risk >= 25 ? "var(--warning)" : "var(--success)",
                            }}>
                              Riesgo {risk}
                            </span>
                          );
                        })()}
                        <button
                          onClick={() => handleDeletePestel(f.id)}
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "2px 4px" }}
                          title="Eliminar"
                        >
                          X
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.85rem", marginBottom: "6px" }}>{f.description}</p>
                    {f.source && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Fuente: {f.source}</p>}
                  </div>
                );
              })
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </>
  );
}
