from fastapi import APIRouter
from app.api.endpoints import tenant, users, pei, diagnostico, onboarding, wargaming, documents, planes

api_router = APIRouter()
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(tenant.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(pei.router, prefix="/pei", tags=["pei"])
api_router.include_router(diagnostico.router, prefix="/diagnostico", tags=["diagnostico"])
api_router.include_router(wargaming.router, prefix="/wargaming", tags=["wargaming"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(planes.router, prefix="/planes", tags=["planes"])
