"""
Endpoints de Planes Estrategicos -- Ciclo de Vida PEI.

Implementa CRUD completo y transiciones de estado unidireccionales:
  FORMULACION -> APROBADO -> VIGENTE -> EN_REVISION -> CERRADO -> ARCHIVADO

Reglas:
  - Solo ADMIN y ESTRATEGA pueden crear, editar, eliminar y transicionar.
  - Solo FORMULACION permite edicion y eliminacion.
  - Al activar un plan, cualquier plan VIGENTE previo pasa a EN_REVISION.
  - Las transiciones son estrictamente unidireccionales.
"""
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    PlanEstrategico, PlanEstado, RoleEnum, User, Tenant,
    EjeEstrategico, ObjetivoEstrategico, Indicador, MedicionHistorica,
    KeyResult, ValorInstitucional, HoshinItem,
    PESTELFactor, PorterForce, FODAItem, TOWSStrategy,
    VRIOResource, McKinsey7SElement, BCGUnit, BlueOceanAction,
    P2WChoice, KernelComponent, IALogPropuestaOODA,
)
from app.schemas.planes import PlanCreate, PlanUpdate, PlanResponse
from app.core.security import get_current_tenant_id, get_current_user, require_role

router = APIRouter()


# ── Helpers ──────────────────────────────────

def _get_plan_or_404(
    plan_id: int, tenant_id: int, db: Session
) -> PlanEstrategico:
    """Busca un plan por ID dentro del tenant o lanza 404."""
    plan = db.query(PlanEstrategico).filter(
        PlanEstrategico.id == plan_id,
        PlanEstrategico.tenant_id == tenant_id,
    ).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan {plan_id} no encontrado",
        )
    return plan


def _assert_estado(plan: PlanEstrategico, esperado: PlanEstado, accion: str):
    """Valida que el plan este en el estado requerido para la accion."""
    if plan.estado != esperado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"No se puede {accion}: el plan esta en estado "
                f"'{plan.estado.value}', se requiere '{esperado.value}'"
            ),
        )


# ── 1. GET /planes ──────────────────────────

