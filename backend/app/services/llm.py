"""
Servicio Multi-LLM -- Capa de abstraccion para Gemini, ChatGPT y Claude.

DOCTRINA: La IA propone, el humano dispone.
Cada provider recibe el mismo prompt y devuelve JSON estructurado.
Si no hay API keys configuradas, usa fallback deterministico.

Phase 3 Governance:
  - Telemetria: cada llamada registrada en ai_telemetry
  - Quality Gates: validacion estructural de respuestas LLM
  - Budget Controls: limite de tokens por tenant por mes
"""
import json
import enum
import logging
import time
from dataclasses import dataclass
from typing import Optional
from decimal import Decimal

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Budget ────────────────────────────────────────────
MONTHLY_TOKEN_BUDGET_PER_TENANT = 500_000  # configurable

# ── Cost rates per 1M tokens (USD) ────────────────────
COST_RATES = {
    "gemini-3.5-flash": {"input": 0.075, "output": 0.30},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
}

# ── Model names per provider ──────────────────────────
MODEL_NAMES = {
    "gemini": "gemini-3.5-flash",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-sonnet-4-20250514",
}


class LLMProvider(str, enum.Enum):
    GEMINI = "gemini"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


@dataclass
class LLMResult:
    """Resultado de una llamada LLM con metricas."""
    text: Optional[str]
    provider: str
    model_name: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: int
    success: bool
    error: Optional[str] = None


def _estimate_tokens(text: str) -> int:
    """Estimacion rapida de tokens (1 token ~ 4 chars en espanol)."""
    return max(1, len(text) // 4)


def _estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> Decimal:
    """Calcula costo estimado en USD."""
    rates = COST_RATES.get(model, {"input": 0.1, "output": 0.4})
    cost = (prompt_tokens * rates["input"] + completion_tokens * rates["output"]) / 1_000_000
    return Decimal(str(round(cost, 6)))


def get_available_provider() -> Optional[LLMProvider]:
    """Detecta el primer provider disponible segun API keys configuradas."""
    preferred = settings.LLM_DEFAULT_PROVIDER

    if preferred == "gemini" and settings.GEMINI_API_KEY:
        return LLMProvider.GEMINI
    if preferred == "openai" and settings.OPENAI_API_KEY:
        return LLMProvider.OPENAI
    if preferred == "anthropic" and settings.ANTHROPIC_API_KEY:
        return LLMProvider.ANTHROPIC

    if settings.GEMINI_API_KEY:
        return LLMProvider.GEMINI
    if settings.OPENAI_API_KEY:
        return LLMProvider.OPENAI
    if settings.ANTHROPIC_API_KEY:
        return LLMProvider.ANTHROPIC

    return None


def check_budget(db, tenant_id: int) -> bool:
    """Verifica si el tenant tiene presupuesto de tokens disponible este mes."""
    from app.db.models import AITelemetry
    from sqlalchemy import func, extract
    from datetime import datetime

    now = datetime.utcnow()
    total = db.query(func.coalesce(func.sum(AITelemetry.total_tokens), 0)).filter(
        AITelemetry.tenant_id == tenant_id,
        extract("year", AITelemetry.created_at) == now.year,
        extract("month", AITelemetry.created_at) == now.month,
    ).scalar()

    if total >= MONTHLY_TOKEN_BUDGET_PER_TENANT:
        logger.warning(f"Tenant {tenant_id} excedio budget mensual: {total}/{MONTHLY_TOKEN_BUDGET_PER_TENANT} tokens")
        return False
    return True


def log_telemetry(db, tenant_id: int, result: LLMResult, endpoint_name: str, status_str: str):
    """Persiste un registro de telemetria en la BD."""
    from app.db.models import AITelemetry, AITelemetryStatus

    status_map = {
        "success": AITelemetryStatus.SUCCESS,
        "error": AITelemetryStatus.ERROR,
        "fallback": AITelemetryStatus.FALLBACK,
        "budget_exceeded": AITelemetryStatus.BUDGET_EXCEEDED,
        "validation_failed": AITelemetryStatus.VALIDATION_FAILED,
    }

    cost = _estimate_cost(result.model_name, result.prompt_tokens, result.completion_tokens)

    entry = AITelemetry(
        tenant_id=tenant_id,
        provider=result.provider,
        model_name=result.model_name,
        endpoint_name=endpoint_name,
        prompt_tokens=result.prompt_tokens,
        completion_tokens=result.completion_tokens,
        total_tokens=result.prompt_tokens + result.completion_tokens,
        latency_ms=result.latency_ms,
        status=status_map.get(status_str, AITelemetryStatus.ERROR),
        error_message=result.error,
        estimated_cost_usd=cost,
    )
    db.add(entry)
    try:
        db.commit()
    except Exception:
        db.rollback()


async def _call_gemini(prompt: str, response_format: str = "json") -> str:
    """Llama a Google Gemini (gemini). Ejecuta en thread pool para no bloquear el event loop."""
    import asyncio
    from google import genai

    def _sync_call():
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        config_args = {
            "system_instruction": "Eres un consultor de planificacion estrategica. Responde SOLO en el formato solicitado, sin markdown extra.",
            "temperature": 0.7,
            "max_output_tokens": 8192,
        }
        if response_format == "json":
            config_args["response_mime_type"] = "application/json"
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(**config_args),
        )
        return response.text

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_call)


