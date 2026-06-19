from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ── Identidad Institucional (Sprint 4) ───────

class IdentidadUpdate(BaseModel):
    mision: Optional[str] = None
    vision: Optional[str] = None


class IdentidadResponse(BaseModel):
    mision: Optional[str] = None
    vision: Optional[str] = None
    tenant_name: str

    class Config:
        from_attributes = True


# ── Valores Institucionales ──────────────────

class ValorBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    orden: int = 0


class ValorCreate(ValorBase):
    pass


class ValorResponse(ValorBase):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Ejes Estratégicos (actualizado Sprint 4) ─

class EjeBase(BaseModel):
    name: str
    description: Optional[str] = None
    perspectiva_bsc: Optional[str] = None
    peso_ponderado: Optional[Decimal] = Decimal("0.25")


class EjeCreate(EjeBase):
    pass


class EjeResponse(EjeBase):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Objetivos Estratégicos ───────────────────

class ObjetivoBase(BaseModel):
    description: str
    eje_id: int  # FK obligatoria — Bloqueo Doctrinal (FR-200)


class ObjetivoCreate(ObjetivoBase):
    pass


class ObjetivoResponse(ObjetivoBase):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Indicadores KPI (Sprint 4) ───────────────

class IndicadorBase(BaseModel):
    nombre: str
    unidad: str = "porcentaje"
    linea_base: Decimal = Decimal("0")
    meta: Decimal
    valor_actual: Decimal = Decimal("0")
    frecuencia: str = "trimestral"
    tendencia: str = "ascendente"
    objetivo_id: int  # FK obligatoria


class IndicadorCreate(IndicadorBase):
    pass


class IndicadorResponse(IndicadorBase):
    id: int
    tenant_id: int
    created_at: datetime
    semaforo: str = "rojo"  # Calculado: verde/amarillo/rojo

    class Config:
        from_attributes = True


class MedicionUpdate(BaseModel):
    valor_actual: Decimal


# ── Vistas Compuestas ────────────────────────

class ObjetivoWithIndicadores(ObjetivoResponse):
    """Objetivo con sus indicadores KPI anidados."""
    indicadores: List[IndicadorResponse] = []


class EjeWithObjetivos(EjeResponse):
    """Vista de arbol: Eje con sus Objetivos anidados (US-3.3)."""
    objetivos: List[ObjetivoWithIndicadores] = []


# ── Mapa Estratégico BSC ─────────────────────

class MapaBSCPerspectiva(BaseModel):
    perspectiva: str
    peso_total: Decimal
    ejes: List[EjeWithObjetivos]


# ── Key Results OKR ──────────────────────────

class KeyResultCreate(BaseModel):
    title: str
    target_value: Decimal
    current_value: Decimal = Decimal("0")
    unit: str = "porcentaje"
    deadline: Optional[datetime] = None
    objetivo_id: int


class KeyResultResponse(KeyResultCreate):
    id: int
    tenant_id: int
    created_at: datetime
    progress: float = 0.0  # Calculado: current/target * 100

    class Config:
        from_attributes = True


class KeyResultUpdate(BaseModel):
    current_value: Decimal
