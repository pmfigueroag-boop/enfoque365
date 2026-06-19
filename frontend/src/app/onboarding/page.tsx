"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setSession } from "../lib/api";
import { COUNTRIES } from "../lib/countries";
import { CIIU_SECCIONES, CIIU_DIVISIONES, CIIU_GRUPOS, CIIU_CLASES } from "../lib/ciiu";

const STEPS = [
  { num: 1, label: "Institucion" },
  { num: 2, label: "Sector" },
  { num: 3, label: "Administrador" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-color)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  display: "block",
  marginBottom: "6px",
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: "",
    tax_id: "",
    tipo: "publico",
    pais_iso: "DO",
    sector_ciiu: "O",
    sector_ciiu_division: "",
    sector_ciiu_grupo: "",
    sector_ciiu_clase: "",
    admin_email: "",
    admin_full_name: "",
    admin_password: "",
    admin_password_confirm: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  // Get tax label for selected country
  const selectedCountry = COUNTRIES.find((c) => c.code === form.pais_iso);
  const taxLabel = selectedCountry?.tax_label || "Tax ID";

  // Get cascading CIIU data
  const divisions = CIIU_DIVISIONES[form.sector_ciiu] || [];
  const grupos = form.sector_ciiu_division ? (CIIU_GRUPOS[form.sector_ciiu_division] || []) : [];
  const clases = form.sector_ciiu_grupo ? (CIIU_CLASES[form.sector_ciiu_grupo] || []) : [];

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.name.trim()) { setError("Ingrese el nombre de la institucion."); return false; }
      if (!form.tax_id.trim()) { setError(`Ingrese el ${taxLabel}.`); return false; }
    }
    if (step === 2) {
      if (!form.sector_ciiu) { setError("Seleccione un sector CIIU."); return false; }
    }
    if (step === 3) {
      if (!form.admin_full_name.trim()) { setError("Ingrese el nombre del administrador."); return false; }
      if (!form.admin_email.trim()) { setError("Ingrese el correo electronico."); return false; }
      if (!form.admin_password || form.admin_password.length < 6) { setError("La contrasena debe tener al menos 6 caracteres."); return false; }
      if (form.admin_password !== form.admin_password_confirm) { setError("Las contrasenas no coinciden."); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setError("");
    try {
      const { admin_password_confirm, ...payload } = form;
      const result = await api.onboarding(payload);
      setSession(result.tenant_id, result.user_email);
      setSuccess(result);
    } catch (err: any) {
      setError(err.message || "Error al registrar la institucion.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──
  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: "24px" }}>
        <div className="card animate-fade-in" style={{ maxWidth: "520px", width: "100%", textAlign: "center", padding: "48px 32px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--success)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "12px", color: "var(--text-primary)" }}>Registro Exitoso</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "8px" }}>{success.message}</p>
          <div style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", padding: "16px", margin: "24px 0", textAlign: "left" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tenant ID</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary-500)", marginBottom: "12px" }}>{success.tenant_id}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Correo</p>
            <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{success.user_email}</p>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", marginTop: "8px" }} onClick={() => router.push("/")}>
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Wizard ──
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: "24px" }}>
      <div className="card animate-fade-in" style={{ maxWidth: "580px", width: "100%", padding: "40px 32px" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary-500)", letterSpacing: "-0.5px" }}>ENFOQUE 365</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>Strategy as a Service</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
          {STEPS.map((s) => (
            <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: step >= s.num ? "var(--primary-500)" : "var(--bg-tertiary)",
                color: step >= s.num ? "#fff" : "var(--text-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700,
                transition: "all 0.3s ease",
              }}>
                {s.num}
              </div>
              <span style={{ fontSize: "0.75rem", color: step === s.num ? "var(--text-primary)" : "var(--text-muted)", fontWeight: step === s.num ? 600 : 400 }}>
                {s.label}
              </span>
              {s.num < 3 && <div style={{ width: "24px", height: "2px", background: step > s.num ? "var(--primary-500)" : "var(--bg-tertiary)", marginLeft: "4px" }} />}
            </div>
          ))}
        </div>

        {/* Step 1: Institucion */}
        {step === 1 && (
          <div className="animate-slide-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Datos de la Institucion</h3>

            <div>
              <label style={labelStyle}>Nombre de la Institucion</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ej: Ministerio de Economia" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Tipo</label>
              <div style={{ display: "flex", gap: "12px" }}>
                {["publico", "privado"].map((t) => (
                  <button key={t} onClick={() => update("tipo", t)}
                    className={`btn ${form.tipo === t ? "btn-primary" : "btn-ghost"}`}
                    style={{ flex: 1, textTransform: "capitalize" }}>
                    {t === "publico" ? "Publica" : "Privada"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Pais</label>
              <select value={form.pais_iso} onChange={(e) => update("pais_iso", e.target.value)} style={inputStyle}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>{taxLabel} (Identificador Fiscal)</label>
              <input type="text" value={form.tax_id} onChange={(e) => update("tax_id", e.target.value)} placeholder={`Ej: ${taxLabel} de la institucion`} style={inputStyle} />
            </div>
          </div>
        )}

        {/* Step 2: Sector */}
        {step === 2 && (
          <div className="animate-slide-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Sector Industrial (CIIU Rev.4)</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "-12px" }}>
              Clasificacion Internacional Industrial Uniforme de las Naciones Unidas
            </p>

            <div>
              <label style={labelStyle}>Seccion</label>
              <select value={form.sector_ciiu} onChange={(e) => { update("sector_ciiu", e.target.value); update("sector_ciiu_division", ""); update("sector_ciiu_grupo", ""); update("sector_ciiu_clase", ""); }} style={inputStyle}>
                {CIIU_SECCIONES.map((s) => (
                  <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            {divisions.length > 0 && (
              <div>
                <label style={labelStyle}>Division</label>
                <select value={form.sector_ciiu_division} onChange={(e) => { update("sector_ciiu_division", e.target.value); update("sector_ciiu_grupo", ""); update("sector_ciiu_clase", ""); }} style={inputStyle}>
                  <option value="">-- Seleccionar division --</option>
                  {divisions.map((d) => (
                    <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {grupos.length > 0 && (
              <div>
                <label style={labelStyle}>Grupo</label>
                <select value={form.sector_ciiu_grupo} onChange={(e) => { update("sector_ciiu_grupo", e.target.value); update("sector_ciiu_clase", ""); }} style={inputStyle}>
                  <option value="">-- Seleccionar grupo --</option>
                  {grupos.map((g) => (
                    <option key={g.code} value={g.code}>{g.code} - {g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {clases.length > 0 && (
              <div>
                <label style={labelStyle}>Clase</label>
                <select value={form.sector_ciiu_clase} onChange={(e) => update("sector_ciiu_clase", e.target.value)} style={inputStyle}>
                  <option value="">-- Seleccionar clase --</option>
                  {clases.map((c) => (
                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Admin */}
        {step === 3 && (
          <div className="animate-slide-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Usuario Administrador</h3>

            <div>
              <label style={labelStyle}>Nombre Completo</label>
              <input type="text" value={form.admin_full_name} onChange={(e) => update("admin_full_name", e.target.value)} placeholder="Nombre y apellido" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Correo Electronico</label>
              <input type="email" value={form.admin_email} onChange={(e) => update("admin_email", e.target.value)} placeholder="admin@institucion.gob.do" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Contrasena</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={form.admin_password} onChange={(e) => update("admin_password", e.target.value)} placeholder="Minimo 6 caracteres" style={inputStyle} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "inherit" }}>
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Confirmar Contrasena</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={form.admin_password_confirm} onChange={(e) => update("admin_password_confirm", e.target.value)} placeholder="Repetir contrasena" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: "16px", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", gap: "12px" }}>
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Atras</button>
          ) : <div />}

          {step < 3 ? (
            <button className="btn btn-primary" onClick={handleNext}>Siguiente</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ minWidth: "160px" }}>
              {submitting ? "Registrando..." : "Registrar Institucion"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
