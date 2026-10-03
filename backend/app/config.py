"""Environment-driven settings (12-factor style)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CTK_", env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://ctk:ctk-local-only@localhost:5432/ctk"
    jwt_secret: str = "ctk-local-development-secret-change-before-production"
    jwt_algorithm: str = "HS256"
    session_hours: int = 24 * 7
    session_cookie: str = "ctk_session"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
