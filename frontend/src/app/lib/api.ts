const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Session helpers ──
// Stored after onboarding or login. Used by all authenticated API calls.
export function setSession(tenantId: number, email: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("enfoque365_tenant_id", String(tenantId));
    localStorage.setItem("enfoque365_user_email", email);
  }
}

export function getSession(): { tenantId: string; email: string } {
  if (typeof window === "undefined") {
    return { tenantId: "1", email: "admin@enfoque365.gob.do" };
  }
  return {
    tenantId: localStorage.getItem("enfoque365_tenant_id") || "1",
    email: localStorage.getItem("enfoque365_user_email") || "admin@enfoque365.gob.do",
  };
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("enfoque365_tenant_id");
    localStorage.removeItem("enfoque365_user_email");
  }
}

// ── API request ──

function getHeaders(): Record<string, string> {
  const session = getSession();
  return {
    "Content-Type": "application/json",
    "X-Tenant-Id": session.tenantId,
    "X-User-Email": session.email,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    const err: any = new Error(error.detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Tenants
  getTenants: () => request<any[]>("/tenants/list"),
  getTenantProfile: () => request<any>('/tenants/me'),
  updateTenant: (data: any) => request<any>('/tenants/me', { method: 'PUT', body: JSON.stringify(data) }),
  deactivateTenant: () => request<void>('/tenants/me', { method: 'DELETE' }),

  // PEI - Identidad
  getIdentidad: () => request<any>("/pei/identidad"),
  updateIdentidad: (data: { mision?: string; vision?: string }) =>
    request<any>("/pei/identidad", { method: "PUT", body: JSON.stringify(data) }),

  // PEI - Valores
  getValores: () => request<any[]>("/pei/valores"),
  createValor: (data: { nombre: string; descripcion?: string; orden?: number }) =>
    request<any>("/pei/valores", { method: "POST", body: JSON.stringify(data) }),
  deleteValor: (id: number) =>
    request<void>(`/pei/valores/${id}`, { method: "DELETE" }),
  iaIdentidad: () =>
    request<any[]>("/pei/ia/generar-identidad", { method: "POST" }),

  // PEI - Ejes y Arbol
  getArbol: () => request<any[]>("/pei/arbol"),
  iaArbol: () =>
    request<any[]>("/pei/ia/generar-arbol", { method: "POST" }),
  getEjes: () => request<any[]>("/pei/ejes"),
  createEje: (data: { name: string; description?: string; perspectiva_bsc?: string; peso_ponderado?: number }) =>
    request<any>("/pei/ejes", { method: "POST", body: JSON.stringify(data) }),
  createObjetivo: (data: { description: string; eje_id: number }) =>
    request<any>("/pei/objetivos", { method: "POST", body: JSON.stringify(data) }),
  deleteEje: (id: number) =>
    request<void>(`/pei/ejes/${id}`, { method: "DELETE" }),
  deleteObjetivo: (id: number) =>
    request<void>(`/pei/objetivos/${id}`, { method: "DELETE" }),

  // PEI - Indicadores KPI
  getIndicadores: () => request<any[]>("/pei/indicadores"),
  createIndicador: (data: any) =>
    request<any>("/pei/indicadores", { method: "POST", body: JSON.stringify(data) }),
  deleteIndicador: (id: number) =>
    request<void>(`/pei/indicadores/${id}`, { method: "DELETE" }),
  registrarMedicion: (id: number, valor_actual: number) =>
    request<any>(`/pei/indicadores/${id}/medicion`, {
      method: "PUT",
      body: JSON.stringify({ valor_actual }),
    }),
  iaKPIs: () =>
    request<any[]>("/pei/ia/generar-kpis", { method: "POST" }),

  // PEI - Mapa Estrategico BSC
  getMapaBSC: () => request<any[]>("/pei/mapa-estrategico"),
  iaMapaPreview: () =>
    request<any>("/pei/ia/generar-mapa-completo", { method: "POST" }),
  iaMapaAplicar: (data: any) =>
    request<any>("/pei/ia/aplicar-mapa", { method: "POST", body: JSON.stringify(data) }),

  // PEI - Hoshin Kanri
  getHoshin: () => request<any[]>("/pei/hoshin"),
  updateHoshinStatus: (id: number, estado: string) =>
    request<any>(`/pei/hoshin/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    }),
  iaGenerarHoshin: () =>
    request<any[]>("/pei/ia/generar-hoshin", { method: "POST" }),

  // IA Exportar Plan
  getIaExportPlan: () =>
    request<{ markdown: string | null }>("/pei/ia/export-plan-ia", { method: "GET" }),
  iaExportPlan: () =>
    request<{ markdown: string }>("/pei/ia/export-plan-ia", { method: "POST" }),

  // Dashboard
  getDashboard: () => request<any>("/pei/dashboard"),

  // KPI Historial
  getHistorialMediciones: (indicadorId: number) =>
    request<any[]>(`/pei/indicadores/${indicadorId}/historial`),

  // Diagnostico
  getPestel: () => request<any[]>("/diagnostico/pestel"),
  createPestel: (data: any) =>
    request<any>("/diagnostico/pestel", { method: "POST", body: JSON.stringify(data) }),
  updatePestel: (id: number, data: any) =>
    request<any>(`/diagnostico/pestel/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getFoda: () => request<any[]>("/diagnostico/foda"),
  createFoda: (data: any) =>
    request<any>("/diagnostico/foda", { method: "POST", body: JSON.stringify(data) }),
  deleteFoda: (id: number, justificacion?: string) => {
    const qs = justificacion ? `?justificacion=${encodeURIComponent(justificacion)}` : '';
    return request<void>(`/diagnostico/foda/${id}${qs}`, { method: "DELETE" });
  },
  moveFoda: (id: number, quadrant: string) =>
    request<any>(`/diagnostico/foda/${id}/mover`, {
      method: "PATCH",
      body: JSON.stringify({ quadrant }),
    }),
  iaFoda: () =>
    request<any[]>("/diagnostico/ia/analizar-foda", { method: "POST" }),
  deletePestel: (id: number) =>
    request<void>(`/diagnostico/pestel/${id}`, { method: "DELETE" }),

  // Porter
  getPorter: () => request<any[]>("/diagnostico/porter"),
  createPorter: (data: any) =>
    request<any>("/diagnostico/porter", { method: "POST", body: JSON.stringify(data) }),
  deletePorter: (id: number) =>
    request<void>(`/diagnostico/porter/${id}`, { method: "DELETE" }),
  iaPorter: () =>
    request<any[]>("/diagnostico/ia/analizar-porter", { method: "POST" }),

  // VRIO
  getVrio: () => request<any[]>("/diagnostico/vrio"),
  createVrio: (data: any) =>
    request<any>("/diagnostico/vrio", { method: "POST", body: JSON.stringify(data) }),
  deleteVrio: (id: number) =>
    request<void>(`/diagnostico/vrio/${id}`, { method: "DELETE" }),
  iaVrio: () =>
    request<any[]>("/diagnostico/ia/analizar-vrio", { method: "POST" }),

  // McKinsey 7S
  getMckinsey7s: () => request<any[]>("/diagnostico/mckinsey7s"),
  createMckinsey7s: (data: any) =>
    request<any>("/diagnostico/mckinsey7s", { method: "POST", body: JSON.stringify(data) }),
  deleteMckinsey7s: (id: number) =>
    request<void>(`/diagnostico/mckinsey7s/${id}`, { method: "DELETE" }),
  iaMckinsey7s: () =>
    request<any[]>("/diagnostico/ia/analizar-mckinsey7s", { method: "POST" }),

  // BCG Matrix
  getBcg: () => request<any[]>("/diagnostico/bcg"),
  createBcg: (data: any) =>
    request<any>("/diagnostico/bcg", { method: "POST", body: JSON.stringify(data) }),
  deleteBcg: (id: number) =>
    request<void>(`/diagnostico/bcg/${id}`, { method: "DELETE" }),
  iaBcg: () =>
    request<any[]>("/diagnostico/ia/analizar-bcg", { method: "POST" }),

  // TOWS
  getTows: () => request<any[]>("/diagnostico/tows"),
  createTows: (data: any) =>
    request<any>("/diagnostico/tows", { method: "POST", body: JSON.stringify(data) }),
  deleteTows: (id: number) =>
    request<void>(`/diagnostico/tows/${id}`, { method: "DELETE" }),
  iaTows: () =>
    request<any[]>("/diagnostico/ia/analizar-tows", { method: "POST" }),

  // P2W
  getP2w: () => request<any[]>("/diagnostico/p2w"),
  createP2w: (data: any) =>
    request<any>("/diagnostico/p2w", { method: "POST", body: JSON.stringify(data) }),
  deleteP2w: (id: number) =>
    request<void>(`/diagnostico/p2w/${id}`, { method: "DELETE" }),
  iaP2w: () =>
    request<any[]>("/diagnostico/ia/analizar-p2w", { method: "POST" }),

  // Kernel Rumelt
  getKernel: () => request<any[]>("/diagnostico/kernel"),
  createKernel: (data: any) =>
    request<any>("/diagnostico/kernel", { method: "POST", body: JSON.stringify(data) }),
  deleteKernel: (id: number) =>
    request<void>(`/diagnostico/kernel/${id}`, { method: "DELETE" }),
  iaKernel: () =>
    request<any[]>("/diagnostico/ia/analizar-kernel", { method: "POST" }),

  // Blue Ocean
  getBlueOcean: () => request<any[]>("/diagnostico/blue-ocean"),
  createBlueOcean: (data: any) =>
    request<any>("/diagnostico/blue-ocean", { method: "POST", body: JSON.stringify(data) }),
  deleteBlueOcean: (id: number) =>
    request<void>(`/diagnostico/blue-ocean/${id}`, { method: "DELETE" }),
  iaBlueOcean: () =>
    request<any[]>("/diagnostico/ia/analizar-blue-ocean", { method: "POST" }),

  // IA HITL
  analyzeIA: () =>
    request<any[]>("/diagnostico/ia/analizar-pestel", { method: "POST" }),
  getAITelemetry: () => request<any>('/diagnostico/ia/telemetry'),
  getInbox: () => request<any[]>("/diagnostico/ia/inbox"),
  clearInbox: () =>
    request<{ deleted: number }>("/diagnostico/ia/inbox/all", { method: "DELETE" }),
  approveProposal: (id: number) =>
    request<any>(`/diagnostico/ia/inbox/${id}/aprobar`, { method: "POST" }),
  rejectProposal: (id: number, reason: string) =>
    request<any>(`/diagnostico/ia/inbox/${id}/rechazar`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason }),
    }),

  // B4.3 + B4.4: Monitoreo OODA
  getPestelPendingReview: () =>
    request<any>("/diagnostico/pestel/pendientes-revision"),
  generateMonitoringAlerts: () =>
    request<any>("/diagnostico/pestel/generar-alertas", { method: "POST" }),
  getMonitoringAlerts: (statusFilter?: string) => {
    const qs = statusFilter ? `?status_filter=${statusFilter}` : '';
    return request<any[]>(`/diagnostico/monitoring/alerts${qs}`);
  },
  acknowledgeAlert: (id: number) =>
    request<any>(`/diagnostico/monitoring/alerts/${id}/acknowledge`, { method: "POST" }),
  resolveAlert: (id: number, notes?: string) => {
    const qs = notes ? `?resolution_notes=${encodeURIComponent(notes)}` : '';
    return request<any>(`/diagnostico/monitoring/alerts/${id}/resolve${qs}`, { method: "POST" });
  },
  getMonitoringSummary: () =>
    request<any>("/diagnostico/monitoring/summary"),

  // Onboarding (public, no auth headers needed)
  onboarding: (data: {
    name: string;
    tax_id: string;
    tipo: string;
    pais_iso: string;
    sector_ciiu: string;
    sector_ciiu_division: string;
    sector_ciiu_grupo: string;
    sector_ciiu_clase: string;
    admin_email: string;
    admin_full_name: string;
    admin_password: string;
  }) =>
    request<any>("/onboarding", { method: "POST", body: JSON.stringify(data) }),

  // Users
  getUsers: () => request<any[]>("/users/"),
  createUser: (data: { email: string; full_name: string; password: string; role: string }) =>
    request<any>("/users/", { method: "POST", body: JSON.stringify(data) }),
  updateUserRole: (userId: number, role: string) =>
    request<any>(`/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),

  // Wargaming AI
  wargameSimulate: (scenario: string) =>
    request<any>("/wargaming/simulate", {
      method: "POST",
      body: JSON.stringify({ scenario }),
    }),

  // Documents
  getDocuments: () => request<any[]>("/documents/"),
  getDocSubtypes: () => request<Record<string, string[]>>("/documents/subtypes"),
  uploadDocument: (file: File, docType: string, docSubtype?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", docType);
    if (docSubtype) formData.append("doc_subtype", docSubtype);
    const session = getSession();
    return fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: {
        "X-Tenant-Id": session.tenantId,
        "X-User-Email": session.email,
      },
      body: formData,
    }).then((r) => {
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
      return r.json();
    });
  },
  addDocLink: (data: { url: string; title: string; doc_type: string; doc_subtype?: string }) =>
    request<any>("/documents/link", { method: "POST", body: JSON.stringify(data) }),
  refreshDocLink: (id: number) =>
    request<any>(`/documents/${id}/refresh`, { method: "POST" }),
  deleteDocument: (id: number) =>
    request<void>(`/documents/${id}`, { method: "DELETE" }),

  // Key Results (OKR)
  getKeyResults: () => request<any[]>("/pei/key-results"),
  createKeyResult: (data: { title: string; target_value: number; unit: string; objetivo_id: number }) =>
    request<any>("/pei/key-results", { method: "POST", body: JSON.stringify(data) }),
  updateKeyResult: (id: number, currentValue: number) =>
    request<any>(`/pei/key-results/${id}`, {
      method: "PUT",
      body: JSON.stringify({ current_value: currentValue }),
    }),
  deleteKeyResult: (id: number) =>
    request<void>(`/pei/key-results/${id}`, { method: "DELETE" }),
  iaKeyResults: () =>
    request<any[]>("/pei/ia/analizar-key-results", { method: "POST" }),

  // Planes Estrategicos
  getPlanes: () => request<any[]>('/planes/'),
  getPlanVigente: () => request<any>('/planes/vigente'),
  createPlan: (data: { nombre: string; descripcion?: string; fecha_inicio?: string; fecha_fin?: string }) =>
    request<any>('/planes/', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (id: number, data: any) =>
    request<any>(`/planes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlan: (id: number) =>
    request<void>(`/planes/${id}`, { method: 'DELETE' }),
  aprobarPlan: (id: number) =>
    request<any>(`/planes/${id}/aprobar`, { method: 'POST' }),
  activarPlan: (id: number) =>
    request<any>(`/planes/${id}/activar`, { method: 'POST' }),
  revisarPlan: (id: number) =>
    request<any>(`/planes/${id}/revisar`, { method: 'POST' }),
  cerrarPlan: (id: number) =>
    request<any>(`/planes/${id}/cerrar`, { method: 'POST' }),
  archivarPlan: (id: number) =>
    request<any>(`/planes/${id}/archivar`, { method: 'POST' }),
};
