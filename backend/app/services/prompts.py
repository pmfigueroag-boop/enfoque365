"""
Prompts estrategicos para el Agente Analitico IA.

Cada funcion genera un prompt contextualizado con:
- Datos del tenant (nombre, tipo, pais, sector CIIU)
- Identidad PEI (mision, vision, valores del plan activo)
- Documentos institucionales extraidos (RAG context)

El campo doc_context inyecta el texto de los documentos cargados
(leyes, planes, informes, etc.) para que el LLM genere sugerencias
basadas en evidencia documental real, no solo en inferencia generica.
"""


def _doc_section(doc_context: str) -> str:
    """Construye la seccion de documentos para el prompt. Si no hay docs, retorna string vacio."""
    if not doc_context:
        return ""
    return f"""
DOCUMENTOS INSTITUCIONALES (usa este contenido como evidencia para tus respuestas):
{doc_context}
"""


def _identidad_section(mision: str = "", vision: str = "", valores: list[str] | None = None) -> str:
    """Construye la seccion de identidad PEI (mision/vision/valores) para el prompt."""
    lines = []
    if mision:
        lines.append(f"- Mision: {mision}")
    if vision:
        lines.append(f"- Vision: {vision}")
    if valores:
        lines.append(f"- Valores institucionales: {', '.join(valores)}")
    if not lines:
        return ""
    return "\n" + "\n".join(lines)


def build_pestel_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    """DEPRECATED: Use build_pestel_dimension_prompt instead."""
    return build_pestel_dimension_prompt(
        dimension="politico", nombre=nombre, tipo=tipo, pais=pais,
        ciiu_seccion=ciiu_seccion, ciiu_division=ciiu_division,
        ciiu_grupo=ciiu_grupo, ciiu_clase=ciiu_clase,
        mision=mision, vision=vision, valores=valores,
        doc_context=doc_context,
    )


# ── Definiciones de cada dimension PESTEL ──
PESTEL_DIMENSIONS = {
    "politico": {
        "label": "Político",
        "scope": "gobierno, politicas publicas, estabilidad politica, regulaciones gubernamentales, relaciones internacionales, elecciones, geopolitica, subsidios y aranceles",
        "example_desc": "Se preve la aprobacion de una nueva reforma tributaria que incrementara los costos operativos.",
        "example_rationale": "El proyecto de ley ya paso la primera lectura en el congreso y tiene respaldo del ejecutivo.",
    },
    "economico": {
        "label": "Económico",
        "scope": "inflacion, tasas de interes, PIB, desempleo, tipo de cambio, costos de insumos, acceso a financiamiento, poder adquisitivo, ciclos economicos",
        "example_desc": "Presion inflacionaria que erosiona el presupuesto operativo del sector.",
        "example_rationale": "Tendencia macroeconomica persistente con inflacion interanual superior al 5 por ciento.",
    },
    "social": {
        "label": "Social",
        "scope": "demografia, educacion, cultura, salud publica, expectativas ciudadanas, tendencias de consumo, migracion, envejecimiento poblacional, desigualdad",
        "example_desc": "Crecimiento de la demanda de servicios digitales por parte de los usuarios.",
        "example_rationale": "Tendencia acelerada post-pandemia con adopcion digital creciendo 30 por ciento anual.",
    },
    "tecnologico": {
        "label": "Tecnológico",
        "scope": "innovacion, digitalizacion, automatizacion, ciberseguridad, inteligencia artificial, infraestructura tecnologica, I+D, adopcion de nuevas tecnologias",
        "example_desc": "Adopcion de inteligencia artificial para automatizacion de procesos internos.",
        "example_rationale": "Competidores directos ya implementando soluciones IA con ROI demostrado.",
    },
    "ecologico": {
        "label": "Ecológico",
        "scope": "cambio climatico, sostenibilidad, residuos, energias renovables, regulacion ambiental, huella de carbono, economia circular, biodiversidad",
        "example_desc": "Presion regulatoria hacia la sostenibilidad y economia circular.",
        "example_rationale": "Marco normativo ambiental en desarrollo con plazos de cumplimiento a 2 anos.",
    },
    "legal": {
        "label": "Legal",
        "scope": "leyes, cumplimiento normativo, proteccion de datos, propiedad intelectual, contratos, litigios, compliance, anticorrupcion, regulacion laboral",
        "example_desc": "Nueva ley de proteccion de datos personales que exige adecuacion de sistemas.",
        "example_rationale": "La ley fue promulgada y entra en vigor en 6 meses con sanciones severas.",
    },
}