async def _call_openai(prompt: str) -> str:
    """Llama a OpenAI ChatGPT (openai). Ejecuta en thread pool."""
    import asyncio
    from openai import OpenAI

    def _sync_call():
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un consultor de estrategia institucional. Responde SOLO en JSON valido."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_call)


async def _call_anthropic(prompt: str) -> str:
    """Llama a Anthropic Claude (anthropic). Ejecuta en thread pool."""
    import asyncio
    import anthropic

    def _sync_call():
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _sync_call)


async def generate(prompt: str, provider: Optional[LLMProvider] = None,
                   endpoint_name: str = "unknown", db=None, tenant_id: int = 0,
                   response_format: str = "json") -> Optional[str]:
    """
    Genera texto con el LLM seleccionado.
    Retorna None si no hay provider disponible (fallback deterministico).
    Registra telemetria si db y tenant_id estan disponibles.
    """
    if provider is None:
        provider = get_available_provider()

    if provider is None:
        logger.warning("No hay API keys LLM configuradas. Usando fallback deterministico.")
        if db and tenant_id:
            result = LLMResult(None, "none", "none", 0, 0, 0, False)
            log_telemetry(db, tenant_id, result, endpoint_name, "fallback")
        return None

    # Budget check
    if db and tenant_id and not check_budget(db, tenant_id):
        result = LLMResult(None, provider.value, MODEL_NAMES.get(provider.value, "unknown"),
                           _estimate_tokens(prompt), 0, 0, False, "Budget mensual excedido")
        log_telemetry(db, tenant_id, result, endpoint_name, "budget_exceeded")
        return None

    model_name = MODEL_NAMES.get(provider.value, "unknown")
    prompt_tokens = _estimate_tokens(prompt)
    start = time.monotonic()

    try:
        if provider == LLMProvider.GEMINI:
            text = await _call_gemini(prompt, response_format)
        elif provider == LLMProvider.OPENAI:
            text = await _call_openai(prompt)
        elif provider == LLMProvider.ANTHROPIC:
            text = await _call_anthropic(prompt)
        else:
            text = None

        elapsed_ms = int((time.monotonic() - start) * 1000)
        completion_tokens = _estimate_tokens(text) if text else 0

        if db and tenant_id:
            result = LLMResult(text, provider.value, model_name,
                               prompt_tokens, completion_tokens, elapsed_ms, True)
            log_telemetry(db, tenant_id, result, endpoint_name, "success")

        return text

    except Exception as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.error(f"Error al llamar LLM ({provider.value}): {e}")

        if db and tenant_id:
            result = LLMResult(None, provider.value, model_name,
                               prompt_tokens, 0, elapsed_ms, False, str(e)[:500])
            log_telemetry(db, tenant_id, result, endpoint_name, "error")

        return None


