"use client";
import { useToast } from '../../components/Toast';

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const TIPO_OPTIONS = [
  { value: "publico", label: "Publico" },
  { value: "privado", label: "Privado" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-color)",
  background: "var(--bg-tertiary)",
  color: "var(--text-primary)",
  fontSize: "0.85rem",
  fontFamily: "inherit",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "100px",
  resize: "vertical",
  lineHeight: "1.6",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
  color: "var(--text-secondary)",
};

const readOnlyValueStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 500,
  color: "var(--text-primary)",
};

export default function ConfiguracionInstitucionPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Editable fields — Datos Institucionales
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [tipo, setTipo] = useState("publico");
  const [paisIso, setPaisIso] = useState("");
  const [sectorCiiu, setSectorCiiu] = useState("");
  const [divisionCiiu, setDivisionCiiu] = useState("");
  const [grupoCiiu, setGrupoCiiu] = useState("");
  const [claseCiiu, setClaseCiiu] = useState("");

  // Identidad PEI — Mision, Vision, Valores
  const [mision, setMision] = useState("");
  const [vision, setVision] = useState("");
  const [savingIdentidad, setSavingIdentidad] = useState(false);
  const [valores, setValores] = useState<any[]>([]);
  const [nuevoValorNombre, setNuevoValorNombre] = useState("");
  const [nuevoValorDesc, setNuevoValorDesc] = useState("");
  const [addingValor, setAddingValor] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await api.getTenantProfile();
      setProfile(data);
      setName(data.name || "");
      setTaxId(data.tax_id || "");
      setTipo(data.tipo || "publico");
      setPaisIso(data.pais_iso || "");
      setSectorCiiu(data.sector_ciiu || "");
      setDivisionCiiu(data.sector_ciiu_division || "");
      setGrupoCiiu(data.sector_ciiu_grupo || "");
      setClaseCiiu(data.sector_ciiu_clase || "");
    } catch (e: any) {
      toast.error("Error al cargar perfil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadIdentidad = async () => {
    try {
      const data = await api.getIdentidad();
      setMision(data.mision || "");
      setVision(data.vision || "");
    } catch {
      // Plan may not exist yet — leave empty
    }
  };

  const loadValores = async () => {
    try {
      const data = await api.getValores();
      setValores(data || []);
    } catch {
      // Plan may not exist yet
    }
  };

  useEffect(() => {
    loadProfile();
    loadIdentidad();
    loadValores();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre de la institucion es requerido.");
      return;
    }
    setSaving(true);
    try {
      await api.updateTenant({
        name: name.trim(),
        tax_id: taxId.trim(),
        tipo,
        pais_iso: paisIso.trim().toUpperCase(),
        sector_ciiu: sectorCiiu.trim().toUpperCase(),
        sector_ciiu_division: divisionCiiu.trim(),
        sector_ciiu_grupo: grupoCiiu.trim(),
        sector_ciiu_clase: claseCiiu.trim(),
      });
      toast.success("Cambios guardados exitosamente.");
      loadProfile();
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIdentidad = async () => {
    setSavingIdentidad(true);
    try {
      await api.updateIdentidad({
        mision: mision.trim(),
        vision: vision.trim(),
      });
      toast.success("Mision y Vision guardadas exitosamente.");
    } catch (e: any) {
      toast.error("Error al guardar identidad: " + e.message);
    } finally {
      setSavingIdentidad(false);
    }
  };

  const handleAddValor = async () => {
    if (!nuevoValorNombre.trim()) {
      toast.error("El nombre del valor es requerido.");
      return;
    }
    setAddingValor(true);
    try {
      await api.createValor({
        nombre: nuevoValorNombre.trim(),
        descripcion: nuevoValorDesc.trim() || undefined,
        orden: valores.length,
      });
      setNuevoValorNombre("");
      setNuevoValorDesc("");
      toast.success("Valor agregado.");
      loadValores();
    } catch (e: any) {
      toast.error("Error al agregar valor: " + e.message);
    } finally {
      setAddingValor(false);
    }
  };

  const handleDeleteValor = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar el valor "${nombre}"?`)) return;
    try {
      await api.deleteValor(id);
      toast.success("Valor eliminado.");
      loadValores();
    } catch (e: any) {
      toast.error("Error al eliminar: " + e.message);
    }
  };

  const handleDeactivate = async () => {
    const confirmName = prompt(
      "Para confirmar la desactivacion, escribe el nombre exacto de la institucion:"
    );
    if (confirmName === null) return;
    if (confirmName !== name) {
      toast.error("El nombre no coincide. Operacion cancelada.");
      return;
    }
    setDeactivating(true);
    try {
      await api.deactivateTenant();
      toast.success("Institucion desactivada.");
    } catch (e: any) {
      toast.error("Error al desactivar: " + e.message);
    } finally {
      setDeactivating(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "---";
    const d = new Date(iso);
    return d.toLocaleDateString("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <header className="header"><h2 className="header-title">Configuracion Institucional</h2></header>
        <div className="page-content"><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
      </>
    );
  }

  return (
    <>
      <header className="header">
        <h2 className="header-title">Configuracion Institucional</h2>
      </header>

      <div className="page-content animate-fade-in">
        {/* ── Formulario editable ── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Datos de la Institucion</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "0 0 8px" }}>
            {/* Nombre */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nombre de la Institucion</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre oficial de la institucion"
                style={inputStyle}
              />
            </div>

            {/* RNC */}
            <div>
              <label style={labelStyle}>Identificador Fiscal / RNC</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Ej: 401-50021-1"
                style={inputStyle}
              />
            </div>

            {/* Tipo */}
            <div>
              <label style={labelStyle}>Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {TIPO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Pais ISO */}
            <div>
              <label style={labelStyle}>Pais ISO (2 caracteres)</label>
              <input
                type="text"
                value={paisIso}
                onChange={(e) => setPaisIso(e.target.value.slice(0, 2))}
                placeholder="DO"
                maxLength={2}
                style={{ ...inputStyle, textTransform: "uppercase" }}
              />
            </div>

            {/* Sector CIIU Seccion */}
            <div>
              <label style={labelStyle}>Sector CIIU - Seccion (A-U)</label>
              <input
                type="text"
                value={sectorCiiu}
                onChange={(e) => setSectorCiiu(e.target.value.slice(0, 1).toUpperCase())}
                placeholder="O"
                maxLength={1}
                style={{ ...inputStyle, textTransform: "uppercase" }}
              />
            </div>

            {/* Division CIIU */}
            <div>
              <label style={labelStyle}>Division CIIU (2 digitos)</label>
              <input
                type="text"
                value={divisionCiiu}
                onChange={(e) => setDivisionCiiu(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="84"
                maxLength={2}
                style={inputStyle}
              />
            </div>

            {/* Grupo CIIU */}
            <div>
              <label style={labelStyle}>Grupo CIIU (3 digitos)</label>
              <input
                type="text"
                value={grupoCiiu}
                onChange={(e) => setGrupoCiiu(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="841"
                maxLength={3}
                style={inputStyle}
              />
            </div>

            {/* Clase CIIU */}
            <div>
              <label style={labelStyle}>Clase CIIU (4 digitos)</label>
              <input
                type="text"
                value={claseCiiu}
                onChange={(e) => setClaseCiiu(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="8411"
                maxLength={4}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border-color)", marginTop: "8px" }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: "160px" }}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* ── Mision y Vision ── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.1em" }}>🎯</span>
              Mision y Vision
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
              Declaraciones fundamentales que guian la direccion estrategica de la institucion.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", padding: "0 0 8px" }}>
            {/* Mision */}
            <div>
              <label style={labelStyle}>
                Mision
                <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>
                  — Razon de ser de la institucion
                </span>
              </label>
              <textarea
                value={mision}
                onChange={(e) => setMision(e.target.value)}
                placeholder="Describe el proposito fundamental de la institucion, a quien sirve y como crea valor..."
                style={textareaStyle}
              />
            </div>

            {/* Vision */}
            <div>
              <label style={labelStyle}>
                Vision
                <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}>
                  — Estado futuro deseado
                </span>
              </label>
              <textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Describe la aspiracion a largo plazo de la institucion, lo que busca lograr o convertirse..."
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border-color)", marginTop: "8px" }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveIdentidad}
              disabled={savingIdentidad}
              style={{ minWidth: "160px" }}
            >
              {savingIdentidad ? "Guardando..." : "Guardar Mision y Vision"}
            </button>
          </div>
        </div>

        {/* ── Valores Institucionales ── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.1em" }}>💎</span>
              Valores Institucionales
            </h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
              Principios y creencias que guian el comportamiento y la toma de decisiones.
            </p>
          </div>

          {/* Lista de valores existentes */}
          {valores.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              {valores.map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: i % 2 === 0 ? "var(--bg-tertiary)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                >
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
                    color: "#fff",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                      {v.nombre}
                    </div>
                    {v.descripcion && (
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.5" }}>
                        {v.descripcion}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteValor(v.id, v.nombre)}
                    title="Eliminar valor"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      fontSize: "1rem",
                      padding: "4px 8px",
                      borderRadius: "var(--radius-sm)",
                      transition: "color 0.2s ease, background 0.2s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--danger)";
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {valores.length === 0 && (
            <p style={{
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              fontStyle: "italic",
              padding: "12px 0",
              marginBottom: "16px",
            }}>
              No hay valores definidos aun. Agrega los principios que guian a tu institucion.
            </p>
          )}

          {/* Formulario para agregar nuevo valor */}
          <div style={{
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed var(--border-color)",
            background: "var(--bg-secondary)",
          }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>
              Agregar Valor
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "12px", alignItems: "end" }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: "4px" }}>Nombre</label>
                <input
                  type="text"
                  value={nuevoValorNombre}
                  onChange={(e) => setNuevoValorNombre(e.target.value)}
                  placeholder="Ej: Transparencia"
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddValor(); }}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: "4px" }}>Descripcion (opcional)</label>
                <input
                  type="text"
                  value={nuevoValorDesc}
                  onChange={(e) => setNuevoValorDesc(e.target.value)}
                  placeholder="Breve descripcion del valor..."
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddValor(); }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAddValor}
                disabled={addingValor || !nuevoValorNombre.trim()}
                style={{ minWidth: "100px", height: "40px" }}
              >
                {addingValor ? "..." : "+ Agregar"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Informacion de solo lectura ── */}
        <div className="card" style={{ marginBottom: "24px" }}>
          <div className="card-header">
            <h3 className="card-title">Informacion del Sistema</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
            <div>
              <label style={labelStyle}>Fecha de Creacion</label>
              <span style={readOnlyValueStyle}>
                {formatDate(profile?.created_at)}
              </span>
            </div>

            <div>
              <label style={labelStyle}>Estado</label>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  padding: "4px 14px",
                  borderRadius: "999px",
                  display: "inline-block",
                  background: profile?.is_active
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                  color: profile?.is_active
                    ? "var(--success)"
                    : "var(--danger)",
                }}
              >
                {profile?.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div>
              <label style={labelStyle}>ID del Tenant</label>
              <span style={{ ...readOnlyValueStyle, fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {profile?.id ?? "---"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Zona de Peligro ── */}
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, rgba(127, 29, 29, 0.35) 0%, rgba(153, 27, 27, 0.18) 100%)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div className="card-header">
            <h3 className="card-title" style={{ color: "var(--danger)" }}>Zona de Peligro</h3>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.6" }}>
            Desactivar esta institucion eliminara el acceso de todos los usuarios.
            Esta accion se puede revertir contactando al administrador.
          </p>

          <button
            className="btn"
            onClick={handleDeactivate}
            disabled={deactivating}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "var(--danger)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              fontWeight: 600,
              minWidth: "200px",
              transition: "background 0.2s ease, border-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
            }}
          >
            {deactivating ? "Desactivando..." : "Desactivar Institucion"}
          </button>
        </div>
      </div>
    </>
  );
}
