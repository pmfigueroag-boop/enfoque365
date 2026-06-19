"""
Endpoints del Bucle Analítico y Diagnóstico — Sprint 2.
Implementa:
  - US-2.1: CRUD de factores PESTEL y elementos FODA
  - US-2.2: Endpoint que simula el Agente Analítico (genera sugerencias)
  - US-2.3: Flujo de Fricción Intencional (aprobar/rechazar propuestas IA)

Toda sugerencia de IA pasa por ia_log_propuestas_ooda en estado "borrador".
Solo al aprobarla se materializa en la tabla operativa correspondiente.
"""
import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    Tenant, ValorInstitucional, PlanEstrategico,
    PESTELFactor, PorterForce, FODAItem, IALogPropuestaOODA,
    IAProposalStatus, FODAQuadrant, PorterForceType, RoleEnum, User,
    VRIOResource, McKinsey7SElement, McKinsey7SElementType,
    BCGUnit, BCGQuadrant,
    TOWSStrategy, TOWSQuadrant,
    P2WChoice, P2WChoiceType,
    KernelComponent, KernelComponentType,
    BlueOceanAction, BlueOceanActionType,
    RiskClassification,
    MonitoringAlert, MonitoringAlertStatus,
)
from app.schemas.diagnostico import (
    PESTELCreate, PESTELResponse, PESTELUpdate,
    PorterCreate, PorterResponse,
    FODACreate, FODAMove, FODAResponse,
    IAProposalCreate, IAProposalResponse,
    IAProposalReject,
)
from app.core.security import get_current_tenant_id, get_current_plan_id, get_current_user, require_role

router = APIRouter()


# ══════════════════════════════════════════════
# US-2.1: PESTEL
# ══════════════════════════════════════════════