def generate_sync(prompt: str, endpoint_name: str = "unknown",
                  db=None, tenant_id: int = 0, response_format: str = "json") -> Optional[str]:
    """
    Wrapper sincrono para uso en endpoints FastAPI sincronos.
    Llama al provider directamente y maneja telemetria.
    """
    provider = get_available_provider()

    if provider is None:
        logger.warning("No hay API keys LLM configuradas. Usando fallback deterministico.")
        if db and tenant_id:
            result = LLMResult(None, "none", "none", 0, 0, 0, False)
            log_telemetry(db, tenant_id, result, endpoint_name, "fallback")
        return None

    # Budget check
    if db and tenant_id and not check_budget(db, tenant_id):
        result = LLMResult(None, provider.value, MODEL_NAMES.get(provider.value, "unknown"),
                           _estimate_tokens(prompt), 0, 0, False, "Budget mensual excedido")
        log_telemetry(db, tenant_id, result, endpoint_name, "budget_exceeded")
        return None

    model_name = MODEL_NAMES.get(provider.value, "unknown")
    prompt_tokens = _estimate_tokens(prompt)
    start = time.monotonic()

    try:
        # Llamamos directo a la API sincrona si es posible (en este caso usamos asyncio.run para el async fallback)
        import asyncio
        text = asyncio.run(generate(prompt, provider, endpoint_name, db, tenant_id, response_format))
        
        # calculate metrics
        elapsed_ms = int((time.monotonic() - start) * 1000)
        completion_tokens = _estimate_tokens(text) if text else 0

        if db and tenant_id:
            result = LLMResult(text, provider.value, model_name,
                               prompt_tokens, completion_tokens, elapsed_ms, True)
            log_telemetry(db, tenant_id, result, endpoint_name, "success")

        return text
    except Exception as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        logger.error(f"Error en generate_sync ({provider.value}): {e}")

        if db and tenant_id:
            result = LLMResult(None, provider.value, model_name,
                               prompt_tokens, 0, elapsed_ms, False, str(e)[:500])
            log_telemetry(db, tenant_id, result, endpoint_name, "error")

        return None


def _call_provider_sync(provider: LLMProvider, prompt: str) -> Optional[str]:
    """Llamada sincrona directa al provider (sin asyncio)."""
    if provider == LLMProvider.GEMINI:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction="Eres un consultor de planificacion estrategica. Responde SOLO en JSON valido, sin markdown.",
                temperature=0.7,
                max_output_tokens=4096,
            ),
        )
        return response.text

    elif provider == LLMProvider.OPENAI:
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un consultor de estrategia institucional. Responde SOLO en JSON valido."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )
        return response.choices[0].message.content

    elif provider == LLMProvider.ANTHROPIC:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    return None


# ── Quality Gates ──────────────────────────────────────

REQUIRED_FIELDS = {
    "pestel": ["description"],  # category is injected server-side
    "porter": ["force_type", "description"],
    "foda": ["quadrant", "description"],
    "vrio": ["resource_name"],
    "mckinsey7s": ["element_type", "description"],
    "bcg": ["unit_name", "quadrant"],
    "tows": ["quadrant", "strategy"],
    "p2w": ["choice_type", "description"],
    "kernel": ["component_type", "description"],
    "blue_ocean": ["action_type", "factor"],
}


def validate_llm_output(items: list[dict], entity_type: str) -> list[dict]:
    """
    Filtra items que no cumplen los campos requeridos.
    Retorna solo los items validos.
    Si todos fallan, retorna lista vacia (trigger fallback).
    """
    required = REQUIRED_FIELDS.get(entity_type, [])
    if not required:
        return items

    valid = []
    for item in items:
        if all(item.get(field) for field in required):
            valid.append(item)
        else:
            missing = [f for f in required if not item.get(f)]
            logger.warning(f"Quality gate: item rechazado por campos faltantes: {missing}")

    if len(valid) < len(items):
        logger.info(f"Quality gate {entity_type}: {len(valid)}/{len(items)} items pasaron validacion")

    return valid


def parse_json_response(text: str) -> list[dict]:
    """
    Parsea la respuesta del LLM como JSON.
    Maneja casos donde el LLM envuelve JSON en ```json ... ```
    """
    if not text:
        return []

    # Limpiar markdown code blocks
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    import re
    # Remove trailing commas before closing brackets/braces
    cleaned = re.sub(r',\s*([\]}])', r'\1', cleaned)

    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            for key in ["factors", "fuerzas", "items", "recursos", "elements", "results",
                        "strategies", "choices", "components", "actions"]:
                if key in result and isinstance(result[key], list):
                    return result[key]
            return [result]
        return []
    except json.JSONDecodeError:
        logger.error(f"No se pudo parsear JSON del LLM: {cleaned[:200]}...")
        return []

