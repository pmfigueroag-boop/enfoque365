"""
Endpoints de gestion de usuarios y asignacion de roles (US-1.2).
Incluye autenticacion JWT via POST /login.
Protegido por RLS: solo un ADMIN del mismo tenant puede crear usuarios o cambiar roles.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, RoleEnum
from app.schemas.user import UserCreate, UserResponse, UserRoleUpdate
from app.core.security import (
    get_current_tenant_id, require_role, get_current_user,
    hash_password, verify_password, create_access_token,
)

router = APIRouter()


@router.post("/login")
def login(
    data: dict = Body(...),
    db: Session = Depends(get_db),
):
    """
    Autentica un usuario y retorna un JWT access token.
    Body: { "email": "...", "password": "...", "tenant_id": 1 }
    """
    email = data.get("email", "")
    password = data.get("password", "")
    tenant_id = data.get("tenant_id")

    if not email or not password or not tenant_id:
        raise HTTPException(status_code=400, detail="email, password y tenant_id son requeridos")

    user = db.query(User).filter(
        User.email == email,
        User.tenant_id == tenant_id,
        User.is_active == True,
    ).first()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales invalidas")

    token = create_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        role=user.role.value,
        email=user.email,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "tenant_id": user.tenant_id,
        },
    }


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    tenant_id: int = Depends(get_current_tenant_id),
    admin: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    """Crea un usuario dentro del tenant del administrador autenticado."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado.")

    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        tenant_id=tenant_id,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    tenant_id: int = Depends(get_current_tenant_id),
    admin: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Actualiza el rol de un usuario. Solo un ADMIN del mismo tenant puede hacerlo.
    Aplica RLS: filtra por tenant_id para evitar escalar privilegios entre instituciones.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado en este tenant.")

    user.role = role_update.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=list[UserResponse])
def list_users(
    tenant_id: int = Depends(get_current_tenant_id),
    admin: User = Depends(require_role(RoleEnum.ADMIN)),
    db: Session = Depends(get_db),
):
    """Lista todos los usuarios del tenant actual. Solo para ADMIN."""
    return db.query(User).filter(User.tenant_id == tenant_id).all()


@router.get("/me")
def get_current_user_info(
    user: User = Depends(get_current_user),
):
    """Retorna info del usuario autenticado."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "tenant_id": user.tenant_id,
    }
