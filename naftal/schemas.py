"""Schemas Pydantic pour les entrees/sorties de l'API."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


# --- Auth ---
class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class UserCreateIn(BaseModel):
    email: str
    full_name: str = ""
    password: str = Field(min_length=8)
    role: str = "juriste"

    @field_validator("email")
    @classmethod
    def _valid_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1] or len(v) < 5:
            raise ValueError("Adresse e-mail invalide.")
        return v


# --- Contrats ---
class ContractIn(BaseModel):
    title: str
    reference: str = ""
    contract_type: str = ""
    counterparty: str = ""
    department: str = ""
    status: str = "actif"
    effective_date: str | None = None
    expiry_date: str | None = None
    renewal_date: str | None = None
    notes: str = ""


class ContractOut(ContractIn):
    id: int
    document_count: int = 0

    class Config:
        from_attributes = True


# --- Recherche juridique ---
class LegalReferenceIn(BaseModel):
    title: str
    number: str = ""
    publication_date: str = ""
    article: str = ""
    source: str = ""
    domain: str = ""
    status: str = "a_verifier"
    note: str = ""


# --- Assistant ---
class AssistantIn(BaseModel):
    question: str
    document_id: int | None = None


# --- Generation de documents ---
class ReportRequest(BaseModel):
    kind: str  # "analysis" | "comparison" | "risk"
    source_id: int
    fmt: str = "docx"  # "docx" | "pdf" | "xlsx"
