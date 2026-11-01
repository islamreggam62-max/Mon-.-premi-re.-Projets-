"""Couche IA specialisee (analyse approfondie, redaction) — fondee sur le LLM.

Confidentialite : ces operations n'appellent le LLM externe que si la couche est
activee (NAFTAL_LLM_ENABLED=1). Sinon, elles renvoient proprement un repli
deterministe/indisponible, sans transmettre aucun texte a l'exterieur.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..analysis import ai_pipeline
from ..db import get_session
from ..llm import llm_status
from ..models import Document, User
from ..security import get_current_user, log_action, require_writer
from ..service import build_retriever, client_ip

router = APIRouter(prefix="/api/ai", tags=["ai"])


class DeepAnalysisIn(BaseModel):
    document_id: int
    use_corpus: bool = True
    self_verify: bool = True


class AmendmentIn(BaseModel):
    document_id: int
    base_document_id: int | None = None


class MemoIn(BaseModel):
    question: str
    use_corpus: bool = True


class RewriteIn(BaseModel):
    clause_text: str
    objective: str = ""


def _doc(db: Session, doc_id: int) -> Document:
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    if not (d.extracted_text or "").strip():
        raise HTTPException(status_code=422, detail="Document sans texte exploitable.")
    return d


@router.get("/status")
def ai_status(_: User = Depends(get_current_user)):
    s = llm_status()
    s["specialise"] = True
    s["capacites"] = ["analyse_approfondie", "correction_avenant", "memorandum", "reecriture_clause"]
    return s


@router.post("/analyze")
def deep_analyze(
    data: DeepAnalysisIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    doc = _doc(db, data.document_id)
    retriever = build_retriever(db, exclude_document_id=doc.id) if data.use_corpus else None
    result = ai_pipeline.deep_analysis(
        doc.extracted_text, retriever=retriever, self_verify=data.self_verify
    )
    log_action(db, user, "analyse_ia", f"doc {doc.id} ok={result.get('ok')}", client_ip(request))
    return result


@router.post("/amendment")
def correct_amendment(
    data: AmendmentIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    doc = _doc(db, data.document_id)
    base = None
    if data.base_document_id:
        base = _doc(db, data.base_document_id).extracted_text
    result = ai_pipeline.amendment_correction(doc.extracted_text, base)
    log_action(db, user, "correction_avenant_ia", f"doc {doc.id}", client_ip(request))
    return result


@router.post("/memo")
def memo(
    data: MemoIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    if not data.question.strip():
        raise HTTPException(status_code=422, detail="Question vide.")
    retriever = build_retriever(db) if data.use_corpus else None
    result = ai_pipeline.legal_memo(data.question, retriever=retriever)
    log_action(db, user, "memorandum_ia", data.question[:80], client_ip(request))
    return result


@router.post("/rewrite")
def rewrite(
    data: RewriteIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    if not data.clause_text.strip():
        raise HTTPException(status_code=422, detail="Clause vide.")
    result = ai_pipeline.clause_rewrite(data.clause_text, data.objective)
    log_action(db, user, "reecriture_ia", "", client_ip(request))
    return result
