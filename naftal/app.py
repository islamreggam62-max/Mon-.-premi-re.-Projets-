"""Fabrique de l'application FastAPI (API + interface web)."""
from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from . import __version__
from .config import get_settings
from .db import create_all, session_scope
from .legal import seed_references
from .routers import (
    ai,
    auth,
    contracts,
    documents,
    intelligence,
    meta,
    reports,
    research,
    search,
)

_STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_all()
    with session_scope() as db:
        seed_references(db)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="NAFTAL LEGAL INTELLIGENCE",
        version=__version__,
        description="Plateforme d'analyse et de gestion des contrats — Direction Juridique.",
        lifespan=lifespan,
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.secret_key,
        session_cookie=settings.session_cookie,
        max_age=settings.session_max_age,
        https_only=settings.https_only,
        same_site="lax",
    )

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok", "version": __version__}

    for module in (auth, contracts, documents, intelligence, ai, search, research, reports, meta):
        app.include_router(module.router)

    # Interface web (fichiers statiques + SPA).
    if _STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")

        @app.get("/")
        def index() -> FileResponse:
            return FileResponse(str(_STATIC_DIR / "index.html"))

    return app


app = create_app()
