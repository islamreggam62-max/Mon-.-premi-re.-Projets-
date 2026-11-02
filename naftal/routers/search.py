"""Recherche plein texte dans les clauses de tous les contrats et references.

Complete le filtrage par metadonnees (titre, reference, partie…) du Module E : ici
on cherche DANS le texte des clauses, avec racinisation, vocabulaire juridique
voisin et, si le backend d'embeddings est actif, recherche semantique.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..analysis import lexicon
from ..db import get_session
from ..models import User
from ..security import get_current_user, log_action
from ..service import build_retriever, client_ip

router = APIRouter(prefix="/api", tags=["search"])

_SCOPES = {"tout": None, "contrat": "contrat", "reference": "reference"}
_SNIPPET = 420


@router.get("/search")
def full_text_search(
    request: Request,
    query: str,
    k: int = 8,
    scope: str = "tout",
    db: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    query = (query or "").strip()
    if len(query) < 2:
        raise HTTPException(status_code=422, detail="Saisissez au moins 2 caracteres.")
    if scope not in _SCOPES:
        raise HTTPException(status_code=422, detail=f"Portee invalide. Valeurs : {sorted(_SCOPES)}")
    k = max(1, min(k, 25))

    retriever = build_retriever(db)
    # On demande plus de candidats puis on filtre par portee, pour toujours rendre k resultats.
    hits = retriever.search(query, 60)
    wanted = _SCOPES[scope]
    if wanted:
        hits = [(p, s) for p, s in hits if p.source == wanted]
    hits = hits[:k]
    top = hits[0][1] if hits else 1.0

    log_action(db, user, "recherche_plein_texte", query[:80], client_ip(request))
    return {
        "query": query,
        "mode": retriever.mode,
        "dense_error": retriever.dense_error or None,
        "groups": lexicon.triggered_groups(query),
        "count": len(hits),
        "results": [
            {
                "label": p.doc_id,
                "source": p.source,
                "article": p.meta.get("ref"),
                "document_id": p.meta.get("document_id"),
                "relevance": round(s / top, 3) if top else 0.0,
                "snippet": p.text[:_SNIPPET] + ("…" if len(p.text) > _SNIPPET else ""),
            }
            for p, s in hits
        ],
    }
