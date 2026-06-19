"""
Endpoints del Motor de Formulacion Estrategica (PEI) -- Sprint 3 + Sprint 4.
Implementa:
  - US-3.1: CRUD de Ejes Estrategicos (con BSC y pesos)
  - US-3.2: Creacion de Objetivos con Bloqueo Doctrinal (FR-200)
  - US-3.3: Vista de Arbol Estrategico (Cascada)
  - Sprint 4: Identidad (Mision/Vision/Valores), Indicadores KPI, Mapa BSC
Todos los endpoints aplican RLS automaticamente via tenant_id.
"""
from decimal import Decimal
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.services.llm import generate

import json
from datetime import datetime, timezone
from app.db.database import get_db
from app.db.models import (
    Tenant, PlanEstrategico, EjeEstrategico, ObjetivoEstrategico, ValorInstitucional,
    Indicador, RoleEnum, User,
    IALogPropuestaOODA, IAProposalStatus,
    PESTELFactor, PorterForce, FODAItem, VRIOResource,
    P2WChoice, KernelComponent, TOWSStrategy,
    HoshinItem, HoshinStatusEnum,
    MedicionHistorica, Document,
    McKinsey7SElement, BCGUnit, BlueOceanAction,
)
from app.schemas.pei import (
    IdentidadUpdate, IdentidadResponse,
    ValorCreate, ValorResponse,
    EjeCreate, EjeResponse,
    ObjetivoCreate, ObjetivoResponse,
    EjeWithObjetivos, ObjetivoWithIndicadores,
    IndicadorCreate, IndicadorResponse, MedicionUpdate,
    MapaBSCPerspectiva,
)
from app.schemas.diagnostico import IAProposalResponse
from app.core.security import get_current_tenant_id, get_current_user, require_role, get_current_plan_id

router = APIRouter()


# ── Helpers ──────────────────────────────────

def _calcular_semaforo(indicador: Indicador) -> str:
    """Calcula semaforo basado en progreso hacia la meta."""
    if indicador.meta is None or indicador.meta == 0:
        return "gris"
    valor = float(indicador.valor_actual or 0)
    meta = float(indicador.meta)
    base = float(indicador.linea_base or 0)

    # Para tendencia descendente, invertir logica
    if indicador.tendencia and indicador.tendencia.value == "descendente":
        if meta >= base:
            return "gris"
        progreso = (base - valor) / (base - meta) if (base - meta) != 0 else 0
    else:
        if meta <= base:
            return "gris"
        progreso = (valor - base) / (meta - base) if (meta - base) != 0 else 0

    if progreso >= 0.8:
        return "verde"
    elif progreso >= 0.5:
        return "amarillo"
    return "rojo"


def _indicador_to_response(ind: Indicador) -> dict:
    """Convierte un Indicador ORM a dict con semaforo calculado."""
    return {
        "id": ind.id,
        "nombre": ind.nombre,
        "unidad": ind.unidad.value if ind.unidad else "porcentaje",
        "linea_base": ind.linea_base,
        "meta": ind.meta,
        "valor_actual": ind.valor_actual,
        "frecuencia": ind.frecuencia.value if ind.frecuencia else "trimestral",
        "tendencia": ind.tendencia.value if ind.tendencia else "ascendente",
        "objetivo_id": ind.objetivo_id,
        "tenant_id": ind.tenant_id,
        "created_at": ind.created_at,
        "semaforo": _calcular_semaforo(ind),
    }


# ══════════════════════════════════════════════
# IDENTIDAD INSTITUCIONAL (Sprint 4.1)
# ══════════════════════════════════════════════

