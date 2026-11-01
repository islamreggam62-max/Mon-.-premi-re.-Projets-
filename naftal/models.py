"""Modeles ORM (schema de la base de donnees).

Schema concu pour la tracabilite : chaque document conserve son empreinte
SHA-256, chaque analyse/comparaison est horodatee et rattachee a son auteur,
et un journal d'audit enregistre les actions sensibles.
"""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


# Roles : controle d'acces base sur les roles (RBAC).
ROLE_ADMIN = "admin"
ROLE_JURISTE = "juriste"
ROLE_LECTEUR = "lecteur"
ROLES = {ROLE_ADMIN, ROLE_JURISTE, ROLE_LECTEUR}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default=ROLE_JURISTE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    reference: Mapped[str] = mapped_column(String(120), default="", index=True)
    contract_type: Mapped[str] = mapped_column(String(120), default="", index=True)
    counterparty: Mapped[str] = mapped_column(String(300), default="", index=True)
    department: Mapped[str] = mapped_column(String(120), default="", index=True)
    status: Mapped[str] = mapped_column(String(60), default="actif", index=True)
    effective_date: Mapped[Optional[str]] = mapped_column(String(20), default=None)
    expiry_date: Mapped[Optional[str]] = mapped_column(String(20), default=None, index=True)
    renewal_date: Mapped[Optional[str]] = mapped_column(String(20), default=None, index=True)
    notes: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    documents: Mapped[list["Document"]] = relationship(
        back_populates="contract", cascade="all, delete-orphan"
    )


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    contract_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("contracts.id"), default=None, index=True
    )
    filename: Mapped[str] = mapped_column(String(500))
    stored_path: Mapped[str] = mapped_column(String(1000))
    mime_type: Mapped[str] = mapped_column(String(120), default="")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    char_count: Mapped[int] = mapped_column(Integer, default=0)
    extracted_text: Mapped[str] = mapped_column(Text, default="")
    extraction_ok: Mapped[bool] = mapped_column(Boolean, default=True)
    extraction_note: Mapped[str] = mapped_column(String(500), default="")
    version_label: Mapped[str] = mapped_column(String(120), default="")
    uploaded_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    contract: Mapped[Optional[Contract]] = relationship(back_populates="documents")
    analyses: Mapped[list["Analysis"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
    engine_version: Mapped[str] = mapped_column(String(60), default="")
    used_llm: Mapped[bool] = mapped_column(Boolean, default=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    structure_json: Mapped[str] = mapped_column(Text, default="[]")
    parties_json: Mapped[str] = mapped_column(Text, default="[]")
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    counts_json: Mapped[str] = mapped_column(Text, default="{}")
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)

    document: Mapped[Document] = relationship(back_populates="analyses")
    findings: Mapped[list["Finding"]] = relationship(
        back_populates="analysis", cascade="all, delete-orphan"
    )


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    analysis_id: Mapped[int] = mapped_column(ForeignKey("analyses.id"), index=True)
    category: Mapped[str] = mapped_column(String(120), default="")
    article_ref: Mapped[str] = mapped_column(String(120), default="")
    excerpt: Mapped[str] = mapped_column(Text, default="")
    problem: Mapped[str] = mapped_column(Text, default="")
    legal_significance: Mapped[str] = mapped_column(Text, default="")
    commercial_consequence: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[str] = mapped_column(String(20), default="LOW", index=True)
    recommendation: Mapped[str] = mapped_column(Text, default="")
    proposed_wording: Mapped[str] = mapped_column(Text, default="")
    present: Mapped[bool] = mapped_column(Boolean, default=True)
    source: Mapped[str] = mapped_column(String(20), default="rule")

    analysis: Mapped[Analysis] = relationship(back_populates="findings")


class Comparison(Base):
    __tablename__ = "comparisons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    doc_a_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    doc_b_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    result_json: Mapped[str] = mapped_column(Text, default="{}")
    summary: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class LegalReference(Base):
    __tablename__ = "legal_references"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    number: Mapped[str] = mapped_column(String(120), default="")
    publication_date: Mapped[str] = mapped_column(String(40), default="")
    article: Mapped[str] = mapped_column(String(120), default="")
    source: Mapped[str] = mapped_column(String(300), default="")
    domain: Mapped[str] = mapped_column(String(120), default="", index=True)
    # statut : "verifie" ou "a_verifier"
    status: Mapped[str] = mapped_column(String(20), default="a_verifier", index=True)
    note: Mapped[str] = mapped_column(Text, default="")
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    user_email: Mapped[str] = mapped_column(String(255), default="")
    action: Mapped[str] = mapped_column(String(120), default="", index=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    ip: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=_now, index=True)

    __table_args__ = (UniqueConstraint("id", name="uq_audit_id"),)
