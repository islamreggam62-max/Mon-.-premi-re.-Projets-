"""Module G : generation et telechargement de rapports."""
from __future__ import annotations

import json
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..analysis import analyze_text, risk_report
from ..config import get_settings
from ..db import get_session
from ..models import Analysis, Comparison, Contract, Document, User
from ..reports import (
    generate_analysis_report,
    generate_comparison_report,
    generate_risk_report,
)
from ..security import get_current_user, log_action, require_writer
from ..service import analysis_to_dict, client_ip, is_safe_filename

router = APIRouter(prefix="/api", tags=["reports"])


class AnalysisReportIn(BaseModel):
    document_id: int
    fmt: str = "docx"


class ComparisonReportIn(BaseModel):
    comparison_id: int
    fmt: str = "docx"


def _doc_meta(db: Session, doc: Document) -> dict:
    meta = {"document": doc.filename}
    if doc.contract_id:
        c = db.get(Contract, doc.contract_id)
        if c:
            meta["contract"] = c.title
            meta["reference"] = c.reference
    return meta


def _download_url(path) -> str:
    return f"/api/reports/download/{path.name}"


@router.post("/reports/analysis")
def report_analysis(
    data: AnalysisReportIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    doc = db.get(Document, data.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    a = db.scalar(select(Analysis).where(Analysis.document_id == doc.id).order_by(desc(Analysis.created_at)).limit(1))
    analysis_dict = analysis_to_dict(db, a) if a else asdict(analyze_text(doc.extracted_text or ""))
    try:
        path = generate_analysis_report(_doc_meta(db, doc), analysis_dict, data.fmt)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    log_action(db, user, "rapport_analyse", f"doc {doc.id} ({data.fmt})", client_ip(request))
    return {"filename": path.name, "url": _download_url(path)}


@router.post("/reports/risk")
def report_risk(
    data: AnalysisReportIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    doc = db.get(Document, data.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    a = db.scalar(select(Analysis).where(Analysis.document_id == doc.id).order_by(desc(Analysis.created_at)).limit(1))
    analysis_dict = analysis_to_dict(db, a) if a else asdict(analyze_text(doc.extracted_text or ""))
    report = risk_report(analysis_dict)
    try:
        path = generate_risk_report(_doc_meta(db, doc), report, data.fmt)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    log_action(db, user, "rapport_risques", f"doc {doc.id} ({data.fmt})", client_ip(request))
    return {"filename": path.name, "url": _download_url(path)}


@router.post("/reports/comparison")
def report_comparison(
    data: ComparisonReportIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    comp = db.get(Comparison, data.comparison_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Comparaison introuvable.")
    comp_dict = json.loads(comp.result_json)
    doc_a = db.get(Document, comp.doc_a_id)
    meta = {"document": f"{doc_a.filename if doc_a else comp.doc_a_id} (A) vs (B)"}
    try:
        path = generate_comparison_report(meta, comp_dict, data.fmt)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    log_action(db, user, "rapport_comparaison", f"cmp {comp.id} ({data.fmt})", client_ip(request))
    return {"filename": path.name, "url": _download_url(path)}


@router.get("/reports/download/{filename}")
def download_report(filename: str, _: User = Depends(get_current_user)):
    if not is_safe_filename(filename):
        raise HTTPException(status_code=400, detail="Nom de fichier invalide.")
    path = get_settings().export_dir / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Fichier introuvable ou expire.")
    return FileResponse(str(path), filename=filename)
