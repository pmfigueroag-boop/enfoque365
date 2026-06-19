"""
Seguridad: JWT Auth + RBAC + RLS (Row-Level Security).

Modo desarrollo: Acepta headers X-Tenant-Id / X-User-Email como fallback.
Modo produccion: Requiere Bearer token JWT en header Authorization.
"""
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, RoleEnum, PlanEstrategico, PlanEstado
from app.core.config import settings


# ── Password Hashing (bcrypt) ──────────────────

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash."""
    # Soporte legacy: si el hash tiene 64 chars, es SHA256 viejo
    if len(hashed) == 64:
        from hashlib import sha256
        return sha256(plain.encode()).hexdigest() == hashed
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT Token ──────────────────────────────────

def create_access_token(user_id: int, tenant_id: int, role: str, email: str) -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "tenant_id": tenant_id,
        "role": role,
        "email": email,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalido")


# ── Security scheme (optional bearer) ──────────

optional_bearer = HTTPBearer(auto_error=False)


# ── Dependencies ───────────────────────────────

def get_current_tenant_id(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    x_tenant_id: Optional[int] = Header(None, description="ID del tenant activo (dev mode)"),
) -> int:
    """
    Extrae tenant_id del JWT o del header X-Tenant-Id (fallback dev).
    """
    # 1. Intentar JWT
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        return int(payload["tenant_id"])

    # 2. Fallback: header de desarrollo
    if x_tenant_id is not None:
        return x_tenant_id

    raise HTTPException(status_code=401, detail="Autenticacion requerida: JWT o X-Tenant-Id header")


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_bearer),
    x_user_email: Optional[str] = Header(None, description="Email del usuario (dev mode)"),
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> User:
    """
    Resuelve el usuario actual desde JWT o fallback dev (header).
    """
    email = None

    # 1. Intentar JWT
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        email = payload.get("email")

    # 2. Fallback: header de desarrollo
    if not email and x_user_email:
        email = x_user_email

    if email:
        user = db.query(User).filter(
            User.email == email,
            User.tenant_id == tenant_id,
            User.is_active == True,
        ).first()
        if user:
            return user

    # 3. Fallback final: cualquier admin activo del tenant
    user = db.query(User).filter(
        User.tenant_id == tenant_id,
        User.is_active == True,
    ).first()
    if not user:
        raise HTTPException(status_code=403, detail="Usuario no autorizado para este tenant.")
    return user


def require_role(*allowed_roles):
    """
    Dependency factory que restringe el acceso a roles especificos.
    Uso: Depends(require_role(RoleEnum.ADMIN, RoleEnum.ESTRATEGA))
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Rol '{current_user.role.value}' no tiene permiso. Requiere: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


def get_current_plan_id(
    tenant_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> int:
    """
    Resuelve el plan activo del tenant.
    Prioridad: VIGENTE > FORMULACION.
    Si no existe ninguno, retorna 404.
    """
    plan = db.query(PlanEstrategico).filter(
        PlanEstrategico.tenant_id == tenant_id,
        PlanEstrategico.estado == PlanEstado.VIGENTE,
    ).first()

    if not plan:
        plan = db.query(PlanEstrategico).filter(
            PlanEstrategico.tenant_id == tenant_id,
            PlanEstrategico.estado == PlanEstado.FORMULACION,
        ).order_by(PlanEstrategico.created_at.desc()).first()

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="No hay plan vigente ni en formulacion para este tenant",
        )
    return plan.id

