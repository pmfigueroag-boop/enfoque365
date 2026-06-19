"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import InfographicKPI from "./InfographicKPI";

interface Objetivo {
  id: number;
  description: string;
}

interface Eje {
  id: number;
  name: string;
  objetivos: Objetivo[];
}

interface Indicador {
  id: number;
  nombre: string;
  objetivo_id: number;
  unidad: string;
  linea_base: number;
  meta: number;
  valor_actual: number | null;
  frecuencia: string;
  tendencia: string;
  semaforo: string;
}

const SEMAFORO_COLORS: Record<string, string> = {
  verde: "#10b981",
  amarillo: "#f59e0b",
  rojo: "#ef4444",
  gris: "#6b7280",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-color)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  background: "var(--bg-tertiary)",
  color: "var(--text-primary)",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const EMPTY_FORM = {
  nombre: "",
  objetivo_id: 0,
  unidad: "porcentaje",
  linea_base: 0,
  meta: 0,
  frecuencia: "trimestral",
  tendencia: "ascendente",
};

export default function IndicadoresPage() {
  const { toast } = useToast();
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [arbol, setArbol] = useState<Eje[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaLoading, setIaLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [medicionTarget, setMedicionTarget] = useState<number | null>(null);
  const [medicionValor, setMedicionValor] = useState("");
  const [historiales, setHistoriales] = useState<Record<number, {valor: number; fecha: string}[]>>({});
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  const loadHistorial = useCallback(async (indicadorId: number) => {
    if (historiales[indicadorId]) return;
    try {
      const data = await api.getHistorialMediciones(indicadorId);
      setHistoriales(prev => ({ ...prev, [indicadorId]: data }));
    } catch { /* ignore */ }
  }, [historiales]);

  const loadData = async () => {
    const [ind, tree] = await Promise.all([
      api.getIndicadores().catch(() => []),
      api.getArbol().catch(() => []),
    ]);
    setIndicadores(ind);
    setArbol(tree);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const objetivoMap: Record<number, { ejeName: string; objDesc: string }> = {};
  arbol.forEach((eje) => {
    (eje.objetivos || []).forEach((obj) => {
      objetivoMap[obj.id] = { ejeName: eje.name, objDesc: obj.description };
    });
  });

  const getObjetivoLabel = (objId: number) => {
    const entry = objetivoMap[objId];
    if (!entry) return "Sin asignar";
    return `${entry.ejeName} > ${entry.objDesc}`;
  };

  const handleCreate = async () => {
    if (!form.nombre.trim() || !form.objetivo_id || !form.meta) return;
    await api.createIndicador(form);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    loadData();
  };

  const handleMedicion = async (id: number) => {
    const valor = parseFloat(medicionValor);
    if (isNaN(valor)) return;
    await api.registrarMedicion(id, valor);
    setMedicionTarget(null);
    setMedicionValor("");
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este indicador?")) return;
    try {
      await api.deleteIndicador(id);
      toast.success("Indicador eliminado");
      loadData();
    } catch (e: any) {
      toast.error("Error al eliminar indicador");
    }
  };

  const calcProgress = (ind: Indicador) => {
    const actual = ind.valor_actual ?? 0;
    if (ind.meta === 0) return 0;
    return Math.min(Math.round((actual / ind.meta) * 100), 100);
  };

  const countSemaforo = (color: string) =>
    indicadores.filter((i) => i.semaforo === color).length;

  const handleRunIA = async () => {
    setIaLoading(true);
    try {
      await api.iaKPIs();
      toast.success("KPIs generados. Revise el Inbox IA para aprobar.");
    } catch (e: any) {
      toast.error("Error: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  return (
    <>
      <header className="header">
        <h2 className="header-title">Indicadores KPI</h2>
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
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(!showForm)}
              >
                + Nuevo Indicador
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRunIA}
                disabled={iaLoading}
                style={{ fontSize: "0.85rem", background: iaLoading ? "var(--text-muted)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {iaLoading ? "Generando..." : "Generar KPIs (IA)"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicKPI data={indicadores} />
        ) : (
          <>
        {/* Summary Stats */}
        {!loading && indicadores.length > 0 && (
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div className="stat-card">
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total KPIs
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {indicadores.length}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                En Verde
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>
                {countSemaforo("verde")}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                En Amarillo
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>
                {countSemaforo("amarillo")}
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                En Rojo
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#ef4444" }}>
                {countSemaforo("rojo")}
              </div>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: "24px" }}>
            <h3 className="card-title" style={{ marginBottom: "16px" }}>Crear Indicador KPI</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Nombre del Indicador
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Porcentaje de ejecucion presupuestaria"
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Objetivo Estrategico
                </label>
                <select
                  value={form.objetivo_id}
                  onChange={(e) => setForm({ ...form, objetivo_id: Number(e.target.value) })}
                  style={{ ...selectStyle, width: "100%" }}
                >
                  <option value={0}>-- Seleccionar objetivo --</option>
                  {arbol.map((eje) =>
                    (eje.objetivos || []).map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        {eje.name} &gt; {obj.description}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Unidad de Medida
                </label>
                <select
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  style={{ ...selectStyle, width: "100%" }}
                >
                  <option value="porcentaje">Porcentaje</option>
                  <option value="cantidad">Cantidad</option>
                  <option value="moneda">Moneda</option>
                  <option value="indice">Indice</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Frecuencia
                </label>
                <select
                  value={form.frecuencia}
                  onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                  style={{ ...selectStyle, width: "100%" }}
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Linea Base
                </label>
                <input
                  type="number"
                  value={form.linea_base}
                  onChange={(e) => setForm({ ...form, linea_base: Number(e.target.value) })}
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Meta
                </label>
                <input
                  type="number"
                  value={form.meta}
                  onChange={(e) => setForm({ ...form, meta: Number(e.target.value) })}
                  style={{ ...inputStyle, width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Tendencia
                </label>
                <select
                  value={form.tendencia}
                  onChange={(e) => setForm({ ...form, tendencia: e.target.value })}
                  style={{ ...selectStyle, width: "100%" }}
                >
                  <option value="ascendente">Ascendente</option>
                  <option value="descendente">Descendente</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button className="btn btn-primary" onClick={handleCreate}>Guardar Indicador</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Indicadores List */}
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Cargando indicadores...</p>
        ) : indicadores.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "16px", fontWeight: 700, color: "var(--primary-500)" }}>KPI</div>
            <h3 style={{ marginBottom: "8px" }}>Sin indicadores registrados</h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Crea tu primer indicador KPI para comenzar a medir el progreso estrategico.
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Panel de Indicadores</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {indicadores.length} indicador{indicadores.length !== 1 ? "es" : ""} registrado{indicadores.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    {["Semaforo", "Nombre", "Objetivo", "Progreso (Actual / Meta)", "Historial", "Frecuencia", "Acciones"].map((col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: "left",
                          padding: "12px 16px",
                          fontSize: "0.75rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indicadores.map((ind) => {
                    const progress = calcProgress(ind);
                    const semaforoColor = SEMAFORO_COLORS[ind.semaforo] || SEMAFORO_COLORS.gris;

                    return (
                      <tr
                        key={ind.id}
                        style={{ borderBottom: "1px solid var(--border-color)" }}
                      >
                        {/* Semaforo */}
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            title={ind.semaforo}
                            style={{
                              width: "16px",
                              height: "16px",
                              borderRadius: "50%",
                              background: semaforoColor,
                              boxShadow: `0 0 8px ${semaforoColor}40`,
                            }}
                          />
                        </td>

                        {/* Nombre */}
                        <td style={{ padding: "14px 16px", fontWeight: 500, color: "var(--text-primary)" }}>
                          {ind.nombre}
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {ind.unidad} | {ind.tendencia}
                          </div>
                        </td>

                        {/* Objetivo */}
                        <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "250px" }}>
                          {getObjetivoLabel(ind.objetivo_id)}
                        </td>

                        {/* Progress */}
                        <td style={{ padding: "14px 16px", minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              flex: 1,
                              height: "8px",
                              background: "var(--bg-tertiary)",
                              borderRadius: "4px",
                              overflow: "hidden",
                            }}>
                              <div style={{
                                width: `${progress}%`,
                                height: "100%",
                                background: semaforoColor,
                                borderRadius: "4px",
                                transition: "width 0.5s ease",
                              }} />
                            </div>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                              {ind.valor_actual ?? 0} / {ind.meta}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                            {progress}% completado | Base: {ind.linea_base}
                          </div>
                        </td>

                        {/* Sparkline Historial */}
                        <td
                          style={{ padding: "14px 8px", width: "100px" }}
                          onMouseEnter={() => loadHistorial(ind.id)}
                        >
                          {(() => {
                            const hist = historiales[ind.id];
                            if (!hist || hist.length < 2) {
                              return (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  {hist ? `${hist.length} med.` : "--"}
                                </span>
                              );
                            }
                            const values = [...hist].reverse().map(h => h.valor);
                            const min = Math.min(...values);
                            const max = Math.max(...values);
                            const range = max - min || 1;
                            const w = 80;
                            const h2 = 28;
                            const points = values.map((v, i) => {
                              const x = (i / (values.length - 1)) * w;
                              const y = h2 - ((v - min) / range) * (h2 - 4) - 2;
                              return `${x},${y}`;
                            }).join(" ");
                            const lastVal = values[values.length - 1];
                            const prevVal = values[values.length - 2];
                            const trendColor = lastVal >= prevVal ? "#10b981" : "#ef4444";
                            return (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <svg width={w} height={h2} style={{ display: "block" }}>
                                  <polyline
                                    points={points}
                                    fill="none"
                                    stroke={trendColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span style={{ fontSize: "0.65rem", color: trendColor, fontWeight: 600 }}>
                                  {values.length}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Frecuencia */}
                        <td style={{ padding: "14px 16px", fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                          {ind.frecuencia}
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "14px 16px" }}>
                          {medicionTarget === ind.id ? (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <input
                                type="number"
                                value={medicionValor}
                                onChange={(e) => setMedicionValor(e.target.value)}
                                placeholder="Valor"
                                autoFocus
                                style={{
                                  ...inputStyle,
                                  width: "90px",
                                  padding: "6px 10px",
                                  fontSize: "0.8rem",
                                }}
                              />
                              <button
                                className="btn btn-success"
                                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                onClick={() => handleMedicion(ind.id)}
                              >
                                OK
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: "0.75rem", padding: "6px 10px" }}
                                onClick={() => { setMedicionTarget(null); setMedicionValor(""); }}
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                                onClick={() => { setMedicionTarget(ind.id); setMedicionValor(""); }}
                              >
                                Registrar Medicion
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ fontSize: "0.75rem", padding: "6px 12px", color: "var(--danger-500)" }}
                                onClick={() => handleDelete(ind.id)}
                                title="Eliminar indicador"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </>
  );
}