@router.get("/identidad", response_model=IdentidadResponse)
def get_identidad(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna mision y vision del plan activo."""
    plan = db.query(PlanEstrategico).filter(
        PlanEstrategico.id == plan_id,
        PlanEstrategico.tenant_id == tenant_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    tenant_name = tenant.name if tenant else "Desconocido"
    return {"mision": plan.mision, "vision": plan.vision, "tenant_name": tenant_name}


@router.put("/identidad", response_model=IdentidadResponse)
def update_identidad(
    data: IdentidadUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Actualiza mision y/o vision del plan activo."""
    plan = db.query(PlanEstrategico).filter(
        PlanEstrategico.id == plan_id,
        PlanEstrategico.tenant_id == tenant_id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    if data.mision is not None:
        plan.mision = data.mision
    if data.vision is not None:
        plan.vision = data.vision
    db.commit()
    db.refresh(plan)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    return {"mision": plan.mision, "vision": plan.vision, "tenant_name": tenant.name if tenant else ""}


# ── Valores Institucionales ──────────────────

@router.get("/valores", response_model=list[ValorResponse])
def list_valores(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(ValorInstitucional).filter(
        ValorInstitucional.tenant_id == tenant_id,
        ValorInstitucional.plan_id == plan_id,
    ).order_by(ValorInstitucional.orden).all()


@router.post("/valores", response_model=ValorResponse, status_code=status.HTTP_201_CREATED)
def create_valor(
    data: ValorCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    valor = ValorInstitucional(
        nombre=data.nombre,
        descripcion=data.descripcion,
        orden=data.orden,
        plan_id=plan_id,
        tenant_id=tenant_id,
    )
    db.add(valor)
    db.commit()
    db.refresh(valor)
    return valor


@router.delete("/valores/{valor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_valor(
    valor_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    valor = db.query(ValorInstitucional).filter(
        ValorInstitucional.id == valor_id,
        ValorInstitucional.tenant_id == tenant_id,
    ).first()
    if not valor:
        raise HTTPException(status_code=404, detail="Valor no encontrado")
    db.delete(valor)
    db.commit()


# ── IA: Generar Identidad desde Diagnostico ──

@router.post("/ia/generar-identidad", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_identidad(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera mision, vision y valores basandose en todos los analisis previos."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    nombre = tenant.name

    # Recopilar contexto de todos los analisis
    fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
    fortalezas = [f.description for f in fodas if f.quadrant.value == "fortaleza"]
    oportunidades = [f.description for f in fodas if f.quadrant.value == "oportunidad"]

    p2ws = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).all()
    p2w_aspiration = next((p.description for p in p2ws if p.choice_type.value == "winning_aspiration"), None)
    p2w_how = next((p.description for p in p2ws if p.choice_type.value == "how_to_win"), None)

    kernels = db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id).all()
    kernel_policy = next((k.description for k in kernels if k.component_type.value == "guiding_policy"), None)

    vrios = db.query(VRIOResource).filter(VRIOResource.tenant_id == tenant_id).all()
    ventajas = [v.resource_name for v in vrios if getattr(v, 'is_sustainable_advantage', False)]

    proposals = []
    source = "fallback:deterministico"

    # 1. MISION
    mision = f"{nombre} tiene como mision "
    if kernel_policy:
        mision += kernel_policy.lower()
    elif p2w_how:
        mision += p2w_how.lower()
    else:
        mision += "servir con excelencia a la ciudadania, garantizando servicios eficientes, transparentes y orientados al impacto social"
    mision += "."
    proposals.append(IALogPropuestaOODA(
        ooda_phase="decide",
        target_entity="identidad_mision",
        proposed_payload=json.dumps({"mision": mision}),
        ai_reasoning=f"[Identidad ({source})] Mision derivada de Kernel/P2W para {nombre}.",
        status=IAProposalStatus.BORRADOR,
        tenant_id=tenant_id,
        plan_id=plan_id,
    ))

    # 2. VISION
    vision = f"Para 2030, {nombre} sera "
    if p2w_aspiration:
        vision += p2w_aspiration.lower()
    elif oportunidades:
        vision += f"una institucion lider que capitaliza {oportunidades[0].lower()}"
    else:
        vision += "la institucion referente en su sector, reconocida por su innovacion, transparencia y resultados medibles"
    vision += "."
    proposals.append(IALogPropuestaOODA(
        ooda_phase="decide",
        target_entity="identidad_vision",
        proposed_payload=json.dumps({"vision": vision}),
        ai_reasoning=f"[Identidad ({source})] Vision derivada de P2W/FODA para {nombre}.",
        status=IAProposalStatus.BORRADOR,
        tenant_id=tenant_id,
        plan_id=plan_id,
    ))

    # 3. VALORES (5 valores clave)
    valores_base = [
        ("Transparencia", "Actuar con apertura, rendicion de cuentas y acceso a la informacion publica."),
        ("Excelencia", "Buscar la mejora continua en todos los procesos y servicios institucionales."),
        ("Innovacion", "Adoptar nuevas tecnologias y metodologias para crear valor publico."),
        ("Integridad", "Mantener conducta etica, honesta y coherente en todas las actuaciones."),
        ("Compromiso Social", "Orientar las acciones hacia el bienestar y desarrollo de la ciudadania."),
    ]

    # Personalizar con fortalezas si existen
    if fortalezas and len(fortalezas) >= 2:
        valores_base[1] = ("Excelencia", f"Excelencia apalancada en: {fortalezas[0]}.")
    if ventajas:
        valores_base[2] = ("Innovacion", f"Innovacion sostenida por ventajas competitivas: {', '.join(ventajas[:2])}.")

    for nombre_val, desc_val in valores_base:
        proposals.append(IALogPropuestaOODA(
            ooda_phase="decide",
            target_entity="identidad_valor",
            proposed_payload=json.dumps({"nombre": nombre_val, "descripcion": desc_val}),
            ai_reasoning=f"[Identidad ({source})] Valor '{nombre_val}' para {nombre}.",
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        ))

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ── IA: Generar Arbol Estrategico (Inbox) ──

@router.post("/ia/generar-arbol", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generar_arbol(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Genera Ejes y Objetivos basados en el diagnostico y los envia al Inbox para revision (HITL).
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    nombre = tenant.name
    proposals = []
    source = "fallback:deterministico"

    # Contexto
    fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
    fortalezas = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "fortaleza"]
    oportunidades = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "oportunidad"]
    debilidades = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "debilidad"]

    kernels = db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id).all()
    acciones = [k.description for k in kernels if getattr(k.component_type, 'value', k.component_type) == "coherent_actions"]
    diagnostico_k = next((k.description for k in kernels if getattr(k.component_type, 'value', k.component_type) == "diagnosis"), None)

    tows = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).all()
    tows_fo = [t.strategy for t in tows if getattr(t.quadrant, 'value', t.quadrant) == "fo"]
    tows_da = [t.strategy for t in tows if getattr(t.quadrant, 'value', t.quadrant) == "da"]

    p2ws = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).all()
    p2w_caps = next((p.description for p in p2ws if getattr(p.choice_type, 'value', p.choice_type) == "core_capabilities"), None)

    perspectivas = []

    # 1. Financiera
    fin_objs = ["Optimizar la ejecucion presupuestaria y reducir gastos innecesarios."]
    if any("presupuest" in f.lower() or "financ" in f.lower() for f in fortalezas):
        fin_objs.append("Capitalizar la solidez financiera para ampliar inversiones estrategicas.")
    if tows_da:
        fin_objs.append(f"Mitigar riesgo: {tows_da[0]}")
    perspectivas.append(("financiera", "Sostenibilidad y Eficiencia Financiera", fin_objs))

    # 2. Clientes
    cli_objs = ["Reducir tiempos de respuesta a solicitudes ciudadanas."]
    if oportunidades:
        cli_objs.append(f"Aprovechar: {oportunidades[0]}")
    if tows_fo:
        cli_objs.append(f"Capitalizar: {tows_fo[0]}")
    perspectivas.append(("clientes", "Impacto Social y Ciudadano", cli_objs))

    # 3. Procesos
    proc_objs = []
    if acciones:
        proc_objs.extend(acciones[:2])
    if not proc_objs:
        proc_objs.append("Digitalizar tramites criticos y eliminar redundancias.")
    if diagnostico_k:
        proc_objs.append(f"Resolver: {diagnostico_k}")
    perspectivas.append(("procesos", "Excelencia en Procesos Internos", proc_objs))

    # 4. Aprendizaje
    apr_objs = []
    if p2w_caps:
        apr_objs.append(f"Desarrollar: {p2w_caps}")
    else:
        apr_objs.append("Implementar programa de capacitacion y gestion del conocimiento.")
    if debilidades:
        apr_objs.append(f"Superar debilidad: {debilidades[0]}")
    perspectivas.append(("aprendizaje", "Capital Humano e Innovacion", apr_objs))

    for persp, eje_name, objs in perspectivas:
        # Generar Eje
        proposals.append(IALogPropuestaOODA(
            ooda_phase="decide",
            target_entity="eje_estrategico",
            proposed_payload=json.dumps({
                "name": eje_name,
                "description": f"Perspectiva {persp.capitalize()} para {nombre}.",
                "perspectiva_bsc": persp,
                "peso_ponderado": 0.25
            }),
            ai_reasoning=f"[Arbol ({source})] Eje derivado del marco BSC.",
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        ))
        
        # Generar Objetivos
        for obj in objs:
            proposals.append(IALogPropuestaOODA(
                ooda_phase="decide",
                target_entity="objetivo_estrategico",
                proposed_payload=json.dumps({
                    "description": obj,
                    "eje_name": eje_name,
                    "eje_perspectiva": persp
                }),
                ai_reasoning=f"[Arbol ({source})] Objetivo alineado al eje {eje_name}.",
                status=IAProposalStatus.BORRADOR,
                tenant_id=tenant_id,
                plan_id=plan_id,
            ))

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ── IA: Generar Mapa BSC Completo (Preview) ──

@router.post("/ia/generar-mapa-completo")
def ia_generar_mapa_completo(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Genera un mapa BSC completo como preview JSON.
    NO materializa nada — solo retorna la propuesta para revision.
    Lee diagnostico existente (FODA, TOWS, P2W, Kernel) para contextualizar.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    nombre = tenant.name

    # Recopilar contexto del diagnostico
    fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
    fortalezas = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "fortaleza"]
    oportunidades = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "oportunidad"]
    debilidades = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "debilidad"]
    amenazas = [f.description for f in fodas if getattr(f.quadrant, 'value', f.quadrant) == "amenaza"]

    kernels = db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id).all()
    acciones = [k.description for k in kernels if getattr(k.component_type, 'value', k.component_type) == "coherent_actions"]
    diagnostico_k = next((k.description for k in kernels if getattr(k.component_type, 'value', k.component_type) == "diagnosis"), None)

    tows = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).all()
    tows_fo = [t.strategy for t in tows if getattr(t.quadrant, 'value', t.quadrant) == "fo"]
    tows_da = [t.strategy for t in tows if getattr(t.quadrant, 'value', t.quadrant) == "da"]

    p2ws = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).all()
    p2w_aspiracion = next((p.description for p in p2ws if getattr(p.choice_type, 'value', p.choice_type) == "winning_aspiration"), None)
    p2w_caps = next((p.description for p in p2ws if getattr(p.choice_type, 'value', p.choice_type) == "core_capabilities"), None)

    # Generar 4 perspectivas con contenido contextualizado
    perspectivas = []

    # 1. FINANCIERA
    fin_objs = ["Optimizar la ejecucion presupuestaria y reducir gastos innecesarios."]
    if any("presupuest" in f.lower() or "financ" in f.lower() for f in fortalezas):
        fin_objs.append("Capitalizar la solidez financiera para ampliar inversiones estrategicas.")
    else:
        fin_objs.append("Diversificar fuentes de financiamiento y cooperacion.")
    if tows_da:
        fin_objs.append(f"Mitigar riesgo: {tows_da[0]}")
    perspectivas.append({
        "perspectiva": "financiera",
        "eje_name": "Sostenibilidad y Eficiencia Financiera",
        "eje_description": f"Garantizar el uso eficiente y la sostenibilidad de los recursos de {nombre}.",
        "peso": 0.20,
        "objetivos": [{"description": o, "kpis": _gen_kpis_for_obj(o)} for o in fin_objs],
    })

    # 2. CLIENTES
    cli_objs = ["Reducir tiempos de respuesta a solicitudes ciudadanas."]
    if oportunidades:
        cli_objs.append(f"Aprovechar: {oportunidades[0]}")
    else:
        cli_objs.append("Aumentar la cobertura y accesibilidad de servicios.")
    if tows_fo:
        cli_objs.append(f"Capitalizar: {tows_fo[0]}")
    perspectivas.append({
        "perspectiva": "clientes",
        "eje_name": "Impacto Social y Ciudadano",
        "eje_description": f"Maximizar la satisfaccion y el impacto en los beneficiarios de {nombre}.",
        "peso": 0.30,
        "objetivos": [{"description": o, "kpis": _gen_kpis_for_obj(o)} for o in cli_objs],
    })

    # 3. PROCESOS
    proc_objs = []
    if acciones:
        proc_objs.extend(acciones[:2])
    if not proc_objs:
        proc_objs = ["Digitalizar tramites criticos y eliminar redundancias."]
    if diagnostico_k:
        proc_objs.append(f"Resolver: {diagnostico_k}")
    perspectivas.append({
        "perspectiva": "procesos",
        "eje_name": "Excelencia en Procesos Internos",
        "eje_description": f"Modernizar y optimizar los procesos criticos de {nombre}.",
        "peso": 0.25,
        "objetivos": [{"description": o, "kpis": _gen_kpis_for_obj(o)} for o in proc_objs],
    })

    # 4. APRENDIZAJE
    apr_objs = []
    if p2w_caps:
        apr_objs.append(f"Desarrollar: {p2w_caps}")
    else:
        apr_objs.append("Implementar programa de capacitacion y gestion del conocimiento.")
    if debilidades:
        apr_objs.append(f"Superar debilidad: {debilidades[0]}")
    else:
        apr_objs.append("Fortalecer la cultura de innovacion y mejora continua.")
    perspectivas.append({
        "perspectiva": "aprendizaje",
        "eje_name": "Capital Humano e Innovacion",
        "eje_description": f"Desarrollar competencias y capacidades institucionales de {nombre}.",
        "peso": 0.25,
        "objetivos": [{"description": o, "kpis": _gen_kpis_for_obj(o)} for o in apr_objs],
    })

    return {"tenant": nombre, "perspectivas": perspectivas}


