"""
Endpoints de Wargaming AI (WAR-001).
Simula escenarios competitivos usando LLM con contexto institucional.
"""
import asyncio
import json
from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    Tenant, User, RoleEnum,
    PESTELFactor, PorterForce, FODAItem, Document,
)
from app.core.security import get_current_tenant_id, get_current_user, require_role
from app.services import llm

router = APIRouter()


class WargameRequest(BaseModel):
    scenario: str


class WargameResponse(BaseModel):
    scenario: str
    impact_analysis: str
    recommendations: list[str]
    tactical_moves: list[str]
    risk_level: str
    source: str


def _build_wargame_context(db: Session, tenant_id: int) -> dict:
    """Construye el contexto institucional + documental para la simulacion."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    pestel = db.query(PESTELFactor).filter(PESTELFactor.tenant_id == tenant_id).all()
    porter = db.query(PorterForce).filter(PorterForce.tenant_id == tenant_id).all()
    foda = db.query(FODAItem).filter(FODAItem.tenant_id == tenant_id).all()

    # Documentos institucionales como contexto
    docs = (
        db.query(Document)
        .filter(Document.tenant_id == tenant_id)
        .filter(Document.extracted_text.isnot(None))
        .filter(Document.char_count > 0)
        .order_by(Document.char_count.desc())
        .limit(5)
        .all()
    )
    doc_fragments = []
    total_chars = 0
    for d in docs:
        text = (d.extracted_text or "")[:1500]
        fragment = f"[{d.doc_type or 'general'}] {d.filename}: {text}"
        if total_chars + len(fragment) > 6000:
            break
        doc_fragments.append(fragment)
        total_chars += len(fragment)

    return {
        "nombre": tenant.name if tenant else "Institucion",
        "mision": tenant.mision or "No definida",
        "sector": tenant.sector_ciiu or "General",
        "pais": tenant.pais_iso or "XX",
        "pestel_count": len(pestel),
        "pestel_items": [f"[{f.category.value}] {f.description}" for f in pestel[:10]],
        "porter_items": [f"[{f.force_type.value}] {f.description}" for f in porter[:5]],
        "foda_fortalezas": [f.description for f in foda if f.quadrant.value == "fortaleza"][:5],
        "foda_debilidades": [f.description for f in foda if f.quadrant.value == "debilidad"][:5],
        "foda_oportunidades": [f.description for f in foda if f.quadrant.value == "oportunidad"][:5],
        "foda_amenazas": [f.description for f in foda if f.quadrant.value == "amenaza"][:5],
        "doc_context": "\n".join(doc_fragments) if doc_fragments else "",
    }


def _build_wargame_prompt(scenario: str, ctx: dict) -> str:
    doc_section = ""
    if ctx.get("doc_context"):
        doc_section = f"\nDOCUMENTOS INSTITUCIONALES (usa como evidencia):\n{ctx['doc_context']}\n"

    return f"""Eres un estratega militar-empresarial. Simula el siguiente escenario competitivo para la institucion.

INSTITUCION: {ctx['nombre']}
MISION: {ctx['mision']}
SECTOR: {ctx['sector']} | PAIS: {ctx['pais']}

CONTEXTO ESTRATEGICO:
- PESTEL ({ctx['pestel_count']} factores): {'; '.join(ctx['pestel_items'][:5])}
- Porter: {'; '.join(ctx['porter_items'][:3])}
- Fortalezas: {'; '.join(ctx['foda_fortalezas'][:3])}
- Debilidades: {'; '.join(ctx['foda_debilidades'][:3])}
- Oportunidades: {'; '.join(ctx['foda_oportunidades'][:3])}
- Amenazas: {'; '.join(ctx['foda_amenazas'][:3])}
{doc_section}
ESCENARIO A SIMULAR:
{scenario}

Responde SOLO en JSON con esta estructura exacta:
{{
  "impact_analysis": "Analisis del impacto del escenario (3-5 oraciones)",
  "recommendations": ["Recomendacion 1", "Recomendacion 2", "Recomendacion 3"],
  "tactical_moves": ["Movimiento tactico 1", "Movimiento tactico 2", "Movimiento tactico 3"],
  "risk_level": "alto|medio|bajo"
}}"""


@router.post("/simulate", response_model=WargameResponse)
def wargame_simulate(
    payload: WargameRequest,
    tenant_id: int = Depends(get_current_tenant_id),
    user: User = Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA)),
    db: Session = Depends(get_db),
):
    """
    Simula un escenario competitivo usando LLM con contexto institucional.
    Fallback a respuesta generica si no hay API key.
    """
    ctx = _build_wargame_context(db, tenant_id)
    provider = llm.get_available_provider()

    result = None
    source = "fallback:deterministico"

    if provider:
        prompt = _build_wargame_prompt(payload.scenario, ctx)
        try:
            raw = asyncio.run(llm.generate(prompt, provider))
            if raw:
                parsed = llm.parse_json_response(raw)
                if parsed and isinstance(parsed, list) and len(parsed) > 0:
                    result = parsed[0]
                elif isinstance(parsed, dict):
                    result = parsed
                source = f"LLM:{provider.value}"
        except Exception:
            result = None

    # Fallback deterministico
    if not result:
        result = {
            "impact_analysis": (
                f"El escenario '{payload.scenario[:80]}...' representa un cambio significativo "
                f"para {ctx['nombre']}. Dado el contexto de {ctx['pestel_count']} factores PESTEL "
                f"identificados y la posicion competitiva actual, el impacto potencial es moderado. "
                f"Se recomienda un analisis mas profundo con datos sectoriales."
            ),
            "recommendations": [
                "Evaluar el impacto financiero directo del escenario propuesto",
                "Convocar al comite estrategico para sesion de analisis de escenarios",
                "Revisar los factores PESTEL afectados y actualizar las prioridades",
            ],
            "tactical_moves": [
                "Activar plan de contingencia operativo",
                "Fortalecer las capacidades identificadas como ventaja competitiva (VRIO)",
                "Monitorear indicadores adelantados durante los proximos 90 dias",
            ],
            "risk_level": "medio",
        }

    return WargameResponse(
        scenario=payload.scenario,
        impact_analysis=result.get("impact_analysis", ""),
        recommendations=result.get("recommendations", []),
        tactical_moves=result.get("tactical_moves", []),
        risk_level=result.get("risk_level", "medio"),
        source=source,
    )
