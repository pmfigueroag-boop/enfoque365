"""
Script de seeding para crear el primer usuario Admin del sistema.
Necesario porque el endpoint POST /users requiere un Admin existente.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from hashlib import sha256
from app.db.database import SessionLocal
from app.db.models import User, RoleEnum

db = SessionLocal()

# Check if admin already exists
existing = db.query(User).filter(User.email == "admin@enfoque365.gob.do").first()
if existing:
    print(f"Admin ya existe: {existing.email} (id={existing.id})")
else:
    admin = User(
        email="admin@enfoque365.gob.do",
        full_name="Administrador del Sistema",
        hashed_password=sha256("admin123".encode()).hexdigest(),
        role=RoleEnum.ADMIN,
        tenant_id=1,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"[OK] Admin creado: {admin.email} (id={admin.id}, role={admin.role.value})")

db.close()