def _gen_kpis_for_obj(description: str) -> list[dict]:
    """Genera 1-2 KPIs contextualizados segun palabras clave del objetivo."""
    desc = description.lower()
    kpis = []

    if any(kw in desc for kw in ["presupuest", "gasto", "financ", "costo", "recurso"]):
        kpis.append({"nombre": "Ejecucion presupuestaria", "unidad": "porcentaje", "meta": 95, "linea_base": 60, "frecuencia": "trimestral", "tendencia": "ascendente"})
    elif any(kw in desc for kw in ["tiempo", "respuesta", "plazo", "rapidez"]):
        kpis.append({"nombre": "Tiempo promedio de respuesta (dias)", "unidad": "cantidad", "meta": 5, "linea_base": 30, "frecuencia": "mensual", "tendencia": "descendente"})
    elif any(kw in desc for kw in ["cobertura", "accesib", "servicio", "ciudadan", "satisf"]):
        kpis.append({"nombre": "Cobertura de servicios", "unidad": "porcentaje", "meta": 85, "linea_base": 40, "frecuencia": "trimestral", "tendencia": "ascendente"})
    elif any(kw in desc for kw in ["digital", "tramite", "proceso", "moderniz"]):
        kpis.append({"nombre": "Tramites digitalizados", "unidad": "porcentaje", "meta": 80, "linea_base": 20, "frecuencia": "trimestral", "tendencia": "ascendente"})
    elif any(kw in desc for kw in ["capacit", "competenc", "talento", "conocimiento", "desarroll"]):
        kpis.append({"nombre": "Horas de capacitacion per capita", "unidad": "cantidad", "meta": 40, "linea_base": 10, "frecuencia": "trimestral", "tendencia": "ascendente"})
    elif any(kw in desc for kw in ["innovac", "tecnolog", "cultura"]):
        kpis.append({"nombre": "Proyectos de innovacion implementados", "unidad": "cantidad", "meta": 5, "linea_base": 0, "frecuencia": "semestral", "tendencia": "ascendente"})
    else:
        kpis.append({"nombre": "Cumplimiento del objetivo", "unidad": "porcentaje", "meta": 100, "linea_base": 0, "frecuencia": "trimestral", "tendencia": "ascendente"})

    return kpis


# ── IA: Aplicar Mapa BSC (Materialización Atómica) ──

