"""Module D : recherche juridique (droit algerien)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..db import get_session
from ..legal import DISCLOSURE, search_references
from ..models import LegalReference, User
from ..schemas import LegalReferenceIn
from ..security import get_current_user, log_action, require_writer
from ..service import client_ip

router = APIRouter(prefix="/api", tags=["research"])


def _ref_out(r: LegalReference) -> dict:
    return {
        "id": r.id, "title": r.title, "number": r.number,
        "publication_date": r.publication_date, "article": r.article,
        "source": r.source, "domain": r.domain, "status": r.status, "note": r.note,
    }


@router.get("/research")
def research(query: str = "", domain: str = "", db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    refs = search_references(db, query, domain)
    return {"disclosure": DISCLOSURE, "count": len(refs), "references": [_ref_out(r) for r in refs]}


@router.post("/research", status_code=201)
def add_reference(
    data: LegalReferenceIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    status = data.status if data.status in ("verifie", "a_verifier") else "a_verifier"
    r = LegalReference(**{**data.model_dump(), "status": status}, created_by=user.id)
    db.add(r)
    db.commit()
    db.refresh(r)
    log_action(db, user, "ajout_reference", f"{r.id}:{r.number}", client_ip(request))
    return _ref_out(r)


@router.put("/research/{ref_id}")
def update_reference(
    ref_id: int, data: LegalReferenceIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    r = db.get(LegalReference, ref_id)
    if not r:
        raise HTTPException(status_code=404, detail="Reference introuvable.")
    status = data.status if data.status in ("verifie", "a_verifier") else "a_verifier"
    for k, v in data.model_dump().items():
        setattr(r, k, v)
    r.status = status
    db.commit()
    db.refresh(r)
    log_action(db, user, "modification_reference", f"{r.id} -> {status}", client_ip(request))
    return _ref_out(r)


@router.delete("/research/{ref_id}")
def delete_reference(
    ref_id: int, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    r = db.get(LegalReference, ref_id)
    if not r:
        raise HTTPException(status_code=404, detail="Reference introuvable.")
    db.delete(r)
    db.commit()
    log_action(db, user, "suppression_reference", str(ref_id), client_ip(request))
    return {"ok": True}
