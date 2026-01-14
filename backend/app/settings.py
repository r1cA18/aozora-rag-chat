"""Application settings loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Exa API
    exa_api_key: str = ""

    # ChromaDB
    chroma_persist_dir: str = "../chroma"
    chroma_collection: str = "aozora_chunks_v1"

    # Search Settings
    search_timeout_ms: int = 8000
    exa_cache_ttl_days: int = 7

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    @property
    def chroma_path(self) -> Path:
        """Get absolute path to ChromaDB directory."""
        return Path(self.chroma_persist_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
