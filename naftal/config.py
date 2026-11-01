"""Configuration centrale.

Toutes les valeurs sensibles proviennent de variables d'environnement.
Aucune cle d'API n'est stockee dans le code ni exposee au frontend.
"""
from __future__ import annotations

import os
import secrets
from pathlib import Path


def _env_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "oui", "on"}


class Settings:
    """Parametres de l'application, charges depuis l'environnement."""

    def __init__(self) -> None:
        # --- Repertoires de donnees (tout reste local) ---
        base = os.getenv("NAFTAL_DATA_DIR", str(Path.cwd() / "naftal_data"))
        self.data_dir = Path(base)
        self.upload_dir = self.data_dir / "uploads"
        self.export_dir = self.data_dir / "exports"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.export_dir.mkdir(parents=True, exist_ok=True)

        # --- Base de donnees ---
        default_db = f"sqlite:///{self.data_dir / 'naftal.db'}"
        self.database_url = os.getenv("DATABASE_URL", default_db)

        # --- Securite / sessions ---
        self.secret_key = self._load_or_create_secret()
        self.session_cookie = "naftal_session"
        self.session_max_age = int(os.getenv("NAFTAL_SESSION_MAX_AGE", "28800"))  # 8 h
        self.https_only = _env_bool("NAFTAL_HTTPS_ONLY", False)

        # Compte administrateur initial (cree au premier demarrage s'il est absent).
        self.admin_email = os.getenv("NAFTAL_ADMIN_EMAIL", "admin@naftal.local")
        self.admin_password = os.getenv("NAFTAL_ADMIN_PASSWORD")  # None => genere + affiche

        # --- Televersement ---
        self.max_upload_mb = int(os.getenv("NAFTAL_MAX_UPLOAD_MB", "25"))
        self.allowed_extensions = {".pdf", ".docx", ".txt"}

        # --- Couche LLM (DESACTIVEE par defaut) ---
        # Rien n'est envoye a l'exterieur tant que NAFTAL_LLM_ENABLED n'est pas vrai.
        self.llm_enabled = _env_bool("NAFTAL_LLM_ENABLED", False)
        self.llm_provider = os.getenv("NAFTAL_LLM_PROVIDER", "anthropic")
        self.llm_model = os.getenv("NAFTAL_LLM_MODEL", "")
        self.llm_api_key = os.getenv("NAFTAL_LLM_API_KEY", "")
        self.llm_base_url = os.getenv("NAFTAL_LLM_BASE_URL", "")

    def _load_or_create_secret(self) -> str:
        env_secret = os.getenv("NAFTAL_SECRET_KEY")
        if env_secret:
            return env_secret
        # Persiste une cle generee pour que les sessions survivent aux redemarrages.
        secret_file = self.data_dir / ".secret_key"
        if secret_file.exists():
            return secret_file.read_text().strip()
        token = secrets.token_urlsafe(48)
        secret_file.write_text(token)
        try:
            os.chmod(secret_file, 0o600)
        except OSError:
            pass
        return token

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
