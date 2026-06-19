from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TenantBase(BaseModel):
    tax_id: str
    name: str


class TenantCreate(TenantBase):
    pass


class TenantResponse(TenantBase):
    id: int
    is_active: bool
    tipo: Optional[str] = None
    pais_iso: Optional[str] = None
    sector_ciiu: Optional[str] = None
    sector_ciiu_division: Optional[str] = None
    sector_ciiu_grupo: Optional[str] = None
    sector_ciiu_clase: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    tipo: Optional[str] = None
    pais_iso: Optional[str] = None
    sector_ciiu: Optional[str] = None
    sector_ciiu_division: Optional[str] = None
    sector_ciiu_grupo: Optional[str] = None
    sector_ciiu_clase: Optional[str] = None


# ── Onboarding (Tenant + Admin en una transaccion) ──

class OnboardingRequest(BaseModel):
    # Tenant
    name: str
    tax_id: str
    tipo: str                          # "publico" o "privado"
    pais_iso: str                      # ISO 3166-1 alpha-2
    sector_ciiu: str                   # Seccion CIIU (A-U)
    sector_ciiu_division: str = ""     # Division CIIU (01-99)
    sector_ciiu_grupo: str = ""        # Grupo CIIU (011-990)
    sector_ciiu_clase: str = ""        # Clase CIIU (0111-9900)

    # Admin user
    admin_email: str
    admin_full_name: str
    admin_password: str


class OnboardingResponse(BaseModel):
    tenant_id: int
    tenant_name: str
    user_id: int
    user_email: str
    message: str
