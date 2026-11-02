"""Couche base de donnees (SQLAlchemy 2.0)."""
from __future__ import annotations

import atexit
from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_SessionLocal: sessionmaker[Session] | None = None


def _make_engine():
    settings = get_settings()
    url = settings.database_url
    connect_args = {}
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(url, connect_args=connect_args, future=True)


def init_engine():
    global _engine, _SessionLocal
    if _engine is None:
        _engine = _make_engine()
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
        # Ferme les connexions du pool a la sortie du processus (serveur MCP lance et
        # arrete par Claude Desktop, commandes en ligne) : pas de connexion SQLite orpheline.
        atexit.register(_engine.dispose)
    return _engine


def create_all() -> None:
    from . import models  # noqa: F401  (enregistre les tables)

    init_engine()
    Base.metadata.create_all(_engine)


def get_session() -> Iterator[Session]:
    """Dependance FastAPI : fournit une session et la ferme proprement."""
    if _SessionLocal is None:
        init_engine()
    assert _SessionLocal is not None
    session = _SessionLocal()
    try:
        yield session
    finally:
        session.close()


def session_scope() -> Session:
    """Session hors requete HTTP (scripts, tests, amorcage)."""
    if _SessionLocal is None:
        init_engine()
    assert _SessionLocal is not None
    return _SessionLocal()
