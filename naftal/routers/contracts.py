"""Module E (partie contrats) : gestion des contrats, filtres et tableau de bord."""
from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import Analysis, Contract, Document, User
from ..schemas import ContractIn, ContractOut
from ..security import get_current_user, log_action, require_writer
from ..service import client_ip

router = APIRouter(prefix="/api", tags=["contracts"])


def _to_out(db: Session, c: Contract) -> ContractOut:
    count = db.scalar(select(func.count()).select_from(Document).where(Document.contract_id == c.id))
    out = ContractOut.model_validate(c)
    out.document_count = count or 0
    return out


@router.get("/contracts", response_model=list[ContractOut])
def list_contracts(
    query: str = "",
    contract_type: str = "",
    department: str = "",
    counterparty: str = "",
    status: str = "",
    year: str = "",
    db: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    stmt = select(Contract)
    if query:
        like = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                Contract.title.ilike(like),
                Contract.reference.ilike(like),
                Contract.counterparty.ilike(like),
                Contract.notes.ilike(like),
            )
        )
    if contract_type:
        stmt = stmt.where(Contract.contract_type == contract_type)
    if department:
        stmt = stmt.where(Contract.department == department)
    if counterparty:
        stmt = stmt.where(Contract.counterparty.ilike(f"%{counterparty}%"))
    if status:
        stmt = stmt.where(Contract.status == status)
    if year:
        stmt = stmt.where(
            or_(
                Contract.effective_date.ilike(f"%{year}%"),
                Contract.expiry_date.ilike(f"%{year}%"),
            )
        )
    stmt = stmt.order_by(Contract.updated_at.desc())
    return [_to_out(db, c) for c in db.scalars(stmt)]


@router.post("/contracts", response_model=ContractOut, status_code=201)
def create_contract(
    data: ContractIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    c = Contract(**data.model_dump(), created_by=user.id)
    db.add(c)
    db.commit()
    db.refresh(c)
    log_action(db, user, "creation_contrat", f"{c.id}:{c.title}", client_ip(request))
    return _to_out(db, c)


@router.get("/contracts/filters")
def contract_filters(db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    def distinct(col):
        return [v for (v,) in db.execute(select(col).distinct()) if v]

    return {
        "types": sorted(distinct(Contract.contract_type)),
        "departments": sorted(distinct(Contract.department)),
        "statuses": sorted(distinct(Contract.status)),
        "counterparties": sorted(distinct(Contract.counterparty)),
    }


@router.get("/contracts/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(status_code=404, detail="Contrat introuvable.")
    return _to_out(db, c)


@router.put("/contracts/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int, data: ContractIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(status_code=404, detail="Contrat introuvable.")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    log_action(db, user, "modification_contrat", f"{c.id}", client_ip(request))
    return _to_out(db, c)


@router.delete("/contracts/{contract_id}")
def delete_contract(
    contract_id: int, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    c = db.get(Contract, contract_id)
    if not c:
        raise HTTPException(status_code=404, detail="Contrat introuvable.")
    db.delete(c)
    db.commit()
    log_action(db, user, "suppression_contrat", f"{contract_id}", client_ip(request))
    return {"ok": True}


def _parse_date(value: str | None) -> dt.date | None:
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


@router.get("/overview")
def overview(db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    n_contracts = db.scalar(select(func.count()).select_from(Contract)) or 0
    n_docs = db.scalar(select(func.count()).select_from(Document)) or 0
    n_analyses = db.scalar(select(func.count()).select_from(Analysis)) or 0

    # Repartition des scores de risque (derniere analyse de chaque document).
    risk_buckets = {"faible": 0, "moyen": 0, "eleve": 0, "critique": 0}
    latest = {}
    for a in db.scalars(select(Analysis).order_by(Analysis.created_at.desc())):
        if a.document_id not in latest:
            latest[a.document_id] = a
    for a in latest.values():
        s = a.risk_score
        if s >= 70:
            risk_buckets["critique"] += 1
        elif s >= 40:
            risk_buckets["eleve"] += 1
        elif s >= 15:
            risk_buckets["moyen"] += 1
        else:
            risk_buckets["faible"] += 1

    # Contrats expirant dans les 90 jours / renouvellements a venir.
    today = dt.date.today()
    horizon = today + dt.timedelta(days=90)
    expiring = []
    for c in db.scalars(select(Contract)):
        d = _parse_date(c.expiry_date)
        if d and today <= d <= horizon:
            expiring.append({"id": c.id, "title": c.title, "reference": c.reference, "expiry_date": c.expiry_date, "days": (d - today).days})
    expiring.sort(key=lambda x: x["days"])

    return {
        "contracts": n_contracts,
        "documents": n_docs,
        "analyses": n_analyses,
        "risk_distribution": risk_buckets,
        "expiring_soon": expiring[:20],
    }
