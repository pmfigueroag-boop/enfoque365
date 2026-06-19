from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Tenant, User, RoleEnum
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate
from app.core.security import get_current_tenant_id, get_current_user, require_role

router = APIRouter()


@router.get("/list", response_model=list[TenantResponse])
def list_tenants(db: Session = Depends(get_db)):
    """Lista todas las instituciones activas (para selector de tenant)."""
    return db.query(Tenant).filter(Tenant.is_active == True).order_by(Tenant.name).all()


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def create_tenant(tenant_in: TenantCreate, db: Session = Depends(get_db)):
    # Check if tax_id already exists
    tenant = db.query(Tenant).filter(Tenant.tax_id == tenant_in.tax_id).first()
    if tenant:
        raise HTTPException(status_code=400, detail="Ya existe un tenant con este identificador fiscal.")

    new_tenant = Tenant(tax_id=tenant_in.tax_id, name=tenant_in.name)
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return new_tenant


# ── CRUD de Institucion (tenant actual) ──────────────────


@router.get("/me", response_model=TenantResponse)
def get_my_tenant(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna los datos de la institucion del tenant actual."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Institucion no encontrada.")
    return tenant


@router.put("/me", response_model=TenantResponse)
def update_my_tenant(
    update_in: TenantUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    """Actualiza los datos de la institucion. Solo admin."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Institucion no encontrada.")

    update_data = update_in.model_dump(exclude_unset=True)

    # Si cambia tax_id, verificar unicidad
    if "tax_id" in update_data and update_data["tax_id"] != tenant.tax_id:
        existing = db.query(Tenant).filter(
            Tenant.tax_id == update_data["tax_id"],
            Tenant.id != tenant_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Ya existe otra institucion con ese identificador fiscal.",
            )

    for field, value in update_data.items():
        setattr(tenant, field, value)

    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/me", status_code=status.HTTP_200_OK)
def deactivate_my_tenant(
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    """Soft-delete: desactiva la institucion y todos sus usuarios. Solo admin."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Institucion no encontrada.")

    if not tenant.is_active:
        raise HTTPException(status_code=400, detail="La institucion ya esta desactivada.")

    tenant.is_active = False

    # Desactivar todos los usuarios del tenant
    users = db.query(User).filter(User.tenant_id == tenant_id).all()
    for u in users:
        u.is_active = False

    db.commit()
    return {"message": f"Institucion '{tenant.name}' desactivada. {len(users)} usuario(s) desactivados."}
