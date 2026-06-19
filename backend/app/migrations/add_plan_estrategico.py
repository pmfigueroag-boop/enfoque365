"""
Migracion: Crear tabla planes_estrategicos y backfill datos existentes.

Ejecutar con:
  cd C:\\dev\\enfoque365\\backend
  .\\venv\\Scripts\\activate
  python -m app.migrations.add_plan_estrategico
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from sqlalchemy import text
from app.db.database import engine, SessionLocal


def run_migration():
    db = SessionLocal()
    try:
        # 1. Crear tipo enum plan_estado
        db.execute(text("""
            DO $$ BEGIN
                CREATE TYPE planestado AS ENUM (
                    'formulacion', 'aprobado', 'vigente', 'en_revision', 'cerrado', 'archivado'
                );
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$;
        """))

        # 2. Crear tabla planes_estrategicos
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS planes_estrategicos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR NOT NULL,
                descripcion TEXT,
                fecha_inicio TIMESTAMPTZ,
                fecha_fin TIMESTAMPTZ,
                estado planestado NOT NULL DEFAULT 'formulacion',
                mision TEXT,
                vision TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                aprobado_at TIMESTAMPTZ,
                cerrado_at TIMESTAMPTZ,
                tenant_id INTEGER NOT NULL REFERENCES tenants(id)
            );
        """))

        # 3. Para cada tenant, crear un plan inicial en FORMULACION
        tenants = db.execute(text("SELECT id, name FROM tenants")).fetchall()

        # Verificar si las columnas mision/vision todavia existen en tenants
        col_check = db.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'tenants' AND column_name IN ('mision', 'vision')
        """)).fetchall()
        has_identity_cols = len(col_check) > 0

        for t in tenants:
            existing = db.execute(text(
                "SELECT id FROM planes_estrategicos WHERE tenant_id = :tid"
            ), {"tid": t.id}).fetchone()

            if not existing:
                if has_identity_cols:
                    identity = db.execute(text(
                        "SELECT mision, vision FROM tenants WHERE id = :tid"
                    ), {"tid": t.id}).fetchone()
                    mision = identity.mision if identity else None
                    vision = identity.vision if identity else None
                else:
                    mision = None
                    vision = None

                db.execute(text("""
                    INSERT INTO planes_estrategicos (nombre, estado, mision, vision, tenant_id)
                    VALUES (:nombre, 'FORMULACION', :mision, :vision, :tid)
                """), {
                    "nombre": "Plan Estrategico Inicial",
                    "mision": mision,
                    "vision": vision,
                    "tid": t.id,
                })
                print(f"  Plan creado para tenant '{t.name}' (id={t.id})")

        db.commit()

        # 4. Agregar columna plan_id a todas las tablas
        tables_needing_plan_id = [
            "valores_institucionales",
            "ejes_estrategicos", "objetivos_estrategicos", "indicadores",
            "mediciones_historicas", "key_results", "documents",
            "pestel_factors", "porter_forces", "foda_items",
            "vrio_resources", "mckinsey_7s_elements", "bcg_units",
            "tows_strategies", "p2w_choices", "kernel_components",
            "blue_ocean_actions", "hoshin_items", "ia_log_propuestas_ooda",
        ]

        for tbl in tables_needing_plan_id:
            has_col = db.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = :tbl AND column_name = 'plan_id'
            """), {"tbl": tbl}).fetchone()

            if not has_col:
                db.execute(text(f"""
                    ALTER TABLE {tbl}
                    ADD COLUMN plan_id INTEGER REFERENCES planes_estrategicos(id)
                """))
                print(f"  Columna plan_id agregada a {tbl}")

        db.commit()

        # 5. Backfill: asignar plan_id del plan inicial a todos los registros
        for tbl in tables_needing_plan_id:
            db.execute(text(f"""
                UPDATE {tbl} SET plan_id = (
                    SELECT p.id FROM planes_estrategicos p
                    WHERE p.tenant_id = {tbl}.tenant_id
                    ORDER BY p.created_at ASC
                    LIMIT 1
                )
                WHERE plan_id IS NULL
            """))

        db.commit()
        print("  Backfill completado para todas las tablas")

        # 6. Eliminar mision/vision de tenants (si existen)
        if has_identity_cols:
            try:
                db.execute(text("ALTER TABLE tenants DROP COLUMN IF EXISTS mision"))
                db.execute(text("ALTER TABLE tenants DROP COLUMN IF EXISTS vision"))
                db.commit()
                print("  Columnas mision/vision eliminadas de tenants")
            except Exception as e:
                print(f"  Nota: No se pudieron eliminar columnas de tenants: {e}")
                db.rollback()

        print("\nMigracion completada exitosamente.")

    except Exception as e:
        db.rollback()
        print(f"Error en migracion: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
