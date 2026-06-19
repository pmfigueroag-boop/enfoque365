from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from app.db.models import PESTELCategory, PorterForceType, FODAQuadrant, IAProposalStatus


# ── Constantes de clasificación PESTEL (ISO 31000 / PMBOK) ──
# Valor Esperado = Probabilidad × Impacto
PESTEL_THRESHOLD_CRITICO = 49      # score ≥ 49 → Zona Roja
PESTEL_THRESHOLD_MONITOREO = 25    # 25 ≤ score < 49 → Zona Amarilla
# score < 25 → Zona Verde (Bajo)


def compute_risk_classification(probability: Optional[int], impact_level: Optional[int]) -> str:
    """Calcula la clasificación de riesgo usando la fórmula Valor Esperado (P×I)."""
    if probability is None or impact_level is None:
        return "sin_calificar"
    score = probability * impact_level
    if score >= PESTEL_THRESHOLD_CRITICO:
        return "critico"
    if score >= PESTEL_THRESHOLD_MONITOREO:
        return "monitoreo"
    return "bajo"


# ── PESTEL ───────────────────────────────────

class PESTELCreate(BaseModel):
    category: PESTELCategory
    description: str
    impact_level: Optional[int] = Field(default=None, ge=1, le=10)  # 1-10
    probability: Optional[int] = Field(default=None, ge=1, le=10)   # 1-10
    ai_rationale: Optional[str] = None
    source: Optional[str] = None

class PESTELUpdate(BaseModel):
    category: Optional[PESTELCategory] = None
    description: Optional[str] = None
    impact_level: Optional[int] = Field(default=None, ge=1, le=10)
    probability: Optional[int] = Field(default=None, ge=1, le=10)
    ai_rationale: Optional[str] = None
    source: Optional[str] = None

class PESTELResponse(PESTELCreate):
    id: int
    tenant_id: int
    created_at: datetime
    risk_score: Optional[int] = None
    risk_classification: Optional[str] = None
    validated_at: Optional[datetime] = None
    validated_by_user_id: Optional[int] = None

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def _compute_risk(self):
        """Calcula risk_score y risk_classification a partir de P×I."""
        if self.probability is not None and self.impact_level is not None:
            self.risk_score = self.probability * self.impact_level
            self.risk_classification = compute_risk_classification(
                self.probability, self.impact_level
            )
        return self


# ── PORTER 5 FUERZAS ────────────────────────

class PorterCreate(BaseModel):
    force_type: PorterForceType
    canonical_subfactor: Optional[str] = None
    description: str
    intensity: int = 3          # 1-5 presion de la fuerza
    probability: Optional[int] = Field(default=None, ge=1, le=5)  # 1-5 relevancia
    ai_rationale: Optional[str] = None
    evidence: Optional[str] = None


class PorterResponse(PorterCreate):
    id: int
    tenant_id: int
    created_at: datetime
    pressure_score: Optional[int] = None  # intensity × probability

    class Config:
        from_attributes = True

    @model_validator(mode="after")
    def _compute_pressure(self):
        """Calcula pressure_score = intensidad × probabilidad."""
        if self.probability is not None and self.intensity is not None:
            self.pressure_score = self.intensity * self.probability
        return self


# ── FODA ─────────────────────────────────────

class FODACreate(BaseModel):
    quadrant: FODAQuadrant
    description: str
    priority: Optional[int] = None
    pestel_factor_id: Optional[int] = None  # Trazabilidad PESTEL → FODA


class FODAMove(BaseModel):
    """Payload para mover un ítem FODA a otro cuadrante (drag & drop HITL)."""
    quadrant: FODAQuadrant


class FODAResponse(FODACreate):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── IA Log Propuestas OODA (Fricción Intencional) ──

class IAProposalCreate(BaseModel):
    """Usado internamente por el Agente de IA para registrar sugerencias."""
    ooda_phase: str
    target_entity: str
    proposed_payload: str   # JSON string del contenido sugerido
    ai_reasoning: Optional[str] = None


class IAProposalResponse(IAProposalCreate):
    id: int
    status: IAProposalStatus
    reviewed_by_user_id: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IAProposalApprove(BaseModel):
    """Payload que envía el humano al aprobar/rechazar."""
    pass


class IAProposalReject(BaseModel):
    rejection_reason: str