@router.post("/ia/aplicar-mapa", status_code=status.HTTP_201_CREATED)
def ia_aplicar_mapa(
    mapa_data: dict = Body(...),
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Materializa el mapa BSC preview en una transaccion atomica.
    Limpia ejes/objetivos/KPIs anteriores del tenant y crea todo de nuevo.
    Registra en IALog para auditoria.
    """
    perspectivas = mapa_data.get("perspectivas", [])
    if not perspectivas:
        raise HTTPException(status_code=422, detail="No hay perspectivas en el mapa.")

    # Limpiar datos anteriores (cascade: indicadores -> objetivos -> ejes)
    existing_ejes = db.query(EjeEstrategico).filter(EjeEstrategico.tenant_id == tenant_id).all()
    for eje in existing_ejes:
        for obj in eje.objetivos:
            db.query(Indicador).filter(Indicador.objetivo_id == obj.id).delete()
        db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.eje_id == eje.id).delete()
        db.delete(eje)

    # Crear todo atomicamente
    created = {"ejes": 0, "objetivos": 0, "kpis": 0}

    for p in perspectivas:
        persp_value = p.get("perspectiva", "procesos")
        if persp_value == "cliente":
            persp_value = "clientes"

        eje = EjeEstrategico(
            name=p.get("eje_name", f"Eje {persp_value}"),
            description=p.get("eje_description", ""),
            perspectiva_bsc=persp_value,
            peso_ponderado=p.get("peso", 0.25),
            tenant_id=tenant_id,
        )
        db.add(eje)
        db.flush()  # obtener eje.id
        created["ejes"] += 1

        for obj_data in p.get("objetivos", []):
            objetivo = ObjetivoEstrategico(
                description=obj_data.get("description", ""),
                eje_id=eje.id,
                tenant_id=tenant_id,
            )
            db.add(objetivo)
            db.flush()  # obtener objetivo.id
            created["objetivos"] += 1

            for kpi_data in obj_data.get("kpis", []):
                indicador = Indicador(
                    nombre=kpi_data.get("nombre", "KPI"),
                    unidad=kpi_data.get("unidad", "porcentaje"),
                    linea_base=kpi_data.get("linea_base", 0),
                    meta=kpi_data.get("meta", 100),
                    valor_actual=None,
                    frecuencia=kpi_data.get("frecuencia", "trimestral"),
                    tendencia=kpi_data.get("tendencia", "ascendente"),
                    objetivo_id=objetivo.id,
                    tenant_id=tenant_id,
                )
                db.add(indicador)
                created["kpis"] += 1

    # Registrar en IALog para auditoria
    log_entry = IALogPropuestaOODA(
        ooda_phase="act",
        target_entity="mapa_bsc_completo",
        proposed_payload=json.dumps({"perspectivas_count": len(perspectivas), **created}),
        ai_reasoning=f"[Mapa BSC] Materializado: {created['ejes']} ejes, {created['objetivos']} obj, {created['kpis']} KPIs.",
        status=IAProposalStatus.APROBADO,
        reviewed_by_user_id=user.id,
        reviewed_at=datetime.now(timezone.utc),
        tenant_id=tenant_id,
    )
    db.add(log_entry)

    db.commit()

    return {"status": "ok", **created}


# ══════════════════════════════════════════════
# EJES ESTRATEGICOS (US-3.1 + Sprint 4.2 BSC)
# ══════════════════════════════════════════════

@router.post("/ejes", response_model=EjeResponse, status_code=status.HTTP_201_CREATED)
def create_eje(
    eje_in: EjeCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Crea un Eje Estrategico (Perspectiva BSC) dentro del plan activo."""
    eje = EjeEstrategico(
        name=eje_in.name,
        description=eje_in.description,
        perspectiva_bsc=eje_in.perspectiva_bsc,
        peso_ponderado=eje_in.peso_ponderado,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(eje)
    db.commit()
    db.refresh(eje)
    return eje


@router.get("/ejes", response_model=list[EjeResponse])
def list_ejes(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los Ejes Estrategicos del tenant actual."""
    return db.query(EjeEstrategico).filter(EjeEstrategico.tenant_id == tenant_id).all()


# ══════════════════════════════════════════════
# OBJETIVOS ESTRATEGICOS (US-3.2 / FR-200)
# ══════════════════════════════════════════════

@router.post("/objetivos", response_model=ObjetivoResponse, status_code=status.HTTP_201_CREATED)
def create_objetivo(
    obj_in: ObjetivoCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Crea un Objetivo Estrategico anclado a un Eje.
    BLOQUEO DOCTRINAL (FR-200): eje_id obligatorio y validado.
    """
    eje = db.query(EjeEstrategico).filter(
        EjeEstrategico.id == obj_in.eje_id,
        EjeEstrategico.tenant_id == tenant_id,
    ).first()
    if not eje:
        raise HTTPException(
            status_code=422,
            detail="Doctrina: Debe seleccionar un Eje Estrategico padre valido dentro de su institucion."
        )

    objetivo = ObjetivoEstrategico(
        description=obj_in.description,
        eje_id=obj_in.eje_id,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(objetivo)
    db.commit()
    db.refresh(objetivo)
    return objetivo


@router.delete("/ejes/{eje_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_eje(
    eje_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Elimina un Eje Estrategico y todos sus objetivos."""
    eje = db.query(EjeEstrategico).filter(
        EjeEstrategico.id == eje_id,
        EjeEstrategico.tenant_id == tenant_id,
    ).first()
    if not eje:
        raise HTTPException(status_code=404, detail="Eje no encontrado")
    # Cascade: eliminar objetivos del eje
    db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.eje_id == eje_id).delete()
    db.delete(eje)
    db.commit()


@router.delete("/objetivos/{objetivo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_objetivo(
    objetivo_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Elimina un Objetivo Estrategico."""
    obj = db.query(ObjetivoEstrategico).filter(
        ObjetivoEstrategico.id == objetivo_id,
        ObjetivoEstrategico.tenant_id == tenant_id,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado")
    db.delete(obj)
    db.commit()


# ── IA: Generar Indicadores KPI ──

@router.post("/ia/generar-kpis", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_kpis(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera indicadores KPI para cada objetivo estrategico existente."""
    objetivos = db.query(ObjetivoEstrategico).filter(
        ObjetivoEstrategico.tenant_id == tenant_id,
    ).all()

    if not objetivos:
        raise HTTPException(status_code=422, detail="No hay objetivos estrategicos. Cree el arbol primero.")

    # Templates de KPIs segun palabras clave en descripcion
    kpi_templates = [
        (["presupuest", "gasto", "financ", "recurso", "costo"],
         [("Porcentaje de ejecucion presupuestaria", "porcentaje", 60, 95, "trimestral", "ascendente"),
          ("Ahorro operativo acumulado", "moneda", 0, 15, "semestral", "ascendente")]),
        (["tiempo", "respuesta", "plazo", "rapidez"],
         [("Tiempo promedio de respuesta (dias)", "cantidad", 30, 5, "mensual", "descendente")]),
        (["cobertura", "accesib", "servicio", "ciudadan"],
         [("Porcentaje de cobertura de servicios", "porcentaje", 40, 85, "trimestral", "ascendente"),
          ("Indice de satisfaccion ciudadana", "porcentaje", 50, 80, "semestral", "ascendente")]),
        (["digital", "tramite", "proceso", "moderniz", "eficien"],
         [("Porcentaje de tramites digitalizados", "porcentaje", 20, 80, "trimestral", "ascendente")]),
        (["capacit", "competenc", "talento", "conocimiento", "capital humano"],
         [("Horas de capacitacion per capita", "cantidad", 10, 40, "trimestral", "ascendente"),
          ("Indice de competencias criticas cubiertas", "porcentaje", 30, 75, "semestral", "ascendente")]),
        (["innovac", "tecnolog"],
         [("Proyectos de innovacion implementados", "cantidad", 0, 5, "semestral", "ascendente")]),
    ]

    # Default KPI si ninguna palabra clave coincide
    default_kpi = ("Porcentaje de cumplimiento del objetivo", "porcentaje", 0, 100, "trimestral", "ascendente")

    proposals = []
    source = "fallback:deterministico"

    for obj in objetivos:
        desc_lower = obj.description.lower()
        matched = False

        for keywords, templates in kpi_templates:
            if any(kw in desc_lower for kw in keywords):
                for nombre, unidad, base, meta, freq, tend in templates:
                    payload = json.dumps({
                        "nombre": nombre,
                        "objetivo_id": obj.id,
                        "objetivo_desc": obj.description,
                        "unidad": unidad,
                        "linea_base": base,
                        "meta": meta,
                        "frecuencia": freq,
                        "tendencia": tend,
                    })
                    proposals.append(IALogPropuestaOODA(
                        ooda_phase="decide",
                        target_entity="indicador_kpi",
                        proposed_payload=payload,
                        ai_reasoning=f"[KPI ({source})] '{nombre}' para objetivo: {obj.description}.",
                        status=IAProposalStatus.BORRADOR,
                        tenant_id=tenant_id,
                        plan_id=plan_id,
                    ))
                matched = True
                break

        if not matched:
            nombre, unidad, base, meta, freq, tend = default_kpi
            payload = json.dumps({
                "nombre": f"{nombre} - {obj.description}",
                "objetivo_id": obj.id,
                "objetivo_desc": obj.description,
                "unidad": unidad,
                "linea_base": base,
                "meta": meta,
                "frecuencia": freq,
                "tendencia": tend,
            })
            proposals.append(IALogPropuestaOODA(
                ooda_phase="decide",
                target_entity="indicador_kpi",
                proposed_payload=payload,
                ai_reasoning=f"[KPI ({source})] KPI generico para: {obj.description[:60]}.",
                status=IAProposalStatus.BORRADOR,
                tenant_id=tenant_id,
                plan_id=plan_id,
            ))

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ══════════════════════════════════════════════
# INDICADORES KPI (Sprint 4.3)
# ══════════════════════════════════════════════

@router.get("/indicadores", response_model=list[IndicadorResponse])
def list_indicadores(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los indicadores KPI del tenant con semaforo calculado."""
    indicadores = db.query(Indicador).filter(Indicador.tenant_id == tenant_id).all()
    return [_indicador_to_response(i) for i in indicadores]


@router.post("/indicadores", response_model=IndicadorResponse, status_code=status.HTTP_201_CREATED)
def create_indicador(
    data: IndicadorCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Crea un indicador KPI vinculado a un Objetivo Estrategico."""
    objetivo = db.query(ObjetivoEstrategico).filter(
        ObjetivoEstrategico.id == data.objetivo_id,
        ObjetivoEstrategico.tenant_id == tenant_id,
    ).first()
    if not objetivo:
        raise HTTPException(status_code=422, detail="Objetivo no encontrado en este tenant.")

    indicador = Indicador(
        nombre=data.nombre,
        unidad=data.unidad,
        linea_base=data.linea_base,
        meta=data.meta,
        valor_actual=data.valor_actual,
        frecuencia=data.frecuencia,
        tendencia=data.tendencia,
        objetivo_id=data.objetivo_id,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(indicador)
    db.commit()
    db.refresh(indicador)
    return _indicador_to_response(indicador)


@router.put("/indicadores/{indicador_id}/medicion", response_model=IndicadorResponse)
def registrar_medicion(
    indicador_id: int,
    data: MedicionUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Registra una nueva medicion para un indicador KPI."""
    indicador = db.query(Indicador).filter(
        Indicador.id == indicador_id,
        Indicador.tenant_id == tenant_id,
    ).first()
    if not indicador:
        raise HTTPException(status_code=404, detail="Indicador no encontrado")
    indicador.valor_actual = data.valor_actual
    # Persist historical measurement
    medicion = MedicionHistorica(
        indicador_id=indicador_id,
        valor=data.valor_actual,
        tenant_id=tenant_id,
    )
    db.add(medicion)
    db.commit()
    db.refresh(indicador)
    return _indicador_to_response(indicador)


# ══════════════════════════════════════════════
# HISTORIAL DE MEDICIONES KPI
# ══════════════════════════════════════════════


@router.get("/indicadores/{indicador_id}/historial")
def get_historial_mediciones(
    indicador_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna el historial de mediciones de un indicador KPI."""
    indicador = db.query(Indicador).filter(
        Indicador.id == indicador_id,
        Indicador.tenant_id == tenant_id,
    ).first()
    if not indicador:
        raise HTTPException(status_code=404, detail="Indicador no encontrado")
    mediciones = (
        db.query(MedicionHistorica)
        .filter(
            MedicionHistorica.indicador_id == indicador_id,
            MedicionHistorica.tenant_id == tenant_id,
        )
        .order_by(MedicionHistorica.fecha.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": m.id,
            "valor": m.valor,
            "fecha": m.fecha,
            "notas": m.notas,
        }
    ]

@router.delete("/indicadores/{indicador_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_indicador(
    indicador_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Elimina un indicador KPI y su historial de mediciones asociado."""
    indicador = db.query(Indicador).filter(
        Indicador.id == indicador_id,
        Indicador.tenant_id == tenant_id,
    ).first()
    if not indicador:
        raise HTTPException(status_code=404, detail="Indicador no encontrado")
    
    # El historial de mediciones (MedicionHistorica) debería borrarse en cascada 
    # o manualmente si no hay cascade. Lo borramos manualmente por seguridad.
    db.query(MedicionHistorica).filter(MedicionHistorica.indicador_id == indicador_id).delete()
    db.delete(indicador)
    db.commit()


# ══════════════════════════════════════════════
# KEY RESULTS — OKR (EXE-002)
# ══════════════════════════════════════════════

from app.db.models import KeyResult
from app.schemas.pei import KeyResultCreate, KeyResultResponse, KeyResultUpdate


def _kr_to_response(kr: KeyResult) -> dict:
    """Calcula el progreso del Key Result."""
    target = float(kr.target_value) if kr.target_value else 0
    current = float(kr.current_value) if kr.current_value else 0
    progress = (current / target * 100) if target > 0 else 0.0
    return {
        "id": kr.id,
        "title": kr.title,
        "target_value": kr.target_value,
        "current_value": kr.current_value,
        "unit": kr.unit.value if kr.unit else "porcentaje",
        "deadline": kr.deadline,
        "objetivo_id": kr.objetivo_id,
        "tenant_id": kr.tenant_id,
        "created_at": kr.created_at,
        "progress": round(progress, 1),
    }


@router.get("/key-results", response_model=list[KeyResultResponse])
def list_key_results(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los Key Results del tenant."""
    krs = db.query(KeyResult).filter(KeyResult.tenant_id == tenant_id).all()
    return [_kr_to_response(kr) for kr in krs]


@router.post("/key-results", response_model=KeyResultResponse, status_code=status.HTTP_201_CREATED)
def create_key_result(
    payload: KeyResultCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Crea un Key Result vinculado a un objetivo."""
    obj = db.query(ObjetivoEstrategico).filter(
        ObjetivoEstrategico.id == payload.objetivo_id,
        ObjetivoEstrategico.tenant_id == tenant_id,
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Objetivo no encontrado en este tenant")

    kr = KeyResult(
        title=payload.title,
        target_value=payload.target_value,
        current_value=payload.current_value,
        unit=payload.unit,
        deadline=payload.deadline,
        objetivo_id=payload.objetivo_id,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(kr)
    db.commit()
    db.refresh(kr)
    return _kr_to_response(kr)


@router.put("/key-results/{kr_id}", response_model=KeyResultResponse)
def update_key_result(
    kr_id: int,
    payload: KeyResultUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Actualiza el progreso de un Key Result."""
    kr = db.query(KeyResult).filter(
        KeyResult.id == kr_id,
        KeyResult.tenant_id == tenant_id,
    ).first()
    if not kr:
        raise HTTPException(status_code=404, detail="Key Result no encontrado")

    kr.current_value = payload.current_value
    db.commit()
    db.refresh(kr)
    return _kr_to_response(kr)


@router.delete("/key-results/{kr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_key_result(
    kr_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    """Elimina un Key Result."""
    kr = db.query(KeyResult).filter(
        KeyResult.id == kr_id,
        KeyResult.tenant_id == tenant_id,
    ).first()
    if not kr:
        raise HTTPException(status_code=404, detail="Key Result no encontrado")

    db.delete(kr)
    db.commit()


@router.post("/ia/analizar-key-results", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_analizar_key_results(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Lee los objetivos estrategicos, genera Key Results con Gemini
    y los envia al Inbox IA.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    objetivos = db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.tenant_id == tenant_id).all()
    if not objetivos:
        raise HTTPException(status_code=400, detail="Debe haber al menos un objetivo estrategico para generar Key Results")

    objs_json = []
    for obj in objetivos:
        objs_json.append({
            "id": obj.id,
            "description": obj.description,
            "eje_estrategico_id": obj.eje_id
        })

    import json
    from app.services.prompts import build_key_results_prompt
    prompt = build_key_results_prompt(
        nombre=tenant.name,
        tipo=tenant.tipo.value if tenant.tipo else "General",
        pais="No especificado",
        ciiu_seccion="N/A", ciiu_division="N/A", ciiu_grupo="N/A", ciiu_clase="N/A",
        objetivos_json=json.dumps(objs_json, ensure_ascii=False)
    )

    from app.services import llm
    
    try:
        response_text = llm.generate_sync(prompt, endpoint_name="analizar-key-results", db=db, tenant_id=tenant_id)
        
        if not response_text:
            # Fallback deterministico si no hay API Keys
            parsed = []
            for obj in objs_json:
                parsed.append({
                    "objetivo_id": obj["id"],
                    "title": f"Incrementar indicador clave para {obj['description'][:20]}...",
                    "target_value": 100,
                    "unit": "porcentaje"
                })
        else:
            import re
            match = re.search(r"\[.*\]", response_text, re.DOTALL)
            if not match:
                raise ValueError("No se encontro un array JSON en la respuesta")
            import json
            parsed = json.loads(match.group(0))

        propuestas = []
        for item in parsed:
            # Create inbox item directly
            db_prop = IALogPropuestaOODA(
                tenant_id=tenant_id,
                plan_id=plan_id,
                ooda_phase="formulacion_okr",
                target_entity="key_result",
                proposed_payload=json.dumps(item, ensure_ascii=False),
                ai_reasoning="Sugerencia generada a partir de los objetivos estrategicos alineada a metodologia OKR de John Doerr.",
                status=IAProposalStatus.BORRADOR,
            )
            db.add(db_prop)
            db.commit()
            db.refresh(db_prop)
            propuestas.append(db_prop)
            
        return [
            IAProposalResponse(
                id=p.id,
                tenant_id=p.tenant_id,
                ooda_phase=p.ooda_phase,
                target_entity=p.target_entity,
                proposed_payload=p.proposed_payload,
                ai_reasoning=p.ai_reasoning,
                status=p.status,
                created_at=p.created_at,
                reviewed_at=p.reviewed_at,
            ) for p in propuestas
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en analisis de IA: {str(e)}")


# ══════════════════════════════════════════════
# ARBOL ESTRATEGICO (US-3.3 + Sprint 4 KPIs)
# ══════════════════════════════════════════════

@router.get("/arbol", response_model=list[EjeWithObjetivos])
def get_arbol_estrategico(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Devuelve el arbol estrategico completo del tenant:
    Ejes -> Objetivos -> Indicadores (con semaforo).
    """
    ejes = db.query(EjeEstrategico).filter(
        EjeEstrategico.tenant_id == tenant_id
    ).all()

    result = []
    for eje in ejes:
        eje_dict = {
            "id": eje.id,
            "name": eje.name,
            "description": eje.description,
            "perspectiva_bsc": eje.perspectiva_bsc.value if eje.perspectiva_bsc else None,
            "peso_ponderado": eje.peso_ponderado or Decimal("0.25"),
            "tenant_id": eje.tenant_id,
            "created_at": eje.created_at,
            "objetivos": [],
        }
        for obj in eje.objetivos:
            obj_dict = {
                "id": obj.id,
                "description": obj.description,
                "eje_id": obj.eje_id,
                "tenant_id": obj.tenant_id,
                "created_at": obj.created_at,
                "indicadores": [_indicador_to_response(i) for i in obj.indicadores],
            }
            eje_dict["objetivos"].append(obj_dict)
        result.append(eje_dict)
    return result


# ══════════════════════════════════════════════
# MAPA ESTRATEGICO BSC (Sprint 4.4)
# ══════════════════════════════════════════════

@router.get("/mapa-estrategico", response_model=list[MapaBSCPerspectiva])
def get_mapa_estrategico(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna los ejes agrupados por perspectiva BSC con semaforo por objetivo.
    Usado para el Mapa Estrategico visual (4 filas BSC).
    """
    ejes = db.query(EjeEstrategico).filter(
        EjeEstrategico.tenant_id == tenant_id
    ).all()

    perspectivas_map: dict = {}
    for eje in ejes:
        key = eje.perspectiva_bsc.value if eje.perspectiva_bsc else "sin_clasificar"
        if key not in perspectivas_map:
            perspectivas_map[key] = {"perspectiva": key, "peso_total": Decimal("0"), "ejes": []}

        perspectivas_map[key]["peso_total"] += eje.peso_ponderado or Decimal("0")

        eje_data = {
            "id": eje.id,
            "name": eje.name,
            "description": eje.description,
            "perspectiva_bsc": key,
            "peso_ponderado": eje.peso_ponderado or Decimal("0.25"),
            "tenant_id": eje.tenant_id,
            "created_at": eje.created_at,
            "objetivos": [],
        }
        for obj in eje.objetivos:
            eje_data["objetivos"].append({
                "id": obj.id,
                "description": obj.description,
                "eje_id": obj.eje_id,
                "tenant_id": obj.tenant_id,
                "created_at": obj.created_at,
                "indicadores": [_indicador_to_response(i) for i in obj.indicadores],
            })
        perspectivas_map[key]["ejes"].append(eje_data)

    # Ordenar: financiera, clientes, procesos, aprendizaje
    order = ["financiera", "clientes", "procesos", "aprendizaje", "sin_clasificar"]
    result = []
    for p in order:
        if p in perspectivas_map:
            result.append(perspectivas_map[p])
    return result


# ══════════════════════════════════════════════
# HOSHIN KANRI (Sprint 9)
# ══════════════════════════════════════════════

@router.get("/hoshin")
def get_hoshin_items(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna todos los items Hoshin del tenant."""
    items = db.query(HoshinItem).filter(HoshinItem.tenant_id == tenant_id).all()
    return [
        {
            "id": i.id,
            "objetivo_estrategico_id": i.objetivo_estrategico_id,
            "objetivo_estrategico_desc": i.objetivo_estrategico_desc,
            "perspectiva": i.perspectiva,
            "objetivo_tactico": i.objetivo_tactico,
            "responsable": i.responsable,
            "meta_corto_plazo": i.meta_corto_plazo,
            "estado": i.estado.value if i.estado else "pendiente",
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.post("/hoshin", status_code=status.HTTP_201_CREATED)
def create_hoshin_item(
    data: dict = Body(...),
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = HoshinItem(
        objetivo_estrategico_id=data.get("objetivo_estrategico_id"),
        objetivo_estrategico_desc=data.get("objetivo_estrategico_desc", ""),
        perspectiva=data.get("perspectiva", "procesos"),
        objetivo_tactico=data.get("objetivo_tactico", ""),
        responsable=data.get("responsable", ""),
        meta_corto_plazo=data.get("meta_corto_plazo"),
        estado=data.get("estado", "pendiente"),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "status": "created"}


@router.put("/hoshin/{item_id}/estado")
def update_hoshin_status(
    item_id: int,
    data: dict = Body(...),
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(HoshinItem).filter(
        HoshinItem.id == item_id, HoshinItem.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item Hoshin no encontrado")
    new_status = data.get("estado", "pendiente")
    item.estado = new_status
    db.commit()
    return {"id": item.id, "estado": new_status}


@router.delete("/hoshin/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hoshin_item(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(HoshinItem).filter(
        HoshinItem.id == item_id, HoshinItem.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item Hoshin no encontrado")
    db.delete(item)
    db.commit()


@router.post("/ia/generar-hoshin", status_code=status.HTTP_201_CREATED)
def ia_generar_hoshin(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera items Hoshin a partir de los objetivos estrategicos existentes."""
    ejes = db.query(EjeEstrategico).filter(EjeEstrategico.tenant_id == tenant_id).all()
    if not ejes:
        raise HTTPException(status_code=422, detail="No hay ejes estrategicos. Genere el Mapa BSC primero.")

    # Limpiar hoshin anterior
    db.query(HoshinItem).filter(HoshinItem.tenant_id == tenant_id).delete()

    created = 0
    responsable_map = {
        "financiera": "Dir. Finanzas",
        "clientes": "Dir. Servicios",
        "procesos": "Dir. Operaciones",
        "aprendizaje": "Dir. RRHH",
    }

    for eje in ejes:
        persp = eje.perspectiva_bsc.value if eje.perspectiva_bsc else "procesos"
        resp = responsable_map.get(persp, "Coordinador General")

        for obj in eje.objetivos:
            tactico = _hoshin_tactico(obj.description)
            meta = _hoshin_meta(obj.description)

            item = HoshinItem(
                objetivo_estrategico_id=obj.id,
                objetivo_estrategico_desc=obj.description,
                perspectiva=persp,
                objetivo_tactico=tactico,
                responsable=resp,
                meta_corto_plazo=meta,
                estado=HoshinStatusEnum.PENDIENTE,
                tenant_id=tenant_id,
            )
            db.add(item)
            created += 1

    # Auditoria
    log_entry = IALogPropuestaOODA(
        ooda_phase="act",
        target_entity="hoshin_kanri",
        proposed_payload=json.dumps({"items_created": created}),
        ai_reasoning=f"[Hoshin] Generados {created} items tacticos desde {len(ejes)} ejes.",
        status=IAProposalStatus.APROBADO,
        reviewed_by_user_id=user.id,
        reviewed_at=datetime.now(timezone.utc),
        tenant_id=tenant_id,
    )
    db.add(log_entry)
    db.commit()

    return {"status": "ok", "items_created": created}


def _hoshin_tactico(desc: str) -> str:
    d = desc.lower()
    if any(kw in d for kw in ["presupuest", "gasto"]):
        return "Reducir gastos operativos un 10% en Q1"
    if any(kw in d for kw in ["financ", "diversificar"]):
        return "Identificar 3 fuentes alternas de financiamiento"
    if any(kw in d for kw in ["tiempo", "respuesta"]):
        return "Implementar SLA de 5 dias habiles maximo"
    if any(kw in d for kw in ["cobertura", "accesib"]):
        return "Ampliar horarios de atencion y canales digitales"
    if any(kw in d for kw in ["digital", "tramite"]):
        return "Digitalizar los 5 tramites mas frecuentes"
    if any(kw in d for kw in ["capacit", "competenc", "desarroll"]):
        return "Ejecutar plan de capacitacion de 40h/persona/anio"
    if any(kw in d for kw in ["innov", "tecnol"]):
        return "Lanzar 2 pilotos de innovacion tecnologica"
    if any(kw in d for kw in ["mitigar", "riesgo"]):
        return "Crear fondo de contingencia del 5% del presupuesto"
    if any(kw in d for kw in ["capitalizar", "aprovechar"]):
        return "Formalizar 2 alianzas estrategicas en 90 dias"
    return "Definir plan de accion con hitos trimestrales"


def _hoshin_meta(desc: str) -> str:
    d = desc.lower()
    if "presupuest" in d: return "95% ejecucion en T1"
    if "tiempo" in d or "respuesta" in d: return "< 5 dias en T1"
    if "cobertura" in d: return "+20% cobertura en T1"
    if "digital" in d: return "3 tramites en T1"
    if "capacit" in d: return "20h promedio en T1"
    return "Avance 25% en T1"


# ══════════════════════════════════════════════
# DASHBOARD METRICS
# ══════════════════════════════════════════════

@router.get("/dashboard")
def get_dashboard_metrics(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna metricas consolidadas del tenant para el dashboard."""
    ejes_count = db.query(EjeEstrategico).filter(EjeEstrategico.tenant_id == tenant_id).count()
    obj_count = db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.tenant_id == tenant_id).count()
    kpi_count = db.query(Indicador).filter(Indicador.tenant_id == tenant_id).count()
    foda_count = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).count()
    pestel_count = db.query(PESTELFactor).filter(PESTELFactor.tenant_id == tenant_id).count()
    hoshin_count = db.query(HoshinItem).filter(HoshinItem.tenant_id == tenant_id).count()

    # KPI semaforo distribution
    indicadores = db.query(Indicador).filter(Indicador.tenant_id == tenant_id).all()
    semaforo = {"verde": 0, "amarillo": 0, "rojo": 0, "gris": 0}
    for ind in indicadores:
        s = _calcular_semaforo(ind)
        semaforo[s] = semaforo.get(s, 0) + 1

    # Hoshin status distribution
    hoshin_items = db.query(HoshinItem).filter(HoshinItem.tenant_id == tenant_id).all()
    hoshin_status = {"pendiente": 0, "en_progreso": 0, "completado": 0}
    for h in hoshin_items:
        hoshin_status[h.estado.value] = hoshin_status.get(h.estado.value, 0) + 1

    # Diagnostico completion
    porter_count = db.query(PorterForce).filter(PorterForce.tenant_id == tenant_id).count()
    vrio_count = db.query(VRIOResource).filter(VRIOResource.tenant_id == tenant_id).count()
    tows_count = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).count()
    p2w_count = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).count()
    kernel_count = db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id).count()

    phases = [
        {"name": "Dx Externo", "items": pestel_count + porter_count, "done": pestel_count > 0 and porter_count > 0},
        {"name": "Dx Interno", "items": vrio_count, "done": vrio_count > 0},
        {"name": "Sintesis", "items": foda_count + tows_count, "done": foda_count > 0 and tows_count > 0},
        {"name": "Formulacion", "items": p2w_count + kernel_count, "done": p2w_count > 0 and kernel_count > 0},
        {"name": "Despliegue", "items": ejes_count + obj_count, "done": ejes_count > 0 and obj_count > 0},
        {"name": "Hoshin", "items": hoshin_count, "done": hoshin_count > 0},
    ]
    phases_done = sum(1 for p in phases if p["done"])

    # Additional counts
    doc_count = db.query(Document).filter(Document.tenant_id == tenant_id).count()
    kr_count = db.query(KeyResult).filter(KeyResult.tenant_id == tenant_id).count()

    return {
        "ejes": ejes_count,
        "objetivos": obj_count,
        "kpis": kpi_count,
        "hoshin": hoshin_count,
        "foda": foda_count,
        "pestel": pestel_count,
        "semaforo": semaforo,
        "hoshin_status": hoshin_status,
        "phases": phases,
        "phases_done": phases_done,
        "phases_total": len(phases),
        "completion_pct": round(phases_done / len(phases) * 100),
        "documentos": doc_count,
        "key_results": kr_count,
        "porter": porter_count,
        "vrio": vrio_count,
        "tows": tows_count,
    }


# ══════════════════════════════════════════════
# EXPORTACION HTML (Plan Estrategico Completo)
# ══════════════════════════════════════════════

@router.get("/export/html", response_class=HTMLResponse)
def export_strategic_plan_html(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exporta el plan estrategico completo como HTML renderizable (para impresion PDF via navegador)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    # Gather all data
    ejes = db.query(EjeEstrategico).filter(EjeEstrategico.tenant_id == tenant_id).all()
    objetivos = db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.tenant_id == tenant_id).all()
    indicadores = db.query(Indicador).filter(Indicador.tenant_id == tenant_id).all()
    valores = db.query(ValorInstitucional).filter(ValorInstitucional.tenant_id == tenant_id).all()
    pestel = db.query(PESTELFactor).filter(PESTELFactor.tenant_id == tenant_id).all()
    porter = db.query(PorterForce).filter(PorterForce.tenant_id == tenant_id).all()
    foda = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
    vrio = db.query(VRIOResource).filter(VRIOResource.tenant_id == tenant_id).all()
    s7 = db.query(McKinsey7SElement).filter(McKinsey7SElement.tenant_id == tenant_id).all()
    bcg = db.query(BCGUnit).filter(BCGUnit.tenant_id == tenant_id).all()
    tows = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).all()
    p2w = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).all()
    kernel = db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id).all()
    blue_ocean = db.query(BlueOceanAction).filter(BlueOceanAction.tenant_id == tenant_id).all()
    hoshin = db.query(HoshinItem).filter(HoshinItem.tenant_id == tenant_id).all()
    docs = db.query(Document).filter(Document.tenant_id == tenant_id).count()

    plan = db.query(PlanEstrategico).filter(PlanEstrategico.id == plan_id).first()
    
    # Build HTML sections
    from datetime import date
    today = date.today().strftime("%d/%m/%Y")
    name = plan.nombre if plan else (tenant.name or "Institucion")
    mision = plan.mision if plan else "No definida"
    vision = plan.vision if plan else "No definida"

    def section(title, content):
        return f'<div class="section"><h2>{title}</h2>{content}</div>'

    def table(headers, rows):
        h = "".join(f"<th>{h}</th>" for h in headers)
        r = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in row) + "</tr>" for row in rows)
        return f'<table><thead><tr>{h}</tr></thead><tbody>{r}</tbody></table>'

    # Cover
    cover = f'''<div class="cover">
        <h1>Plan Estrategico Institucional</h1>
        <h2>{name}</h2>
        <p class="date">Fecha de generacion: {today}</p>
        <p class="meta">Sector CIIU: {tenant.sector_ciiu or "No especificado"} | Pais: {tenant.pais_iso or "XX"}</p>
    </div>'''

    # Identity
    vals_html = "".join(f"<li><strong>{v.nombre}</strong>: {v.descripcion or ''}</li>" for v in valores)
    identity = section("1. Identidad Institucional", f'''
        <p><strong>Mision:</strong> {mision}</p>
        <p><strong>Vision:</strong> {vision}</p>
        <h3>Valores Institucionales</h3>
        <ul>{vals_html if vals_html else '<li>No definidos</li>'}</ul>
    ''')

    # PESTEL
    pestel_rows = [(p.category.value.upper(), p.description, str(p.impact_level or 0)) for p in pestel]
    pestel_html = section("2. Diagnostico Externo - PESTEL",
        f"<p>{len(pestel)} factores identificados.</p>" + table(["Categoria", "Descripcion", "Impacto"], pestel_rows) if pestel else "<p>No completado.</p>"
    )

    # Porter
    porter_rows = [(p.force_type.value.replace('_', ' ').title(), p.description, str(p.intensity or 0)) for p in porter]
    porter_html = section("3. Diagnostico Externo - 5 Fuerzas de Porter",
        f"<p>{len(porter)} fuerzas evaluadas.</p>" + table(["Fuerza", "Descripcion", "Intensidad"], porter_rows) if porter else "<p>No completado.</p>"
    )

    # VRIO
    def _bool(v): return "Si" if v else "No"
    vrio_rows = [(v.resource_name, _bool(v.valuable), _bool(v.rare), _bool(v.inimitable), _bool(v.organized), v.competitive_implication or "") for v in vrio]
    vrio_html = section("4. Diagnostico Interno - VRIO",
        table(["Recurso", "V", "R", "I", "O", "Implicacion"], vrio_rows) if vrio else "<p>No completado.</p>"
    )

    # 7S
    s7_rows = [(s.element_type.value.replace('_',' ').title(), s.description, str(s.alignment_score or 0)) for s in s7]
    s7_html = section("5. Diagnostico Interno - McKinsey 7S",
        table(["Elemento", "Evaluacion", "Score"], s7_rows) if s7 else "<p>No completado.</p>"
    )

    # BCG
    bcg_rows = [(b.unit_name, b.quadrant.value.replace('_',' ').title(), str(b.market_growth or 0), str(b.market_share or 0)) for b in bcg]
    bcg_html = section("6. Diagnostico Interno - Matriz BCG",
        table(["Unidad", "Cuadrante", "Crecimiento", "Participacion"], bcg_rows) if bcg else "<p>No completado.</p>"
    )

    # FODA
    foda_by_q = {"fortaleza": [], "oportunidad": [], "debilidad": [], "amenaza": []}
    for f in foda:
        foda_by_q.get(f.quadrant.value, []).append(f.description)
    foda_inner = ""
    for q, label in [("fortaleza", "Fortalezas"), ("oportunidad", "Oportunidades"), ("debilidad", "Debilidades"), ("amenaza", "Amenazas")]:
        items = foda_by_q[q]
        foda_inner += f"<h3>{label} ({len(items)})</h3><ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
    foda_html = section("7. Sintesis FODA", foda_inner if foda else "<p>No completado.</p>")

    # TOWS
    tows_rows = [(t.quadrant.value.upper(), t.strategy, str(t.priority or 0)) for t in tows]
    tows_html = section("8. Estrategias TOWS",
        table(["Cuadrante", "Estrategia", "Prioridad"], tows_rows) if tows else "<p>No completado.</p>"
    )

    # P2W
    p2w_rows = [(p.choice_type.value.replace('_',' ').title(), p.description, p.rationale or "") for p in p2w]
    p2w_html = section("9. Playing to Win - Cascada de Elecciones",
        table(["Eleccion", "Descripcion", "Rationale"], p2w_rows) if p2w else "<p>No completado.</p>"
    )

    # Kernel
    kernel_rows = [(k.component_type.value.replace('_',' ').title(), k.title or "", k.description) for k in kernel]
    kernel_html = section("10. Kernel Rumelt",
        table(["Componente", "Titulo", "Descripcion"], kernel_rows) if kernel else "<p>No completado.</p>"
    )

    # Blue Ocean
    bo_rows = [(b.action_type.value.upper(), b.factor, b.description or "") for b in blue_ocean]
    bo_html = section("11. Blue Ocean - Grid ERRC",
        table(["Accion", "Factor", "Descripcion"], bo_rows) if blue_ocean else "<p>No completado.</p>"
    )

    # PEI - Ejes y Objetivos
    ejes_html = ""
    for eje in ejes:
        eje_objs = [o for o in objetivos if o.eje_id == eje.id]
        obj_items = ""
        for obj in eje_objs:
            obj_kpis = [i for i in indicadores if i.objetivo_id == obj.id]
            kpi_rows_inner = ""
            for kpi in obj_kpis:
                semaforo = _calcular_semaforo(kpi)
                kpi_rows_inner += f"<tr><td>{kpi.nombre}</td><td>{kpi.linea_base}</td><td>{kpi.meta}</td><td>{kpi.valor_actual}</td><td>{semaforo}</td></tr>"
            kpi_table = f'<table class="kpi"><thead><tr><th>KPI</th><th>Base</th><th>Meta</th><th>Actual</th><th>Semaforo</th></tr></thead><tbody>{kpi_rows_inner}</tbody></table>' if kpi_rows_inner else ""
            obj_items += f"<li>{obj.description}{kpi_table}</li>"
        ejes_html += f"<h3>Eje: {eje.name} (BSC: {eje.perspectiva_bsc.value if eje.perspectiva_bsc else 'N/A'}, Peso: {eje.peso_ponderado}%)</h3><ul>{obj_items if obj_items else '<li>Sin objetivos</li>'}</ul>"

    pei_html = section("12. Plan Estrategico - Ejes, Objetivos e Indicadores",
        ejes_html if ejes else "<p>No hay ejes estrategicos definidos.</p>"
    )

    # Hoshin
    hoshin_rows = [(h.objetivo_estrategico_desc or "", h.perspectiva or "", h.objetivo_tactico or "", h.responsable or "", h.meta_corto_plazo or "", h.estado.value) for h in hoshin]
    hoshin_html = section("13. Despliegue Hoshin Kanri",
        table(["Obj. Estrategico", "BSC", "Obj. Tactico", "Responsable", "Meta CP", "Estado"], hoshin_rows) if hoshin else "<p>No completado.</p>"
    )

    # Footer
    footer = f'<div class="footer"><p>Generado por Enfoque 365 -- {today} -- {docs} documentos de soporte</p></div>'

    # Assemble
    css = '''
    <style>
        @page { size: letter; margin: 2cm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Segoe UI", Tahoma, sans-serif; color: #1a1a2e; font-size: 11pt; line-height: 1.6; }
        .cover { text-align: center; padding: 80px 0 40px; border-bottom: 3px solid #6366f1; margin-bottom: 32px; }
        .cover h1 { font-size: 28pt; color: #6366f1; margin-bottom: 8px; }
        .cover h2 { font-size: 18pt; color: #333; font-weight: 400; }
        .cover .date { margin-top: 24px; color: #666; font-size: 10pt; }
        .cover .meta { color: #888; font-size: 9pt; }
        .section { margin-bottom: 28px; page-break-inside: avoid; }
        .section h2 { font-size: 14pt; color: #6366f1; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 12px; }
        .section h3 { font-size: 11pt; color: #374151; margin: 12px 0 6px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; font-size: 9.5pt; }
        th { background: #f1f5f9; text-align: left; padding: 6px 10px; border: 1px solid #d1d5db; font-weight: 600; }
        td { padding: 5px 10px; border: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        table.kpi { width: auto; margin: 4px 0 4px 20px; font-size: 8.5pt; }
        ul { margin-left: 20px; margin-bottom: 8px; }
        li { margin-bottom: 4px; }
        .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #d1d5db; text-align: center; color: #9ca3af; font-size: 8.5pt; }
        @media print { .no-print { display: none; } }
    </style>
    '''

    html = f'''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Plan Estrategico - {name}</title>
    {css}
</head>
<body>
    {cover}
    {identity}
    {pestel_html}
    {porter_html}
    {vrio_html}
    {s7_html}
    {bcg_html}
    {foda_html}
    {tows_html}
    {p2w_html}
    {kernel_html}
    {bo_html}
    {pei_html}
    {hoshin_html}
    {footer}
</body>
</html>'''

    return HTMLResponse(content=html)


# ══════════════════════════════════════════════
# EXPORTACION INTELIGENTE (BIG FOUR STYLE)
# ══════════════════════════════════════════════

@router.get("/ia/export-plan-ia")
def get_ia_export_plan(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA, RoleEnum.LECTOR)),
    db: Session = Depends(get_db),
):
    """Obtiene el memorándum generado previamente, si existe."""
    plan = db.query(PlanEstrategico).filter(PlanEstrategico.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    if plan.memorandum_ia:
        return {"markdown": plan.memorandum_ia}
    
    return {"markdown": None}

@router.post("/ia/export-plan-ia")
async def ia_export_plan(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Exportacion Inteligente: Toma todo el contexto del plan (Diagnostico, Formulacion, Despliegue)
    y utiliza la IA como 'Big Four Strategy Consultant' para redactar un documento Markdown.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    # Recolectar datos
    # 1. Diagnostico
    pestels = db.query(PESTELFactor).filter(PESTELFactor.tenant_id == tenant_id).all()
    porters = db.query(PorterForce).filter(PorterForce.tenant_id == tenant_id).all()
    vrios = db.query(VRIOResource).filter(VRIOResource.tenant_id == tenant_id).all()
    fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
    
    # 2. Formulacion
    tows = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).all()
    p2ws = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).all()
    kernels = db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id).all()
    bos = db.query(BlueOceanAction).filter(BlueOceanAction.tenant_id == tenant_id).all()
    # 3. Despliegue
    plan = db.query(PlanEstrategico).filter(PlanEstrategico.id == plan_id).first()
    mision = plan.mision if plan else ""
    vision = plan.vision if plan else ""
    valores = db.query(ValorInstitucional).filter(ValorInstitucional.tenant_id == tenant_id).all()
    
    ejes = db.query(EjeEstrategico).filter(EjeEstrategico.tenant_id == tenant_id).all()
    objetivos = db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.tenant_id == tenant_id).all()
    indicadores = db.query(Indicador).filter(Indicador.tenant_id == tenant_id).all()
    hoshins = db.query(HoshinItem).filter(HoshinItem.tenant_id == tenant_id).all()

    try:
        # Formatear el contexto para el prompt
        contexto = {
            "institucion": tenant.name,
            "diagnostico": {
                "pestel": [{"factor": p.category.value, "descripcion": p.description} for p in pestels],
                "porter": [{"fuerza": p.force_type.value, "poder": p.intensity, "descripcion": p.description} for p in porters],
                "vrio": [{"recurso": p.resource_name, "ventaja_competitiva": (p.valuable and p.rare and p.inimitable and p.organized)} for p in vrios],
                "foda": [{"cuadrante": p.quadrant.value, "descripcion": p.description} for p in fodas]
            },
            "formulacion": {
                "tows": [{"cuadrante": t.quadrant.value, "estrategia": t.strategy} for t in tows],
                "play_to_win": [{"eleccion": p.choice_type.value, "descripcion": p.description} for p in p2ws],
                "kernel": [{"componente": k.component_type.value, "descripcion": k.description} for k in kernels],
                "blue_ocean": [{"accion": b.action_type.value, "factor": b.factor} for b in bos]
            },
            "despliegue": {
                "mision": mision,
                "vision": vision,
                "valores": [{"nombre": v.nombre, "descripcion": v.descripcion} for v in valores],
                "ejes_bsc": [{"nombre": e.name, "perspectiva": e.perspectiva_bsc.value if e.perspectiva_bsc else "", "peso": float(e.peso_ponderado)} for e in ejes],
                "objetivos": [o.description for o in objetivos],
                "kpis": [{"nombre": i.nombre, "meta": float(i.meta) if i.meta else 0} for i in indicadores],
                "hoshin_kanri": [{"tactica": h.objetivo_tactico, "responsable": h.responsable, "meta_cp": h.meta_corto_plazo} for h in hoshins]
            }
        }
    except Exception as e:
        import traceback
        return {"markdown": f"ERROR IN CONTEXT PREP: {str(e)}\n{traceback.format_exc()}"}

    import asyncio

    try:
        base_prompt = f"""Eres un Partner de una consultora estratégica de élite "Big Four" (ej. McKinsey, BCG, Bain).
Se te ha encomendado redactar una sección específica del 'Plan Estratégico Institucional' para la institución: {tenant.name}.

Contexto Global y Misión/Visión:
Misión: {mision}
Visión: {vision}
Valores: {[v['nombre'] for v in contexto['despliegue']['valores']]}

INSTRUCCIONES CRÍTICAS (DE ESTRICTO CUMPLIMIENTO):
1. BAJO NINGUNA CIRCUNSTANCIA uses tablas Markdown (ej. `| --- |`). Son inaceptables y rompen el diseño corporativo.
2. Si necesitas presentar datos estructurados o listar estrategias, utiliza viñetas estilizadas corporativas, párrafos de análisis directo o bloques de citas ejecutivas (blockquotes `>`).
3. El tono debe ser altamente profesional, persuasivo, directivo y estructurado como un memorándum de consultoría de altísimo nivel.
4. Redacta ÚNICAMENTE la sección que se te solicita a continuación. NO incluyas saludos, ni texto extra, ni confirmaciones. Devuelve SOLO el contenido Markdown de tu sección.
"""

        prompts = [
            base_prompt + f"\n\nTU TAREA: Redacta el '# Plan Estratégico Institucional: {tenant.name}' y la sección '## 1. Resumen Ejecutivo'. Sintetiza de manera magistral la situación actual, la ambición y la ruta crítica.",
            base_prompt + f"\n\nTU TAREA: Redacta la sección '## 2. Análisis del Entorno Macro (PESTEL)'. Insumos: {json.dumps(contexto['diagnostico']['pestel'], ensure_ascii=False)}. Analiza profundamente las implicaciones de estos factores.",
            base_prompt + f"\n\nTU TAREA: Redacta la sección '## 3. Dinámica Competitiva (Fuerzas de Porter)'. Insumos: {json.dumps(contexto['diagnostico']['porter'], ensure_ascii=False)}. Redacta un análisis narrativo sobre rivalidad y poder.",
            base_prompt + f"\n\nTU TAREA: Redacta la sección '## 4. Capacidades Internas y Ventaja Competitiva (VRIO)'. Insumos: {json.dumps(contexto['diagnostico']['vrio'], ensure_ascii=False)}. ¿Cuáles recursos son ventajas competitivas sostenibles?",
            base_prompt + f"\n\nTU TAREA: Redacta la sección '## 5. Diagnóstico Integrado (FODA y TOWS)'. Insumos FODA: {json.dumps(contexto['diagnostico']['foda'], ensure_ascii=False)}. Insumos TOWS: {json.dumps(contexto['formulacion']['tows'], ensure_ascii=False)}. Sintetiza la matriz y las estrategias cruzadas sin usar tablas.",
            base_prompt + f"\n\nTU TAREA: Redacta la sección '## 6. Formulación Estratégica (Play-to-Win, Kernel y Océano Azul)'. Insumos P2W: {json.dumps(contexto['formulacion']['play_to_win'], ensure_ascii=False)}. Insumos Kernel: {json.dumps(contexto['formulacion']['kernel'], ensure_ascii=False)}. Insumos BO: {json.dumps(contexto['formulacion']['blue_ocean'], ensure_ascii=False)}. Explica la política guía y los movimientos Océano Azul.",
            base_prompt + f"\n\nTU TAREA: Redacta la sección '## 7. Despliegue Operativo y Ejecución (BSC y Hoshin Kanri)'. Insumos Ejes: {json.dumps(contexto['despliegue']['ejes_bsc'], ensure_ascii=False)}. Objetivos: {json.dumps(contexto['despliegue']['objetivos'], ensure_ascii=False)}. KPIs: {json.dumps(contexto['despliegue']['kpis'], ensure_ascii=False)}. Hoshin Kanri: {json.dumps(contexto['despliegue']['hoshin_kanri'], ensure_ascii=False)}. Narra la traducción operativa, las metas a corto plazo y la ejecución táctica.",
            base_prompt + "\n\nTU TAREA: Redacta la sección '## 8. Conclusión y Recomendaciones Finales'. Proporciona un cierre directivo, estructurado y persuasivo con los próximos pasos a seguir."
        ]

        # Ejecutar las 8 peticiones en paralelo
        tasks = [
            generate(prompt, db=db, tenant_id=tenant_id, endpoint_name="export_plan_ia", response_format="text")
            for prompt in prompts
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Ensamblar el documento
        markdown_text = "\n\n".join([str(res).strip() for res in results if res])
        
        if not markdown_text or markdown_text.isspace():
            markdown_text = f"# Plan Estratégico Institucional: {tenant.name}\n\n*Nota: Falló la generación.*"

        # Limpiar formato de markdown code blocks si el LLM lo incluye por error
        markdown_text = markdown_text.strip()
        if markdown_text.startswith("```markdown"):
            markdown_text = markdown_text[11:]
        elif markdown_text.startswith("```"):
            markdown_text = markdown_text[3:]
        if markdown_text.endswith("```"):
            markdown_text = markdown_text[:-3]

        markdown_text = markdown_text.strip()

        # Guardar en base de datos
        if plan:
            plan.memorandum_ia = markdown_text
            db.commit()

        return {"markdown": markdown_text}
    except Exception as e:
        import traceback
        logger.error(f"Error generando exportación IA: {e}")
        return {"markdown": f"## Error al generar el documento\nNo se pudo contactar al LLM. Detalles:\n{str(e)}"}
