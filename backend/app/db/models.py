import enum
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


# ──────────────────────────────────────────────
# Enum: Roles del sistema (US-1.2)
# ──────────────────────────────────────────────
class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    ESTRATEGA = "estratega"
    AUDITOR = "auditor"
    LECTOR = "lector"


# ──────────────────────────────────────────────
# Enums para clasificacion institucional
# ──────────────────────────────────────────────
class TipoInstitucion(str, enum.Enum):
    PUBLICO = "publico"
    PRIVADO = "privado"


# ──────────────────────────────────────────────
# Enum: Estados del Plan Estrategico
# ──────────────────────────────────────────────
class PlanEstado(str, enum.Enum):
    FORMULACION = "FORMULACION"
    APROBADO = "APROBADO"
    VIGENTE = "VIGENTE"
    EN_REVISION = "EN_REVISION"
    CERRADO = "CERRADO"
    ARCHIVADO = "ARCHIVADO"


# ──────────────────────────────────────────────
# Tenant – Aislamiento institucional (US-1.1)
# ──────────────────────────────────────────────
class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    tax_id = Column(String, unique=True, index=True, nullable=False)  # RNC, NIT, RFC, EIN, etc.
    name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Clasificacion institucional (Onboarding)
    tipo = Column(Enum(TipoInstitucion), nullable=True)
    pais_iso = Column(String(2), nullable=True)              # ISO 3166-1 alpha-2
    sector_ciiu = Column(String(1), nullable=True)           # Seccion CIIU Rev.4 (A-U)
    sector_ciiu_division = Column(String(2), nullable=True)  # Division CIIU (01-99)
    sector_ciiu_grupo = Column(String(3), nullable=True)     # Grupo CIIU (011-990)
    sector_ciiu_clase = Column(String(4), nullable=True)     # Clase CIIU (0111-9900)

    users = relationship("User", back_populates="tenant")
    ejes = relationship("EjeEstrategico", back_populates="tenant")
    planes = relationship("PlanEstrategico", back_populates="tenant")


# ──────────────────────────────────────────────
# Plan Estrategico – Eje central del PEI
# ──────────────────────────────────────────────
class PlanEstrategico(Base):
    __tablename__ = "planes_estrategicos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_inicio = Column(DateTime(timezone=True), nullable=True)
    fecha_fin = Column(DateTime(timezone=True), nullable=True)
    estado = Column(Enum(PlanEstado), nullable=False, default=PlanEstado.FORMULACION)

    # Identidad del plan (migrada desde Tenant)
    mision = Column(Text, nullable=True)
    vision = Column(Text, nullable=True)
    
    # Memorándum IA persistente
    memorandum_ia = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    aprobado_at = Column(DateTime(timezone=True), nullable=True)
    cerrado_at = Column(DateTime(timezone=True), nullable=True)

    # FK al tenant
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="planes")

    # Relationships
    valores = relationship("ValorInstitucional", back_populates="plan")
    ejes = relationship("EjeEstrategico", back_populates="plan")


# ──────────────────────────────────────────────
# User – Usuarios con rol y tenant (US-1.2)
# ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.LECTOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # FK obligatoria: todo usuario pertenece a un tenant
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    tenant = relationship("Tenant", back_populates="users")


# ──────────────────────────────────────────────
# Sprint 4: Valor Institucional (Identidad PEI)
# ──────────────────────────────────────────────
class ValorInstitucional(Base):
    __tablename__ = "valores_institucionales"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    orden = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=False)
    plan = relationship("PlanEstrategico", back_populates="valores")

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)


# ──────────────────────────────────────────────
# Sprint 4: Enum para Perspectivas BSC
# ──────────────────────────────────────────────
class PerspectivaBSC(str, enum.Enum):
    FINANCIERA = "financiera"
    CLIENTES = "clientes"
    PROCESOS = "procesos"
    APRENDIZAJE = "aprendizaje"


