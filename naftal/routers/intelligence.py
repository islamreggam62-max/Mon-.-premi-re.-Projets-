"""Modules A, B, C, F : analyse, comparaison, risques, assistant juridique."""
from __future__ import annotations

import json
import re
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..analysis import analyze_text, compare_texts, risk_report
from ..analysis.retrieval import build_corpus_retriever
from ..analysis.rules import norm
from ..extraction.segmentation import segment_clauses
from ..db import get_session
from ..llm import llm_status, run_llm
from ..models import Analysis, Comparison, Document, User
from ..schemas import AssistantIn
from ..security import get_current_user, log_action, require_writer
from ..service import analysis_to_dict, client_ip, run_and_store_analysis

router = APIRouter(prefix="/api", tags=["intelligence"])


class RunAnalysisIn(BaseModel):
    document_id: int


class RunComparisonIn(BaseModel):
    doc_a_id: int
    doc_b_id: int


def _require_doc(db: Session, doc_id: int) -> Document:
    d = db.get(Document, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="Document introuvable.")
    if not (d.extracted_text or "").strip():
        raise HTTPException(
            status_code=422,
            detail="Aucun texte exploitable dans ce document (extraction echouee). " + (d.extraction_note or ""),
        )
    return d


# --------------------------- Module A : Analyse ---------------------------- #
@router.post("/analysis/run")
def run_analysis(
    data: RunAnalysisIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    doc = _require_doc(db, data.document_id)
    analysis = run_and_store_analysis(db, doc, user)
    log_action(db, user, "analyse", f"doc {doc.id} -> score {analysis.risk_score}", client_ip(request))
    return analysis_to_dict(db, analysis)


@router.get("/analysis/document/{document_id}/latest")
def latest_analysis(document_id: int, db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    a = db.scalar(
        select(Analysis).where(Analysis.document_id == document_id).order_by(desc(Analysis.created_at)).limit(1)
    )
    if not a:
        raise HTTPException(status_code=404, detail="Aucune analyse pour ce document.")
    return analysis_to_dict(db, a)


@router.get("/analysis/{analysis_id}")
def get_analysis(analysis_id: int, db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    a = db.get(Analysis, analysis_id)
    if not a:
        raise HTTPException(status_code=404, detail="Analyse introuvable.")
    return analysis_to_dict(db, a)


# ------------------------- Module C : Risques ------------------------------ #
@router.get("/risk/document/{document_id}")
def risk_for_document(
    document_id: int, request: Request,
    db: Session = Depends(get_session), user: User = Depends(get_current_user),
):
    a = db.scalar(
        select(Analysis).where(Analysis.document_id == document_id).order_by(desc(Analysis.created_at)).limit(1)
    )
    if not a:
        # Pas d'analyse stockee : on analyse a la volee (sans persister) pour le rapport.
        doc = _require_doc(db, document_id)
        out = analyze_text(doc.extracted_text or "")
        return risk_report(asdict(out))
    return risk_report(analysis_to_dict(db, a))


# ----------------------- Module B : Comparaison ---------------------------- #
@router.post("/comparison/run")
def run_comparison(
    data: RunComparisonIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(require_writer),
):
    if data.doc_a_id == data.doc_b_id:
        raise HTTPException(status_code=422, detail="Veuillez choisir deux documents differents.")
    doc_a = _require_doc(db, data.doc_a_id)
    doc_b = _require_doc(db, data.doc_b_id)
    result = compare_texts(doc_a.extracted_text, doc_b.extracted_text)
    comp = Comparison(
        doc_a_id=doc_a.id, doc_b_id=doc_b.id,
        result_json=json.dumps(asdict(result), ensure_ascii=False),
        summary=result.summary, created_by=user.id,
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    log_action(db, user, "comparaison", f"{doc_a.id} vs {doc_b.id}", client_ip(request))
    out = asdict(result)
    out["id"] = comp.id
    out["doc_a"] = {"id": doc_a.id, "filename": doc_a.filename, "version_label": doc_a.version_label}
    out["doc_b"] = {"id": doc_b.id, "filename": doc_b.filename, "version_label": doc_b.version_label}
    return out


@router.get("/comparison/{comparison_id}")
def get_comparison(comparison_id: int, db: Session = Depends(get_session), _: User = Depends(get_current_user)):
    comp = db.get(Comparison, comparison_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Comparaison introuvable.")
    out = json.loads(comp.result_json)
    out["id"] = comp.id
    return out


# ----------------------- Module F : Assistant ------------------------------ #
@router.get("/assistant/status")
def assistant_status(_: User = Depends(get_current_user)):
    return llm_status()


_ARTICLE_Q = re.compile(r"article\s+(\d{1,3}|premier|premiere|[ivxl]{1,6})", re.IGNORECASE)


def _answer_rule_based(doc: Document, question: str) -> dict:
    text = doc.extracted_text or ""
    clauses = segment_clauses(text)
    out = analyze_text(text)
    nq = norm(question)
    citations: list[dict] = []
    base = f"Document : {doc.filename}"

    # Intention : expliquer un article precis.
    m = _ARTICLE_Q.search(question)
    if m:
        target = norm("article " + m.group(1))
        for c in clauses:
            if norm(c.ref) == target or norm(c.ref).replace(" ", "") == target.replace(" ", ""):
                findings = [f for f in out.findings if norm(f["article_ref"]) == norm(c.ref) and f["severity"] != "INFO"]
                citations.append({"document": doc.filename, "article": c.ref})
                answer = f"{c.ref} — {c.title or 'sans titre'}\n\n{c.text}"
                if findings:
                    answer += "\n\nPoints d'attention sur cet article :\n" + "\n".join(
                        f"- [{f['severity']}] {f['problem']}" for f in findings
                    )
                return {"answer": answer, "citations": citations, "grounded": True, "used_llm": False}
        return {
            "answer": f"Aucun « {m.group(0)} » n'a ete trouve dans {doc.filename}.",
            "citations": [], "grounded": True, "used_llm": False,
        }

    # Intention : provisions manquantes.
    if any(k in nq for k in ("manquant", "absent", "protection", "manque")):
        missing = [f for f in out.findings if not f["present"]]
        if not missing:
            return {"answer": "Aucune provision-cle manquante detectee.", "citations": [], "grounded": True, "used_llm": False}
        answer = "Provisions absentes detectees :\n" + "\n".join(
            f"- [{f['severity']}] {f['category']} : {f['recommendation']}" for f in missing
        )
        return {"answer": answer, "citations": [], "grounded": True, "used_llm": False}

    # Intention : risques.
    if any(k in nq for k in ("risque", "danger", "exposition")):
        rr = risk_report(asdict(out))
        lines = [f"Niveau global : {rr['overall_level']} (score {rr['risk_score']}/100)."]
        for f in out.issues()[:12]:
            lines.append(f"- [{f['severity']}] {f['category']} @ {f['article_ref']} : {f['problem']}")
            if f["article_ref"] not in ("(absente)", "(plusieurs clauses)"):
                citations.append({"document": doc.filename, "article": f["article_ref"]})
        return {"answer": "\n".join(lines), "citations": citations, "grounded": True, "used_llm": False}

    # Intention : incoherences.
    if any(k in nq for k in ("incoherence", "contradiction", "coherence")):
        inc = [f for f in out.findings if f["category"] == "Coherence"]
        if not inc:
            return {"answer": "Aucune incoherence manifeste detectee.", "citations": [], "grounded": True, "used_llm": False}
        return {"answer": "\n".join(f"- [{f['severity']}] {f['problem']}" for f in inc), "citations": [], "grounded": True, "used_llm": False}

    # Intention : synthese / analyse globale.
    if any(k in nq for k in ("resume", "synthese", "analyse", "apercu", "global")):
        return {"answer": out.summary, "citations": [], "grounded": True, "used_llm": False}

    # Par defaut : recherche dans les clauses du document (racinisation + vocabulaire
    # juridique voisin), via le meme moteur que la recherche plein texte.
    local = build_corpus_retriever([{"label": doc.filename, "text": text, "id": doc.id}])
    hits = local.search(question, 4)
    if hits:
        answer_parts = []
        for p, _score in hits:
            ref = p.meta.get("ref") or p.doc_id
            citations.append({"document": doc.filename, "article": ref})
            answer_parts.append(f"{ref} — {p.meta.get('title') or ''}\n{p.text[:500]}")
        return {"answer": "Clauses correspondantes :\n\n" + "\n\n".join(answer_parts), "citations": citations, "grounded": True, "used_llm": False}

    return {
        "answer": (
            "Je reponds uniquement a partir du document selectionne et des constats "
            "de l'analyse. Reformulez votre question (ex. « Explique l'article 5 », "
            "« Quelles protections manquent ? », « Quels sont les risques ? ») ou "
            "precisez un terme present dans le contrat."
        ),
        "citations": [], "grounded": True, "used_llm": False,
    }


@router.post("/assistant")
def assistant(
    data: AssistantIn, request: Request,
    db: Session = Depends(get_session), user: User = Depends(get_current_user),
):
    if not data.question.strip():
        raise HTTPException(status_code=422, detail="Question vide.")
    if data.document_id is None:
        return {
            "answer": "Veuillez d'abord selectionner un document pour que je puisse repondre a partir de son contenu.",
            "citations": [], "grounded": True, "used_llm": False,
        }
    doc = _require_doc(db, data.document_id)
    result = _answer_rule_based(doc, data.question)
    log_action(db, user, "assistant", f"doc {doc.id}: {data.question[:80]}", client_ip(request))
    return result