@router.get("/", response_model=List[PlanResponse])
def listar_planes(
    estado: Optional[PlanEstado] = None,
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Lista todos los planes del tenant, con filtro opcional por estado."""
    query = db.query(PlanEstrategico).filter(
        PlanEstrategico.tenant_id == tenant_id,
    )
    if estado is not None:
        query = query.filter(PlanEstrategico.estado == estado)
    return query.order_by(PlanEstrategico.created_at.desc()).all()


# ── 2. GET /planes/vigente ──────────────────

@router.get("/vigente", response_model=PlanResponse)
def obtener_plan_vigente(
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """
    Retorna el plan activo del tenant.
    Prioridad: VIGENTE > FORMULACION.
    Si no existe ninguno, retorna 404.
    """
    plan = db.query(PlanEstrategico).filter(
        PlanEstrategico.tenant_id == tenant_id,
        PlanEstrategico.estado == PlanEstado.VIGENTE,
    ).first()

    if not plan:
        plan = db.query(PlanEstrategico).filter(
            PlanEstrategico.tenant_id == tenant_id,
            PlanEstrategico.estado == PlanEstado.FORMULACION,
        ).order_by(PlanEstrategico.created_at.desc()).first()

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay plan vigente ni en formulacion",
        )
    return plan


# ── 3. POST /planes ─────────────────────────

@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def crear_plan(
    body: PlanCreate,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Crea un nuevo plan estrategico en estado FORMULACION."""
    plan = PlanEstrategico(
        nombre=body.nombre,
        descripcion=body.descripcion,
        fecha_inicio=body.fecha_inicio,
        fecha_fin=body.fecha_fin,
        estado=PlanEstado.FORMULACION,
        tenant_id=tenant_id,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


# ── 4. PUT /planes/{plan_id} ────────────────

@router.put("/{plan_id}", response_model=PlanResponse)
def editar_plan(
    plan_id: int,
    body: PlanUpdate,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Edita un plan. Solo permitido en estado FORMULACION."""
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.FORMULACION, "editar")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


# ── 5. DELETE /planes/{plan_id} ─────────────

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_plan(
    plan_id: int,
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """
    Elimina un plan en FORMULACION junto con todos sus artefactos.
    Solo ADMIN puede eliminar. Solo planes en FORMULACION.
    """
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.FORMULACION, "eliminar")

    # Cascade manual: eliminar artefactos hijos en orden de dependencia
    # 1. Mediciones e hijos de indicadores
    for ind in db.query(Indicador).filter(Indicador.plan_id == plan_id).all():
        db.query(MedicionHistorica).filter(MedicionHistorica.indicador_id == ind.id).delete()
    # 2. Key Results (dependen de objetivos)
    db.query(KeyResult).filter(KeyResult.plan_id == plan_id).delete()
    # 3. Indicadores (dependen de objetivos)
    db.query(Indicador).filter(Indicador.plan_id == plan_id).delete()
    # 4. Hoshin items
    db.query(HoshinItem).filter(HoshinItem.plan_id == plan_id).delete()
    # 5. Objetivos (dependen de ejes)
    db.query(ObjetivoEstrategico).filter(ObjetivoEstrategico.plan_id == plan_id).delete()
    # 6. Ejes
    db.query(EjeEstrategico).filter(EjeEstrategico.plan_id == plan_id).delete()
    # 7. Valores
    db.query(ValorInstitucional).filter(ValorInstitucional.plan_id == plan_id).delete()
    # 8. Diagnostico
    db.query(IALogPropuestaOODA).filter(IALogPropuestaOODA.plan_id == plan_id).delete()
    db.query(TOWSStrategy).filter(TOWSStrategy.plan_id == plan_id).delete()
    db.query(FODAItem).filter(FODAItem.plan_id == plan_id).delete()
    db.query(PESTELFactor).filter(PESTELFactor.plan_id == plan_id).delete()
    db.query(PorterForce).filter(PorterForce.plan_id == plan_id).delete()
    db.query(VRIOResource).filter(VRIOResource.plan_id == plan_id).delete()
    db.query(McKinsey7SElement).filter(McKinsey7SElement.plan_id == plan_id).delete()
    db.query(BCGUnit).filter(BCGUnit.plan_id == plan_id).delete()
    db.query(BlueOceanAction).filter(BlueOceanAction.plan_id == plan_id).delete()
    db.query(P2WChoice).filter(P2WChoice.plan_id == plan_id).delete()
    db.query(KernelComponent).filter(KernelComponent.plan_id == plan_id).delete()

    # Finalmente, eliminar el plan
    db.delete(plan)
    db.commit()


# ── 6. POST /planes/{plan_id}/aprobar ───────

@router.post("/{plan_id}/aprobar", response_model=PlanResponse)
def aprobar_plan(
    plan_id: int,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Transicion: FORMULACION -> APROBADO. Registra fecha de aprobacion."""
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.FORMULACION, "aprobar")

    plan.estado = PlanEstado.APROBADO
    plan.aprobado_at = datetime.now(timezone.utc)
    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


# ── 7. POST /planes/{plan_id}/activar ───────

@router.post("/{plan_id}/activar", response_model=PlanResponse)
def activar_plan(
    plan_id: int,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """
    Transicion: APROBADO -> VIGENTE.
    Si ya existe un plan VIGENTE en el tenant, lo mueve a EN_REVISION.
    """
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.APROBADO, "activar")

    # Desactivar plan vigente anterior (si existe)
    plan_vigente_actual = db.query(PlanEstrategico).filter(
        PlanEstrategico.tenant_id == tenant_id,
        PlanEstrategico.estado == PlanEstado.VIGENTE,
    ).first()

    if plan_vigente_actual:
        plan_vigente_actual.estado = PlanEstado.EN_REVISION
        plan_vigente_actual.updated_at = datetime.now(timezone.utc)

    plan.estado = PlanEstado.VIGENTE
    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


# ── 8. POST /planes/{plan_id}/revisar ───────

@router.post("/{plan_id}/revisar", response_model=PlanResponse)
def revisar_plan(
    plan_id: int,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Transicion: VIGENTE -> EN_REVISION."""
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.VIGENTE, "pasar a revision")

    plan.estado = PlanEstado.EN_REVISION
    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


# ── 9. POST /planes/{plan_id}/cerrar ────────

@router.post("/{plan_id}/cerrar", response_model=PlanResponse)
def cerrar_plan(
    plan_id: int,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Transicion: EN_REVISION -> CERRADO. Registra fecha de cierre."""
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.EN_REVISION, "cerrar")

    plan.estado = PlanEstado.CERRADO
    plan.cerrado_at = datetime.now(timezone.utc)
    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan


# ── 10. POST /planes/{plan_id}/archivar ─────

@router.post("/{plan_id}/archivar", response_model=PlanResponse)
def archivar_plan(
    plan_id: int,
    current_user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """Transicion: CERRADO -> ARCHIVADO."""
    plan = _get_plan_or_404(plan_id, tenant_id, db)
    _assert_estado(plan, PlanEstado.CERRADO, "archivar")

    plan.estado = PlanEstado.ARCHIVADO
    plan.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(plan)
    return plan
