"""
B4.4: Scheduler de Monitoreo OODA

Background thread que genera alertas automáticas para factores PESTEL
en zona MONITOREO cuyo next_review_date ha vencido.

Se ejecuta una vez por hora (configurable) y procesa todos los tenants.
Se inicia automáticamente con FastAPI via lifespan event.
"""
import threading
import time
import logging
from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import (
    PESTELFactor, MonitoringAlert, MonitoringAlertStatus, Tenant,
)

logger = logging.getLogger("enfoque365.scheduler")

# Intervalo entre ejecuciones del scheduler (en segundos)
SCHEDULER_INTERVAL_SECONDS = 3600  # 1 hora


def _generate_alerts_for_tenant(db: Session, tenant_id: int) -> int:
    """Genera alertas pendientes para un tenant específico. Retorna cantidad creada."""
    now = datetime.now(timezone.utc)

    due_factors = db.query(PESTELFactor).filter(
        PESTELFactor.tenant_id == tenant_id,
        PESTELFactor.next_review_date != None,  # noqa: E711
        PESTELFactor.next_review_date <= now,
    ).all()

    created = 0
    for f in due_factors:
        # No duplicar alertas pendientes
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
            risk_classification_at_creation=(
                f.risk_classification.value if f.risk_classification else "monitoreo"
            ),
            status=MonitoringAlertStatus.PENDIENTE,
            message=(
                f"Factor PESTEL '{f.category.value.upper()}' (score {score}) "
                f"requiere reevaluación. Última revisión: "
                f"{f.last_evaluated_at.strftime('%Y-%m-%d') if f.last_evaluated_at else 'nunca'}."
            ),
            due_date=f.next_review_date or now,
            tenant_id=tenant_id,
            plan_id=f.plan_id,
        )
        db.add(alert)
        created += 1

    if created > 0:
        db.commit()
    return created


def _scheduler_loop(stop_event: threading.Event):
    """Loop principal del scheduler. Se ejecuta hasta que stop_event se activa."""
    logger.info(
        "OODA Scheduler iniciado. Intervalo: %d segundos.",
        SCHEDULER_INTERVAL_SECONDS,
    )

    while not stop_event.is_set():
        try:
            db = SessionLocal()
            try:
                tenants = db.query(Tenant.id).all()
                total_alerts = 0
                for (tid,) in tenants:
                    total_alerts += _generate_alerts_for_tenant(db, tid)
                if total_alerts > 0:
                    logger.info(
                        "OODA Scheduler: %d alerta(s) generada(s) para %d tenant(s).",
                        total_alerts, len(tenants),
                    )
            finally:
                db.close()
        except Exception:
            logger.exception("Error en OODA Scheduler.")

        # Esperar hasta el próximo ciclo (o hasta que se detenga)
        stop_event.wait(SCHEDULER_INTERVAL_SECONDS)

    logger.info("OODA Scheduler detenido.")


# ── Gestión del ciclo de vida ──

_stop_event: threading.Event | None = None
_thread: threading.Thread | None = None


def start_scheduler():
    """Inicia el scheduler en un thread daemon."""
    global _stop_event, _thread
    if _thread is not None and _thread.is_alive():
        logger.warning("OODA Scheduler ya está corriendo.")
        return

    _stop_event = threading.Event()
    _thread = threading.Thread(
        target=_scheduler_loop,
        args=(_stop_event,),
        daemon=True,
        name="ooda-monitoring-scheduler",
    )
    _thread.start()


def stop_scheduler():
    """Detiene el scheduler de forma limpia."""
    global _stop_event, _thread
    if _stop_event:
        _stop_event.set()
    if _thread:
        _thread.join(timeout=5)
    _stop_event = None
    _thread = None