# ──────────────────────────────────────────────
# Eje Estratégico – Perspectiva BSC (US-3.1 + Sprint 4)
# ──────────────────────────────────────────────
class EjeEstrategico(Base):
    __tablename__ = "ejes_estrategicos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Sprint 4: BSC
    perspectiva_bsc = Column(Enum(PerspectivaBSC), nullable=True)
    peso_ponderado = Column(Numeric(5, 4), default=0.25)  # Peso relativo (sum = 1.0)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)
    tenant = relationship("Tenant", back_populates="ejes")
    plan = relationship("PlanEstrategico", back_populates="ejes")

    objetivos = relationship("ObjetivoEstrategico", back_populates="eje")


# ──────────────────────────────────────────────
# Objetivo Estratégico – Anclado a un Eje (US-3.2 / FR-200)
# ──────────────────────────────────────────────
class ObjetivoEstrategico(Base):
    __tablename__ = "objetivos_estrategicos"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # FK obligatoria: ningún objetivo sin eje (FR-200)
    eje_id = Column(Integer, ForeignKey("ejes_estrategicos.id"), nullable=False)
    eje = relationship("EjeEstrategico", back_populates="objetivos")

    # FK obligatoria: aislamiento por tenant
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)

    indicadores = relationship("Indicador", back_populates="objetivo")
    key_results = relationship("KeyResult", back_populates="objetivo")


# ──────────────────────────────────────────────
# Sprint 4: Enums para Indicadores KPI
# ──────────────────────────────────────────────
class UnidadKPI(str, enum.Enum):
    PORCENTAJE = "porcentaje"
    CANTIDAD = "cantidad"
    MONEDA = "moneda"
    INDICE = "indice"


class FrecuenciaKPI(str, enum.Enum):
    MENSUAL = "mensual"
    TRIMESTRAL = "trimestral"
    SEMESTRAL = "semestral"
    ANUAL = "anual"


class TendenciaKPI(str, enum.Enum):
    ASCENDENTE = "ascendente"    # Mejor si sube
    DESCENDENTE = "descendente"  # Mejor si baja


