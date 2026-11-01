"""Parametres et informations systeme (sans secret)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from .. import __version__, ENGINE_VERSION
from ..config import get_settings
from ..llm import llm_status
from ..llm.embeddings import embeddings_status
from ..models import User
from ..security import get_current_user

router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/settings")
def settings_info(_: User = Depends(get_current_user)):
    s = get_settings()
    return {
        "version": __version__,
        "engine_version": ENGINE_VERSION,
        "database": "sqlite" if s.database_url.startswith("sqlite") else "postgresql",
        "max_upload_mb": s.max_upload_mb,
        "allowed_extensions": sorted(s.allowed_extensions),
        "llm": llm_status(),
        "embeddings": embeddings_status(),
        "local_only": not (s.llm_enabled or s.embed_enabled),
    }
