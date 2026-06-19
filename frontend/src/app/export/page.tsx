"use client";

import { useEffect, useState, useRef } from "react";
import { api, getSession } from "../lib/api";
import ReactMarkdown from "react-markdown";

/* ── Types ── */
interface DashboardData {
  ejes: number;
  objetivos: number;
  kpis: number;
  hoshin: number;
  foda: number;
  pestel: number;
  documentos: number;
  key_results: number;
  porter: number;
  vrio: number;
  tows: number;
  semaforo: { verde: number; amarillo: number; rojo: number; gris: number };
  hoshin_status: { pendiente: number; en_progreso: number; completado: number };
  phases: { name: string; items: number; done: boolean }[];
  phases_done: number;
  phases_total: number;
  completion_pct: number;
}

/* ── Checklist modules config ── */
const CHECKLIST_MODULES = [
  { key: "pestel", label: "Diagnostico PESTEL" },
  { key: "porter", label: "Porter 5 Fuerzas" },
  { key: "vrio", label: "Analisis VRIO" },
  { key: "foda", label: "FODA (SWOT)" },
  { key: "tows", label: "Matriz TOWS" },
  { key: "ejes", label: "Ejes Estrategicos" },
  { key: "objetivos", label: "Objetivos Estrategicos" },
  { key: "kpis", label: "Indicadores KPI" },
  { key: "key_results", label: "Key Results (OKR)" },
  { key: "hoshin", label: "Hoshin Kanri" },
  { key: "documentos", label: "Documentos" },
] as const;

/* ── Summary cards config ── */
const SUMMARY_ITEMS = [
  { key: "ejes", label: "Ejes Estrategicos", color: "#6366f1" },
  { key: "objetivos", label: "Objetivos", color: "#22d3ee" },
  { key: "kpis", label: "Indicadores KPI", color: "#f59e0b" },
  { key: "hoshin", label: "Items Hoshin", color: "#a855f7" },
  { key: "foda", label: "Factores FODA", color: "#22c55e" },
  { key: "pestel", label: "Factores PESTEL", color: "#3b82f6" },
  { key: "porter", label: "Fuerzas Porter", color: "#ec4899" },
  { key: "documentos", label: "Documentos", color: "#6b7280" },
] as const;

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: "14px",
    marginBottom: "32px",
  },
  summaryCard: {
    background: "var(--bg-card, #1a1a2e)",
    border: "1px solid var(--border-color, #2a2a4a)",
    borderRadius: "14px",
    padding: "20px 18px",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  summaryLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--text-muted, #8888aa)",
    marginBottom: "6px",
  },
  summaryValue: {
    fontSize: "2rem",
    fontWeight: 800,
    lineHeight: 1,
  },
  summaryGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    filter: "blur(32px)",
    opacity: 0.16,
    pointerEvents: "none",
  },
  sectionCard: {
    background: "var(--bg-card, #1a1a2e)",
    border: "1px solid var(--border-color, #2a2a4a)",
    borderRadius: "16px",
    padding: "28px",
  },
  sectionTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-muted, #8888aa)",
    marginBottom: "20px",
  },
  checklistRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "6px",
    transition: "background 0.15s ease",
  },
  checklistLabel: {
    fontSize: "0.88rem",
    fontWeight: 500,
  },
  badge: {
    fontSize: "0.72rem",
    fontWeight: 700,
    padding: "3px 10px",
    borderRadius: "999px",
  },
  exportSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    textAlign: "center",
  },
  exportButton: {
    padding: "18px 48px",
    fontSize: "1.05rem",
    fontWeight: 700,
    fontFamily: "inherit",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#ffffff",
    boxShadow: "0 8px 32px rgba(99, 102, 241, 0.35)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
    letterSpacing: "0.02em",
  },
  instructions: {
    marginTop: "20px",
    fontSize: "0.85rem",
    color: "var(--text-muted, #8888aa)",
    lineHeight: 1.6,
    maxWidth: "520px",
  },
  loadingWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid var(--border-color, #2a2a4a)",
    borderTopColor: "var(--primary-500, #6366f1)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    background: "var(--bg-card, #1a1a2e)",
    border: "1px solid var(--border-color, #2a2a4a)",
    borderRadius: "16px",
    padding: "24px",
    maxWidth: 420,
    textAlign: "center",
  },
};

