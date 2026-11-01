"""Module E (partie documents) : televersement et gestion des documents."""
from __future__ import annotations

from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..db import get_session
from ..models import Contract, Document, User
from ..security import get_current_user, log_action, require_writer
from ..service import client_ip, ingest_document

router = APIRouter(prefix="/api", tags=["documents"])

_SAMPLE_DIR = Path(__file__).resolve().parent.parent / "samples"


def _doc_out(d: Document, with_text: bool = False) -> dict:
    data = {
        "id": d.id, "contract_id": d.contract_id, "filename": d.filename,
        "mime_type": d.mime_type, "size_bytes": d.size_bytes, "sha256": d.sha256,
        "page_count": d.page_count, "char_count": d.char_count,
        "extraction_ok": d.extraction_ok, "extraction_note": d.extraction_note,
        "version_label": d.version_label, "created_at": d.created_at.isoformat(),
    }
    if with_text:
        data["extracted_text"] = d.extracted_text
    return data


@router.post("/documents/upload")
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    contract_id: int | None = Form(None),
    version_label: str = Form(""),
    db: Session = Depends(get_session),
    user: User = Depends(require_writer),
):
    settings = get_settings()
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in settings.allowed_extensions:
        raise HTTPException(
            status_code=422,
            detail=f"Format non supporte ({suffix or 'inconnu'}). Formats acceptes : PDF, DOCX, TXT.",
        )
    content = await file.read()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail=f"Fichier trop volumineux (max {settings.max_upload_mb} Mo).")
    if contract_id is not None and not db.get(Contract, contract_id):
        raise HTTPException(status_code=404, detail="Contrat associe introuvable.")

    doc = ingest_document(db, content, file.filename or "document", user, contract_id, version_label)
    log_action(db, user, "televersement_document", f"{doc.id}:{doc.filename}", client_ip(request))
    out = _doc_out(doc)
    if not doc.extraction_ok:
        out["warning"] = doc.extraction_note
    return out


@router.get("/documents")
def list_documents(
    contract_id: int | None = None,
    db: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    stmt = select(Document).order_by(Document.created_at.desc())
    if contract_id is not None:
        stmt = stmt.where(Document.contract_id == contract_id)
    return [_doc_out(d) for d in db.scalars(stmt)]


@router.get("/documents/{document_id}")
def get_document(
    document_id: int, with_text: bool = False,
    db: Session = Depends(get_session), _: User = Depends(get_current_user),
):
    d = db.get(Document, document_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    return _doc_out(d, with_text=with_text)


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: int, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    d = db.get(Document, document_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    # Supprime aussi le fichier stocke.
    try:
        Path(d.stored_path).unlink(missing_ok=True)
    except OSError:
        pass
    db.delete(d)
    db.commit()
    log_action(db, user, "suppression_document", str(document_id), client_ip(request))
    return {"ok": True}


@router.post("/documents/load-samples")
def load_samples(
    request: Request,
    db: Session = Depends(get_session),
    user: User = Depends(require_writer),
):
    """Charge les deux contrats de demonstration (donnees synthetiques)."""
    contract = Contract(
        title="Contrat de fourniture de carburant (DEMONSTRATION)",
        reference="CTR-2024-018",
        contract_type="Fourniture",
        counterparty="TRANSPORT SUD SARL",
        department="Branche Carburants",
        status="actif",
        effective_date="2024-01-15",
        expiry_date="2025-01-15",
        notes="Donnees synthetiques de demonstration.",
        created_by=user.id,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)

    created = []
    for fname, label in (("contrat_demo_v1.txt", "Version 1"), ("contrat_demo_v2.txt", "Version 2")):
        path = _SAMPLE_DIR / fname
        if not path.exists():
            continue
        content = path.read_bytes()
        doc = ingest_document(db, content, fname, user, contract.id, label)
        created.append(_doc_out(doc))
    log_action(db, user, "chargement_demo", f"contrat {contract.id}", client_ip(request))
    return {"contract_id": contract.id, "documents": created}
