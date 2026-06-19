"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getSession, setSession } from "../lib/api";

const NAV_ITEMS = [
  {
    section: "Diagnostico Externo",
    items: [
      { href: "/diagnostico/pestel", label: "PESTEL" },
      { href: "/diagnostico/porter", label: "Porter 5 Fuerzas" },
    ],
  },
  {
    section: "Diagnostico Interno",
    items: [
      { href: "/diagnostico/vrio", label: "VRIO" },
      { href: "/diagnostico/mckinsey7s", label: "McKinsey 7S" },
      { href: "/diagnostico/bcg", label: "BCG Matrix" },
    ],
  },
  {
    section: "Sintesis Estrategica",
    items: [
      { href: "/diagnostico/foda", label: "FODA (SWOT)" },
      { href: "/diagnostico/tows", label: "TOWS" },
    ],
  },
  {
    section: "Formulacion Core",
    items: [
      { href: "/formulacion/p2w", label: "Playing to Win (P2W)" },
      { href: "/formulacion/kernel", label: "Kernel (Rumelt)" },
      { href: "/formulacion/blue-ocean", label: "Blue Ocean" },
    ],
  },
  {
    section: "Despliegue (PEI)",
    items: [
      { href: "/pei/identidad", label: "Identidad Institucional" },
      { href: "/pei/arbol", label: "Arbol Estrategico" },
      { href: "/pei/indicadores", label: "Indicadores KPI" },
      { href: "/pei/key-results", label: "Key Results (OKR)" },
      { href: "/pei/mapa", label: "Mapa BSC" },
      { href: "/despliegue/hoshin", label: "Hoshin Kanri" },
    ],
  },
];

const ADMIN_SECTIONS = [
  {
    section: "Administracion",
    items: [
      { href: "/planes", label: "Planes Estrategicos" },
      { href: "/configuracion/institucion", label: "Mi Institucion" },
      { href: "/admin/usuarios", label: "Usuarios" },
      { href: "/documentos", label: "Documentos" },
      { href: "/onboarding", label: "Registrar Institucion" },
    ],
  },
  {
    section: "Inteligencia Artificial",
    items: [
      { href: "/ia/inbox", label: "Inbox IA (HITL)" },
      { href: "/ia/governance", label: "Gobernanza IA" },
      { href: "/wargaming", label: "Wargaming" },
    ],
  },
  {
    section: "Reportes",
    items: [
      { href: "/diagnostico/reporte", label: "Reporte Integral PDF" },
      { href: "/export", label: "Exportar Plan" },
    ],
  },
];