export default function ExportPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // IA Export States
  const [generatingIA, setGeneratingIA] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getIaExportPlan().catch(() => ({ markdown: null }))
    ])
      .then(([d, iaResp]) => {
        setData(d);
        if (iaResp && iaResp.markdown) {
          setMarkdown(iaResp.markdown);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Error al cargar datos del plan");
        setLoading(false);
      });
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const baseUrl =
        typeof window !== "undefined" && window.location.hostname === "localhost"
          ? "http://localhost:8000"
          : "";
      const session = getSession();
      const resp = await fetch(`${baseUrl}/api/v1/pei/export/html`, {
        headers: {
          "X-Tenant-Id": session.tenantId,
          "X-User-Email": session.email,
        },
      });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const html = await resp.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e: any) {
      setError("Error al generar el reporte: " + (e.message || "desconocido"));
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateIA = async () => {
    setGeneratingIA(true);
    setMarkdown(""); // Limpiar anterior
    try {
      const result = await api.iaExportPlan();
      setMarkdown(result.markdown);
    } catch (err) {
      console.error(err);
      alert("Error al generar el documento. Verifica los logs o que la IA responda.");
    } finally {
      setGeneratingIA(false);
    }
  };

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [15, 15, 15, 15],
        filename: "Memorandum_Estrategico_Institucional.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      html2pdf().set(opt).from(contentRef.current).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al exportar PDF. Usa la opcion de Imprimir (Ctrl+P) como alternativa.");
    }
  };

  /* Loading */
  if (loading) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <header className="header">
          <h2 className="header-title">Exportar Plan Estrategico</h2>
        </header>
        <div className="page-content" style={S.loadingWrapper}>
          <div style={S.spinner} />
        </div>
      </>
    );
  }

  /* Error without data */
  if (!data) {
    return (
      <>
        <header className="header">
          <h2 className="header-title">Exportar Plan Estrategico</h2>
        </header>
        <div className="page-content" style={S.loadingWrapper}>
          <div style={S.errorBox}>
            <p style={{ color: "var(--danger, #ef4444)", fontWeight: 600, marginBottom: 8 }}>
              No se pudieron cargar los datos
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{error}</p>
          </div>
        </div>
      </>
    );
  }

  /* Count completed modules */
  const completedModules = CHECKLIST_MODULES.filter(
    (m) => (data[m.key as keyof DashboardData] as number) > 0
  ).length;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .summary-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 32px rgba(0,0,0,0.22);
        }
        .export-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(99, 102, 241, 0.45);
        }
        .export-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <header className="header">
        <h2 className="header-title">Exportar Plan Estrategico</h2>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {completedModules}/{CHECKLIST_MODULES.length} modulos con datos
        </span>
      </header>

      <div className="page-content animate-fade-in">
        {/* ── Summary grid ── */}
        <div style={S.summaryGrid}>
          {SUMMARY_ITEMS.map((item) => {
            const value = (data[item.key as keyof DashboardData] as number) || 0;
            return (
              <div key={item.key} className="summary-card-hover" style={S.summaryCard}>
                <div style={{ ...S.summaryGlow, background: item.color }} />
                <div style={S.summaryLabel}>{item.label}</div>
                <div style={{ ...S.summaryValue, color: value > 0 ? item.color : "var(--text-muted, #666688)" }}>
                  {value}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "2px",
                    background: value > 0
                      ? `linear-gradient(90deg, ${item.color}, transparent)`
                      : "transparent",
                    opacity: 0.5,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Main content: two columns ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Export action card */}
          <div style={S.sectionCard}>
              {error && (
                <p style={{ marginTop: "16px", color: "var(--danger, #ef4444)", fontSize: "0.85rem", fontWeight: 600 }}>
                  {error}
                </p>
              )}
              
              <div style={{ width: "100%", height: "1px", background: "var(--border-color, #2a2a4a)", margin: "24px 0" }} />
              
              <div style={S.sectionTitle}>Memorándum Estratégico (IA Big Four)</div>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary, #aaaacc)", marginBottom: "20px", lineHeight: 1.5 }}>
                Genera un memorándum ejecutivo profundamente analítico redactado por IA. Este es el documento final narrativo.
                {markdown && " (El memorándum está guardado y fue cargado instantáneamente)."}
              </p>
              <button
                className="export-btn"
                style={{ ...S.exportButton, background: "linear-gradient(135deg, #10b981, #3b82f6)", marginBottom: "16px" }}
                onClick={handleGenerateIA}
                disabled={generatingIA}
              >
                {generatingIA ? "Analizando y Redactando..." : (markdown ? "Regenerar Memorándum (IA)" : "Paso 1: Generar Memorándum (IA)")}
              </button>
            </div>

          {/* Completion checklist card */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>
              Estado de Completitud ({completedModules}/{CHECKLIST_MODULES.length})
            </div>
            <div>
              {CHECKLIST_MODULES.map((mod) => {
                const count = (data[mod.key as keyof DashboardData] as number) || 0;
                const hasData = count > 0;
                return (
                  <div
                    key={mod.key}
                    style={{
                      ...S.checklistRow,
                      background: hasData
                        ? "rgba(34, 197, 94, 0.06)"
                        : "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* Status indicator */}
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: hasData ? "2px solid #22c55e" : "2px solid var(--border-color, #2a2a4a)",
                          background: hasData ? "#22c55e" : "transparent",
                          color: hasData ? "#fff" : "var(--text-muted)",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          transition: "all 0.2s ease",
                          flexShrink: 0,
                        }}
                      >
                        {hasData ? (
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                            <path
                              d="M5 10.5L8.5 14L15 7"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          "--"
                        )}
                      </div>
                      <span
                        style={{
                          ...S.checklistLabel,
                          color: hasData
                            ? "var(--text-primary, #eeeeff)"
                            : "var(--text-muted, #666688)",
                        }}
                      >
                        {mod.label}
                      </span>
                    </div>
                    <span
                      style={{
                        ...S.badge,
                        background: hasData
                          ? "rgba(34, 197, 94, 0.15)"
                          : "rgba(107, 114, 128, 0.15)",
                        color: hasData ? "#22c55e" : "var(--text-muted, #666688)",
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Avance general ── */}
        <div
          style={{
            ...S.sectionCard,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <div>
            <div style={S.sectionTitle}>Avance General del Plan</div>
            <p style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--primary-500, #6366f1)", lineHeight: 1, marginBottom: "6px" }}>
              {data.completion_pct}%
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #8888aa)" }}>
              {data.phases_done} de {data.phases_total} fases completadas
            </p>
          </div>
          {/* Progress bar */}
          <div style={{ flex: 1, maxWidth: "400px" }}>
            <div
              style={{
                width: "100%",
                height: "14px",
                borderRadius: "7px",
                background: "var(--bg-tertiary, #12121f)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(Math.max(data.completion_pct, 0), 100)}%`,
                  height: "100%",
                  borderRadius: "7px",
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  transition: "width 0.8s ease",
                  boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── IA Generated Document Area ── */}
        {markdown && !generatingIA && (
          <div style={{ marginTop: "40px" }} className="animate-fade-in no-print">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary-500)" }}>Documento Generado Exitosamente</h3>
              <div style={{ display: "flex", gap: "12px" }}>
                <button className="btn btn-ghost" onClick={() => window.print()} style={{ border: "1px solid #4b5563" }}>Paso 2A: Imprimir / Guardar como PDF</button>
                <button className="btn btn-secondary" onClick={handleExportPDF} style={{ background: "#2563eb", color: "white" }}>Paso 2B: Descargar PDF Directo</button>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center", paddingBottom: "60px" }}>
              <div 
                ref={contentRef}
                className="document-print-area"
                style={{
                  background: "#ffffff",
                  color: "#111827",
                  width: "100%",
                  maxWidth: "210mm",
                  minHeight: "297mm",
                  padding: "20mm",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                  borderRadius: "4px",
                  textAlign: "justify",
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                }}
              >
                <div className="markdown-body">
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Global styles for the generated markdown document */}
      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body h1 {
          font-size: 24pt;
          font-weight: 800;
          color: #1e3a8a;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
          margin-bottom: 24px;
          text-align: center;
        }
        .markdown-body h2 {
          font-size: 16pt;
          font-weight: 700;
          color: #2563eb;
          margin-top: 32px;
          margin-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 4px;
          page-break-after: avoid;
        }
        .markdown-body h3 {
          font-size: 13pt;
          font-weight: 600;
          color: #374151;
          margin-top: 24px;
          margin-bottom: 8px;
          page-break-after: avoid;
        }
        .markdown-body p {
          font-size: 11pt;
          line-height: 1.6;
          margin-bottom: 16px;
          color: #374151;
        }
        .markdown-body ul, .markdown-body ol {
          margin-top: 0;
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .markdown-body li {
          font-size: 11pt;
          line-height: 1.6;
          margin-bottom: 6px;
          color: #374151;
        }
        .markdown-body strong {
          font-weight: 700;
          color: #111827;
        }
        .markdown-body blockquote {
          border-left: 4px solid #10b981;
          padding-left: 16px;
          color: #1f2937;
          font-style: normal;
          font-weight: 500;
          margin: 20px 0;
          background: #f0fdf4;
          padding: 16px 20px;
          border-radius: 0 8px 8px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        @media print {
          body {
            background: white !important;
          }
          /* Ocultar la UI del dashboard */
          .no-print, header, nav, .sidebar { 
            display: none !important; 
          }
          /* Mostrar solo el area de impresion, asegurando que fluya naturalmente */
          .document-print-area {
            visibility: visible !important;
            display: block !important;
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .markdown-body p, .markdown-body li { page-break-inside: avoid; }
          .markdown-body h2 { page-break-before: always; }
        }
      `}} />
    </>
  );
}
