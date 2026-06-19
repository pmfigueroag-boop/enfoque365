"""
Endpoint publico de Onboarding — Registro de Tenant + Admin.

SIN AUTENTICACION: Este es el unico endpoint del sistema que no requiere
headers X-Tenant-Id ni X-User-Email. Crea tenant + usuario admin en una
sola transaccion atomica.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Tenant, User, RoleEnum
from app.schemas.tenant import OnboardingRequest, OnboardingResponse
from app.core.security import hash_password

router = APIRouter()



@router.post("/", response_model=OnboardingResponse, status_code=status.HTTP_201_CREATED)
def onboarding(
    data: OnboardingRequest,
    db: Session = Depends(get_db),
):
    """
    Registra una nueva institucion y su usuario administrador.
    Transaccion atomica: si falla el usuario, se revierte el tenant.
    """
    # Validar unicidad de tax_id
    existing_tenant = db.query(Tenant).filter(Tenant.tax_id == data.tax_id).first()
    if existing_tenant:
        raise HTTPException(
            status_code=400,
            detail="Ya existe una institucion registrada con este identificador fiscal."
        )

    # Validar unicidad de email
    existing_user = db.query(User).filter(User.email == data.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Este correo electronico ya esta registrado."
        )

    # Validar campos requeridos
    if data.tipo not in ("publico", "privado"):
        raise HTTPException(status_code=422, detail="Tipo debe ser 'publico' o 'privado'.")
    if len(data.pais_iso) != 2:
        raise HTTPException(status_code=422, detail="pais_iso debe ser un codigo ISO 3166-1 de 2 letras.")
    if len(data.sector_ciiu) != 1 or data.sector_ciiu.upper() not in "ABCDEFGHIJKLMNOPQRSTU":
        raise HTTPException(status_code=422, detail="sector_ciiu debe ser una letra A-U (seccion CIIU Rev.4).")

    # Crear tenant
    tenant = Tenant(
        name=data.name,
        tax_id=data.tax_id,
        tipo=data.tipo,
        pais_iso=data.pais_iso.upper(),
        sector_ciiu=data.sector_ciiu.upper(),
        sector_ciiu_division=data.sector_ciiu_division or None,
        sector_ciiu_grupo=data.sector_ciiu_grupo or None,
        sector_ciiu_clase=data.sector_ciiu_clase or None,
    )
    db.add(tenant)
    db.flush()  # Obtener tenant.id sin commit

    # Crear usuario admin
    admin = User(
        email=data.admin_email,
        full_name=data.admin_full_name,
        hashed_password=hash_password(data.admin_password),
        role=RoleEnum.ADMIN,
        tenant_id=tenant.id,
    )
    db.add(admin)

    # Commit atomico
    db.commit()
    db.refresh(tenant)
    db.refresh(admin)

    return OnboardingResponse(
        tenant_id=tenant.id,
        tenant_name=tenant.name,
        user_id=admin.id,
        user_email=admin.email,
        message=f"Institucion '{tenant.name}' registrada exitosamente. Bienvenido a ENFOQUE 365.",
    )