def build_pestel_dimension_prompt(
    dimension: str,
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    """Prompt enfocado para UNA sola dimension PESTEL. Produce 3 factores."""
    dim = PESTEL_DIMENSIONS[dimension]
    return f"""Eres un consultor senior de estrategia institucional con 20 anos de experiencia.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Genera exactamente 3 factores de la dimension **{dim['label']}** del analisis PESTEL.
Estos factores deben ser relevantes y especificos para esta institucion en este sector y pais.
No generes factores genericos. Si se proveen documentos institucionales, usa su contenido como evidencia.

ALCANCE de la dimension {dim['label']}: {dim['scope']}

Para cada factor incluye:
- "description": descripcion concreta y accionable del factor (maximo 35 palabras)
- "impact_level": nivel de impacto del 1 al 10 (1=insignificante, 5=moderado, 10=critico)
- "probability": probabilidad de ocurrencia del 1 al 10 (1=improbable, 5=posible, 10=casi seguro)
- "ai_rationale": justificacion de la calificacion (maximo 140 caracteres)

REGLAS DE FORMATO:
1. Responde SOLO con una lista YAML valida. Sin explicaciones adicionales.
2. NO uses comillas dobles dentro del texto, usa comillas simples.
3. NO incluyas el campo "category" — ya se asigna automaticamente.

Ejemplo:
```yaml
- description: {dim['example_desc']}
  impact_level: 7
  probability: 8
  ai_rationale: {dim['example_rationale']}
```"""


def build_porter_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia competitiva especializado en analisis sectorial.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Genera exactamente 10 factores de las 5 Fuerzas de Porter (2 por fuerza) relevantes para esta institucion en este sector y pais.
Si es una institucion publica, adapta el modelo: "clientes" son ciudadanos/beneficiarios, "competidores" son otras entidades que ofrecen servicios similares, etc.
Si se proveen documentos institucionales, usa su contenido como evidencia.

IMPORTANTE: Debes evaluar los factores basandote estrictamente en los subfactores teoricos del marco de Porter para garantizar rigor:
- rivalidad: Crecimiento de la industria, Costos fijos, Diferenciacion de producto, Costos de cambio, Concentracion, Barreras de salida.
- nuevos_entrantes: Economias de escala, Requisitos de capital, Acceso a canales de distribucion, Politica gubernamental, Represalias esperadas.
- sustitutos: Desempeno relativo de precio/valor de sustitutos, Costos de cambio hacia el sustituto, Propension del comprador.
- poder_proveedores: Concentracion de proveedores, Volumen de compra, Diferenciacion de insumos, Costos de cambio de proveedor, Amenaza de integracion hacia adelante.
- poder_clientes: Concentracion de clientes, Volumen de clientes, Sensibilidad al precio, Costos de cambio del cliente, Amenaza de integracion hacia atras.

Para cada factor incluye:
- "force_type": una de ["rivalidad", "nuevos_entrantes", "sustitutos", "poder_proveedores", "poder_clientes"]
- "canonical_subfactor": el subfactor teorico al que hace referencia (ej. "Economias de escala", "Concentracion de proveedores")
- "description": descripcion concreta y especifica al sector (maximo 120 caracteres)
- "intensity": nivel de intensidad de la fuerza del 1 al 5 (1=baja presion, 5=muy alta presion)
- "probability": probabilidad de que este factor afecte a la institucion del 1 al 5 (1=improbable, 3=posible, 5=casi seguro)
- "ai_rationale": justificacion breve de la calificacion (maximo 140 caracteres)

Responde SOLO con un array JSON valido. Sin explicaciones adicionales. Ejemplo:
[
  {{"force_type": "nuevos_entrantes", "canonical_subfactor": "Economias de escala", "description": "Alta barrera de entrada por volumen requerido...", "intensity": 4, "probability": 3, "ai_rationale": "El sector exige inversion inicial elevada que desincentiva nuevos competidores."}},
  ...
]"""


def build_foda_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    pestel_summary: str, porter_summary: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia institucional.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}

DIAGNOSTICO PREVIO:
Factores PESTEL identificados: {pestel_summary}
Fuerzas Porter identificadas: {porter_summary}
{_doc_section(doc_context)}
TAREA: Basandote en el diagnostico previo y en los documentos institucionales (si existen), genera exactamente 12 elementos FODA (3 por cuadrante):
- Fortalezas y Debilidades: derivadas del analisis interno implicito del sector y de los documentos
- Oportunidades y Amenazas: derivadas directamente del PESTEL, Porter y contexto documental

Para cada elemento incluye:
- "quadrant": una de ["fortaleza", "oportunidad", "debilidad", "amenaza"]
- "description": descripcion concreta (maximo 120 caracteres)
- "priority": prioridad del 1 al 5 (1=baja, 5=critica)

Responde SOLO con un array JSON valido.
[
  {{"quadrant": "fortaleza", "description": "Capacidad de...", "priority": 4}},
  ...
]"""


def build_vrio_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia con experiencia en analisis de recursos y capacidades.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Identifica exactamente 6 recursos o capacidades reales y especificos de esta institucion segun su tipo y sector.
Para cada recurso, evalua los 4 criterios VRIO (Valioso, Raro, Inimitable, Organizado) con verdadero o falso.
No uses recursos genericos. Refleja la realidad del sector y pais indicados.
Si se proveen documentos institucionales, usa su contenido como evidencia.

Para cada recurso incluye:
- "resource_name": nombre concreto del recurso o capacidad (maximo 80 caracteres)
- "valuable": true o false
- "rare": true o false
- "inimitable": true o false
- "organized": true o false

Responde SOLO con un array JSON valido.
[
  {{"resource_name": "Red de distribucion propia en...", "valuable": true, "rare": true, "inimitable": false, "organized": true}},
  ...
]"""


def build_mckinsey7s_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior especializado en diagnostico organizacional con el modelo McKinsey 7S.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Genera exactamente 7 elementos, uno por cada S del modelo McKinsey 7S.

El modelo distingue entre:
- Hard S (mas faciles de cambiar): Strategy, Structure, Systems
- Soft S (mas dificiles pero mas impactantes): Shared Values, Skills, Staff, Style

REGLAS DE CALIFICACION CRITICAS:
1. Los scores DEBEN reflejar diferencias reales. Al menos 1 elemento debe tener score <= 2 y al menos 1 debe tener score >= 4. NO asignes 3 a todos.
2. El campo "observations" es OBLIGATORIO y debe analizar la alineacion de este elemento con al menos otro elemento. Ejemplo: "Desalineada con Structure: la estrategia requiere agilidad pero la estructura es rigidamente jerarquica."
3. Si se proveen documentos institucionales, usa su contenido como evidencia en las observations.
Adapta la evaluacion al tipo de institucion (publica, privada, ONG, etc.) y al sector.

Para cada elemento incluye:
- "element_type": una de ["strategy", "structure", "systems", "shared_values", "skills", "staff", "style"]
- "description": evaluacion concreta del estado actual (maximo 150 caracteres)
- "alignment_score": puntuacion de alineacion del 1 al 5 (1=muy desalineado, 5=optimo). Recuerda: minimo un <=2 y un >=4.
- "observations": analisis de alineacion cruzada con otros elementos (maximo 200 caracteres). Menciona explicitamente que otro elemento esta alineado o desalineado.

Responde SOLO con un array JSON valido.
[
  {{"element_type": "strategy", "description": "Estrategia de expansion centrada en...", "alignment_score": 4, "observations": "Bien alineada con Skills: el equipo tiene las competencias que la estrategia exige. Tension con Systems: los procesos no soportan la velocidad requerida."}},
  ...
]"""


def build_bcg_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia de portafolio con experiencia en la matriz BCG.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Identifica entre 4 y 6 unidades de negocio, productos o servicios de esta institucion y clasifikalos en la matriz BCG.
Si es una institucion publica, trata programas o servicios como unidades de analisis.
Evalua el crecimiento de mercado y la participacion relativa de cada unidad.
Si se proveen documentos institucionales, usa su contenido como evidencia.

Para cada unidad incluye:
- "unit_name": nombre del producto, servicio o unidad (maximo 80 caracteres)
- "quadrant": una de ["star", "cash_cow", "question_mark", "dog"]
- "market_growth": nivel de crecimiento del mercado del 1 al 5 (1=bajo, 5=muy alto)
- "market_share": participacion relativa del 1 al 5 (1=baja, 5=dominante)
- "description": descripcion breve de la unidad y su posicion competitiva (maximo 150 caracteres)
- "strategic_recommendation": recomendacion estrategica concreta para esta unidad (maximo 150 caracteres)

Responde SOLO con un array JSON valido.
[
  {{"unit_name": "Servicio de consultoria digital", "quadrant": "star", "market_growth": 5, "market_share": 4, "description": "Servicio en mercado de alto crecimiento donde somos lideres en innovacion.", "strategic_recommendation": "Invertir agresivamente para consolidar liderazgo antes de que la competencia reaccione."}},
  ...
]"""


def build_tows_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    foda_summary: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia especializado en la formulacion de estrategias cruzadas TOWS.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}

DIAGNOSTICO FODA EXISTENTE:
{foda_summary}
{_doc_section(doc_context)}
TAREA: Basandote en el FODA existente, genera estrategias cruzadas TOWS.
Prioriza la CALIDAD y la COHERENCIA LOGICA sobre la cantidad. Genera entre 4 y 8 estrategias de alto impacto.
NO FUERCES cruces que carezcan de causalidad real. Si una debilidad no tiene relacion con una oportunidad, no inventes una estrategia DO.

Tipos de cruces posibles:
- FO: Fortalezas + Oportunidades (Ofensivas)
- FA: Fortalezas + Amenazas (Defensivas)
- DO: Debilidades + Oportunidades (Reorientacion)
- DA: Debilidades + Amenazas (Supervivencia)

Para cada estrategia identifica explicitamente los IDs de los elementos FODA cruzados y justifica la causalidad.
- "quadrant": una de ["FO", "FA", "DO", "DA"]
- "description": descripcion concreta y accionable de la estrategia (maximo 150 caracteres)
- "ai_rationale": justificacion logica de por que estos factores tienen una causalidad real (maximo 150 caracteres)
- "strength_id": ID numerico de la fortaleza usada (o null)
- "weakness_id": ID numerico de la debilidad usada (o null)
- "opportunity_id": ID numerico de la oportunidad usada (o null)
- "threat_id": ID numerico de la amenaza usada (o null)

Responde SOLO con un array JSON valido.
[
  {{"quadrant": "FO", "description": "Aprovechar la...", "ai_rationale": "La fortaleza X complementa directamente la oportunidad Y...", "strength_id": 12, "weakness_id": null, "opportunity_id": 15, "threat_id": null}},
  ...
]"""


def build_p2w_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia especializado en el framework Playing to Win de A.G. Lafley y Roger Martin.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Genera exactamente 5 elecciones estrategicas, una por cada nivel de la cascada Playing to Win.
Adapta las elecciones al tipo de institucion y sector. Si es publica, "ganar" significa cumplir la mision con impacto medible.
Si se proveen documentos institucionales, usa su contenido como evidencia.

Para cada eleccion incluye:
- "choice_type": una de ["winning_aspiration", "where_to_play", "how_to_win", "core_capabilities", "management_systems"]
- "description": descripcion concreta de la eleccion (maximo 150 caracteres)
- "rationale": justificacion breve de por que esta eleccion es adecuada (maximo 150 caracteres)

Responde SOLO con un array JSON valido.
[
  {{"choice_type": "winning_aspiration", "description": "Ser lider en...", "rationale": "El mercado de..."}},
  ...
]"""


def build_kernel_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia especializado en el modelo Good Strategy/Bad Strategy de Richard Rumelt.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Genera los 3 componentes del Kernel Estrategico de Rumelt para esta institucion.
- Diagnostico: identifica el desafio critico real que enfrenta la institucion
- Politica guia: define el enfoque general para abordar el desafio
- Acciones coherentes: describe las acciones coordinadas que implementan la politica
Si se proveen documentos institucionales, usa su contenido como evidencia.

Para cada componente incluye:
- "component_type": una de ["diagnosis", "guiding_policy", "coherent_actions"]
- "description": descripcion concreta y especifica (maximo 200 caracteres)

Responde SOLO con un array JSON valido.
[
  {{"component_type": "diagnosis", "description": "El principal desafio es..."}},
  ...
]"""


def build_blue_ocean_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    mision: str = "", vision: str = "", valores: list[str] | None = None,
    doc_context: str = "",
) -> str:
    return f"""Eres un consultor senior de estrategia especializado en Blue Ocean Strategy y el marco ERRC (Eliminar, Reducir, Incrementar, Crear).

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}{_identidad_section(mision, vision, valores)}
{_doc_section(doc_context)}
TAREA: Genera al menos 8 acciones distribuidas en los 4 cuadrantes ERRC (minimo 2 por cuadrante).
Identifica factores competitivos reales del sector y propone acciones concretas para cada cuadrante.
Si es una institucion publica, adapta los factores al contexto de servicios publicos.
Si se proveen documentos institucionales, usa su contenido como evidencia.

Para cada accion incluye:
- "action_type": una de ["eliminate", "reduce", "raise", "create"]
- "factor": nombre del factor competitivo (maximo 60 caracteres)
- "description": descripcion de la accion propuesta (maximo 150 caracteres)

Responde SOLO con un array JSON valido.
[
]"""

