from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.db.models import PlanEstado


class PlanCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None


class PlanUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    mision: Optional[str] = None
    vision: Optional[str] = None


class PlanResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: PlanEstado
    mision: Optional[str] = None
    vision: Optional[str] = None
    tenant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    aprobado_at: Optional[datetime] = None
    cerrado_at: Optional[datetime] = None

    class Config:
        from_attributes = True
