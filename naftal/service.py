"""Services partages : televersement, persistance des analyses."""
from __future__ import annotations

import json
import re
import uuid
from dataclasses import asdict
from pathlib import Path

from sqlalchemy.orm import Session

from .analysis import analyze_text
from .config import get_settings
from .extraction import extract_text
from .models import Analysis, Document, Finding, User


def safe_stored_name(original: str) -> str:
    suffix = Path(original).suffix.lower()
    return f"{uuid.uuid4().hex}{suffix}"


def store_upload(content: bytes, original_filename: str) -> Path:
    settings = get_settings()
    stored = settings.upload_dir / safe_stored_name(original_filename)
    stored.write_bytes(content)
    return stored


def ingest_document(
    db: Session,
    content: bytes,
    original_filename: str,
    user: User | None,
    contract_id: int | None = None,
    version_label: str = "",
) -> Document:
    """Stocke le fichier, extrait le texte et cree l'enregistrement Document."""
    stored = store_upload(content, original_filename)
    result = extract_text(stored)
    doc = Document(
        contract_id=contract_id,
        filename=original_filename,
        stored_path=str(stored),
        mime_type=result.mime_type,
        size_bytes=len(content),
        sha256=result.sha256,
        page_count=result.page_count,
        char_count=result.char_count,
        extracted_text=result.text,
        extraction_ok=result.ok,
        extraction_note=result.note,
        version_label=version_label,
        uploaded_by=user.id if user else None,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def run_and_store_analysis(db: Session, doc: Document, user: User | None) -> Analysis:
    """Lance l'analyse deterministe et la persiste (avec ses constats)."""
    output = analyze_text(doc.extracted_text or "")
    analysis = Analysis(
        document_id=doc.id,
        engine_version="naftal-rules-1",
        used_llm=output.used_llm,
        summary=output.summary,
        structure_json=json.dumps(output.structure, ensure_ascii=False),
        parties_json=json.dumps(output.parties, ensure_ascii=False),
        risk_score=output.risk_score,
        counts_json=json.dumps(output.counts, ensure_ascii=False),
        created_by=user.id if user else None,
    )
    db.add(analysis)
    db.flush()
    for f in output.findings:
        db.add(Finding(analysis_id=analysis.id, **f))
    db.commit()
    db.refresh(analysis)
    return analysis


def analysis_to_dict(db: Session, analysis: Analysis) -> dict:
    findings = [
        {
            "category": f.category, "article_ref": f.article_ref, "excerpt": f.excerpt,
            "problem": f.problem, "legal_significance": f.legal_significance,
            "commercial_consequence": f.commercial_consequence, "severity": f.severity,
            "recommendation": f.recommendation, "proposed_wording": f.proposed_wording,
            "present": f.present, "source": f.source,
        }
        for f in analysis.findings
    ]
    return {
        "id": analysis.id,
        "document_id": analysis.document_id,
        "engine_version": analysis.engine_version,
        "used_llm": analysis.used_llm,
        "summary": analysis.summary,
        "structure": json.loads(analysis.structure_json or "[]"),
        "parties": json.loads(analysis.parties_json or "[]"),
        "counts": json.loads(analysis.counts_json or "{}"),
        "risk_score": analysis.risk_score,
        "findings": findings,
        "created_at": analysis.created_at.isoformat(),
    }


def build_retriever(db: Session, exclude_document_id: int | None = None):
    """Construit un retriever RAG a partir du corpus (documents + references)."""
    from sqlalchemy import select

    from .analysis.retrieval import build_corpus_retriever
    from .models import Contract, Document, LegalReference

    docs = []
    for d in db.scalars(select(Document)):
        if exclude_document_id is not None and d.id == exclude_document_id:
            continue
        if not (d.extracted_text or "").strip():
            continue
        label = d.filename
        if d.contract_id:
            c = db.get(Contract, d.contract_id)
            if c:
                label = f"{c.title}"
        if d.version_label:
            label = f"{label} ({d.version_label})"
        docs.append({"label": label, "text": d.extracted_text})

    refs = []
    for r in db.scalars(select(LegalReference)):
        txt = " — ".join(x for x in (r.number, r.title, r.article, r.note) if x)
        refs.append({"label": f"{r.number or r.title}", "text": txt})
    return build_corpus_retriever(docs, refs)


def client_ip(request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else ""


_SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+$")


def is_safe_filename(name: str) -> bool:
    return bool(_SAFE_NAME.match(name)) and ".." not in name
