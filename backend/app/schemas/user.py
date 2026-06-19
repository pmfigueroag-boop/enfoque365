from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.db.models import RoleEnum


class UserBase(BaseModel):
    email: str
    full_name: str


class UserCreate(UserBase):
    password: str
    role: RoleEnum = RoleEnum.LECTOR


class UserRoleUpdate(BaseModel):
    role: RoleEnum


class UserResponse(UserBase):
    id: int
    role: RoleEnum
    is_active: bool
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True