# ──────────────────────────────────────────────
# Sprint 4: Indicador KPI vinculado a Objetivo
# ──────────────────────────────────────────────
class Indicador(Base):
    __tablename__ = "indicadores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    unidad = Column(Enum(UnidadKPI), nullable=False, default=UnidadKPI.PORCENTAJE)
    linea_base = Column(Numeric(12, 2), default=0)
    meta = Column(Numeric(12, 2), nullable=False)
    valor_actual = Column(Numeric(12, 2), default=0)
    frecuencia = Column(Enum(FrecuenciaKPI), nullable=False, default=FrecuenciaKPI.TRIMESTRAL)
    tendencia = Column(Enum(TendenciaKPI), nullable=False, default=TendenciaKPI.ASCENDENTE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # FK obligatoria: todo KPI pertenece a un objetivo
    objetivo_id = Column(Integer, ForeignKey("objetivos_estrategicos.id"), nullable=False)
    objetivo = relationship("ObjetivoEstrategico", back_populates="indicadores")

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# Medicion Historica – Historial de valores KPI
# Cada registro captura un valor puntual en el tiempo.
# ──────────────────────────────────────────────
class MedicionHistorica(Base):
    __tablename__ = "mediciones_historicas"

    id = Column(Integer, primary_key=True, index=True)
    indicador_id = Column(Integer, ForeignKey("indicadores.id", ondelete="CASCADE"), nullable=False)
    valor = Column(Numeric(12, 2), nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    notas = Column(String, nullable=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# Key Result – OKR medible vinculado a Objetivo (EXE-002)
# Cada objetivo tiene N resultados clave cuantificables.
# ──────────────────────────────────────────────
class UnidadKR(str, enum.Enum):
    PORCENTAJE = "porcentaje"
    CANTIDAD = "cantidad"
    MONEDA = "moneda"


class KeyResult(Base):
    __tablename__ = "key_results"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    target_value = Column(Numeric(12, 2), nullable=False)
    current_value = Column(Numeric(12, 2), default=0)
    unit = Column(Enum(UnidadKR), nullable=False, default=UnidadKR.PORCENTAJE)
    deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # FK obligatoria: todo KR pertenece a un objetivo
    objetivo_id = Column(Integer, ForeignKey("objetivos_estrategicos.id"), nullable=False)
    objetivo = relationship("ObjetivoEstrategico", back_populates="key_results")

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# Document – Documentos institucionales (ONB-002)
# PDF, DOCX, TXT cargados para contexto IA.
# ──────────────────────────────────────────────
class DocType(str, enum.Enum):
    NORMATIVA = "normativa"                # Piramide de Kelsen
    IDENTIDAD = "identidad"                # Documentos de Identidad institucional
    FINANCIERO = "financiero"              # Financieros
    MARKETING = "marketing"                # Marketing
    RRHH = "rrhh"                          # Recursos Humanos
    TIC = "tic"                            # Tecnologia de Informacion y Comunicacion
    OPERACIONES = "operaciones"            # Operaciones
    PLANIFICACION = "planificacion"        # Planificacion
    ORGANIZACION = "organizacion"          # Organizacion
    GENERAL = "general"                    # Generales


# Subtipos fijos por tipo de documento
DOC_SUBTYPES: dict[str, list[str]] = {
    "normativa": [
        "Constitucion", "Tratado Internacional", "Ley Organica", "Ley Ordinaria",
        "Decreto", "Reglamento", "Resolucion", "Ordenanza", "Circular", "Norma Tecnica",
    ],
    "identidad": [
        "Acta Constitutiva", "Estatutos", "RNC/NIT", "Registro Mercantil",
        "Certificacion Institucional", "Manual de Marca",
    ],
    "financiero": [
        "Estado Financiero", "Presupuesto", "Flujo de Caja", "Balance General",
        "Estado de Resultados", "Auditoria", "Informe Fiscal",
    ],
    "marketing": [
        "Plan de Marketing", "Estudio de Mercado", "Analisis de Competencia",
        "Encuesta de Satisfaccion", "Branding", "Benchmarking",
    ],
    "rrhh": [
        "Organigrama", "Manual de Funciones", "Politica Salarial", "Plan de Capacitacion",
        "Evaluacion de Desempeno", "Codigo de Etica", "Reglamento Interno",
    ],
    "tic": [
        "Plan de TI", "Arquitectura de Sistemas", "Politica de Seguridad",
        "SLA", "Inventario Tecnologico", "Plan de Continuidad",
    ],
    "operaciones": [
        "Manual de Procesos", "Procedimiento Operativo", "Cadena de Valor",
        "Layout", "Control de Calidad", "Plan de Mantenimiento",
    ],
    "planificacion": [
        "Plan Estrategico", "Plan Operativo Anual", "Plan de Accion",
        "Informe de Gestion", "Memoria Institucional", "Marco Logico",
    ],
    "organizacion": [
        "Estructura Organizacional", "Manual de Organizacion", "Delegacion de Autoridad",
        "Mapa de Procesos", "Gobierno Corporativo",
    ],
    "general": [
        "Acta de Reunion", "Informe General", "Correspondencia",
        "Contrato", "Convenio", "Otro",
    ],
}


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, nullable=False, default="file")  # "file" | "link"
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)        # pdf, docx, txt, html, link
    file_path = Column(String, nullable=True)          # Ruta en disco (null para links)
    url = Column(String, nullable=True)                # URL origen (null para archivos)
    doc_type = Column(String, nullable=False, default="general")
    doc_subtype = Column(String, nullable=True)         # Subtipo libre dentro del tipo
    extracted_text = Column(Text, nullable=True)        # Texto extraido
    char_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ══════════════════════════════════════════════
# SPRINT 2+5: Bucle Analitico y Diagnostico
# ══════════════════════════════════════════════

# ──────────────────────────────────────────────
# Enums para PESTEL, Porter, FODA
# ──────────────────────────────────────────────
class PESTELCategory(str, enum.Enum):
    POLITICO = "politico"
    ECONOMICO = "economico"
    SOCIAL = "social"
    TECNOLOGICO = "tecnologico"
    ECOLOGICO = "ecologico"
    LEGAL = "legal"


class PorterForceType(str, enum.Enum):
    RIVALIDAD = "rivalidad"
    NUEVOS_ENTRANTES = "nuevos_entrantes"
    SUSTITUTOS = "sustitutos"
    PODER_PROVEEDORES = "poder_proveedores"
    PODER_CLIENTES = "poder_clientes"


class FODAQuadrant(str, enum.Enum):
    FORTALEZA = "fortaleza"
    OPORTUNIDAD = "oportunidad"
    DEBILIDAD = "debilidad"
    AMENAZA = "amenaza"


class IAProposalStatus(str, enum.Enum):
    BORRADOR = "borrador"       # Sugerencia de IA pendiente (gris)
    APROBADO = "aprobado"       # Humano aceptó la sugerencia
    RECHAZADO = "rechazado"     # Humano descartó la sugerencia


# ──────────────────────────────────────────────
# Enum: Clasificación de riesgo PESTEL (ISO 31000 / PMBOK)
# Calculado como Valor Esperado = Probabilidad × Impacto
# ──────────────────────────────────────────────
class RiskClassification(str, enum.Enum):
    CRITICO = "critico"         # score ≥ 49 (Zona Roja)
    MONITOREO = "monitoreo"     # 25 ≤ score < 49 (Zona Amarilla)
    BAJO = "bajo"               # score < 25 (Zona Verde)
    SIN_CALIFICAR = "sin_calificar"  # P o I no asignados aún


# ──────────────────────────────────────────────
# PESTEL – Factores del entorno externo (US-2.1)
# ──────────────────────────────────────────────
class PESTELFactor(Base):
    __tablename__ = "pestel_factors"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(Enum(PESTELCategory), nullable=False)
    description = Column(Text, nullable=False)
    impact_level = Column(Integer, nullable=True)  # 1-10 escala de impacto
    probability = Column(Integer, nullable=True)    # 1-10 escala de probabilidad
    ai_rationale = Column(Text, nullable=True)      # Justificacion IA de la calificacion
    source = Column(String, nullable=True)          # Fuente del dato
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # B1.1: Clasificación de riesgo persistida (ISO 31000)
    # Calculada automáticamente como P×I en el endpoint.
    risk_classification = Column(
        Enum(RiskClassification),
        nullable=True,
        default=RiskClassification.SIN_CALIFICAR,
    )

    # B2.2: Audit trail de validación humana (Fricción Intencional)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    validated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # B4.1: Campos de monitoreo OODA (reevaluación periódica)
    next_review_date = Column(DateTime(timezone=True), nullable=True)
    review_frequency_days = Column(Integer, nullable=True, default=90)  # 90 = trimestral
    last_evaluated_at = Column(DateTime(timezone=True), nullable=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# B4.2: Alertas de Monitoreo OODA (Bucle de Reevaluación)
# ──────────────────────────────────────────────
class MonitoringAlertStatus(str, enum.Enum):
    PENDIENTE = "pendiente"       # Alerta generada, aún no revisada
    RECONOCIDA = "reconocida"     # Usuario la vio y la reconoció
    RESUELTA = "resuelta"         # Se reevaluó y se tomaron acciones
    EXPIRADA = "expirada"         # No se atendió y el ciclo avanzó


class MonitoringAlert(Base):
    """
    Alerta de reevaluación OODA. Se genera automáticamente cuando un
    factor PESTEL en zona MONITOREO alcanza su next_review_date.
    También puede generarse manualmente o por el scheduler.
    """
    __tablename__ = "monitoring_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String, nullable=False, default="pestel_review")  # pestel_review | porter_review | ...
    source_entity = Column(String, nullable=False)  # "pestel_factor" | "porter_force" | ...
    source_entity_id = Column(Integer, nullable=False)  # FK genérico al ID del factor
    risk_score_at_creation = Column(Integer, nullable=True)  # Score P×I al momento de crear la alerta
    risk_classification_at_creation = Column(String, nullable=True)  # critico | monitoreo | bajo

    status = Column(
        Enum(MonitoringAlertStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=MonitoringAlertStatus.PENDIENTE,
    )
    message = Column(Text, nullable=False)  # Descripción legible de la alerta
    due_date = Column(DateTime(timezone=True), nullable=False)  # Fecha límite de reevaluación

    acknowledged_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)  # Notas al resolver
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# Porter 5 Fuerzas – Diagnostico sectorial (Sprint 5)
# ──────────────────────────────────────────────
class PorterForce(Base):
    __tablename__ = "porter_forces"

    id = Column(Integer, primary_key=True, index=True)
    force_type = Column(Enum(PorterForceType), nullable=False)
    canonical_subfactor = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    intensity = Column(Integer, nullable=False, default=3)  # 1-5 presion de la fuerza
    probability = Column(Integer, nullable=True)            # 1-5 probabilidad/relevancia
    ai_rationale = Column(Text, nullable=True)              # Justificacion IA de la calificacion
    evidence = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# FODA – Sintesis Estrategica (derivado de los 5 analisis)
# ──────────────────────────────────────────────
class FODAItem(Base):
    __tablename__ = "foda_items"

    id = Column(Integer, primary_key=True, index=True)
    quadrant = Column(Enum(FODAQuadrant), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Integer, nullable=True)       # Orden de importancia
    source_tool = Column(String, nullable=True)     # pestel|porter|vrio|7s|bcg|manual
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Trazabilidad: de qué análisis se derivó este item FODA
    pestel_factor_id = Column(Integer, ForeignKey("pestel_factors.id"), nullable=True)
    porter_force_id = Column(Integer, ForeignKey("porter_forces.id"), nullable=True)
    vrio_resource_id = Column(Integer, ForeignKey("vrio_resources.id"), nullable=True)
    mckinsey7s_element_id = Column(Integer, ForeignKey("mckinsey_7s_elements.id"), nullable=True)
    bcg_unit_id = Column(Integer, ForeignKey("bcg_units.id"), nullable=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# TOWS – Cruce estrategico de FODA (Sprint 7)
# FO, FA, DO, DA
# ──────────────────────────────────────────────
class TOWSQuadrant(str, enum.Enum):
    FO = "fo"   # Fortalezas x Oportunidades = Ofensivas
    FA = "fa"   # Fortalezas x Amenazas = Defensivas
    DO = "do"   # Debilidades x Oportunidades = Reorientacion
    DA = "da"   # Debilidades x Amenazas = Supervivencia


class TOWSStrategy(Base):
    __tablename__ = "tows_strategies"

    id = Column(Integer, primary_key=True, index=True)
    quadrant = Column(Enum(TOWSQuadrant, values_callable=lambda x: [e.value for e in x]), nullable=False)
    strategy = Column(Text, nullable=False)
    foda_strength_id = Column(Integer, ForeignKey("foda_items.id"), nullable=True)
    foda_weakness_id = Column(Integer, ForeignKey("foda_items.id"), nullable=True)
    foda_opportunity_id = Column(Integer, ForeignKey("foda_items.id"), nullable=True)
    foda_threat_id = Column(Integer, ForeignKey("foda_items.id"), nullable=True)
    priority = Column(Integer, nullable=True, default=3)  # 1-5
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# P2W – Playing to Win (Lafley & Martin)
# 5 elecciones en cascada
# ──────────────────────────────────────────────
class P2WChoiceType(str, enum.Enum):
    WINNING_ASPIRATION = "winning_aspiration"
    WHERE_TO_PLAY = "where_to_play"
    HOW_TO_WIN = "how_to_win"
    CORE_CAPABILITIES = "core_capabilities"
    MANAGEMENT_SYSTEMS = "management_systems"


class P2WChoice(Base):
    __tablename__ = "p2w_choices"

    id = Column(Integer, primary_key=True, index=True)
    choice_type = Column(Enum(P2WChoiceType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)  # Por que esta eleccion
    priority = Column(Integer, nullable=True, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# Kernel Rumelt – Nucleo de la estrategia
# Diagnostico, Politica Guia, Acciones Coherentes
# ──────────────────────────────────────────────
class KernelComponentType(str, enum.Enum):
    DIAGNOSIS = "diagnosis"
    GUIDING_POLICY = "guiding_policy"
    COHERENT_ACTIONS = "coherent_actions"


class KernelComponent(Base):
    __tablename__ = "kernel_components"

    id = Column(Integer, primary_key=True, index=True)
    component_type = Column(Enum(KernelComponentType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(Integer, nullable=True, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# Blue Ocean – ERRC (Eliminar, Reducir, Incrementar, Crear)
# ──────────────────────────────────────────────
class BlueOceanActionType(str, enum.Enum):
    ELIMINATE = "eliminate"
    REDUCE = "reduce"
    RAISE = "raise"
    CREATE = "create"


class BlueOceanAction(Base):
    __tablename__ = "blue_ocean_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(Enum(BlueOceanActionType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    factor = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    current_level = Column(Integer, nullable=True, default=3)
    target_level = Column(Integer, nullable=True, default=3)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# VRIO – Evaluacion de recursos (Sprint 6)
# Valioso, Raro, Inimitable, Organizado
# ──────────────────────────────────────────────
class VRIOResource(Base):
    __tablename__ = "vrio_resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    valuable = Column(Boolean, default=False)       # V - Valioso?
    rare = Column(Boolean, default=False)            # R - Raro?
    inimitable = Column(Boolean, default=False)      # I - Inimitable?
    organized = Column(Boolean, default=False)       # O - Organizado?
    competitive_implication = Column(String, nullable=True)  # Resultado VRIO
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# McKinsey 7S – Alineacion institucional (Sprint 6)
# ──────────────────────────────────────────────
class McKinsey7SElementType(str, enum.Enum):
    STRATEGY = "strategy"          # Estrategia
    STRUCTURE = "structure"        # Estructura
    SYSTEMS = "systems"            # Sistemas
    SHARED_VALUES = "shared_values"  # Valores compartidos
    STYLE = "style"                # Estilo
    STAFF = "staff"                # Personal
    SKILLS = "skills"              # Habilidades


class McKinsey7SElement(Base):
    __tablename__ = "mckinsey_7s_elements"

    id = Column(Integer, primary_key=True, index=True)
    element_type = Column(Enum(McKinsey7SElementType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    description = Column(Text, nullable=False)
    alignment_score = Column(Integer, nullable=True, default=3)  # 1-5
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# BCG Matrix – Portafolio estrategico (Sprint 6)
# ──────────────────────────────────────────────
class BCGQuadrant(str, enum.Enum):
    STAR = "star"               # Estrella: alto crecimiento, alta participacion
    CASH_COW = "cash_cow"       # Vaca lechera: bajo crecimiento, alta participacion
    QUESTION = "question_mark"  # Interrogacion: alto crecimiento, baja participacion
    DOG = "dog"                 # Perro: bajo crecimiento, baja participacion


class BCGUnit(Base):
    __tablename__ = "bcg_units"

    id = Column(Integer, primary_key=True, index=True)
    unit_name = Column(String, nullable=False)       # Nombre del producto/servicio/unidad
    quadrant = Column(Enum(BCGQuadrant, values_callable=lambda x: [e.value for e in x]), nullable=False)
    market_growth = Column(Integer, nullable=True, default=3)      # 1-5
    market_share = Column(Integer, nullable=True, default=3)       # 1-5
    description = Column(Text, nullable=True)
    strategic_recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# IA_Log_Propuestas_OODA – Fricción Intencional (US-2.3)
#
# REGLA CRÍTICA: Toda sugerencia de IA se registra aquí
# en estado "borrador". NADA se persiste en las tablas
# operativas hasta que un humano haga clic en "Aprobar".
# ──────────────────────────────────────────────
class IALogPropuestaOODA(Base):
    __tablename__ = "ia_log_propuestas_ooda"

    id = Column(Integer, primary_key=True, index=True)

    # Qué fase OODA generó esto
    ooda_phase = Column(String, nullable=False)         # observe, orient, decide, act

    # Tipo de entidad que la IA propone crear/modificar
    target_entity = Column(String, nullable=False)      # "foda_item", "pestel_factor", etc.

    # El contenido propuesto por la IA (JSON serializado)
    proposed_payload = Column(Text, nullable=False)

    # Razonamiento de la IA (Chain of Thought)
    ai_reasoning = Column(Text, nullable=True)

    # Estado del ciclo de vida HITL
    status = Column(Enum(IAProposalStatus), nullable=False, default=IAProposalStatus.BORRADOR)

    # Quién revisó y cuándo
    reviewed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Auditoría
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)


# ──────────────────────────────────────────────
# HOSHIN KANRI (Sprint 9) - Despliegue Estrategico
# Cascadeo de objetivos estrategicos a tacticos
# con responsables, metas y seguimiento.
# ──────────────────────────────────────────────
class HoshinStatusEnum(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    COMPLETADO = "completado"


class HoshinItem(Base):
    __tablename__ = "hoshin_items"

    id = Column(Integer, primary_key=True, index=True)

    # Vinculo al objetivo estrategico padre
    objetivo_estrategico_id = Column(Integer, ForeignKey("objetivos_estrategicos.id"), nullable=True)
    objetivo_estrategico_desc = Column(Text, nullable=False)

    perspectiva = Column(String, nullable=False)  # financiera, clientes, procesos, aprendizaje

    # Objetivo tactico (cascadeo)
    objetivo_tactico = Column(Text, nullable=False)
    responsable = Column(String(200), nullable=False)
    meta_corto_plazo = Column(String(300), nullable=True)

    estado = Column(Enum(HoshinStatusEnum, values_callable=lambda x: [e.value for e in x]), nullable=False, default=HoshinStatusEnum.PENDIENTE)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("planes_estrategicos.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ──────────────────────────────────────────────
# AI TELEMETRY (Phase 3 Governance)
# Registro de cada llamada LLM para auditoria,
# presupuesto y control de calidad.
# ──────────────────────────────────────────────
class AITelemetryStatus(str, enum.Enum):
    SUCCESS = "success"
    ERROR = "error"
    FALLBACK = "fallback"
    BUDGET_EXCEEDED = "budget_exceeded"
    VALIDATION_FAILED = "validation_failed"


class AITelemetry(Base):
    __tablename__ = "ai_telemetry"

    id = Column(Integer, primary_key=True, index=True)

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    provider = Column(String(20), nullable=False)           # gemini, openai, anthropic, none
    model_name = Column(String(50), nullable=False)         # gemini-2.0-flash, gpt-4o-mini, etc.
    endpoint_name = Column(String(60), nullable=False)      # analizar-pestel, generar-identidad, etc.

    prompt_tokens = Column(Integer, nullable=False, default=0)
    completion_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)

    latency_ms = Column(Integer, nullable=False, default=0)

    status = Column(Enum(AITelemetryStatus), nullable=False)
    error_message = Column(Text, nullable=True)

    # Costo estimado en USD (tokens * rate)
    estimated_cost_usd = Column(Numeric(10, 6), nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