interface TenantOption {
  id: number;
  name: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const session = getSession();
    setCurrentTenantId(session.tenantId);
    api
      .getTenants()
      .then((list) => setTenants(list))
      .catch(() => {});
  }, []);

  // Auto-expand la seccion que contiene la pagina activa
  useEffect(() => {
    const allSections = [...NAV_ITEMS, ...ADMIN_SECTIONS];
    const activeSections = allSections
      .filter((section) =>
        section.items.some((item) =>
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        )
      )
      .map((s) => s.section);
    if (activeSections.length > 0) {
      setExpandedSections(new Set(activeSections));
    }
  }, [pathname]);

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenantId = e.target.value;
    const session = getSession();
    setSession(Number(newTenantId), session.email);
    setCurrentTenantId(newTenantId);
    window.location.reload();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>ENFOQUE 365</h1>
        <span>Strategy as a Service</span>
      </div>

      {/* Tenant Selector */}
      {tenants.length > 0 && (
        <div
          style={{
            padding: "0 16px 12px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <label
            style={{
              fontSize: "0.65rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
              display: "block",
              marginBottom: "6px",
            }}
          >
            Institucion activa
          </label>
          <select
            value={currentTenantId}
            onChange={handleTenantChange}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              fontSize: "0.8rem",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <nav className="sidebar-nav">
        {/* Secciones colapsables */}
        {NAV_ITEMS.map((section) => {
          const isExpanded = expandedSections.has(section.section);
          const hasActiveChild = section.items.some((item) =>
            isActive(item.href)
          );

          return (
            <div key={section.section} className="nav-section">
              <button
                onClick={() => toggleSection(section.section)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: hasActiveChild
                    ? "rgba(99, 102, 241, 0.08)"
                    : "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s ease",
                  borderRadius: "var(--radius-sm)",
                  margin: "2px 0",
                }}
                onMouseEnter={(e) => {
                  if (!hasActiveChild)
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!hasActiveChild)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    flex: 1,
                    textAlign: "left",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                    color: hasActiveChild
                      ? "var(--primary-400)"
                      : "var(--text-secondary)",
                  }}
                >
                  {section.section}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "1px 6px",
                    borderRadius: "8px",
                    marginRight: "8px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {section.items.length}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    transition: "transform 0.2s ease",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}
                >
                  ›
                </span>
              </button>

              {/* Sub-items con animacion */}
              <div
                style={{
                  overflow: "hidden",
                  maxHeight: isExpanded
                    ? `${section.items.length * 42}px`
                    : "0px",
                  transition: "max-height 0.25s ease-out, opacity 0.2s ease",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div
                  style={{
                    borderLeft: hasActiveChild
                      ? "2px solid var(--primary-500)"
                      : "2px solid rgba(255,255,255,0.06)",
                    marginLeft: "28px",
                    paddingLeft: "0",
                  }}
                >
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                      style={{
                        paddingLeft: "14px",
                        fontSize: "0.8rem",
                        display: "block",
                        padding: "8px 14px",
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Dashboard link */}
        <Link
          href="/"
          className={`nav-item ${isActive("/") ? "active" : ""}`}
          style={{
            display: "block",
            padding: "10px 16px",
            fontSize: "0.82rem",
            fontWeight: 600,
            borderBottom: "1px solid var(--border-color)",
            marginBottom: "4px",
          }}
        >
          Dashboard
        </Link>

        {/* Separador */}
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            margin: "12px 16px",
          }}
        />

        {/* Admin sections colapsables */}
        {ADMIN_SECTIONS.map((section) => {
          const isExpanded = expandedSections.has(section.section);
          const hasActiveChild = section.items.some((item) =>
            isActive(item.href)
          );

          return (
            <div key={section.section} className="nav-section">
              <button
                onClick={() => toggleSection(section.section)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: hasActiveChild
                    ? "rgba(99, 102, 241, 0.08)"
                    : "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.2s ease",
                  borderRadius: "var(--radius-sm)",
                  margin: "2px 0",
                }}
                onMouseEnter={(e) => {
                  if (!hasActiveChild)
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.04)";
                }}
                onMouseLeave={(e) => {
                  if (!hasActiveChild)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    flex: 1,
                    textAlign: "left",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                    color: hasActiveChild
                      ? "var(--primary-400)"
                      : "var(--text-secondary)",
                  }}
                >
                  {section.section}
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.06)",
                    padding: "1px 6px",
                    borderRadius: "8px",
                    marginRight: "8px",
                    minWidth: "18px",
                    textAlign: "center",
                  }}
                >
                  {section.items.length}
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    transition: "transform 0.2s ease",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}
                >
                  {'›'}
                </span>
              </button>

              <div
                style={{
                  overflow: "hidden",
                  maxHeight: isExpanded
                    ? `${section.items.length * 42}px`
                    : "0px",
                  transition: "max-height 0.25s ease-out, opacity 0.2s ease",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                <div
                  style={{
                    borderLeft: hasActiveChild
                      ? "2px solid var(--primary-500)"
                      : "2px solid rgba(255,255,255,0.06)",
                    marginLeft: "28px",
                    paddingLeft: "0",
                  }}
                >
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                      style={{
                        paddingLeft: "14px",
                        fontSize: "0.8rem",
                        display: "block",
                        padding: "8px 14px",
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
