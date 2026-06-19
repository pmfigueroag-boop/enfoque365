"""baseline – 24 tables from models.py

Revision ID: 0001
Revises: –
Create Date: 2026-06-18 12:30:00.000000

Squash of 16 legacy migrations.  This single file recreates the
complete schema that matches app.db.models as of Sprint 9.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Enums ─────────────────────────────────────
    roleenum = sa.Enum(
        "ADMIN", "ESTRATEGA", "AUDITOR", "LECTOR",
        name="roleenum",
    )
    tipoinstitucion = sa.Enum("PUBLICO", "PRIVADO", name="tipoinstitucion")
    planestado = sa.Enum(
        "FORMULACION", "APROBADO", "VIGENTE",
        "EN_REVISION", "CERRADO", "ARCHIVADO",
        name="planestado",
    )
    perspectivabsc = sa.Enum(
        "FINANCIERA", "CLIENTES", "PROCESOS", "APRENDIZAJE",
        name="perspectivabsc",
    )
    unidadkpi = sa.Enum(
        "PORCENTAJE", "CANTIDAD", "MONEDA", "INDICE",
        name="unidadkpi",
    )
    frecuenciakpi = sa.Enum(
        "MENSUAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL",
        name="frecuenciakpi",
    )
    tendenciakpi = sa.Enum("ASCENDENTE", "DESCENDENTE", name="tendenciakpi")
    unidadkr = sa.Enum("PORCENTAJE", "CANTIDAD", "MONEDA", name="unidadkr")
    pestelcategory = sa.Enum(
        "POLITICO", "ECONOMICO", "SOCIAL",
        "TECNOLOGICO", "ECOLOGICO", "LEGAL",
        name="pestelcategory",
    )
    riskclassification = sa.Enum(
        "CRITICO", "MONITOREO", "BAJO", "SIN_CALIFICAR",
        name="riskclassification",
    )
    monitoringalertstatus = sa.Enum(
        "pendiente", "reconocida", "resuelta", "expirada",
        name="monitoringalertstatus",
    )
    porterforcetype = sa.Enum(
        "RIVALIDAD", "NUEVOS_ENTRANTES", "SUSTITUTOS",
        "PODER_PROVEEDORES", "PODER_CLIENTES",
        name="porterforcetype",
    )
    fodaquadrant = sa.Enum(
        "FORTALEZA", "OPORTUNIDAD", "DEBILIDAD", "AMENAZA",
        name="fodaquadrant",
    )
    iaproposalstatus = sa.Enum(
        "BORRADOR", "APROBADO", "RECHAZADO",
        name="iaproposalstatus",
    )
    towsquadrant = sa.Enum("fo", "fa", "do", "da", name="towsquadrant")
    p2wchoicetype = sa.Enum(
        "winning_aspiration", "where_to_play", "how_to_win",
        "core_capabilities", "management_systems",
        name="p2wchoicetype",
    )
    kernelcomponenttype = sa.Enum(
        "diagnosis", "guiding_policy", "coherent_actions",
        name="kernelcomponenttype",
    )
    blueoceanactiontype = sa.Enum(
        "eliminate", "reduce", "raise", "create",
        name="blueoceanactiontype",
    )
    bcgquadrant = sa.Enum(
        "star", "cash_cow", "question_mark", "dog",
        name="bcgquadrant",
    )
    mckinsey7selementtype = sa.Enum(
        "strategy", "structure", "systems", "shared_values",
        "style", "staff", "skills",
        name="mckinsey7selementtype",
    )
    hoshinstatusenum = sa.Enum(
        "pendiente", "en_progreso", "completado",
        name="hoshinstatusenum",
    )
    aitelemetrystatus = sa.Enum(
        "SUCCESS", "ERROR", "FALLBACK",
        "BUDGET_EXCEEDED", "VALIDATION_FAILED",
        name="aitelemetrystatus",
    )

    # ── 1. tenants ────────────────────────────────
    op.create_table(
        "tenants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tax_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tipo", tipoinstitucion, nullable=True),
        sa.Column("pais_iso", sa.String(length=2), nullable=True),
        sa.Column("sector_ciiu", sa.String(length=1), nullable=True),
        sa.Column("sector_ciiu_division", sa.String(length=2), nullable=True),
        sa.Column("sector_ciiu_grupo", sa.String(length=3), nullable=True),
        sa.Column("sector_ciiu_clase", sa.String(length=4), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tenants_id"), "tenants", ["id"], unique=False)
    op.create_index(op.f("ix_tenants_tax_id"), "tenants", ["tax_id"], unique=True)

    # ── 2. planes_estrategicos ────────────────────
    op.create_table(
        "planes_estrategicos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("fecha_inicio", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fecha_fin", sa.DateTime(timezone=True), nullable=True),
        sa.Column("estado", planestado, nullable=False),
        sa.Column("mision", sa.Text(), nullable=True),
        sa.Column("vision", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("aprobado_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cerrado_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_planes_estrategicos_id"), "planes_estrategicos", ["id"], unique=False)

    # ── 3. users ──────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", roleenum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # ── 4. valores_institucionales ────────────────
    op.create_table(
        "valores_institucionales",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("orden", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_valores_institucionales_id"), "valores_institucionales", ["id"], unique=False)

    # ── 5. ejes_estrategicos ──────────────────────
    op.create_table(
        "ejes_estrategicos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("perspectiva_bsc", perspectivabsc, nullable=True),
        sa.Column("peso_ponderado", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ejes_estrategicos_id"), "ejes_estrategicos", ["id"], unique=False)

    # ── 6. objetivos_estrategicos ─────────────────
    op.create_table(
        "objetivos_estrategicos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("eje_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["eje_id"], ["ejes_estrategicos.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_objetivos_estrategicos_id"), "objetivos_estrategicos", ["id"], unique=False)

    # ── 7. indicadores ────────────────────────────
    op.create_table(
        "indicadores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("unidad", unidadkpi, nullable=False),
        sa.Column("linea_base", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("meta", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("valor_actual", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("frecuencia", frecuenciakpi, nullable=False),
        sa.Column("tendencia", tendenciakpi, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("objetivo_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["objetivo_id"], ["objetivos_estrategicos.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_indicadores_id"), "indicadores", ["id"], unique=False)

    # ── 8. mediciones_historicas ───────────────────
    op.create_table(
        "mediciones_historicas",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("indicador_id", sa.Integer(), nullable=False),
        sa.Column("valor", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("fecha", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("notas", sa.String(), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["indicador_id"], ["indicadores.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mediciones_historicas_id"), "mediciones_historicas", ["id"], unique=False)

    # ── 9. key_results ────────────────────────────
    op.create_table(
        "key_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("target_value", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("current_value", sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column("unit", unidadkr, nullable=False),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("objetivo_id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["objetivo_id"], ["objetivos_estrategicos.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_key_results_id"), "key_results", ["id"], unique=False)

    # ── 10. documents ─────────────────────────────
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("file_type", sa.String(), nullable=False),
        sa.Column("file_path", sa.String(), nullable=True),
        sa.Column("url", sa.String(), nullable=True),
        sa.Column("doc_type", sa.String(), nullable=False),
        sa.Column("doc_subtype", sa.String(), nullable=True),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("char_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)

    # ── 11. pestel_factors ────────────────────────
    op.create_table(
        "pestel_factors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("category", pestelcategory, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("impact_level", sa.Integer(), nullable=True),
        sa.Column("probability", sa.Integer(), nullable=True),
        sa.Column("ai_rationale", sa.Text(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("risk_classification", riskclassification, nullable=True),
        sa.Column("validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("validated_by_user_id", sa.Integer(), nullable=True),
        sa.Column("next_review_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("review_frequency_days", sa.Integer(), nullable=True),
        sa.Column("last_evaluated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["validated_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_pestel_factors_id"), "pestel_factors", ["id"], unique=False)

    # ── 12. monitoring_alerts ─────────────────────
    op.create_table(
        "monitoring_alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("alert_type", sa.String(), nullable=False),
        sa.Column("source_entity", sa.String(), nullable=False),
        sa.Column("source_entity_id", sa.Integer(), nullable=False),
        sa.Column("risk_score_at_creation", sa.Integer(), nullable=True),
        sa.Column("risk_classification_at_creation", sa.String(), nullable=True),
        sa.Column("status", monitoringalertstatus, nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("acknowledged_by_user_id", sa.Integer(), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["acknowledged_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_monitoring_alerts_id"), "monitoring_alerts", ["id"], unique=False)

    # ── 13. porter_forces ─────────────────────────
    op.create_table(
        "porter_forces",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("force_type", porterforcetype, nullable=False),
        sa.Column("canonical_subfactor", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("intensity", sa.Integer(), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_porter_forces_id"), "porter_forces", ["id"], unique=False)

    # ── 14. vrio_resources ────────────────────────
    op.create_table(
        "vrio_resources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("resource_name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("valuable", sa.Boolean(), nullable=True),
        sa.Column("rare", sa.Boolean(), nullable=True),
        sa.Column("inimitable", sa.Boolean(), nullable=True),
        sa.Column("organized", sa.Boolean(), nullable=True),
        sa.Column("competitive_implication", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vrio_resources_id"), "vrio_resources", ["id"], unique=False)

    # ── 15. mckinsey_7s_elements ──────────────────
    op.create_table(
        "mckinsey_7s_elements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("element_type", mckinsey7selementtype, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("alignment_score", sa.Integer(), nullable=True),
        sa.Column("observations", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mckinsey_7s_elements_id"), "mckinsey_7s_elements", ["id"], unique=False)

    # ── 16. bcg_units ─────────────────────────────
    op.create_table(
        "bcg_units",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("unit_name", sa.String(), nullable=False),
        sa.Column("quadrant", bcgquadrant, nullable=False),
        sa.Column("market_growth", sa.Integer(), nullable=True),
        sa.Column("market_share", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("strategic_recommendation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bcg_units_id"), "bcg_units", ["id"], unique=False)

    # ── 17. foda_items (depends on pestel, porter, vrio, 7s, bcg) ──
    op.create_table(
        "foda_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quadrant", fodaquadrant, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("source_tool", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("pestel_factor_id", sa.Integer(), nullable=True),
        sa.Column("porter_force_id", sa.Integer(), nullable=True),
        sa.Column("vrio_resource_id", sa.Integer(), nullable=True),
        sa.Column("mckinsey7s_element_id", sa.Integer(), nullable=True),
        sa.Column("bcg_unit_id", sa.Integer(), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["pestel_factor_id"], ["pestel_factors.id"]),
        sa.ForeignKeyConstraint(["porter_force_id"], ["porter_forces.id"]),
        sa.ForeignKeyConstraint(["vrio_resource_id"], ["vrio_resources.id"]),
        sa.ForeignKeyConstraint(["mckinsey7s_element_id"], ["mckinsey_7s_elements.id"]),
        sa.ForeignKeyConstraint(["bcg_unit_id"], ["bcg_units.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_foda_items_id"), "foda_items", ["id"], unique=False)

    # ── 18. tows_strategies ───────────────────────
    op.create_table(
        "tows_strategies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quadrant", towsquadrant, nullable=False),
        sa.Column("strategy", sa.Text(), nullable=False),
        sa.Column("foda_strength_id", sa.Integer(), nullable=True),
        sa.Column("foda_weakness_id", sa.Integer(), nullable=True),
        sa.Column("foda_opportunity_id", sa.Integer(), nullable=True),
        sa.Column("foda_threat_id", sa.Integer(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["foda_strength_id"], ["foda_items.id"]),
        sa.ForeignKeyConstraint(["foda_weakness_id"], ["foda_items.id"]),
        sa.ForeignKeyConstraint(["foda_opportunity_id"], ["foda_items.id"]),
        sa.ForeignKeyConstraint(["foda_threat_id"], ["foda_items.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tows_strategies_id"), "tows_strategies", ["id"], unique=False)

    # ── 19. p2w_choices ───────────────────────────
    op.create_table(
        "p2w_choices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("choice_type", p2wchoicetype, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_p2w_choices_id"), "p2w_choices", ["id"], unique=False)

    # ── 20. kernel_components ─────────────────────
    op.create_table(
        "kernel_components",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("component_type", kernelcomponenttype, nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_kernel_components_id"), "kernel_components", ["id"], unique=False)

    # ── 21. blue_ocean_actions ────────────────────
    op.create_table(
        "blue_ocean_actions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("action_type", blueoceanactiontype, nullable=False),
        sa.Column("factor", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("current_level", sa.Integer(), nullable=True),
        sa.Column("target_level", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_blue_ocean_actions_id"), "blue_ocean_actions", ["id"], unique=False)

    # ── 22. ia_log_propuestas_ooda ────────────────
    op.create_table(
        "ia_log_propuestas_ooda",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ooda_phase", sa.String(), nullable=False),
        sa.Column("target_entity", sa.String(), nullable=False),
        sa.Column("proposed_payload", sa.Text(), nullable=False),
        sa.Column("ai_reasoning", sa.Text(), nullable=True),
        sa.Column("status", iaproposalstatus, nullable=False),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ia_log_propuestas_ooda_id"), "ia_log_propuestas_ooda", ["id"], unique=False)

    # ── 23. hoshin_items ──────────────────────────
    op.create_table(
        "hoshin_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("objetivo_estrategico_id", sa.Integer(), nullable=True),
        sa.Column("objetivo_estrategico_desc", sa.Text(), nullable=False),
        sa.Column("perspectiva", sa.String(), nullable=False),
        sa.Column("objetivo_tactico", sa.Text(), nullable=False),
        sa.Column("responsable", sa.String(length=200), nullable=False),
        sa.Column("meta_corto_plazo", sa.String(length=300), nullable=True),
        sa.Column("estado", hoshinstatusenum, nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["objetivo_estrategico_id"], ["objetivos_estrategicos.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.ForeignKeyConstraint(["plan_id"], ["planes_estrategicos.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_hoshin_items_id"), "hoshin_items", ["id"], unique=False)

    # ── 24. ai_telemetry ──────────────────────────
    op.create_table(
        "ai_telemetry",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("model_name", sa.String(length=50), nullable=False),
        sa.Column("endpoint_name", sa.String(length=60), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False),
        sa.Column("completion_tokens", sa.Integer(), nullable=False),
        sa.Column("total_tokens", sa.Integer(), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False),
        sa.Column("status", aitelemetrystatus, nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("estimated_cost_usd", sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_telemetry_id"), "ai_telemetry", ["id"], unique=False)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_index(op.f("ix_ai_telemetry_id"), table_name="ai_telemetry")
    op.drop_table("ai_telemetry")
    op.drop_index(op.f("ix_hoshin_items_id"), table_name="hoshin_items")
    op.drop_table("hoshin_items")
    op.drop_index(op.f("ix_ia_log_propuestas_ooda_id"), table_name="ia_log_propuestas_ooda")
    op.drop_table("ia_log_propuestas_ooda")
    op.drop_index(op.f("ix_blue_ocean_actions_id"), table_name="blue_ocean_actions")
    op.drop_table("blue_ocean_actions")
    op.drop_index(op.f("ix_kernel_components_id"), table_name="kernel_components")
    op.drop_table("kernel_components")
    op.drop_index(op.f("ix_p2w_choices_id"), table_name="p2w_choices")
    op.drop_table("p2w_choices")
    op.drop_index(op.f("ix_tows_strategies_id"), table_name="tows_strategies")
    op.drop_table("tows_strategies")
    op.drop_index(op.f("ix_foda_items_id"), table_name="foda_items")
    op.drop_table("foda_items")
    op.drop_index(op.f("ix_bcg_units_id"), table_name="bcg_units")
    op.drop_table("bcg_units")
    op.drop_index(op.f("ix_mckinsey_7s_elements_id"), table_name="mckinsey_7s_elements")
    op.drop_table("mckinsey_7s_elements")
    op.drop_index(op.f("ix_vrio_resources_id"), table_name="vrio_resources")
    op.drop_table("vrio_resources")
    op.drop_index(op.f("ix_porter_forces_id"), table_name="porter_forces")
    op.drop_table("porter_forces")
    op.drop_index(op.f("ix_monitoring_alerts_id"), table_name="monitoring_alerts")
    op.drop_table("monitoring_alerts")
    op.drop_index(op.f("ix_pestel_factors_id"), table_name="pestel_factors")
    op.drop_table("pestel_factors")
    op.drop_index(op.f("ix_documents_id"), table_name="documents")
    op.drop_table("documents")
    op.drop_index(op.f("ix_key_results_id"), table_name="key_results")
    op.drop_table("key_results")
    op.drop_index(op.f("ix_mediciones_historicas_id"), table_name="mediciones_historicas")
    op.drop_table("mediciones_historicas")
    op.drop_index(op.f("ix_indicadores_id"), table_name="indicadores")
    op.drop_table("indicadores")
    op.drop_index(op.f("ix_objetivos_estrategicos_id"), table_name="objetivos_estrategicos")
    op.drop_table("objetivos_estrategicos")
    op.drop_index(op.f("ix_ejes_estrategicos_id"), table_name="ejes_estrategicos")
    op.drop_table("ejes_estrategicos")
    op.drop_index(op.f("ix_valores_institucionales_id"), table_name="valores_institucionales")
    op.drop_table("valores_institucionales")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_planes_estrategicos_id"), table_name="planes_estrategicos")
    op.drop_table("planes_estrategicos")
    op.drop_index(op.f("ix_tenants_tax_id"), table_name="tenants")
    op.drop_index(op.f("ix_tenants_id"), table_name="tenants")
    op.drop_table("tenants")
