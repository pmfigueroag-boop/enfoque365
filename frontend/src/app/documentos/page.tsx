"use client";

import React, { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";

const DOC_TYPES = [
  { value: "normativa", label: "Normativa (Piramide de Kelsen)" },
  { value: "identidad", label: "Documentos de Identidad" },
  { value: "financiero", label: "Financieros" },
  { value: "marketing", label: "Marketing" },
  { value: "rrhh", label: "Recursos Humanos" },
  { value: "tic", label: "TIC" },
  { value: "operaciones", label: "Operaciones" },
  { value: "planificacion", label: "Planificacion" },
  { value: "organizacion", label: "Organizacion" },
  { value: "general", label: "Generales" },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("general");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [subtypes, setSubtypes] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [docs, subs] = await Promise.all([
        api.getDocuments().catch(() => []),
        api.getDocSubtypes().catch(() => ({})),
      ]);
      setDocuments(docs);
      setSubtypes(subs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setSelectedSubtype(""); }, [selectedDocType]);

  const currentSubtypes = subtypes[selectedDocType] || [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Formato no permitido. Solo: ${ALLOWED_EXTENSIONS.join(", ")}`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("El archivo excede el limite de 50 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      await api.uploadDocument(file, selectedDocType, selectedSubtype || undefined);
      await loadData();
    } catch (err: any) {
      setError("Error al subir: " + (err.message || "Error desconocido"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !linkTitle.trim()) {
      setError("URL y titulo son obligatorios.");
      return;
    }
    if (!linkUrl.startsWith("http://") && !linkUrl.startsWith("https://")) {
      setError("La URL debe comenzar con http:// o https://");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await api.addDocLink({
        url: linkUrl.trim(),
        title: linkTitle.trim(),
        doc_type: selectedDocType,
        doc_subtype: selectedSubtype || undefined,
      });
      setLinkUrl("");
      setLinkTitle("");
      await loadData();
    } catch (err: any) {
      setError("Error al registrar enlace: " + (err.message || "Error desconocido"));
    } finally {
      setUploading(false);
    }
  };

  const handleRefresh = async (id: number) => {
    setRefreshingId(id);
    try {
      await api.refreshDocLink(id);
      await loadData();
    } catch (err: any) {
      setError("Error al actualizar: " + (err.message || "Error desconocido"));
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteDocument(id);
      setDeleteConfirmId(null);
      await loadData();
    } catch (err: any) {
      setError("Error al eliminar: " + (err.message || "Error desconocido"));
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    try {
      return new Date(dateStr).toLocaleDateString("es-DO", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return dateStr; }
  };

  const getDocTypeLabel = (value: string) =>
    DOC_TYPES.find((d) => d.value === value)?.label || value;

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Documentos Institucionales</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  const selectStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border-color)", fontSize: "0.85rem",
    fontFamily: "inherit", background: "var(--bg-secondary)", color: "var(--text-primary)",
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle, outline: "none",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 20px", border: "none", cursor: "pointer",
    fontFamily: "inherit", fontWeight: 600, fontSize: "0.82rem",
    borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
    background: active ? "var(--bg-tertiary)" : "transparent",
    color: active ? "var(--primary-400)" : "var(--text-muted)",
    borderBottom: active ? "2px solid var(--primary-500)" : "2px solid transparent",
    transition: "all 0.2s ease",
  });

  return (
    <>
      <header className="header">
        <h2 className="header-title">Documentos Institucionales</h2>
      </header>

      <div className="page-content animate-fade-in">
        {/* Upload / Link Section */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Agregar Documento</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {mode === "file" ? "PDF, DOCX, TXT | Max: 50 MB" : "Extraccion automatica de contenido"}
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border-color)", marginBottom: "0" }}>
            <button style={tabStyle(mode === "file")} onClick={() => setMode("file")}>
              Subir Archivo
            </button>
            <button style={tabStyle(mode === "link")} onClick={() => setMode("link")}>
              Agregar Enlace
            </button>
          </div>

          <div style={{ padding: "16px", background: "var(--bg-tertiary)", borderRadius: "0 0 var(--radius-sm) var(--radius-sm)" }}>
            {/* Tipo + Subtipo (compartidos) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Tipo de Documento
                </label>
                <select value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)} style={selectStyle}>
                  {DOC_TYPES.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                  Subtipo
                </label>
                <select
                  value={selectedSubtype}
                  onChange={(e) => setSelectedSubtype(e.target.value)}
                  style={{ ...selectStyle, opacity: currentSubtypes.length === 0 ? 0.5 : 1 }}
                  disabled={currentSubtypes.length === 0}
                >
                  <option value="">-- Seleccionar subtipo --</option>
                  {currentSubtypes.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
            </div>

            {/* Modo Archivo */}
            {mode === "file" && (
              <div>
                <input
                  ref={fileInputRef} type="file" accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect} disabled={uploading}
                  style={{ display: "none" }} id="doc-file-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Subiendo..." : "Seleccionar Archivo"}
                </button>
              </div>
            )}

            {/* Modo Enlace */}
            {mode === "link" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    URL
                  </label>
                  <input
                    type="url" value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://ejemplo.gob.do/ley-107-13.pdf"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: "4px", color: "var(--text-secondary)" }}>
                    Titulo descriptivo
                  </label>
                  <input
                    type="text" value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Ley 107-13 sobre derechos de las personas"
                    style={inputStyle}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleAddLink}
                  disabled={uploading || !linkUrl.trim() || !linkTitle.trim()}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {uploading ? "Extrayendo..." : "Agregar Enlace"}
                </button>
              </div>
            )}

            {error && (
              <div style={{
                marginTop: "12px", padding: "10px 14px", borderRadius: "var(--radius-sm)",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                color: "var(--danger)", fontSize: "0.83rem",
              }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Documents Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Acervo Documental</h3>
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "2px 10px",
              borderRadius: "999px", background: "rgba(99,102,241,0.12)", color: "var(--primary-500)",
            }}>
              {documents.length} documento{documents.length !== 1 ? "s" : ""}
            </span>
          </div>

          {documents.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontStyle: "italic", padding: "16px 0" }}>
              No hay documentos cargados. Sube un archivo o agrega un enlace para alimentar el contexto del Agente IA.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                    {["Fuente", "Nombre", "Tipo", "Subtipo", "Caracteres", "Fecha", ""].map((h, i) => (
                      <th key={i} style={{
                        textAlign: "left", padding: "10px 12px", fontSize: "0.75rem",
                        fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)",
                        letterSpacing: "0.05em",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc: any) => {
                    const isLink = doc.source_type === "link";
                    return (
                      <React.Fragment key={doc.id}>
                      <tr
                        style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.15s ease" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Source badge */}
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px",
                            borderRadius: "999px", textTransform: "uppercase",
                            background: isLink ? "rgba(59,130,246,0.1)" : "rgba(99,102,241,0.08)",
                            color: isLink ? "rgb(96,165,250)" : "var(--primary-500)",
                          }}>
                            {isLink ? "LINK" : (doc.file_type || "FILE").toUpperCase()}
                          </span>
                        </td>

                        {/* Name */}
                        <td style={{ padding: "12px", fontWeight: 500 }}>
                          <div style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {isLink && doc.url ? (
                              <a
                                href={doc.url} target="_blank" rel="noopener noreferrer"
                                style={{ color: "var(--primary-400)", textDecoration: "none" }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                              >
                                {doc.filename}
                              </a>
                            ) : doc.filename || "--"}
                          </div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 600, padding: "2px 8px",
                            borderRadius: "999px", background: "rgba(16,185,129,0.1)", color: "var(--success)",
                          }}>
                            {getDocTypeLabel(doc.doc_type)}
                          </span>
                        </td>

                        {/* Subtype */}
                        <td style={{ padding: "12px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {doc.doc_subtype || "--"}
                        </td>

                        {/* Chars */}
                        <td style={{ padding: "12px", fontVariantNumeric: "tabular-nums" }}>
                          {doc.char_count != null ? doc.char_count.toLocaleString("es-DO") : "--"}
                        </td>

                        {/* Date */}
                        <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {formatDate(doc.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            {/* Preview toggle */}
                            {doc.char_count > 0 && (
                              <button
                                onClick={() => setPreviewId(previewId === doc.id ? null : doc.id)}
                                style={{
                                  background: previewId === doc.id ? "rgba(99,102,241,0.15)" : "none",
                                  border: previewId === doc.id ? "1px solid rgba(99,102,241,0.3)" : "none",
                                  color: previewId === doc.id ? "var(--primary-400)" : "var(--text-muted)",
                                  cursor: "pointer", fontSize: "0.78rem", padding: "2px 8px",
                                  borderRadius: "var(--radius-sm)",
                                  transition: "all 0.15s", fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => { if (previewId !== doc.id) e.currentTarget.style.color = "var(--primary-400)"; }}
                                onMouseLeave={(e) => { if (previewId !== doc.id) e.currentTarget.style.color = "var(--text-muted)"; }}
                              >
                                {previewId === doc.id ? "Ocultar" : "Ver"}
                              </button>
                            )}

                            {/* Refresh button for links */}
                            {isLink && (
                              <button
                                onClick={() => handleRefresh(doc.id)}
                                disabled={refreshingId === doc.id}
                                title="Actualizar contenido"
                                style={{
                                  background: "none", border: "none", color: "var(--text-muted)",
                                  cursor: "pointer", fontSize: "0.78rem", padding: "2px 6px",
                                  transition: "color 0.15s",
                                  opacity: refreshingId === doc.id ? 0.4 : 1,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-400)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                              >
                                {refreshingId === doc.id ? "..." : "Actualizar"}
                              </button>
                            )}

                            {/* Delete */}
                            {deleteConfirmId === doc.id ? (
                              <>
                                <button
                                  onClick={() => handleDelete(doc.id)}
                                  style={{
                                    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                                    color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem",
                                    fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)",
                                    fontFamily: "inherit",
                                  }}
                                >Confirmar</button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="btn btn-ghost"
                                  style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                                >No</button>
                              </>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(doc.id)}
                                style={{
                                  background: "none", border: "none", color: "var(--text-muted)",
                                  cursor: "pointer", fontSize: "0.85rem", padding: "2px 6px",
                                  transition: "color 0.15s",
                                }}
                                title="Eliminar"
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                              >X</button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Preview panel */}
                      {previewId === doc.id && doc.extracted_text && (
                        <tr>
                          <td colSpan={7} style={{ padding: 0 }}>
                            <div style={{
                              padding: "16px 20px",
                              background: "var(--bg-tertiary)",
                              borderTop: "1px solid var(--border-color)",
                              borderBottom: "1px solid rgba(99,102,241,0.15)",
                            }}>
                              <div style={{
                                display: "flex", justifyContent: "space-between",
                                alignItems: "center", marginBottom: "8px",
                              }}>
                                <span style={{
                                  fontSize: "0.75rem", fontWeight: 700,
                                  textTransform: "uppercase" as const,
                                  letterSpacing: "0.06em",
                                  color: "var(--text-muted)",
                                }}>
                                  Texto extraido ({doc.char_count?.toLocaleString("es-DO") || 0} caracteres) -- Este contenido alimenta la IA
                                </span>
                                <button
                                  onClick={() => setPreviewId(null)}
                                  style={{
                                    background: "none", border: "none",
                                    color: "var(--text-muted)", cursor: "pointer",
                                    fontSize: "0.78rem", fontFamily: "inherit",
                                  }}
                                >Cerrar</button>
                              </div>
                              <pre style={{
                                whiteSpace: "pre-wrap", wordBreak: "break-word",
                                fontSize: "0.78rem", lineHeight: 1.6,
                                color: "var(--text-secondary)",
                                maxHeight: "300px", overflowY: "auto",
                                padding: "12px", borderRadius: "var(--radius-sm)",
                                background: "var(--bg-secondary)",
                                border: "1px solid var(--border-color)",
                                margin: 0, fontFamily: "inherit",
                              }}>
                                {doc.extracted_text.length > 5000
                                  ? doc.extracted_text.slice(0, 5000) + "\n\n[... truncado para vista previa ...]"
                                  : doc.extracted_text}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload/Link overlay */}
      {uploading && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 9999,
        }}>
          <div style={{
            background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)", padding: "32px 40px", textAlign: "center",
          }}>
            <div style={{
              width: "40px", height: "40px", border: "3px solid var(--border-color)",
              borderTopColor: "var(--primary-500)", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
            }} />
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>
              {mode === "file" ? "Subiendo documento..." : "Extrayendo contenido del enlace..."}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "4px" }}>
              {mode === "file" ? "Procesando archivo" : "Descargando y convirtiendo a texto"}
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
