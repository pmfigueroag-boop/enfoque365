"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import InfographicBSC from "./InfographicBSC";

interface KPI {
  id: number;
  nombre: string;
  semaforo: string;
}

interface Objetivo {
  id: number;
  description: string;
  indicadores: KPI[];
}

interface EjeMapa {
  id: number;
  name: string;
  perspectiva_bsc: string | null;
  peso_ponderado: number;
  objetivos: Objetivo[];
}

interface PerspectivaDef {
  key: string;
  label: string;
  color: string;
}

const PERSPECTIVAS: PerspectivaDef[] = [
  { key: "financiera", label: "Financiera", color: "#3b82f6" },
  { key: "clientes", label: "Clientes", color: "#10b981" },
  { key: "procesos", label: "Procesos", color: "#f59e0b" },
  { key: "aprendizaje", label: "Aprendizaje", color: "#8b5cf6" },
];

const SEMAFORO_COLORS: Record<string, string> = {
  verde: "#10b981",
  amarillo: "#f59e0b",
  rojo: "#ef4444",
  gris: "#9ca3af",
};

function getSemaforoColor(semaforo: string): string {
  return SEMAFORO_COLORS[semaforo?.toLowerCase()] || SEMAFORO_COLORS.gris;
}

function getDominantSemaforo(kpis: KPI[]): string | null {
  if (!kpis || kpis.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const kpi of kpis) {
    const s = (kpi.semaforo || "gris").toLowerCase();
    counts[s] = (counts[s] || 0) + 1;
  }
  const priority = ["rojo", "amarillo", "verde", "gris"];
  let dominant = "gris";
  let maxCount = 0;
  for (const p of priority) {
    if ((counts[p] || 0) > maxCount) {
      maxCount = counts[p] || 0;
      dominant = p;
    }
  }
  return dominant;
}

function getDominantBgTint(kpis: KPI[]): string {
  const dominant = getDominantSemaforo(kpis);
  if (!dominant) return "transparent";
  const color = getSemaforoColor(dominant);
  return `${color}12`;
}