def parse_yaml_response(text: str) -> list[dict]:
    """
    Parsea la respuesta del LLM como YAML.

    Hardened contra los problemas más comunes de LLMs:
    1. Code blocks (```yaml ... ```)
    2. Texto explicativo antes/después del YAML
    3. Comillas inconsistentes y caracteres especiales
    4. Múltiples documentos YAML separados por ---
    """
    if not text:
        return []

    import yaml
    import re

    # ── Paso 1: Extraer bloque YAML de code fences ──
    # Buscar el primer bloque ```yaml ... ``` o ``` ... ```
    fence_match = re.search(r'```(?:ya?ml)?\s*\n(.*?)```', text, re.DOTALL)
    if fence_match:
        cleaned = fence_match.group(1).strip()
    else:
        # Sin code fence: limpiar texto antes/después del YAML
        cleaned = text.strip()
        # Buscar donde empieza la lista YAML (primer "- ")
        yaml_start = re.search(r'^- ', cleaned, re.MULTILINE)
        if yaml_start:
            cleaned = cleaned[yaml_start.start():]
            # Cortar texto después del último campo YAML
            # (buscar línea que no empiece con - ni con espacios/campo)
            lines = cleaned.split('\n')
            yaml_lines = []
            for line in lines:
                if (line.strip() == '' or
                    line.startswith('- ') or
                    line.startswith('  ') or
                    line.startswith('\t')):
                    yaml_lines.append(line)
                elif yaml_lines and line.strip().startswith('#'):
                    continue  # skip comments
                elif yaml_lines:
                    break  # text after YAML ends
            cleaned = '\n'.join(yaml_lines)

    # ── Paso 2: Sanitizar problemas comunes de YAML ──
    # Fix: colons in unquoted values (e.g., "description: Factor X: impacto alto")
    # Solo aplicar a líneas que tienen key: value pattern donde value contiene ':'
    sanitized_lines = []
    for line in cleaned.split('\n'):
        stripped = line.strip()
        # Skip list markers and empty lines
        if stripped.startswith('- ') or stripped == '' or stripped == '-':
            sanitized_lines.append(line)
            continue
        # Match "  key: value" pattern
        kv_match = re.match(r'^(\s+)(\w[\w_]*):\s+(.+)$', line)
        if kv_match:
            indent, key, value = kv_match.groups()
            # If value contains unquoted colons or special chars, wrap in quotes
            if ':' in value or value.startswith('{') or value.startswith('['):
                # Don't re-quote if already quoted
                if not (value.startswith('"') or value.startswith("'")):
                    value = value.replace("'", "''")  # escape single quotes
                    line = f"{indent}{key}: '{value}'"
            sanitized_lines.append(line)
        else:
            sanitized_lines.append(line)
    cleaned = '\n'.join(sanitized_lines)

    # ── Paso 3: Intentar parsear ──
    try:
        result = yaml.safe_load(cleaned)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            for key in ["factors", "fuerzas", "items", "recursos", "elements", "results"]:
                if key in result and isinstance(result[key], list):
                    return result[key]
            return [result]
        return []
    except yaml.YAMLError as e:
        logger.warning(f"YAML parse attempt 1 failed: {e}")

    # ── Paso 4: Fallback — parsear documento por documento ──
    try:
        results = list(yaml.safe_load_all(cleaned))
        combined = []
        for doc in results:
            if isinstance(doc, list):
                combined.extend(doc)
            elif isinstance(doc, dict):
                combined.append(doc)
        if combined:
            return combined
    except yaml.YAMLError:
        pass

    # ── Paso 5: Último recurso — extracción regex campo por campo ──
    logger.warning("YAML parsing failed completely. Attempting regex extraction.")
    items = []
    # Split by "- category:" pattern
    blocks = re.split(r'(?=^- )', cleaned, flags=re.MULTILINE)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        item = {}
        for field in ['category', 'description', 'impact_level', 'probability', 'ai_rationale']:
            match = re.search(rf'{field}:\s*(.+)', block)
            if match:
                val = match.group(1).strip().strip("'\"")
                if field in ('impact_level', 'probability'):
                    try:
                        val = int(val)
                    except (ValueError, TypeError):
                        val = 5
                item[field] = val
        if item.get('description'):
            items.append(item)

    if items:
        logger.info(f"Regex extraction recovered {len(items)} PESTEL factors")
    else:
        logger.error(f"All YAML parsing failed. Raw text: {text[:300]}...")

    return items