@router.post("/pestel", response_model=PESTELResponse, status_code=status.HTTP_201_CREATED)
def create_pestel_factor(
    factor_in: PESTELCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Registra un factor del entorno externo (PESTEL)."""
    from app.schemas.diagnostico import compute_risk_classification
    from app.db.models import RiskClassification
    rc_str = compute_risk_classification(factor_in.probability, factor_in.impact_level)
    _rc_map = {
        "critico": RiskClassification.CRITICO,
        "monitoreo": RiskClassification.MONITOREO,
        "bajo": RiskClassification.BAJO,
        "sin_calificar": RiskClassification.SIN_CALIFICAR,
    }
    factor = PESTELFactor(
        category=factor_in.category,
        description=factor_in.description,
        impact_level=factor_in.impact_level,
        probability=factor_in.probability,
        source=factor_in.source,
        risk_classification=_rc_map.get(rc_str, RiskClassification.SIN_CALIFICAR),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(factor)
    db.commit()
    db.refresh(factor)
    return factor


@router.get("/pestel", response_model=list[PESTELResponse])
def list_pestel_factors(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los factores PESTEL del tenant."""
    return db.query(PESTELFactor).filter(PESTELFactor.tenant_id == tenant_id, PESTELFactor.plan_id == plan_id).all()


@router.put("/pestel/{item_id}", response_model=PESTELResponse)
def update_pestel_factor(
    item_id: int,
    factor_in: PESTELUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Actualiza un factor PESTEL.

    B1.1: Auto-computa risk_classification desde P×I.
    B2.2: Registra validated_at y validated_by_user_id cuando se
    asignan probabilidad e impacto (acto de validación humana).
    """
    item = db.query(PESTELFactor).filter(
        PESTELFactor.id == item_id, PESTELFactor.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Factor no encontrado")
    
    update_data = factor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    # B1.1: Re-calcular clasificación de riesgo si hay P e I
    from app.schemas.diagnostico import compute_risk_classification
    from app.db.models import RiskClassification
    _rc_map = {
        "critico": RiskClassification.CRITICO,
        "monitoreo": RiskClassification.MONITOREO,
        "bajo": RiskClassification.BAJO,
        "sin_calificar": RiskClassification.SIN_CALIFICAR,
    }
    prob = item.probability
    imp = item.impact_level
    if prob is not None and imp is not None:
        rc_str = compute_risk_classification(prob, imp)
        item.risk_classification = _rc_map.get(rc_str, RiskClassification.SIN_CALIFICAR)
        # B2.2: Registrar acto de validación humana
        if "probability" in update_data or "impact_level" in update_data:
            item.validated_at = datetime.now(timezone.utc)
            item.validated_by_user_id = user.id
            item.last_evaluated_at = datetime.now(timezone.utc)

            # B4.1: Programar reevaluación para factores en zona MONITOREO
            freq = item.review_frequency_days or 90
            if item.risk_classification == RiskClassification.MONITOREO:
                item.next_review_date = datetime.now(timezone.utc) + timedelta(days=freq)
            else:
                # CRITICO o BAJO no necesitan reevaluación periódica
                item.next_review_date = None

    db.commit()
    db.refresh(item)
    return item


@router.delete("/pestel/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pestel_factor(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Elimina un factor PESTEL."""
    item = db.query(PESTELFactor).filter(
        PESTELFactor.id == item_id, PESTELFactor.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Factor PESTEL no encontrado.")
    db.delete(item)
    db.commit()


# ══════════════════════════════════════════════
# Sprint 5: PORTER 5 FUERZAS
# ══════════════════════════════════════════════

@router.post("/porter", response_model=PorterResponse, status_code=status.HTTP_201_CREATED)
def create_porter_force(
    item_in: PorterCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Registra un factor Porter (manual)."""
    item = PorterForce(
        force_type=item_in.force_type,
        description=item_in.description,
        intensity=item_in.intensity,
        evidence=item_in.evidence,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/porter", response_model=list[PorterResponse])
def list_porter_forces(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los factores Porter del tenant."""
    return db.query(PorterForce).filter(PorterForce.tenant_id == tenant_id, PorterForce.plan_id == plan_id).all()


@router.delete("/porter/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_porter_force(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Elimina un factor Porter."""
    item = db.query(PorterForce).filter(
        PorterForce.id == item_id, PorterForce.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Factor Porter no encontrado.")
    db.delete(item)
    db.commit()


# ══════════════════════════════════════════════
# US-2.1: FODA
# ══════════════════════════════════════════════

@router.post("/foda", response_model=FODAResponse, status_code=status.HTTP_201_CREATED)
def create_foda_item(
    item_in: FODACreate,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Registra un elemento FODA (manual, sin IA)."""
    item = FODAItem(
        quadrant=item_in.quadrant,
        description=item_in.description,
        priority=item_in.priority,
        pestel_factor_id=item_in.pestel_factor_id,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/foda", response_model=list[FODAResponse])
def list_foda_items(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos los elementos FODA del tenant."""
    return db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id, FODAItem.plan_id == plan_id).all()


@router.delete("/foda/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_foda_item(
    item_id: int,
    justificacion: str = None,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Elimina un elemento FODA.

    TRAZABILIDAD DOCTRINAL (ISO 31000 / COSO):
    Si el item FODA proviene de un factor PESTEL con score CRÍTICO
    (Probabilidad × Impacto ≥ 49), el borrado requiere justificación
    documentada via parámetro 'justificacion'. Sin ella, se rechaza
    con HTTP 409 para preservar la cadena PESTEL→FODA→TOWS.
    """
    item = db.query(FODAItem).filter(
        FODAItem.id == item_id, FODAItem.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Elemento FODA no encontrado.")

    # ── Guardia de trazabilidad: proteger ítems derivados de PESTEL Crítico ──
    if item.pestel_factor_id:
        pestel_src = db.query(PESTELFactor).filter(
            PESTELFactor.id == item.pestel_factor_id,
        ).first()
        if pestel_src:
            prob = pestel_src.probability or 5
            imp = pestel_src.impact_level or 5
            score = prob * imp
            if score >= 49:  # CRÍTICO
                if not justificacion or len(justificacion.strip()) < 10:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Este elemento FODA deriva de un factor PESTEL CRITICO "
                            f"(score {score} = {prob}×{imp}). "
                            f"No se puede eliminar sin justificacion documentada. "
                            f"Envie el parametro 'justificacion' con al menos 10 caracteres."
                        ),
                    )
                # Registrar justificación en el log OODA para auditoría
                log = IALogPropuestaOODA(
                    ooda_phase="decide",
                    target_entity="foda_item_delete",
                    proposed_payload=json.dumps({
                        "foda_item_id": item.id,
                        "pestel_factor_id": item.pestel_factor_id,
                        "pestel_score": score,
                        "action": "delete",
                    }),
                    ai_reasoning=f"[AUDITORIA] Borrado autorizado por usuario. Justificacion: {justificacion.strip()}",
                    status=IAProposalStatus.APROBADO,
                    reviewed_by_user_id=user.id,
                    reviewed_at=datetime.now(timezone.utc),
                    tenant_id=tenant_id,
                    plan_id=item.plan_id,
                )
                db.add(log)

    db.delete(item)
    db.commit()


@router.patch("/foda/{item_id}/mover", response_model=FODAResponse)
def move_foda_item(
    item_id: int,
    move_in: FODAMove,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Mueve un elemento FODA a otro cuadrante (HITL: drag & drop / fallback).
    Permite reclasificar un factor sin eliminar y recrear,
    preservando la trazabilidad (pestel_factor_id, source_tool, etc.).
    """
    item = db.query(FODAItem).filter(
        FODAItem.id == item_id, FODAItem.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Elemento FODA no encontrado.")
    if item.quadrant == move_in.quadrant:
        return item  # No-op si ya está en el cuadrante destino
    item.quadrant = move_in.quadrant
    db.commit()
    db.refresh(item)
    return item


# ══════════════════════════════════════════════
# FODA IA – Síntesis desde las 5 herramientas
# ══════════════════════════════════════════════

@router.post("/ia/analizar-foda", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_foda(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Sintetiza FODA leyendo los datos APROBADOS de las 5 herramientas.
    - Oportunidades ← PESTEL positivos + Porter fuerzas débiles
    - Amenazas ← PESTEL negativos + Porter fuerzas fuertes
    - Fortalezas ← VRIO ventaja + 7S score alto + BCG stars/cash_cows
    - Debilidades ← VRIO paridad/desventaja + 7S score bajo + BCG dogs/question

    Limita a 4 items por cuadrante (16 total) priorizando por relevancia.
    """
    ctx = _get_tenant_context(db, tenant_id, plan_id)

    # Leer datos aprobados de las 5 herramientas
    pestels = db.query(PESTELFactor).filter(PESTELFactor.tenant_id == tenant_id).all()
    porters = db.query(PorterForce).filter(PorterForce.tenant_id == tenant_id).all()
    vrios = db.query(VRIOResource).filter(VRIOResource.tenant_id == tenant_id).all()
    elements_7s = db.query(McKinsey7SElement).filter(McKinsey7SElement.tenant_id == tenant_id).all()
    bcgs = db.query(BCGUnit).filter(BCGUnit.tenant_id == tenant_id).all()

    total = len(pestels) + len(porters) + len(vrios) + len(elements_7s) + len(bcgs)
    if total == 0:
        raise HTTPException(
            status_code=400,
            detail="No hay datos de analisis previos. Complete al menos PESTEL, Porter o VRIO antes de sintetizar FODA."
        )

    source = "sintesis:automatica"
    MAX_PER_QUADRANT = 4

    # Collect candidates per quadrant with priority scores
    candidates: dict[str, list[tuple[float, dict]]] = {
        "fortaleza": [], "oportunidad": [], "debilidad": [], "amenaza": [],
    }

    # ── PESTEL → FODA: Clasificación por contenido + categoría ──
    # Heurística de sentimiento: detectar si el factor es positivo o negativo
    # basándose en palabras clave del contenido, NO solo en la categoría PESTEL.
    _POSITIVE_SIGNALS = (
        "oportunidad", "incentivo", "impulso", "crecimiento", "demanda",
        "alianza", "innovacion", "inversión", "inversion", "apertura",
        "facilitando", "facilita", "beneficio", "digitalización", "digitalizacion",
        "adopcion", "adopción", "auge", "favorable", "aprovech",
        "licitacion", "licitación", "subsidio", "exencion", "exención",
    )
    _NEGATIVE_SIGNALS = (
        "restriccion", "restricción", "sancion", "sanción", "riesgo",
        "amenaza", "declive", "obsolescencia", "penaliz", "multa",
        "litigio", "crisis", "tensión", "tension", "proteccion",
        "regulacion", "regulación", "cumplimiento", "compliance",
        "barrera", "limitacion", "limitación", "escasez", "conflicto",
        "rotacion", "rotación", "fuga", "sobrecosto", "encarec",
        "vulnerab", "ataque", "ciberataque", "piratería", "pirateria",
        "erosion", "erosión", "presion", "presión", "desventaja",
        "perdida", "pérdida", "desaceler", "incertidumbre", "brecha",
        "limitando", "debilita", "deterioro", "contraccion", "contracción",
        "resistencia", "rezago", "deficien", "insuficien",
    )
    # Categorías con sesgo natural (fallback si no hay señales claras)
    _NATURAL_OPPORTUNITY = ("tecnologico", "economico", "social")
    _NATURAL_THREAT = ("politico", "legal", "ecologico")

    for p in pestels:
        prob = p.probability or 5
        imp = p.impact_level or 5
        score = prob * imp
        cat = p.category.value
        desc_lower = (p.description or "").lower()

        # Detectar sentimiento del contenido
        pos_hits = sum(1 for s in _POSITIVE_SIGNALS if s in desc_lower)
        neg_hits = sum(1 for s in _NEGATIVE_SIGNALS if s in desc_lower)

        if pos_hits > neg_hits:
            quadrant = "oportunidad"
        elif neg_hits > pos_hits:
            quadrant = "amenaza"
        elif pos_hits == neg_hits and pos_hits > 0:
            # Empate con señales mixtas: score alto = amenaza (principio de precaución)
            quadrant = "amenaza" if score >= 25 else "oportunidad"
        elif cat in _NATURAL_OPPORTUNITY:
            quadrant = "oportunidad"
        elif cat in _NATURAL_THREAT:
            quadrant = "amenaza"
        else:
            continue

        # Prioridad label
        if score >= 49:
            label = "ALTO IMPACTO" if quadrant == "oportunidad" else "CRITICO"
        elif score >= 25:
            label = "MONITOREO"
        else:
            if imp < 3:
                continue
            label = "EMERGENTE"

        reasoning = (
            f"[Sintesis FODA ({source})] Factor PESTEL '{cat}' "
            f"con score {label} ({score} = {prob}×{imp}) → {quadrant.capitalize()}."
        )
        payload_data = {
            "quadrant": quadrant,
            "description": f"[PESTEL/{cat.upper()}] {p.description}",
            "source_tool": "pestel",
            "pestel_factor_id": p.id,
        }
        candidates[quadrant].append((score, {"payload": payload_data, "reasoning": reasoning}))

    # ── PORTER → FODA ──
    for f in porters:
        intensity = f.intensity or 3
        probability = f.probability or 3
        pressure = intensity * probability

        if intensity <= 2:
            quadrant = "oportunidad"
            payload_data = {
                "quadrant": "oportunidad",
                "description": f"[PORTER/{f.force_type.value.upper()}] Baja presión: {f.description}",
                "source_tool": "porter",
                "porter_force_id": f.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Fuerza Porter '{f.force_type.value}' con intensidad {intensity}/5 (débil) → Oportunidad."
            candidates["oportunidad"].append((pressure, {"payload": payload_data, "reasoning": reasoning}))

        elif intensity >= 4:
            quadrant = "amenaza"
            payload_data = {
                "quadrant": "amenaza",
                "description": f"[PORTER/{f.force_type.value.upper()}] Alta presión: {f.description}",
                "source_tool": "porter",
                "porter_force_id": f.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Fuerza Porter '{f.force_type.value}' con intensidad {intensity}/5 (fuerte) → Amenaza."
            candidates["amenaza"].append((pressure, {"payload": payload_data, "reasoning": reasoning}))

    # ── VRIO → Fortalezas/Debilidades ──
    for v in vrios:
        vrio_count = sum([bool(v.valuable), bool(v.rare), bool(v.inimitable), bool(v.organized)])
        if v.valuable and v.rare:
            label = v.competitive_implication or "Ventaja competitiva"
            payload_data = {
                "quadrant": "fortaleza",
                "description": f"[VRIO] {v.resource_name}: {label}",
                "source_tool": "vrio",
                "vrio_resource_id": v.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Recurso VRIO '{v.resource_name}' ({vrio_count}/4 criterios) → Fortaleza."
            candidates["fortaleza"].append((vrio_count * 25, {"payload": payload_data, "reasoning": reasoning}))
        elif not v.valuable or (v.valuable and not v.rare):
            label = v.competitive_implication or "Sin ventaja"
            payload_data = {
                "quadrant": "debilidad",
                "description": f"[VRIO] {v.resource_name}: {label}",
                "source_tool": "vrio",
                "vrio_resource_id": v.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Recurso VRIO '{v.resource_name}' ({vrio_count}/4 criterios) → Debilidad."
            candidates["debilidad"].append(((4 - vrio_count) * 25, {"payload": payload_data, "reasoning": reasoning}))

    # ── 7S → Fortalezas/Debilidades ──
    for e in elements_7s:
        score = e.alignment_score or 3
        if score >= 4:
            payload_data = {
                "quadrant": "fortaleza",
                "description": f"[7S/{e.element_type.value.upper()}] Alto alineamiento: {e.description}",
                "source_tool": "7s",
                "mckinsey7s_element_id": e.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Elemento 7S '{e.element_type.value}' con score {score}/5 → Fortaleza."
            candidates["fortaleza"].append((score * 20, {"payload": payload_data, "reasoning": reasoning}))
        elif score <= 2:
            payload_data = {
                "quadrant": "debilidad",
                "description": f"[7S/{e.element_type.value.upper()}] Bajo alineamiento: {e.description}",
                "source_tool": "7s",
                "mckinsey7s_element_id": e.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Elemento 7S '{e.element_type.value}' con score {score}/5 → Debilidad."
            candidates["debilidad"].append(((5 - score) * 20, {"payload": payload_data, "reasoning": reasoning}))

    # ── BCG → Fortalezas/Debilidades ──
    BCG_LABELS = {"star": "Estrella", "cash_cow": "Vaca Lechera", "question_mark": "Interrogación", "dog": "Perro"}
    for b in bcgs:
        q = b.quadrant.value
        label = BCG_LABELS.get(q, q)
        if q in ("star", "cash_cow"):
            priority = 90 if q == "star" else 70
            payload_data = {
                "quadrant": "fortaleza",
                "description": f"[BCG/{label}] {b.unit_name}: posición dominante",
                "source_tool": "bcg",
                "bcg_unit_id": b.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Unidad BCG '{b.unit_name}' ({label}) → Fortaleza."
            candidates["fortaleza"].append((priority, {"payload": payload_data, "reasoning": reasoning}))
        elif q in ("dog", "question_mark"):
            priority = 80 if q == "dog" else 60
            payload_data = {
                "quadrant": "debilidad",
                "description": f"[BCG/{label}] {b.unit_name}: posición vulnerable",
                "source_tool": "bcg",
                "bcg_unit_id": b.id,
            }
            reasoning = f"[Sintesis FODA ({source})] Unidad BCG '{b.unit_name}' ({label}) → Debilidad."
            candidates["debilidad"].append((priority, {"payload": payload_data, "reasoning": reasoning}))

    # ── Priorizar y limitar: top N por cuadrante ──
    proposals = []
    for quadrant, items in candidates.items():
        # Sort by priority score descending, take top MAX_PER_QUADRANT
        items.sort(key=lambda x: x[0], reverse=True)
        for _, item_data in items[:MAX_PER_QUADRANT]:
            payload = json.dumps(item_data["payload"])
            proposals.append(IALogPropuestaOODA(
                ooda_phase="orient",
                target_entity="foda_item",
                proposed_payload=payload,
                ai_reasoning=item_data["reasoning"],
                status=IAProposalStatus.BORRADOR,
                tenant_id=tenant_id,
                plan_id=plan_id,
            ))

    if not proposals:
        raise HTTPException(
            status_code=400,
            detail="Los datos existentes no generaron propuestas FODA. Ajuste los factores o agregue más análisis."
        )

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals
# ══════════════════════════════════════════════
# AGENTE ANALITICO IA (Multi-LLM + HITL)
#
# DOCTRINA: La IA GENERA factores desde cero.
# Usa Gemini, ChatGPT o Claude segun config.
# Si no hay API key → fallback deterministico.
# El humano aprueba/rechaza desde el Inbox.
# ══════════════════════════════════════════════

import asyncio
from app.services import llm
from app.services.prompts import (
    build_pestel_prompt, build_pestel_dimension_prompt, PESTEL_DIMENSIONS,
    build_porter_prompt,
    build_vrio_prompt, build_mckinsey7s_prompt, build_bcg_prompt,
    build_tows_prompt, build_p2w_prompt, build_kernel_prompt,
    build_blue_ocean_prompt,
)

# -- Fallback deterministico (sin LLM) --
# Flat list: cada factor lleva su category explicitamente.
# Orden mezclado para evitar la falsa impresion de asignacion secuencial.
_PESTEL_FALLBACK = [
    ("legal", "Nuevas leyes de proteccion de datos personales", 8, 9, "Muy alta. Legislacion en fase de implementacion."),
    ("economico", "Presion inflacionaria que erosiona el presupuesto operativo", 7, 8, "Alta. Tendencia macroeconomica persistente en la region."),
    ("politico", "Cambios en la regulacion sectorial que podrian afectar el marco operativo", 6, 7, "Probable. Ciclo legislativo activo en el sector."),
    ("tecnologico", "Adopcion de inteligencia artificial para automatizacion de procesos", 8, 7, "Media-alta. Competidores ya implementando soluciones IA."),
    ("social", "Crecimiento de la demanda de servicios digitales por parte de los usuarios", 6, 8, "Alta. Tendencia acelerada post-pandemia."),
    ("ecologico", "Presion regulatoria hacia la sostenibilidad ambiental", 5, 6, "Media. Marco normativo en desarrollo."),
    ("politico", "Reformas fiscales previstas que impactarian la estructura de costos", 8, 6, "Media-alta. Proyecto de ley en discusion parlamentaria."),
    ("legal", "Normativas de compliance y anticorrupcion", 6, 7, "Probable. Presion de organismos internacionales."),
    ("social", "Expectativas de transparencia y rendicion de cuentas", 7, 7, "Probable. Presion ciudadana creciente en el sector."),
    ("economico", "Acceso a financiamiento externo y tasas de interes", 5, 5, "Media. Depende de politica monetaria del banco central."),
    ("tecnologico", "Obsolescencia de sistemas tecnologicos actuales", 7, 6, "Media. Ciclo de vida tecnologico en fase final."),
    ("ecologico", "Impacto del cambio climatico en las operaciones", 4, 3, "Baja. Efecto indirecto a mediano plazo."),
]

_PORTER_FALLBACK = {
    "rivalidad": [
        ("Concentracion", "Alta concentracion de actores similares en el sector", 4, 4, "Mercado saturado con multiples oferentes de servicios comparables."),
        ("Diferenciacion de producto", "Diferenciacion limitada entre oferta de competidores", 3, 3, "Propuestas de valor similares dificultan captar nuevos clientes."),
    ],
    "nuevos_entrantes": [
        ("Requisitos de capital", "Bajas barreras de entrada permiten nuevos competidores", 3, 4, "Inversion inicial moderada facilita entrada de nuevos actores."),
        ("Economias de escala", "Necesidad de escala minima como barrera natural", 2, 3, "Actores pequenos pueden operar pero sin eficiencia de escala."),
    ],
    "sustitutos": [
        ("Desempeno relativo de precio/valor", "Servicios digitales disruptivos que reemplazan los tradicionales", 4, 4, "Plataformas SaaS ofrecen funcionalidad similar a menor costo."),
        ("Propension del comprador", "Alternativas de bajo costo disponibles en el mercado", 3, 3, "Clientes sensibles al precio migran facilmente a sustitutos."),
    ],
    "poder_proveedores": [
        ("Concentracion de proveedores", "Concentracion de proveedores clave genera dependencia", 3, 3, "Pocos proveedores dominan insumos criticos del sector."),
        ("Costos de cambio", "Costos de cambio de proveedor son elevados", 4, 3, "Migracion tecnologica implica inversiones significativas."),
    ],
    "poder_clientes": [
        ("Sensibilidad al precio", "Usuarios con alto poder de negociacion por abundancia de opciones", 3, 4, "Multiples alternativas otorgan poder de negociacion al cliente."),
        ("Concentracion de clientes", "Sensibilidad al precio limita la capacidad de ajuste tarifario", 4, 3, "Base de clientes fragmentada pero informada y exigente."),
    ],
}

PORTER_LABELS = {
    "rivalidad": "Rivalidad entre Competidores",
    "nuevos_entrantes": "Amenaza de Nuevos Entrantes",
    "sustitutos": "Productos/Servicios Sustitutos",
    "poder_proveedores": "Poder de Proveedores",
    "poder_clientes": "Poder de Clientes/Usuarios",
}


def _get_document_context(db, tenant_id, max_chars: int = 8000) -> str:
    """
    Extrae el texto de los documentos del tenant para inyectar como
    contexto en los prompts IA. Prioriza documentos con mas contenido.
    Limita a max_chars para no exceder ventana del LLM.
    """
    from app.db.models import Document
    docs = (
        db.query(Document)
        .filter(Document.tenant_id == tenant_id)
        .filter(Document.extracted_text.isnot(None))
        .filter(Document.char_count > 0)
        .order_by(Document.char_count.desc())
        .all()
    )
    if not docs:
        return ""

    fragments = []
    total = 0
    for d in docs:
        header = f"[{d.doc_type or 'general'}] {d.filename}"
        text = (d.extracted_text or "")[:2000]  # max 2k per doc
        fragment = f"--- {header} ---\n{text}"
        if total + len(fragment) > max_chars:
            break
        fragments.append(fragment)
        total += len(fragment)

    return "\n\n".join(fragments)


def _get_tenant_context(db, tenant_id, plan_id=None):
    """Extrae datos del tenant + plan (mision/vision/valores) + documentos para contextualizar los prompts."""
    from app.db.models import Tenant, PlanEstrategico, ValorInstitucional
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    doc_context = _get_document_context(db, tenant_id)

    # Identidad PEI: mision, vision, valores
    mision = ""
    vision = ""
    valores_list: list[str] = []
    if plan_id:
        plan = db.query(PlanEstrategico).filter(
            PlanEstrategico.id == plan_id,
            PlanEstrategico.tenant_id == tenant_id,
        ).first()
        if plan:
            mision = (plan.mision or "").strip()
            vision = (plan.vision or "").strip()
            valores = db.query(ValorInstitucional).filter(
                ValorInstitucional.plan_id == plan_id,
                ValorInstitucional.tenant_id == tenant_id,
            ).order_by(ValorInstitucional.orden).all()
            valores_list = [v.nombre for v in valores]

    return {
        "nombre": tenant.name,
        "tipo": tenant.tipo.value if tenant.tipo else "mixto",
        "pais": tenant.pais_iso or "internacional",
        "ciiu_seccion": tenant.sector_ciiu or "general",
        "ciiu_division": tenant.sector_ciiu_division or "",
        "ciiu_grupo": getattr(tenant, "sector_ciiu_grupo", "") or "",
        "ciiu_clase": getattr(tenant, "sector_ciiu_clase", "") or "",
        "mision": mision,
        "vision": vision,
        "valores": valores_list,
        "doc_context": doc_context,
    }


@router.post("/ia/analizar-pestel", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
async def ia_generate_pestel(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    GENERA factores PESTEL usando LLM — 6 llamadas paralelas (1 por dimension).
    Cada llamada produce 3 factores enfocados en una sola dimension.
    La categoria se inyecta server-side, eliminando errores de clasificacion.
    Fallback a sugerencias deterministicas si no hay API key.
    """
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    dimensions = list(PESTEL_DIMENSIONS.keys())  # P-E-S-T-E-L

    # ── Fase 1: Generar prompts y lanzar llamadas en paralelo ──
    async def _call_dimension(dimension: str) -> list[dict]:
        """Llama al LLM para UNA dimension y retorna factores con category inyectada."""
        prompt = build_pestel_dimension_prompt(dimension=dimension, **ctx)
        try:
            # db=None: skip per-call telemetry during parallel execution
            # to avoid SQLAlchemy session conflicts across threads.
            raw = await llm.generate(
                prompt,
                endpoint_name=f"analizar-pestel-{dimension}",
                db=None, tenant_id=tenant_id,
                response_format="yaml",
            )
            items = llm.parse_yaml_response(raw) if raw else []
            # Inyectar category server-side (el LLM no la devuelve)
            for item in items:
                item["category"] = dimension
            # Quality gate
            items = llm.validate_llm_output(items, "pestel")
            # Normalizar P/I
            for item in items:
                item["impact_level"] = max(1, min(10, int(item.get("impact_level", 5))))
                item["probability"] = max(1, min(10, int(item.get("probability", 5))))
            return items
        except Exception as e:
            import logging
            logging.error(f"PESTEL dimension '{dimension}' fallo: {e}")
            return []

    # Lanzar las 6 llamadas en paralelo
    results = await asyncio.gather(*[_call_dimension(d) for d in dimensions])

    # Combinar resultados de todas las dimensiones
    factors = []
    for dim_factors in results:
        factors.extend(dim_factors)

    # ── Fase 2: Fallback deterministico si TODAS fallaron ──
    if not factors:
        for category, desc, impact, prob, rationale in _PESTEL_FALLBACK:
            factors.append({
                "category": category,
                "description": f"{desc} (sector {ctx['ciiu_seccion']}, {ctx['pais']})",
                "impact_level": impact,
                "probability": prob,
                "ai_rationale": rationale,
            })

    # ── Fase 3: Crear propuestas HITL ──
    source = "LLM" if any(r for r in results) else "fallback:deterministico"
    from app.schemas.diagnostico import compute_risk_classification
    proposals = []
    for f in factors:
        cat = f.get("category")
        if not cat:
            continue
        imp = f.get("impact_level", 5)
        prob = f.get("probability", 5)
        score = prob * imp
        classification = compute_risk_classification(prob, imp)

        payload = json.dumps({
            "category": cat,
            "description": f.get("description", ""),
            "impact_level": imp,
            "probability": prob,
            "risk_score": score,
            "risk_classification": classification,
            "ai_rationale": f.get("ai_rationale", ""),
        })

        llm_rationale = f.get("ai_rationale", "").strip()
        score_label = classification.upper()
        score_summary = f"[P={prob} × I={imp} = {score} → {score_label}]"

        if llm_rationale:
            reasoning = f"{score_summary} {llm_rationale}"
        else:
            reasoning = (
                f"[Agente Analitico ({source})] Factor {cat.upper()} "
                f"para {ctx['nombre']}. {score_summary}"
            )

        proposal = IALogPropuestaOODA(
            ooda_phase="observe",
            target_entity="pestel_factor",
            proposed_payload=payload,
            ai_reasoning=reasoning,
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(proposal)
        proposals.append(proposal)

    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


@router.post("/ia/analizar-porter", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_porter(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    GENERA fuerzas Porter usando LLM (Gemini/ChatGPT/Claude).
    Fallback a sugerencias deterministicas si no hay API key.
    """
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    forces = []
    if True:
        prompt = build_porter_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-porter", db=db, tenant_id=tenant_id)
            forces = llm.parse_json_response(raw) if raw else []
        except Exception:
            forces = []

    # Fallback deterministico
    if not forces:
        for force_type, items in _PORTER_FALLBACK.items():
            for subfactor, desc, intensity, prob, rationale in items:
                forces.append({
                    "force_type": force_type,
                    "canonical_subfactor": subfactor,
                    "description": f"{desc} (sector {ctx['ciiu_seccion']})",
                    "intensity": intensity,
                    "probability": prob,
                    "ai_rationale": rationale,
                })

    source = "LLM" if forces else "fallback:deterministico"
    proposals = []
    for f in forces:
        ft = f.get("force_type", "rivalidad")
        label = PORTER_LABELS.get(ft, ft)
        intensity = max(1, min(5, int(f.get("intensity", 3))))
        probability = max(1, min(5, int(f.get("probability", 3))))
        subfactor = f.get("canonical_subfactor", "")
        rationale = f.get("ai_rationale", "")
        payload = json.dumps({
            "force_type": ft,
            "canonical_subfactor": subfactor,
            "description": f.get("description", ""),
            "intensity": intensity,
            "probability": probability,
            "ai_rationale": rationale,
        })
        pressure = intensity * probability
        proposal = IALogPropuestaOODA(
            ooda_phase="observe",
            target_entity="porter_force",
            proposed_payload=payload,
            ai_reasoning=(
                f"[Agente Analitico ({source})] Fuerza '{label}' · "
                f"Subfactor: {subfactor or 'N/A'} · "
                f"Presion: {intensity}×{probability}={pressure}/25. "
                f"{rationale}"
            ),
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(proposal)
        proposals.append(proposal)

    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ══════════════════════════════════════════════
# US-2.3: Inbox de Friccion Intencional (HITL)
# ══════════════════════════════════════════════

@router.get("/ia/inbox", response_model=list[IAProposalResponse])
def list_ia_proposals(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Bandeja de entrada: muestra todas las sugerencias de IA
    pendientes de revision humana (estado = borrador).
    """
    return db.query(IALogPropuestaOODA).filter(
        IALogPropuestaOODA.tenant_id == tenant_id,
        IALogPropuestaOODA.plan_id == plan_id,
        IALogPropuestaOODA.status == IAProposalStatus.BORRADOR,
    ).all()


@router.delete("/ia/inbox/all", status_code=status.HTTP_200_OK)
def clear_all_ia_proposals(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Elimina todas las propuestas en estado borrador del plan activo."""
    count = db.query(IALogPropuestaOODA).filter(
        IALogPropuestaOODA.tenant_id == tenant_id,
        IALogPropuestaOODA.plan_id == plan_id,
        IALogPropuestaOODA.status == IAProposalStatus.BORRADOR,
    ).delete()
    db.commit()
    return {"deleted": count}


@router.post("/ia/inbox/{proposal_id}/aprobar")
def approve_ia_proposal(
    proposal_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA, RoleEnum.AUDITOR)),
    db: Session = Depends(get_db),
):
    """
    APROBAR sugerencia de IA: materializa el contenido propuesto
    en la tabla operativa correspondiente.

    Soporta: pestel_factor, porter_force, foda_item (y futuras).
    Este es el punto de Friccion Intencional: sin este clic,
    la IA no puede modificar ningun dato del sistema.
    """
    proposal = db.query(IALogPropuestaOODA).filter(
        IALogPropuestaOODA.id == proposal_id,
        IALogPropuestaOODA.tenant_id == tenant_id,
        IALogPropuestaOODA.status == IAProposalStatus.BORRADOR,
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada o ya procesada.")

    # Materializar en la tabla operativa segun target_entity
    payload = json.loads(proposal.proposed_payload)
    entity = proposal.target_entity

    if entity == "pestel_factor":
        from app.schemas.diagnostico import compute_risk_classification
        from app.db.models import RiskClassification, PESTELCategory as _PC
        prob = payload.get("probability", 5)
        imp = payload.get("impact_level", 5)
        rc_str = compute_risk_classification(prob, imp)
        rc_map = {
            "critico": RiskClassification.CRITICO,
            "monitoreo": RiskClassification.MONITOREO,
            "bajo": RiskClassification.BAJO,
            "sin_calificar": RiskClassification.SIN_CALIFICAR,
        }
        item = PESTELFactor(
            category=_PC(payload["category"]),
            description=payload["description"],
            impact_level=imp,
            probability=prob,
            ai_rationale=payload.get("ai_rationale", ""),
            source="Agente Analitico IA",
            risk_classification=rc_map.get(rc_str, RiskClassification.SIN_CALIFICAR),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "porter_force":
        item = PorterForce(
            force_type=payload["force_type"],
            canonical_subfactor=payload.get("canonical_subfactor", ""),
            description=payload["description"],
            intensity=payload.get("intensity", 3),
            probability=payload.get("probability"),
            ai_rationale=payload.get("ai_rationale", ""),
            evidence="Generado por Agente Analitico IA",
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "foda_item":
        item = FODAItem(
            quadrant=payload["quadrant"],
            description=payload["description"],
            source_tool=payload.get("source_tool", "ia"),
            pestel_factor_id=payload.get("pestel_factor_id"),
            porter_force_id=payload.get("porter_force_id"),
            vrio_resource_id=payload.get("vrio_resource_id"),
            mckinsey7s_element_id=payload.get("mckinsey7s_element_id"),
            bcg_unit_id=payload.get("bcg_unit_id"),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "vrio_resource":
        item = VRIOResource(
            resource_name=payload["resource_name"],
            description=payload.get("description", ""),
            valuable=payload.get("valuable", False),
            rare=payload.get("rare", False),
            inimitable=payload.get("inimitable", False),
            organized=payload.get("organized", False),
            competitive_implication=payload.get("competitive_implication", ""),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "mckinsey_7s_element":
        item = McKinsey7SElement(
            element_type=payload["element_type"],
            description=payload["description"],
            alignment_score=payload.get("alignment_score", 3),
            observations=payload.get("observations", ""),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "bcg_unit":
        item = BCGUnit(
            unit_name=payload["unit_name"],
            quadrant=payload["quadrant"],
            market_growth=payload.get("market_growth", 3),
            market_share=payload.get("market_share", 3),
            description=payload.get("description", ""),
            strategic_recommendation=payload.get("strategic_recommendation", ""),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "tows_strategy":
        item = TOWSStrategy(
            quadrant=payload["quadrant"],
            strategy=payload.get("strategy", payload.get("description", "")),
            foda_strength_id=payload.get("foda_strength_id"),
            foda_weakness_id=payload.get("foda_weakness_id"),
            foda_opportunity_id=payload.get("foda_opportunity_id"),
            foda_threat_id=payload.get("foda_threat_id"),
            priority=payload.get("priority", 3),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "p2w_choice":
        item = P2WChoice(
            choice_type=payload["choice_type"],
            description=payload["description"],
            rationale=payload.get("rationale", ""),
            priority=payload.get("priority", 3),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "kernel_component":
        item = KernelComponent(
            component_type=payload["component_type"],
            title=payload.get("title", ""),
            description=payload.get("description", ""),
            priority=payload.get("priority", 3),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "blue_ocean_action":
        item = BlueOceanAction(
            action_type=payload["action_type"],
            factor=payload["factor"],
            description=payload.get("description", ""),
            current_level=payload.get("current_level", 3),
            target_level=payload.get("target_level", 3),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "identidad_mision":
        plan = db.query(PlanEstrategico).filter(PlanEstrategico.id == plan_id, PlanEstrategico.tenant_id == tenant_id).first()
        if plan:
            plan.mision = payload["mision"]

    elif entity == "identidad_vision":
        plan = db.query(PlanEstrategico).filter(PlanEstrategico.id == plan_id, PlanEstrategico.tenant_id == tenant_id).first()
        if plan:
            plan.vision = payload["vision"]

    elif entity == "identidad_valor":
        item = ValorInstitucional(
            nombre=payload["nombre"],
            descripcion=payload.get("descripcion", ""),
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(item)

    elif entity == "eje_estrategico":
        from app.db.models import EjeEstrategico
        raw_persp = payload.get("perspectiva_bsc", "procesos")
        if raw_persp == "cliente":
            raw_persp = "clientes"
        # Evitar duplicados: si ya existe un eje con la misma perspectiva, no crear otro
        existing = db.query(EjeEstrategico).filter(
            EjeEstrategico.tenant_id == tenant_id,
            EjeEstrategico.perspectiva_bsc == raw_persp,
        ).first()
        if not existing:
            item = EjeEstrategico(
                name=payload["name"],
                description=payload.get("description", ""),
                perspectiva_bsc=raw_persp,
                peso_ponderado=payload.get("peso_ponderado", 0.25),
                tenant_id=tenant_id,
                plan_id=plan_id,
            )
            db.add(item)

    elif entity == "objetivo_estrategico":
        from app.db.models import EjeEstrategico, ObjetivoEstrategico
        # Buscar eje por nombre o perspectiva
        eje_name = payload.get("eje_name", "")
        eje_persp = payload.get("eje_perspectiva", "")
        # Fix: cliente -> clientes
        if eje_persp == "cliente":
            eje_persp = "clientes"
        eje = db.query(EjeEstrategico).filter(
            EjeEstrategico.tenant_id == tenant_id,
            EjeEstrategico.name == eje_name,
        ).first()
        if not eje and eje_persp:
            eje = db.query(EjeEstrategico).filter(
                EjeEstrategico.tenant_id == tenant_id,
                EjeEstrategico.perspectiva_bsc == eje_persp,
            ).first()
        # Auto-crear eje si no existe
        if not eje and eje_persp:
            eje = EjeEstrategico(
                name=eje_name or f"Eje {eje_persp.capitalize()}",
                description="",
                perspectiva_bsc=eje_persp,
                peso_ponderado=0.25,
                tenant_id=tenant_id,
                plan_id=plan_id,
            )
            db.add(eje)
            db.flush()  # get eje.id
        if eje:
            # Evitar duplicados
            existing_obj = db.query(ObjetivoEstrategico).filter(
                ObjetivoEstrategico.tenant_id == tenant_id,
                ObjetivoEstrategico.eje_id == eje.id,
                ObjetivoEstrategico.description == payload["description"],
            ).first()
            if not existing_obj:
                item = ObjetivoEstrategico(
                    description=payload["description"],
                    eje_id=eje.id,
                    tenant_id=tenant_id,
                    plan_id=plan_id,
                )
                db.add(item)

    elif entity == "indicador_kpi":
        from app.db.models import Indicador
        # Normalize enum values
        raw_unidad = (payload.get("unidad") or "porcentaje").lower()
        if raw_unidad == "numero":
            raw_unidad = "cantidad"
        raw_freq = (payload.get("frecuencia") or "trimestral").lower()
        raw_tend = (payload.get("tendencia") or "ascendente").lower()
        obj_id = payload.get("objetivo_id")
        # Verificar que el objetivo existe
        from app.db.models import ObjetivoEstrategico
        obj_exists = db.query(ObjetivoEstrategico).filter(
            ObjetivoEstrategico.id == obj_id,
            ObjetivoEstrategico.tenant_id == tenant_id,
        ).first() if obj_id else None
        if obj_exists:
            # Evitar duplicados
            existing_kpi = db.query(Indicador).filter(
                Indicador.tenant_id == tenant_id,
                Indicador.objetivo_id == obj_id,
                Indicador.nombre == payload["nombre"],
            ).first()
            if not existing_kpi:
                item = Indicador(
                    nombre=payload["nombre"],
                    unidad=raw_unidad,
                    linea_base=payload.get("linea_base", 0),
                    meta=payload.get("meta", 100),
                    valor_actual=None,
                    frecuencia=raw_freq,
                    tendencia=raw_tend,
                    objetivo_id=obj_id,
                    tenant_id=tenant_id,
                    plan_id=plan_id,
                )
                db.add(item)

    elif entity == "key_result":
        from app.db.models import KeyResult, ObjetivoEstrategico, UnidadKR
        obj_id = payload.get("objetivo_id")
        # Verificar que el objetivo existe y pertenece al tenant
        obj_exists = db.query(ObjetivoEstrategico).filter(
            ObjetivoEstrategico.id == obj_id,
            ObjetivoEstrategico.tenant_id == tenant_id,
        ).first() if obj_id else None
        if obj_exists:
            # Normalizar unidad
            raw_unit = (payload.get("unit") or "porcentaje").lower()
            unit_map = {"porcentaje": UnidadKR.PORCENTAJE, "cantidad": UnidadKR.CANTIDAD,
                        "monto": UnidadKR.MONEDA, "moneda": UnidadKR.MONEDA,
                        "indice": UnidadKR.CANTIDAD, "dias": UnidadKR.CANTIDAD, "horas": UnidadKR.CANTIDAD}
            unit_enum = unit_map.get(raw_unit, UnidadKR.PORCENTAJE)
            item = KeyResult(
                title=payload["title"],
                target_value=payload.get("target_value", 100),
                current_value=0,
                unit=unit_enum,
                objetivo_id=obj_id,
                tenant_id=tenant_id,
                plan_id=plan_id,
            )
            db.add(item)

    else:
        raise HTTPException(status_code=400, detail=f"Tipo de entidad '{entity}' no soportado.")

    # Marcar propuesta como aprobada
    proposal.status = IAProposalStatus.APROBADO
    proposal.reviewed_by_user_id = user.id
    proposal.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    return {"status": "aprobado", "entity": entity, "proposal_id": proposal_id}


@router.post("/ia/inbox/{proposal_id}/rechazar", response_model=IAProposalResponse)
def reject_ia_proposal(
    proposal_id: int,
    rejection: IAProposalReject,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA, RoleEnum.AUDITOR)),
    db: Session = Depends(get_db),
):
    """
    RECHAZAR sugerencia de IA: marca la propuesta como descartada
    sin materializar ningún dato. Se exige un motivo de rechazo
    para mantener la trazabilidad de la auditoría.
    """
    proposal = db.query(IALogPropuestaOODA).filter(
        IALogPropuestaOODA.id == proposal_id,
        IALogPropuestaOODA.tenant_id == tenant_id,
        IALogPropuestaOODA.status == IAProposalStatus.BORRADOR,
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada o ya procesada.")

    proposal.status = IAProposalStatus.RECHAZADO
    proposal.reviewed_by_user_id = user.id
    proposal.reviewed_at = datetime.now(timezone.utc)
    proposal.rejection_reason = rejection.rejection_reason

    db.commit()
    db.refresh(proposal)
    return proposal


# ══════════════════════════════════════════════
# VRIO – Diagnostico Interno (Sprint 6)
# ══════════════════════════════════════════════

@router.get("/vrio")
def list_vrio(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(VRIOResource).filter(VRIOResource.tenant_id == tenant_id, VRIOResource.plan_id == plan_id).all()


@router.post("/vrio", status_code=status.HTTP_201_CREATED)
def create_vrio(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = VRIOResource(
        resource_name=data["resource_name"],
        description=data.get("description", ""),
        valuable=data.get("valuable", False),
        rare=data.get("rare", False),
        inimitable=data.get("inimitable", False),
        organized=data.get("organized", False),
        competitive_implication=data.get("competitive_implication", ""),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/vrio/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vrio(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(VRIOResource).filter(
        VRIOResource.id == item_id, VRIOResource.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Recurso VRIO no encontrado.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-vrio", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_vrio(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera recursos VRIO via LLM con fallback deterministico."""
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    items = []
    source = "fallback:deterministico"
    if True:
        prompt = build_vrio_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-vrio", db=db, tenant_id=tenant_id)
            parsed = llm.parse_json_response(raw) if raw else []
            if parsed:
                items = parsed
                source = "LLM"
        except Exception:
            items = []

    # Fallback deterministico
    if not items:
        source = "fallback:deterministico"
        items = [
            {"resource_name": "Capital humano especializado", "valuable": True, "rare": True, "inimitable": False, "organized": True},
            {"resource_name": "Infraestructura tecnologica", "valuable": True, "rare": False, "inimitable": False, "organized": True},
            {"resource_name": "Reputacion institucional", "valuable": True, "rare": True, "inimitable": True, "organized": False},
            {"resource_name": "Base de datos de beneficiarios", "valuable": True, "rare": True, "inimitable": True, "organized": True},
            {"resource_name": "Procesos estandarizados", "valuable": True, "rare": False, "inimitable": False, "organized": True},
            {"resource_name": "Red de alianzas estrategicas", "valuable": True, "rare": True, "inimitable": False, "organized": False},
        ]

    proposals = []
    for r in items:
        def _vrio_implication(v, ra, i, o):
            if v and ra and i and o: return "Ventaja competitiva sostenible"
            if v and ra and i: return "Ventaja competitiva temporal (no organizado)"
            if v and ra: return "Ventaja competitiva temporal"
            if v: return "Paridad competitiva"
            return "Desventaja competitiva"

        impl = _vrio_implication(r.get("valuable", False), r.get("rare", False), r.get("inimitable", False), r.get("organized", False))
        payload = json.dumps({
            "resource_name": r.get("resource_name", "Recurso"),
            "valuable": r.get("valuable", False),
            "rare": r.get("rare", False),
            "inimitable": r.get("inimitable", False),
            "organized": r.get("organized", False),
            "competitive_implication": impl,
        })
        proposal = IALogPropuestaOODA(
            ooda_phase="observe",
            target_entity="vrio_resource",
            proposed_payload=payload,
            ai_reasoning=f"[Agente Analitico ({source})] Recurso VRIO para {ctx['nombre']}: {impl}.",
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(proposal)
        proposals.append(proposal)

    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ══════════════════════════════════════════════
# McKinsey 7S – Diagnostico Interno (Sprint 6)
# ══════════════════════════════════════════════

@router.get("/mckinsey7s")
def list_mckinsey7s(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(McKinsey7SElement).filter(McKinsey7SElement.tenant_id == tenant_id, McKinsey7SElement.plan_id == plan_id).all()


@router.post("/mckinsey7s", status_code=status.HTTP_201_CREATED)
def create_mckinsey7s(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = McKinsey7SElement(
        element_type=data["element_type"],
        description=data["description"],
        alignment_score=data.get("alignment_score", 3),
        observations=data.get("observations", ""),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/mckinsey7s/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mckinsey7s(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(McKinsey7SElement).filter(
        McKinsey7SElement.id == item_id, McKinsey7SElement.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Elemento 7S no encontrado.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-mckinsey7s", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_mckinsey7s(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera elementos McKinsey 7S via LLM con fallback deterministico."""
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    items = []
    if True:
        prompt = build_mckinsey7s_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-mckinsey7s", db=db, tenant_id=tenant_id)
            items = llm.parse_json_response(raw) if raw else []
        except Exception:
            items = []

    if not items:
        items = [
            {"element_type": "strategy", "description": "Claridad y comunicacion de la estrategia institucional", "alignment_score": 4, "observations": "Alineada con Shared Values: la mision guia las decisiones estrategicas. Tension con Systems: los procesos no acompanan la velocidad de ejecucion."},
            {"element_type": "structure", "description": "Organizacion jerarquica que limita la agilidad operativa", "alignment_score": 2, "observations": "Desalineada con Strategy: la estrategia exige agilidad pero la estructura es rigida. Afecta tambien Style: el liderazgo informal choca con la jerarquia formal."},
            {"element_type": "systems", "description": "Sistemas de informacion parcialmente integrados con brechas operativas", "alignment_score": 2, "observations": "Desalineada con Skills: el equipo tiene competencias digitales pero los sistemas no las aprovechan. Bloquea la ejecucion de Strategy."},
            {"element_type": "shared_values", "description": "Valores institucionales claros y arraigados en la cultura", "alignment_score": 4, "observations": "Alineada con Strategy: los valores refuerzan la direccion estrategica. Conecta con Style: el liderazgo comunica coherentemente los valores."},
            {"element_type": "style", "description": "Estilo de liderazgo participativo pero con toma de decisiones lenta", "alignment_score": 3, "observations": "Parcialmente alineado con Structure: liderazgo horizontal pero estructura vertical genera friccion. Compatible con Shared Values."},
            {"element_type": "staff", "description": "Gestion del talento reactiva sin plan de desarrollo sistematico", "alignment_score": 3, "observations": "Tension con Skills: se identifican brechas de competencias pero no hay plan de desarrollo. Afecta la implementacion de Strategy."},
            {"element_type": "skills", "description": "Competencias tecnicas fuertes pero carencia en gestion de cambio", "alignment_score": 4, "observations": "Alineada con Strategy: habilidades tecnicas soportan la propuesta de valor. Brecha con Systems: las capacidades exceden las herramientas disponibles."},
        ]

    ELEMENT_LABELS = {
        "strategy": "Estrategia", "structure": "Estructura", "systems": "Sistemas",
        "shared_values": "Valores Compartidos", "style": "Estilo", "staff": "Personal", "skills": "Habilidades",
    }
    HARD_SOFT = {
        "strategy": "Hard", "structure": "Hard", "systems": "Hard",
        "shared_values": "Soft", "style": "Soft", "staff": "Soft", "skills": "Soft",
    }
    source = "LLM" if items else "fallback:deterministico"
    proposals = []
    for e in items:
        etype = e.get("element_type", "strategy")
        # Handle both 'score' and 'alignment_score' from LLM
        score = e.get("alignment_score") or e.get("score", 3)
        score = max(1, min(5, int(score)))
        observations = e.get("observations", "")
        label = ELEMENT_LABELS.get(etype, etype)
        hs = HARD_SOFT.get(etype, "?")
        payload = json.dumps({
            "element_type": etype,
            "description": e.get("description", ""),
            "alignment_score": score,
            "observations": observations,
        })
        proposal = IALogPropuestaOODA(
            ooda_phase="observe",
            target_entity="mckinsey_7s_element",
            proposed_payload=payload,
            ai_reasoning=(
                f"[Agente Analitico ({source})] {hs} S: {label} · "
                f"Alineacion: {score}/5. {observations}"
            ),
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(proposal)
        proposals.append(proposal)

    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ══════════════════════════════════════════════
# BCG Matrix – Diagnostico Interno (Sprint 6)
# ══════════════════════════════════════════════

@router.get("/bcg")
def list_bcg(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(BCGUnit).filter(BCGUnit.tenant_id == tenant_id, BCGUnit.plan_id == plan_id).all()


@router.post("/bcg", status_code=status.HTTP_201_CREATED)
def create_bcg(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = BCGUnit(
        unit_name=data["unit_name"],
        quadrant=data["quadrant"],
        market_growth=data.get("market_growth", 3),
        market_share=data.get("market_share", 3),
        description=data.get("description", ""),
        strategic_recommendation=data.get("strategic_recommendation", ""),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/bcg/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bcg(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(BCGUnit).filter(
        BCGUnit.id == item_id, BCGUnit.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Unidad BCG no encontrada.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-bcg", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_bcg(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera unidades BCG via LLM con fallback deterministico."""
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    items = []
    source = "fallback:deterministico"
    if True:
        prompt = build_bcg_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-bcg", db=db, tenant_id=tenant_id)
            parsed = llm.parse_json_response(raw) if raw else []
            if parsed:
                items = parsed
                source = "LLM"
        except Exception:
            items = []

    if not items:
        items = [
            {"unit_name": "Servicio principal", "quadrant": "star", "market_growth": 4, "market_share": 4, "description": "Unidad de negocio estrella con alto crecimiento y participación de mercado dominante.", "strategic_recommendation": "Invertir para mantener liderazgo."},
            {"unit_name": "Servicio legacy consolidado", "quadrant": "cash_cow", "market_growth": 2, "market_share": 5, "description": "Producto maduro que genera flujo de caja estable con bajo crecimiento.", "strategic_recommendation": "Optimizar costos y reinvertir ganancias en estrellas."},
            {"unit_name": "Iniciativa digital nueva", "quadrant": "question_mark", "market_growth": 5, "market_share": 2, "description": "Iniciativa innovadora en mercado de alto crecimiento pero con participación baja.", "strategic_recommendation": "Evaluar inversión agresiva o desinversión."},
            {"unit_name": "Proceso administrativo obsoleto", "quadrant": "dog", "market_growth": 1, "market_share": 2, "description": "Unidad de bajo rendimiento en mercado estancado.", "strategic_recommendation": "Considerar desinversión o eliminación."},
        ]

    QUADRANT_LABELS = {"star": "Estrella", "cash_cow": "Vaca Lechera", "question_mark": "Interrogación", "dog": "Perro"}
    proposals = []
    for u in items:
        quadrant = u.get("quadrant", "question_mark")
        q_label = QUADRANT_LABELS.get(quadrant, quadrant)
        payload = json.dumps({
            "unit_name": u.get("unit_name", "Unidad"),
            "quadrant": quadrant,
            "market_growth": u.get("market_growth", 3),
            "market_share": u.get("market_share", u.get("relative_share", 3)),
            "description": u.get("description", ""),
            "strategic_recommendation": u.get("strategic_recommendation", ""),
        })
        proposal = IALogPropuestaOODA(
            ooda_phase="observe",
            target_entity="bcg_unit",
            proposed_payload=payload,
            ai_reasoning=(
                f"[Agente Analitico ({source})] {q_label}: {u.get('unit_name', '')} · "
                f"Crec={u.get('market_growth', 3)}/5, Part={u.get('market_share', 3)}/5. "
                f"{u.get('strategic_recommendation', '')}"
            ),
            status=IAProposalStatus.BORRADOR,
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(proposal)
        proposals.append(proposal)

    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ══════════════════════════════════════════════
# TOWS – Cruce Estrategico (Sprint 7)
# ══════════════════════════════════════════════

@router.get("/tows")
def list_tows(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id, TOWSStrategy.plan_id == plan_id).all()


@router.post("/tows", status_code=status.HTTP_201_CREATED)
def create_tows(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = TOWSStrategy(
        quadrant=data["quadrant"],
        strategy=data["strategy"],
        priority=data.get("priority", 3),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/tows/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tows(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(TOWSStrategy).filter(
        TOWSStrategy.id == item_id, TOWSStrategy.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Estrategia TOWS no encontrada.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-tows", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_tows(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Cruza FODA aprobados para generar estrategias TOWS (LLM + fallback mecanico).

    B2.1 (GATE SERVER-SIDE): Verifica que TODOS los factores PESTEL
    del plan estén validados (probabilidad e impacto asignados) antes
    de permitir la generación TOWS. Sin esto, la cadena PESTEL→FODA→TOWS
    podría contener factores no calificados por el humano.
    """
    # ── B2.1: Gate de validación PESTEL ──
    pestel_factors = db.query(PESTELFactor).filter(
        PESTELFactor.tenant_id == tenant_id,
        PESTELFactor.plan_id == plan_id,
    ).all()

    if pestel_factors:
        unvalidated = [
            f for f in pestel_factors
            if f.probability is None or f.impact_level is None
        ]
        if unvalidated:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"GATE TOWS: {len(unvalidated)} factor(es) PESTEL aún no tienen "
                    f"probabilidad e impacto asignados. Valide TODOS los factores PESTEL "
                    f"en la Matriz de Impacto antes de generar TOWS."
                ),
            )

    ctx = _get_tenant_context(db, tenant_id, plan_id)
    fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()

    fortalezas = [f for f in fodas if f.quadrant.value == "fortaleza"]
    oportunidades = [f for f in fodas if f.quadrant.value == "oportunidad"]
    debilidades = [f for f in fodas if f.quadrant.value == "debilidad"]
    amenazas = [f for f in fodas if f.quadrant.value == "amenaza"]

    if not fodas:
        raise HTTPException(status_code=400, detail="No hay items FODA aprobados. Complete el FODA antes de generar TOWS.")

    proposals = []
    # Intentar LLM con contexto FODA
    if True:
        foda_summary = "\n".join([f"- [ID {f.id}] [{f.quadrant.value.upper()}] {f.description}" for f in fodas])
        prompt = build_tows_prompt(**ctx, foda_summary=foda_summary)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-tows", db=db, tenant_id=tenant_id)
            items = llm.parse_json_response(raw) if raw else []
            if items:
                source = "LLM"
                for s in items:
                    payload = json.dumps({
                        "quadrant": s.get("quadrant", "FO").lower(),
                        "strategy": s.get("description", s.get("strategy", "")),
                        "priority": s.get("priority", 3),
                        "foda_strength_id": s.get("strength_id"),
                        "foda_weakness_id": s.get("weakness_id"),
                        "foda_opportunity_id": s.get("opportunity_id"),
                        "foda_threat_id": s.get("threat_id"),
                    })
                    rationale = s.get("ai_rationale", f"Estrategia {s.get('quadrant','FO')} generada por IA.")
                    proposals.append(IALogPropuestaOODA(
                        ooda_phase="decide",
                        target_entity="tows_strategy",
                        proposed_payload=payload,
                        ai_reasoning=f"[TOWS ({source})] {rationale}",
                        status=IAProposalStatus.BORRADOR,
                        tenant_id=tenant_id,
                        plan_id=plan_id,
                    ))
        except Exception:
            pass

    # Fallback mecanico: cruces directos
    if not proposals:
        source = "fallback:deterministico"
        for f in fortalezas[:3]:
            for o in oportunidades[:2]:
                payload = json.dumps({
                    "quadrant": "fo",
                    "strategy": f"Usar '{f.description}' para capitalizar '{o.description}'",
                    "foda_strength_id": f.id, "foda_opportunity_id": o.id, "priority": 4,
                })
                proposals.append(IALogPropuestaOODA(
                    ooda_phase="decide", target_entity="tows_strategy", proposed_payload=payload,
                    ai_reasoning=f"[TOWS ({source})] Cruce FO: Fortaleza #{f.id} x Oportunidad #{o.id}.",
                    status=IAProposalStatus.BORRADOR, tenant_id=tenant_id, plan_id=plan_id,
                ))
        for f in fortalezas[:2]:
            for a in amenazas[:2]:
                payload = json.dumps({
                    "quadrant": "fa",
                    "strategy": f"Usar '{f.description}' para mitigar '{a.description}'",
                    "foda_strength_id": f.id, "foda_threat_id": a.id, "priority": 3,
                })
                proposals.append(IALogPropuestaOODA(
                    ooda_phase="decide", target_entity="tows_strategy", proposed_payload=payload,
                    ai_reasoning=f"[TOWS ({source})] Cruce FA: Fortaleza #{f.id} x Amenaza #{a.id}.",
                    status=IAProposalStatus.BORRADOR, tenant_id=tenant_id, plan_id=plan_id,
                ))
        for d in debilidades[:2]:
            for o in oportunidades[:2]:
                payload = json.dumps({
                    "quadrant": "do",
                    "strategy": f"Superar '{d.description}' aprovechando '{o.description}'",
                    "foda_weakness_id": d.id, "foda_opportunity_id": o.id, "priority": 3,
                })
                proposals.append(IALogPropuestaOODA(
                    ooda_phase="decide", target_entity="tows_strategy", proposed_payload=payload,
                    ai_reasoning=f"[TOWS ({source})] Cruce DO: Debilidad #{d.id} x Oportunidad #{o.id}.",
                    status=IAProposalStatus.BORRADOR, tenant_id=tenant_id, plan_id=plan_id,
                ))
        for d in debilidades[:2]:
            for a in amenazas[:2]:
                payload = json.dumps({
                    "quadrant": "da",
                    "strategy": f"Minimizar '{d.description}' y evitar '{a.description}'",
                    "foda_weakness_id": d.id, "foda_threat_id": a.id, "priority": 5,
                })
                proposals.append(IALogPropuestaOODA(
                    ooda_phase="decide", target_entity="tows_strategy", proposed_payload=payload,
                    ai_reasoning=f"[TOWS ({source})] Cruce DA: Debilidad #{d.id} x Amenaza #{a.id}.",
                    status=IAProposalStatus.BORRADOR, tenant_id=tenant_id, plan_id=plan_id,
                ))

    if not proposals:
        raise HTTPException(status_code=400, detail="No se generaron cruces TOWS. Necesita items en al menos 2 cuadrantes FODA.")

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


# ══════════════════════════════════════════════
# P2W – Playing to Win (Formulacion)
# ══════════════════════════════════════════════

@router.get("/p2w")
def list_p2w(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id, P2WChoice.plan_id == plan_id).all()


@router.post("/p2w", status_code=status.HTTP_201_CREATED)
def create_p2w(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = P2WChoice(
        choice_type=data["choice_type"],
        description=data["description"],
        rationale=data.get("rationale", ""),
        priority=data.get("priority", 3),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/p2w/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_p2w(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(P2WChoice).filter(
        P2WChoice.id == item_id, P2WChoice.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Eleccion P2W no encontrada.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-p2w", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_p2w(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera las 5 elecciones P2W basándose en FODA y TOWS."""
    ctx = _get_tenant_context(db, tenant_id, plan_id)

    fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
    tows = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).all()

    fortalezas = [f.description for f in fodas if f.quadrant.value == "fortaleza"]
    oportunidades = [f.description for f in fodas if f.quadrant.value == "oportunidad"]

    proposals = []
    source = "fallback:deterministico"
    nombre = ctx["nombre"]
    if True:
        prompt = build_p2w_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-p2w", db=db, tenant_id=tenant_id)
            items = llm.parse_json_response(raw) if raw else []
            if items:
                source = "LLM"
                for c in items:
                    proposals.append(_make_p2w_proposal(
                        c.get("choice_type", "winning_aspiration"),
                        c.get("description", ""),
                        c.get("rationale", ""),
                        source, tenant_id, plan_id,
                    ))
        except Exception:
            pass

    if not proposals:
        # Fallback deterministico
        aspiration = f"Ser la institucion lider en {ctx.get('ciiu', 'su sector')} de la Republica Dominicana"
        proposals.append(_make_p2w_proposal("winning_aspiration", aspiration,
            f"Aspiracion derivada del mandato institucional de {nombre}.", source, tenant_id, plan_id))
        where = f"Enfocarse en los segmentos donde {nombre} tiene mayor impacto social y mandato legal"
        if oportunidades:
            where += f". Oportunidad clave: {oportunidades[0]}"
        proposals.append(_make_p2w_proposal("where_to_play", where,
            "Segmentos priorizados segun oportunidades FODA y mandato.", source, tenant_id, plan_id))
        how = f"Diferenciacion por excelencia en servicio publico y transformacion digital"
        if fortalezas:
            how += f". Apalancando: {fortalezas[0]}"
        proposals.append(_make_p2w_proposal("how_to_win", how,
            "Ventaja competitiva basada en fortalezas VRIO.", source, tenant_id, plan_id))
        caps = f"Capacidades criticas: gestion de datos, capital humano especializado, infraestructura tecnologica"
        proposals.append(_make_p2w_proposal("core_capabilities", caps,
            "Capacidades requeridas para sostener la estrategia.", source, tenant_id, plan_id))
        systems = f"Sistemas de medicion BSC, ciclos OODA de revision trimestral, Hoshin Kanri para despliegue"
        proposals.append(_make_p2w_proposal("management_systems", systems,
            "Sistemas necesarios para ejecutar y monitorear la estrategia.", source, tenant_id, plan_id))

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


def _make_p2w_proposal(choice_type: str, description: str, rationale: str, source: str, tenant_id: int, plan_id: int):
    payload = json.dumps({
        "choice_type": choice_type,
        "description": description,
        "rationale": rationale,
        "priority": 4,
    })
    return IALogPropuestaOODA(
        ooda_phase="decide",
        target_entity="p2w_choice",
        proposed_payload=payload,
        ai_reasoning=f"[P2W ({source})] Eleccion '{choice_type}' para tenant {tenant_id}.",
        status=IAProposalStatus.BORRADOR,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )


# ══════════════════════════════════════════════
# Kernel Rumelt – Formulacion
# ══════════════════════════════════════════════

@router.get("/kernel")
def list_kernel(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(KernelComponent).filter(KernelComponent.tenant_id == tenant_id, KernelComponent.plan_id == plan_id).all()


@router.post("/kernel", status_code=status.HTTP_201_CREATED)
def create_kernel(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = KernelComponent(
        component_type=data["component_type"],
        title=data["title"],
        description=data["description"],
        priority=data.get("priority", 3),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/kernel/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kernel(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(KernelComponent).filter(
        KernelComponent.id == item_id, KernelComponent.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Componente Kernel no encontrado.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-kernel", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_kernel(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera Kernel Rumelt via LLM con fallback desde FODA, TOWS y P2W."""
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    nombre = ctx["nombre"]
    proposals = []

    if True:
        prompt = build_kernel_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-kernel", db=db, tenant_id=tenant_id)
            items = llm.parse_json_response(raw) if raw else []
            if items:
                source = "LLM"
                for c in items:
                    proposals.append(_make_kernel_proposal(
                        c.get("component_type", "diagnosis"),
                        c.get("component_type", "Componente").replace("_", " ").title(),
                        c.get("description", ""),
                        source, tenant_id, plan_id,
                    ))
        except Exception:
            pass

    if not proposals:
        source = "fallback:deterministico"
        fodas = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()
        tows = db.query(TOWSStrategy).filter(TOWSStrategy.tenant_id == tenant_id).all()
        p2ws = db.query(P2WChoice).filter(P2WChoice.tenant_id == tenant_id).all()

        amenazas = [f.description for f in fodas if f.quadrant.value == "amenaza"]
        debilidades = [f.description for f in fodas if f.quadrant.value == "debilidad"]
        estrategias_fo = [t.strategy for t in tows if t.quadrant.value == "fo"]
        p2w_how = [p.description for p in p2ws if p.choice_type.value == "how_to_win"]

        diag_desc = f"Desafio critico de {nombre}: "
        if amenazas:
            diag_desc += amenazas[0]
        elif debilidades:
            diag_desc += debilidades[0]
        else:
            diag_desc += "Necesidad de modernizacion institucional y mejora de servicios."
        proposals.append(_make_kernel_proposal("diagnosis", "Desafio Critico Institucional", diag_desc, source, tenant_id, plan_id))

        policy_desc = "Politica guia: "
        if p2w_how:
            policy_desc += p2w_how[0]
        else:
            policy_desc += f"Concentrar recursos en la transformacion digital y fortalecimiento del capital humano de {nombre}."
        proposals.append(_make_kernel_proposal("guiding_policy", "Politica Guia Estrategica", policy_desc, source, tenant_id, plan_id))

        if estrategias_fo:
            for i, est in enumerate(estrategias_fo[:3]):
                proposals.append(_make_kernel_proposal("coherent_actions", f"Accion Coherente {i+1}", est, source, tenant_id, plan_id))
        else:
            proposals.append(_make_kernel_proposal("coherent_actions", "Accion Coherente 1",
                f"Implementar sistema de medicion de desempeno institucional en {nombre}.", source, tenant_id, plan_id))
            proposals.append(_make_kernel_proposal("coherent_actions", "Accion Coherente 2",
                f"Desarrollar programa de capacitacion continua para personal clave.", source, tenant_id, plan_id))

    for p in proposals:
        db.add(p)
    db.commit()
    for p in proposals:
        db.refresh(p)
    return proposals


def _make_kernel_proposal(comp_type: str, title: str, description: str, source: str, tenant_id: int, plan_id: int):
    payload = json.dumps({
        "component_type": comp_type,
        "title": title,
        "description": description,
        "priority": 4,
    })
    return IALogPropuestaOODA(
        ooda_phase="decide",
        target_entity="kernel_component",
        proposed_payload=payload,
        ai_reasoning=f"[Kernel ({source})] Componente '{comp_type}' para tenant {tenant_id}.",
        status=IAProposalStatus.BORRADOR,
        tenant_id=tenant_id,
        plan_id=plan_id,
    )


# ══════════════════════════════════════════════
# Blue Ocean – ERRC Grid (Formulacion)
# ══════════════════════════════════════════════

@router.get("/blue-ocean")
def list_blue_ocean(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    db: Session = Depends(get_db),
):
    return db.query(BlueOceanAction).filter(BlueOceanAction.tenant_id == tenant_id, BlueOceanAction.plan_id == plan_id).all()


@router.post("/blue-ocean", status_code=status.HTTP_201_CREATED)
def create_blue_ocean(
    data: dict,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = BlueOceanAction(
        action_type=data["action_type"],
        factor=data["factor"],
        description=data.get("description", ""),
        current_level=data.get("current_level", 3),
        target_level=data.get("target_level", 3),
        tenant_id=tenant_id,
        plan_id=plan_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/blue-ocean/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blue_ocean(
    item_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    item = db.query(BlueOceanAction).filter(
        BlueOceanAction.id == item_id, BlueOceanAction.tenant_id == tenant_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Accion Blue Ocean no encontrada.")
    db.delete(item)
    db.commit()


@router.post("/ia/analizar-blue-ocean", response_model=list[IAProposalResponse], status_code=status.HTTP_201_CREATED)
def ia_generate_blue_ocean(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """Genera grid ERRC via LLM con fallback deterministico."""
    ctx = _get_tenant_context(db, tenant_id, plan_id)
    nombre = ctx["nombre"]
    proposals = []

    if True:
        prompt = build_blue_ocean_prompt(**ctx)
        try:
            raw = llm.generate_sync(prompt, endpoint_name="analizar-blue_ocean", db=db, tenant_id=tenant_id)
            items = llm.parse_json_response(raw) if raw else []
            if items:
                source = "LLM"
                for a in items:
                    payload = json.dumps({
                        "action_type": a.get("action_type", "create"),
                        "factor": a.get("factor", ""),
                        "description": a.get("description", ""),
                        "current_level": a.get("current_level", 3),
                        "target_level": a.get("target_level", 3),
                    })
                    proposals.append(IALogPropuestaOODA(
                        ooda_phase="decide",
                        target_entity="blue_ocean_action",
                        proposed_payload=payload,
                        ai_reasoning=f"[Blue Ocean ({source})] ERRC '{a.get('action_type','')}': {a.get('factor','')} para {nombre}.",
                        status=IAProposalStatus.BORRADOR,
                        tenant_id=tenant_id,
                        plan_id=plan_id,
                    ))
        except Exception:
            pass

    if not proposals:
        source = "fallback:deterministico"
        errc = [
            ("eliminate", "Burocracia excesiva en tramites", "Eliminar procesos manuales redundantes que no agregan valor.", 4, 0),
            ("eliminate", "Duplicidad de funciones", "Eliminar superposicion de roles entre departamentos.", 3, 0),
            ("reduce", "Tiempo de respuesta a solicitudes", "Reducir de semanas a dias mediante digitalizacion.", 5, 2),
            ("reduce", "Dependencia de sistemas legados", "Migrar gradualmente a plataformas modernas.", 4, 2),
            ("raise", "Transparencia institucional", "Incrementar reportes publicos y rendicion de cuentas.", 2, 5),
            ("raise", "Capacitacion del personal", "Elevar programas de formacion continua.", 2, 4),
            ("create", "Portal de servicios digitales unificado", "Crear ventanilla unica digital para ciudadanos.", 0, 5),
            ("create", "Sistema de medicion de impacto social", "Crear dashboard de indicadores de impacto en tiempo real.", 0, 4),
        ]
        for action_type, factor, desc, cur, tgt in errc:
            payload = json.dumps({
                "action_type": action_type,
                "factor": factor,
                "description": desc,
                "current_level": cur,
                "target_level": tgt,
            })
            proposals.append(IALogPropuestaOODA(
                ooda_phase="decide",
                target_entity="blue_ocean_action",
                proposed_payload=payload,
                ai_reasoning=f"[Blue Ocean ({source})] ERRC '{action_type}': {factor} para {nombre}.",
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
# AI GOVERNANCE: Telemetry Endpoint
# ══════════════════════════════════════════════

@router.get("/ia/telemetry")
def get_ai_telemetry(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna estadisticas de uso IA del tenant para el panel de gobernanza."""
    from app.db.models import AITelemetry, AITelemetryStatus
    from sqlalchemy import func, extract, cast, Date
    from datetime import datetime, timedelta

    now = datetime.utcnow()

    # Totales
    base = db.query(AITelemetry).filter(AITelemetry.tenant_id == tenant_id)
    total_calls = base.count()
    successful = base.filter(AITelemetry.status == AITelemetryStatus.SUCCESS).count()
    failed = base.filter(AITelemetry.status == AITelemetryStatus.ERROR).count()
    fallback = base.filter(AITelemetry.status == AITelemetryStatus.FALLBACK).count()
    budget_exceeded = base.filter(AITelemetry.status == AITelemetryStatus.BUDGET_EXCEEDED).count()
    validation_failed = base.filter(AITelemetry.status == AITelemetryStatus.VALIDATION_FAILED).count()

    total_tokens = db.query(func.coalesce(func.sum(AITelemetry.total_tokens), 0)).filter(
        AITelemetry.tenant_id == tenant_id
    ).scalar()

    # Budget del mes actual
    month_tokens = db.query(func.coalesce(func.sum(AITelemetry.total_tokens), 0)).filter(
        AITelemetry.tenant_id == tenant_id,
        extract("year", AITelemetry.created_at) == now.year,
        extract("month", AITelemetry.created_at) == now.month,
    ).scalar()

    from app.services.llm import MONTHLY_TOKEN_BUDGET_PER_TENANT
    budget_limit = MONTHLY_TOKEN_BUDGET_PER_TENANT
    budget_used_pct = round((month_tokens / budget_limit) * 100, 1) if budget_limit > 0 else 0

    # Costo total
    total_cost = db.query(func.coalesce(func.sum(AITelemetry.estimated_cost_usd), 0)).filter(
        AITelemetry.tenant_id == tenant_id
    ).scalar()

    # Latencia promedio
    avg_latency = db.query(func.coalesce(func.avg(AITelemetry.latency_ms), 0)).filter(
        AITelemetry.tenant_id == tenant_id,
        AITelemetry.status == AITelemetryStatus.SUCCESS,
    ).scalar()

    # Por endpoint
    by_endpoint_raw = db.query(
        AITelemetry.endpoint_name,
        func.count(AITelemetry.id).label("calls"),
        func.coalesce(func.sum(AITelemetry.total_tokens), 0).label("tokens"),
        func.coalesce(func.avg(AITelemetry.latency_ms), 0).label("avg_latency"),
    ).filter(
        AITelemetry.tenant_id == tenant_id
    ).group_by(AITelemetry.endpoint_name).all()

    by_endpoint = [
        {"name": r[0], "calls": r[1], "tokens": int(r[2]), "avg_latency": int(r[3])}
        for r in by_endpoint_raw
    ]

    # Ultimos 30 dias
    thirty_ago = now - timedelta(days=30)
    by_day_raw = db.query(
        cast(AITelemetry.created_at, Date).label("day"),
        func.count(AITelemetry.id).label("calls"),
        func.coalesce(func.sum(AITelemetry.total_tokens), 0).label("tokens"),
    ).filter(
        AITelemetry.tenant_id == tenant_id,
        AITelemetry.created_at >= thirty_ago,
    ).group_by(cast(AITelemetry.created_at, Date)).order_by(cast(AITelemetry.created_at, Date)).all()

    by_day = [
        {"date": str(r[0]), "calls": r[1], "tokens": int(r[2])}
        for r in by_day_raw
    ]

    return {
        "total_calls": total_calls,
        "successful_calls": successful,
        "failed_calls": failed,
        "fallback_calls": fallback,
        "budget_exceeded_calls": budget_exceeded,
        "validation_failed_calls": validation_failed,
        "total_tokens": int(total_tokens),
        "month_tokens": int(month_tokens),
        "budget_limit": budget_limit,
        "budget_used_pct": budget_used_pct,
        "estimated_cost_usd": float(total_cost),
        "avg_latency_ms": int(avg_latency),
        "by_endpoint": by_endpoint,
        "by_day": by_day,
    }


# ══════════════════════════════════════════════
# B4.3 + B4.4: Sistema de Monitoreo OODA
# Bucle de reevaluación periódica para factores
# en zona MONITOREO (25 ≤ P×I < 49)
# ══════════════════════════════════════════════

@router.get("/pestel/pendientes-revision")
def list_pestel_pending_review(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    B4.3: Lista factores PESTEL cuyo next_review_date ha llegado o pasado.
    Estos factores están en zona MONITOREO y necesitan reevaluación humana.
    Útil para el badge del Dashboard y para el scheduler.
    """
    now = datetime.now(timezone.utc)
    due_factors = db.query(PESTELFactor).filter(
        PESTELFactor.tenant_id == tenant_id,
        PESTELFactor.plan_id == plan_id,
        PESTELFactor.next_review_date != None,  # noqa: E711
        PESTELFactor.next_review_date <= now,
    ).all()

    results = []
    for f in due_factors:
        score = (f.probability or 5) * (f.impact_level or 5)
        days_overdue = (now - f.next_review_date).days if f.next_review_date else 0
        results.append({
            "id": f.id,
            "category": f.category.value,
            "description": f.description,
            "probability": f.probability,
            "impact_level": f.impact_level,
            "risk_score": score,
            "risk_classification": f.risk_classification.value if f.risk_classification else "sin_calificar",
            "next_review_date": f.next_review_date.isoformat() if f.next_review_date else None,
            "last_evaluated_at": f.last_evaluated_at.isoformat() if f.last_evaluated_at else None,
            "days_overdue": days_overdue,
        })

    return {
        "count": len(results),
        "factors": results,
    }


@router.post("/pestel/generar-alertas")
def generate_monitoring_alerts(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    B4.4: Genera alertas de monitoreo para factores PESTEL que han
    alcanzado su next_review_date. Puede ser llamado por un scheduler
    (cron endpoint) o manualmente desde el Dashboard.

    Solo crea alertas para factores que no tengan ya una alerta PENDIENTE.
    """
    now = datetime.now(timezone.utc)

    # Factores con revisión vencida
    due_factors = db.query(PESTELFactor).filter(
        PESTELFactor.tenant_id == tenant_id,
        PESTELFactor.plan_id == plan_id,
        PESTELFactor.next_review_date != None,  # noqa: E711
        PESTELFactor.next_review_date <= now,
    ).all()

    created = 0
    for f in due_factors:
        # Evitar duplicar alertas pendientes para el mismo factor
        existing = db.query(MonitoringAlert).filter(
            MonitoringAlert.source_entity == "pestel_factor",
            MonitoringAlert.source_entity_id == f.id,
            MonitoringAlert.status == MonitoringAlertStatus.PENDIENTE,
            MonitoringAlert.tenant_id == tenant_id,
        ).first()

        if existing:
            continue

        score = (f.probability or 5) * (f.impact_level or 5)
        alert = MonitoringAlert(
            alert_type="pestel_review",
            source_entity="pestel_factor",
            source_entity_id=f.id,
            risk_score_at_creation=score,
            risk_classification_at_creation=f.risk_classification.value if f.risk_classification else "monitoreo",
            status=MonitoringAlertStatus.PENDIENTE,
            message=(
                f"Factor PESTEL '{f.category.value.upper()}' (score {score}) "
                f"requiere reevaluación. Última revisión: "
                f"{f.last_evaluated_at.strftime('%Y-%m-%d') if f.last_evaluated_at else 'nunca'}."
            ),
            due_date=f.next_review_date or now,
            tenant_id=tenant_id,
            plan_id=plan_id,
        )
        db.add(alert)
        created += 1

    db.commit()
    return {"alerts_created": created, "total_due_factors": len(due_factors)}


@router.get("/monitoring/alerts")
def list_monitoring_alerts(
    status_filter: str = None,
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    B4.3: Lista todas las alertas de monitoreo del tenant/plan.
    Soporta filtro por status: pendiente, reconocida, resuelta, expirada.
    """
    query = db.query(MonitoringAlert).filter(
        MonitoringAlert.tenant_id == tenant_id,
        MonitoringAlert.plan_id == plan_id,
    )

    if status_filter:
        try:
            status_enum = MonitoringAlertStatus(status_filter.lower())
            query = query.filter(MonitoringAlert.status == status_enum)
        except ValueError:
            pass  # Ignorar filtro inválido, devolver todos

    alerts = query.order_by(MonitoringAlert.due_date.asc()).all()

    return [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "source_entity": a.source_entity,
            "source_entity_id": a.source_entity_id,
            "risk_score_at_creation": a.risk_score_at_creation,
            "risk_classification_at_creation": a.risk_classification_at_creation,
            "status": a.status.value,
            "message": a.message,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "acknowledged_at": a.acknowledged_at.isoformat() if a.acknowledged_at else None,
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "resolution_notes": a.resolution_notes,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


@router.post("/monitoring/alerts/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: int,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    B4.4: El usuario reconoce haber visto la alerta.
    Cambia estado de PENDIENTE a RECONOCIDA.
    """
    alert = db.query(MonitoringAlert).filter(
        MonitoringAlert.id == alert_id,
        MonitoringAlert.tenant_id == tenant_id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada.")

    if alert.status != MonitoringAlertStatus.PENDIENTE:
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden reconocer alertas PENDIENTES. Estado actual: {alert.status.value}",
        )

    alert.status = MonitoringAlertStatus.RECONOCIDA
    alert.acknowledged_by_user_id = user.id
    alert.acknowledged_at = datetime.now(timezone.utc)

    db.commit()
    return {"status": "reconocida", "alert_id": alert_id}


@router.post("/monitoring/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    resolution_notes: str = "",
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    B4.4: El usuario resuelve la alerta tras reevaluar el factor.
    Cambia estado a RESUELTA, registra notas de resolución,
    y reprograma el next_review_date del factor PESTEL asociado.
    """
    alert = db.query(MonitoringAlert).filter(
        MonitoringAlert.id == alert_id,
        MonitoringAlert.tenant_id == tenant_id,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada.")

    if alert.status not in (MonitoringAlertStatus.PENDIENTE, MonitoringAlertStatus.RECONOCIDA):
        raise HTTPException(
            status_code=400,
            detail=f"Solo se pueden resolver alertas PENDIENTES o RECONOCIDAS. Estado actual: {alert.status.value}",
        )

    alert.status = MonitoringAlertStatus.RESUELTA
    alert.resolution_notes = resolution_notes
    alert.resolved_at = datetime.now(timezone.utc)

    # Reprogramar el next_review_date del factor PESTEL asociado
    if alert.source_entity == "pestel_factor":
        factor = db.query(PESTELFactor).filter(
            PESTELFactor.id == alert.source_entity_id,
        ).first()
        if factor:
            freq = factor.review_frequency_days or 90
            factor.last_evaluated_at = datetime.now(timezone.utc)
            # Solo reprogramar si sigue en zona MONITOREO
            if factor.risk_classification and factor.risk_classification.value == "monitoreo":
                factor.next_review_date = datetime.now(timezone.utc) + timedelta(days=freq)
            else:
                factor.next_review_date = None

    db.commit()
    return {"status": "resuelta", "alert_id": alert_id}


@router.get("/monitoring/summary")
def monitoring_summary(
    tenant_id: int = Depends(get_current_tenant_id),
    plan_id: int = Depends(get_current_plan_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    B4.3: Resumen para el Dashboard — conteos de alertas pendientes,
    factores en monitoreo, y factores vencidos. Ideal para badges.
    """
    now = datetime.now(timezone.utc)

    pending_alerts = db.query(MonitoringAlert).filter(
        MonitoringAlert.tenant_id == tenant_id,
        MonitoringAlert.plan_id == plan_id,
        MonitoringAlert.status == MonitoringAlertStatus.PENDIENTE,
    ).count()

    acknowledged_alerts = db.query(MonitoringAlert).filter(
        MonitoringAlert.tenant_id == tenant_id,
        MonitoringAlert.plan_id == plan_id,
        MonitoringAlert.status == MonitoringAlertStatus.RECONOCIDA,
    ).count()

    monitoring_factors = db.query(PESTELFactor).filter(
        PESTELFactor.tenant_id == tenant_id,
        PESTELFactor.plan_id == plan_id,
        PESTELFactor.risk_classification == RiskClassification.MONITOREO,
    ).count()

    overdue_factors = db.query(PESTELFactor).filter(
        PESTELFactor.tenant_id == tenant_id,
        PESTELFactor.plan_id == plan_id,
        PESTELFactor.next_review_date != None,  # noqa: E711
        PESTELFactor.next_review_date <= now,
    ).count()

    return {
        "pending_alerts": pending_alerts,
        "acknowledged_alerts": acknowledged_alerts,
        "total_active_alerts": pending_alerts + acknowledged_alerts,
        "monitoring_factors": monitoring_factors,
        "overdue_factors": overdue_factors,
    }