function ObjectiveCard({ objetivo }: { objetivo: Objetivo }) {
  const kpis = objetivo.indicadores || [];
  const dominantBg = getDominantBgTint(kpis);

  return (
    <div
      style={{
        background: dominantBg,
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        minWidth: "200px",
        maxWidth: "300px",
        flex: "0 0 auto",
      }}
    >
      <div
        style={{
          fontSize: "0.85rem",
          color: "var(--text-primary)",
          fontWeight: 500,
          lineHeight: 1.4,
          marginBottom: kpis.length > 0 ? "10px" : "0",
        }}
      >
        {objetivo.description}
      </div>

      {kpis.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginBottom: "6px",
            }}
          >
            {kpis.length} {kpis.length === 1 ? "KPI" : "KPIs"}
          </div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {kpis.map((kpi) => (
              <span
                key={kpi.id}
                title={kpi.nombre || `KPI #${kpi.id}`}
                style={{
                  display: "inline-block",
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: getSemaforoColor(kpi.semaforo),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PerspectiveRow({
  perspectiva,
  ejes,
}: {
  perspectiva: PerspectivaDef;
  ejes: EjeMapa[];
}) {
  const totalWeight = ejes.reduce(
    (sum, e) => sum + (e.peso_ponderado || 0),
    0
  );
  const allObjetivos = ejes.flatMap((e) => e.objetivos || []);

  return (
    <div
      className="card animate-slide-in"
      style={{
        borderLeft: `4px solid ${perspectiva.color}`,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          minHeight: "100px",
        }}
      >
        {/* Left label */}
        <div
          style={{
            width: "180px",
            minWidth: "180px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRight: "1px solid var(--border-color)",
            background: `${perspectiva.color}08`,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "1rem",
              color: perspectiva.color,
            }}
          >
            {perspectiva.label}
          </div>
          {totalWeight > 0 && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Peso: {totalWeight}%
            </div>
          )}
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            {allObjetivos.length}{" "}
            {allObjetivos.length === 1 ? "objetivo" : "objetivos"}
          </div>
        </div>

        {/* Right: objectives */}
        <div
          style={{
            flex: 1,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
          }}
        >
          {allObjetivos.length === 0 ? (
            <span
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                fontStyle: "italic",
              }}
            >
              Sin objetivos en esta perspectiva
            </span>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "nowrap",
              }}
            >
              {allObjetivos.map((obj) => (
                <ObjectiveCard key={obj.id} objetivo={obj} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Preview Modal: muestra el mapa generado por IA
   antes de materializar
   ───────────────────────────────────────────── */
function PreviewModal({
  preview,
  onApply,
  onClose,
  applying,
}: {
  preview: any;
  onApply: () => void;
  onClose: () => void;
  applying: boolean;
}) {
  const perspectivas = preview?.perspectivas || [];
  const PERSP_COLORS: Record<string, string> = {
    financiera: "#3b82f6",
    clientes: "#10b981",
    procesos: "#f59e0b",
    aprendizaje: "#8b5cf6",
  };
  const PERSP_LABELS: Record<string, string> = {
    financiera: "Financiera",
    clientes: "Clientes",
    procesos: "Procesos",
    aprendizaje: "Aprendizaje",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          maxWidth: "900px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem" }}>
              Preview: Mapa BSC Generado
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              Revise el contenido. Al aplicar se reemplaza el mapa actual.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.3rem",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 28px" }}>
          {perspectivas.map((p: any) => {
            const color = PERSP_COLORS[p.perspectiva] || "#6b7280";
            const label = PERSP_LABELS[p.perspectiva] || p.perspectiva;
            const objs = p.objetivos || [];

            return (
              <div
                key={p.perspectiva}
                style={{
                  marginBottom: "20px",
                  borderLeft: `3px solid ${color}`,
                  paddingLeft: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: color,
                      fontSize: "0.95rem",
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      background: "var(--bg-secondary)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {p.eje_name}
                  </span>
                </div>

                {objs.map((obj: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "var(--bg-secondary)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 14px",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        marginBottom: "6px",
                      }}
                    >
                      {obj.description}
                    </div>
                    {obj.kpis?.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {obj.kpis.map((kpi: any, ki: number) => (
                          <span
                            key={ki}
                            style={{
                              fontSize: "0.72rem",
                              background: `${color}18`,
                              color: color,
                              padding: "3px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontWeight: 500,
                            }}
                          >
                            {kpi.nombre} (meta: {kpi.meta}
                            {kpi.unidad === "porcentaje" ? "%" : ""})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 28px 24px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          <button className="btn btn-ghost" onClick={onClose} disabled={applying}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={onApply}
            disabled={applying}
            style={{
              background: applying
                ? "var(--text-muted)"
                : "linear-gradient(135deg, #10b981, #059669)",
              minWidth: "180px",
            }}
          >
            {applying ? "Aplicando..." : "Aplicar Mapa"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapaBSCPage() {
  const { toast } = useToast();
  const [ejes, setEjes] = useState<EjeMapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [viewMode, setViewMode] = useState<"gestion" | "infografia">("gestion");

  // La API retorna [{perspectiva, ejes: [...]}] — aplanar a ejes[]
  const flattenMapa = (data: any[]): EjeMapa[] =>
    (data || []).flatMap((p: any) => p.ejes || []);

  useEffect(() => {
    api
      .getMapaBSC()
      .then((data) => {
        setEjes(flattenMapa(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error al cargar el mapa estrategico");
        setLoading(false);
      });
  }, []);

  const reloadData = () => {
    setLoading(true);
    setError(null);
    api
      .getMapaBSC()
      .then((data) => {
        setEjes(flattenMapa(data));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleGenerateIA = async () => {
    setIaLoading(true);
    try {
      const result = await api.iaMapaPreview();
      setPreview(result);
    } catch (e: any) {
      toast.error("Error al generar preview: " + (e?.message || "Desconocido"));
    } finally {
      setIaLoading(false);
    }
  };

  const handleApplyMapa = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      await api.iaMapaAplicar(preview);
      setPreview(null);
      // Recargar mapa
      const data = await api.getMapaBSC();
      setEjes(flattenMapa(data));
    } catch (e: any) {
      toast.error("Error al aplicar mapa: " + (e?.message || "Desconocido"));
    } finally {
      setApplying(false);
    }
  };

  const ejesByPerspectiva = (key: string) =>
    ejes.filter(
      (e) => (e.perspectiva_bsc || "").toLowerCase() === key.toLowerCase()
    );

  const sinClasificar = ejes.filter(
    (e) =>
      !e.perspectiva_bsc ||
      !PERSPECTIVAS.some(
        (p) => p.key.toLowerCase() === (e.perspectiva_bsc || "").toLowerCase()
      )
  );

  return (
    <>
      <header className="header">
        <h2 className="header-title">Mapa Estrategico BSC</h2>
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
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem" }}>
                {Object.entries(SEMAFORO_COLORS)
                  .filter(([k]) => k !== "gris")
                  .map(([label, color]) => (
                    <span
                      key={label}
                      style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: color,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          color: "var(--text-muted)",
                          textTransform: "capitalize",
                        }}
                      >
                        {label}
                      </span>
                    </span>
                  ))}
              </div>
              <button
                className="btn btn-ghost"
                onClick={reloadData}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                Recargar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateIA}
                disabled={iaLoading}
                style={{
                  fontSize: "0.85rem",
                  background: iaLoading
                    ? "var(--text-muted)"
                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                }}
              >
                {iaLoading ? "Generando..." : "Generar Mapa (IA)"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {viewMode === "infografia" ? (
          <InfographicBSC data={ejes} />
        ) : (
          <>
        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>
            Cargando mapa estrategico...
          </p>
        ) : error ? (
          <div className="card" style={{ textAlign: "center", padding: "40px" }}>
            <div
              style={{
                color: "var(--danger)",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Error
            </div>
            <p style={{ color: "var(--text-secondary)" }}>{error}</p>
          </div>
        ) : ejes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px" }}>
            <div
              style={{
                fontSize: "1.5rem",
                marginBottom: "16px",
                fontWeight: 700,
                color: "var(--primary-500)",
              }}
            >
              BSC
            </div>
            <h3 style={{ marginBottom: "8px" }}>Mapa vacio</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "20px" }}>
              No hay ejes estrategicos. Use el boton &quot;Generar Mapa (IA)&quot;
              para crear el mapa automaticamente desde su diagnostico.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleGenerateIA}
              disabled={iaLoading}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {iaLoading ? "Generando..." : "Generar Mapa (IA)"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {PERSPECTIVAS.map((p) => {
              const perspEjes = ejesByPerspectiva(p.key);
              return (
                <PerspectiveRow
                  key={p.key}
                  perspectiva={p}
                  ejes={perspEjes}
                />
              );
            })}

            {sinClasificar.length > 0 && (
              <PerspectiveRow
                perspectiva={{
                  key: "sin_clasificar",
                  label: "Sin clasificar",
                  color: "#6b7280",
                }}
                ejes={sinClasificar}
              />
            )}
          </div>
        )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          preview={preview}
          onApply={handleApplyMapa}
          onClose={() => setPreview(null)}
          applying={applying}
        />
      )}
    </>
  );
}