def build_key_results_prompt(
    nombre: str, tipo: str, pais: str,
    ciiu_seccion: str, ciiu_division: str,
    ciiu_grupo: str, ciiu_clase: str,
    objetivos_json: str,
) -> str:
    return f"""Eres un consultor experto en Planificacion Estrategica y la metodologia OKR (Objectives and Key Results) de John Doerr.

CONTEXTO DE LA INSTITUCION:
- Nombre: {nombre}
- Tipo: {tipo}
- Pais: {pais}
- Sector CIIU Rev.4: Seccion {ciiu_seccion}, Division {ciiu_division}, Grupo {ciiu_grupo}, Clase {ciiu_clase}

OBJETIVOS ESTRATEGICOS APROBADOS:
{objetivos_json}

TAREA: Para CADA UNO de los objetivos estrategicos listados, genera 2 o 3 Resultados Clave (Key Results) que cumplan con los estandares de la metodologia OKR.
Los Key Results DEBEN ser medibles, numericos, y tener un target value concreto.
Utiliza unidades de medida como "porcentaje", "cantidad", "indice", "monto", "dias" u "horas".

Para cada Key Result incluye exactamente las siguientes propiedades:
- "objetivo_id": el ID del objetivo al que pertenece
- "title": titulo del resultado clave (ej. "Aumentar la tasa de retencion de clientes") (maximo 120 caracteres)
- "target_value": un numero que represente la meta a alcanzar (ej. 95)
- "unit": unidad de medida (ej. "porcentaje", "cantidad", "monto")

Responde SOLO con un array JSON valido. Sin markdown adicional, sin explicaciones.
Ejemplo:
[
  {{"objetivo_id": 1, "title": "Incrementar las ventas online", "target_value": 50, "unit": "porcentaje"}},
  ...
]"""
