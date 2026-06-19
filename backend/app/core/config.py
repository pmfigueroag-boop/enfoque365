from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ENFOQUE 365"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql://enfoque_user:enfoque_password@localhost:5434/enfoque365"

    # JWT Auth
    JWT_SECRET_KEY: str = "enfoque365-dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas

    # LLM Providers (al menos una key para activar IA real)
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    LLM_DEFAULT_PROVIDER: str = "gemini"  # gemini | openai | anthropic

    class Config:
        env_file = ".env"

settings = Settings()
