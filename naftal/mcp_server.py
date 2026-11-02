"""Serveur MCP : NAFTAL LEGAL INTELLIGENCE utilisable DEPUIS la conversation Claude.

Principe (« les deux ensemble ») :
- la CONVERSATION Claude (Claude Desktop) apporte le raisonnement et la redaction ;
- NAFTAL apporte ce qu'une conversation n'a pas : vos contrats stockes localement,
  le decoupage en articles, le moteur de regles deterministe (provisions absentes,
  motifs de risque), la comparaison clause par clause, la recherche dans tout le
  corpus, les references marquees « a verifier » et les rapports DOCX/PDF/XLSX.

Ce serveur n'appelle AUCUN LLM : pas de cle d'API NAFTAL necessaire. Le raisonnement
est celui de la conversation, dans le cadre de votre abonnement Claude.

Confidentialite : les RESULTATS des outils (texte de clauses, constats) entrent dans
la conversation Claude, donc chez Anthropic, comme si vous les colliez vous-meme.
Les outils ne lisent que ce que la conversation demande ; chaque appel est inscrit au
journal d'audit (utilisateur « claude (MCP) »).

Lancement (normalement par Claude Desktop, pas a la main) :
    python -m naftal.mcp_server
Aucun affichage sur la sortie standard : elle est reservee au protocole.
"""
from __future__ import annotations

import json
from dataclasses import asdict
from functools import wraps
from pathlib import Path
from typing import Any, Callable

from sqlalchemy import desc, or_, select

from . import __version__
from .analysis import analyze_text, compare_texts, lexicon, risk_report
from .config import get_settings
from .db import create_all, session_scope
from .extraction.segmentation import segment_clauses
from .legal import DISCLOSURE, search_references, seed_references
from .llm import legal_brain
from .models import Analysis, AuditLog, Contract, Document
from .reports import generate_analysis_report, generate_comparison_report, generate_risk_report
from .service import analysis_to_dict, build_retriever, ingest_document, run_and_store_analysis

SERVER_NAME = "naftal-legal-intelligence"
MCP_USER = "claude (MCP)"
MAX_TEXT = 60_000          # plafond d'un texte colle (analyse/comparaison)
EXCERPT = 400

INSTRUCTIONS = """\
Outils de NAFTAL LEGAL INTELLIGENCE (Direction Juridique NAFTAL, Departement Contrats).
Regles a respecter en les utilisant :
- Appuie toute affirmation sur le TEXTE renvoye par les outils ; cite l'article exact.
  N'invente jamais de clause, d'article, de texte de loi ni de jurisprudence.
- Une provision signalee « absente » par le moteur est absente : ne pretends pas le contraire.
- Les references juridiques du catalogue sont « a verifier » (JORADP non consulte) :
  garde cette mention. Ne presume aucune procedure interne NAFTAL/SONATRACH.
- Le moteur de regles est un FILET DE SECURITE (detection de motifs), pas un avis :
  confirme, nuance ou complete ses constats par ta propre lecture du texte.
- Distingue faits (texte du contrat), interpretations et strategie de negociation.
Demarche conseillee : naftal_list_documents -> naftal_read_document -> naftal_analyze_document
-> ta propre analyse ; naftal_search pour retrouver des clauses dans les autres contrats.
"""


# --------------------------------------------------------------------------- #
# Utilitaires
# --------------------------------------------------------------------------- #
class ToolError(ValueError):
    """Erreur presentee a la conversation (message clair, sans pile d'appels)."""


def _audit(action: str, detail: str = "") -> None:
    with session_scope() as db:
        db.add(AuditLog(user_id=None, user_email=MCP_USER, action=action, detail=detail[:2000], ip="local"))
        db.commit()


def _audited(action: str) -> Callable:
    def deco(fn: Callable) -> Callable:
        @wraps(fn)
        def inner(*args: Any, **kwargs: Any) -> Any:
            detail = json.dumps({k: (v if not isinstance(v, str) or len(v) < 120 else f"<{len(v)} car.>")
                                 for k, v in kwargs.items()}, ensure_ascii=False)
            _audit(action, detail)
            return fn(*args, **kwargs)
        return inner
    return deco


def _cut(text: str, n: int = EXCERPT) -> str:
    text = (text or "").strip()
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def _doc_label(db, d: Document) -> dict[str, Any]:
    c = db.get(Contract, d.contract_id) if d.contract_id else None
    return {
        "document_id": d.id, "fichier": d.filename, "version": d.version_label or None,
        "contrat": c.title if c else None, "reference": (c.reference or None) if c else None,
        "contract_id": d.contract_id, "caracteres": d.char_count,
        "texte_extrait": d.extraction_ok,
        **({"avertissement_extraction": d.extraction_note} if not d.extraction_ok else {}),
    }


def _get_doc(db, document_id: int) -> Document:
    d = db.get(Document, int(document_id))
    if d is None:
        raise ToolError(f"Document {document_id} introuvable. Utilisez naftal_list_documents.")
    if not (d.extracted_text or "").strip():
        raise ToolError(f"Le document {document_id} n'a pas de texte exploitable : "
                        f"{d.extraction_note or 'extraction vide'} (PDF scanne ? OCR requis).")
    return d


def _check_text(text: str, name: str = "text") -> str:
    text = (text or "").strip()
    if not text:
        raise ToolError(f"« {name} » est vide.")
    if len(text) > MAX_TEXT:
        raise ToolError(f"« {name} » depasse {MAX_TEXT} caracteres : importez plutot le fichier "
                        "(naftal_import_file) et travaillez par document_id.")
    return text


def _compact_findings(findings: list[dict], include_present: bool) -> dict[str, Any]:
    issues, missing, present = [], [], []
    for f in findings:
        if f["severity"] == "INFO":
            if include_present:
                present.append({"provision": f["category"], "article": f["article_ref"]})
            continue
        item = {
            "gravite": f["severity"], "categorie": f["category"], "article": f["article_ref"],
            "constat": f["problem"], "portee": f.get("legal_significance") or None,
            "recommandation": f.get("recommendation") or None,
            "redaction_proposee": f.get("proposed_wording") or None,
        }
        if f.get("excerpt"):
            item["extrait"] = _cut(f["excerpt"])
        (missing if not f["present"] else issues).append(item)
    out = {"points_d_attention": issues, "provisions_absentes": missing}
    if include_present:
        out["provisions_presentes"] = present
    return out


def _analysis_payload(a: dict, include_present: bool) -> dict[str, Any]:
    return {
        "moteur": "regles deterministes NAFTAL (filet de securite, pas un avis juridique)",
        "score_de_risque": a["risk_score"],
        "synthese": a["summary"],
        "parties_detectees": a.get("parties", []),
        "comptes_par_gravite": {k: v for k, v in (a.get("counts") or {}).items() if k != "INFO"},
        **_compact_findings(a["findings"], include_present),
    }


# --------------------------------------------------------------------------- #
# Outils (fonctions simples : testables sans MCP)
# --------------------------------------------------------------------------- #
@_audited("mcp_list_documents")
def naftal_list_documents(query: str = "") -> dict[str, Any]:
    """Liste les contrats et documents enregistres dans NAFTAL (filtre optionnel sur
    le titre, la reference, la partie ou le nom de fichier)."""
    with session_scope() as db:
        stmt = select(Document).order_by(desc(Document.created_at))
        if query.strip():
            like = f"%{query.strip()}%"
            stmt = stmt.outerjoin(Contract, Document.contract_id == Contract.id).where(or_(
                Document.filename.ilike(like), Contract.title.ilike(like),
                Contract.reference.ilike(like), Contract.counterparty.ilike(like)))
        docs = [_doc_label(db, d) for d in db.scalars(stmt.limit(200))]
    return {"nombre": len(docs), "documents": docs,
            "astuce": "Si votre contrat n'y est pas : naftal_import_file avec son chemin sur ce PC."}


@_audited("mcp_read_document")
def naftal_read_document(document_id: int, article: str = "", offset: int = 0,
                         max_chars: int = 12000) -> dict[str, Any]:
    """Lit le texte d'un document : soit un article precis (ex. « 5 », « Article 5 »,
    « premier »), soit le texte integral par tranches (offset / max_chars). Renvoie
    aussi le plan (liste des articles) pour citer les bonnes references."""
    max_chars = max(500, min(int(max_chars), 30000))
    with session_scope() as db:
        d = _get_doc(db, document_id)
        text, label = d.extracted_text, _doc_label(db, d)
    clauses = segment_clauses(text)
    plan = [{"ref": c.ref, "titre": c.title} for c in clauses]
    if article.strip():
        want = article.strip().lower().replace("article", "").replace("art.", "").strip()
        for c in clauses:
            ref = c.ref.lower().replace("article", "").strip()
            if want == ref or (c.number is not None and want == str(c.number)):
                return {"document": label, "article": c.ref, "titre": c.title, "texte": c.text, "plan": plan}
        raise ToolError(f"Article « {article} » introuvable. Articles disponibles : "
                        + ", ".join(p["ref"] for p in plan))
    offset = max(0, int(offset))
    chunk = text[offset: offset + max_chars]
    nxt = offset + len(chunk)
    return {"document": label, "plan": plan, "offset": offset, "texte": chunk,
            "longueur_totale": len(text), "suite": nxt if nxt < len(text) else None}


@_audited("mcp_analyze_document")
def naftal_analyze_document(document_id: int, include_present: bool = False) -> dict[str, Any]:
    """Analyse deterministe d'un document enregistre (moteur de regles NAFTAL) :
    provisions-cles ABSENTES, motifs de risque (responsabilite illimitee, resiliation
    unilaterale, revision unilaterale du prix, reconduction tacite...), incoherences,
    score 0-100. L'analyse est enregistree dans l'historique NAFTAL."""
    with session_scope() as db:
        d = _get_doc(db, document_id)
        a = analysis_to_dict(db, run_and_store_analysis(db, d, None))
        label = _doc_label(db, d)
    return {"document": label, **_analysis_payload(a, include_present)}


@_audited("mcp_analyze_text")
def naftal_analyze_text(text: str, include_present: bool = False) -> dict[str, Any]:
    """Analyse deterministe d'un texte de contrat colle dans la conversation (rien
    n'est enregistre). Utile quand le contrat n'est pas dans NAFTAL."""
    out = analyze_text(_check_text(text))
    return {"articles_detectes": [c["ref"] for c in out.structure], **_analysis_payload(asdict(out), include_present)}


def _comparison_payload(c) -> dict[str, Any]:
    return {
        "synthese": c.summary,
        "score_de_risque": {"version_a": c.risk_score_a, "version_b": c.risk_score_b},
        "changements": [{
            "type": ch["kind"], "article_a": ch["ref_a"], "article_b": ch["ref_b"],
            "classe": ch["change_class"], "risque": ch["risk"], "explication": ch["explanation"],
            "impact": ch["legal_impact"], "action": ch["recommended_action"],
            "avant": _cut(ch["before"], 600) or None, "apres": _cut(ch["after"], 600) or None,
        } for ch in c.changes],
    }


@_audited("mcp_compare_documents")
def naftal_compare_documents(document_id_a: int, document_id_b: int) -> dict[str, Any]:
    """Compare deux versions (A = ancienne, B = nouvelle) clause par clause, avec
    alignement par contenu (robuste a la renumerotation) : ajouts, suppressions,
    modifications classees (cosmetique ... financiere, haut risque)."""
    if int(document_id_a) == int(document_id_b):
        raise ToolError("Choisissez deux documents differents.")
    with session_scope() as db:
        a, b = _get_doc(db, document_id_a), _get_doc(db, document_id_b)
        ta, tb, la, lb = a.extracted_text, b.extracted_text, _doc_label(db, a), _doc_label(db, b)
    return {"version_a": la, "version_b": lb, **_comparison_payload(compare_texts(ta, tb))}


@_audited("mcp_compare_texts")
def naftal_compare_texts(text_a: str, text_b: str) -> dict[str, Any]:
    """Compare deux textes colles (A = ancienne version, B = nouvelle), sans enregistrement."""
    return _comparison_payload(compare_texts(_check_text(text_a, "text_a"), _check_text(text_b, "text_b")))


@_audited("mcp_risk_report")
def naftal_risk_report(document_id: int) -> dict[str, Any]:
    """Regroupe les risques d'un document par domaine (juridique, financier,
    operationnel, reglementaire) avec un niveau global."""
    with session_scope() as db:
        d = _get_doc(db, document_id)
        last = db.scalar(select(Analysis).where(Analysis.document_id == d.id)
                         .order_by(desc(Analysis.created_at)).limit(1))
        a = analysis_to_dict(db, last) if last else asdict(analyze_text(d.extracted_text))
        label = _doc_label(db, d)
    r = risk_report(a)
    return {"document": label, "niveau_global": r["overall_level"], "score_de_risque": r["risk_score"],
            "domaines": [{"domaine": dm["label"], "nombre": dm["count"], "niveau": dm["level"],
                          "points": [{"gravite": f["severity"], "article": f["article_ref"],
                                      "constat": f["problem"]} for f in dm["findings"]]}
                         for dm in r["domains"]]}


@_audited("mcp_search")
def naftal_search(query: str, scope: str = "tout", k: int = 8) -> dict[str, Any]:
    """Recherche DANS le texte de tous les contrats et references enregistres
    (formes grammaticales et vocabulaire juridique voisin pris en compte).
    scope : « tout », « contrat » ou « reference »."""
    query = (query or "").strip()
    if len(query) < 2:
        raise ToolError("Requete trop courte.")
    if scope not in ("tout", "contrat", "reference"):
        raise ToolError("scope doit valoir « tout », « contrat » ou « reference ».")
    k = max(1, min(int(k), 20))
    with session_scope() as db:
        r = build_retriever(db)
    hits = r.search(query, 60)
    if scope != "tout":
        hits = [(p, s) for p, s in hits if p.source == scope]
    hits = hits[:k]
    top = hits[0][1] if hits else 1.0
    return {"mode": r.mode, "vocabulaire_voisin": lexicon.triggered_groups(query),
            "resultats": [{"source": p.doc_id, "type": p.source, "document_id": p.meta.get("document_id"),
                           "article": p.meta.get("ref"), "pertinence": round(s / top, 3),
                           "extrait": _cut(p.text, 600)} for p, s in hits]}


@_audited("mcp_legal_references")
def naftal_legal_references(query: str = "", domain: str = "") -> dict[str, Any]:
    """Catalogue local de references juridiques algeriennes. ATTENTION : statut
    « a_verifier » par defaut ; le JORADP n'est pas consulte."""
    with session_scope() as db:
        refs = [{"titre": r.title, "numero": r.number, "date": r.publication_date, "article": r.article,
                 "domaine": r.domain, "statut": r.status, "source": r.source, "note": r.note}
                for r in search_references(db, query, domain)]
    return {"avertissement": DISCLOSURE, "nombre": len(refs), "references": refs}


@_audited("mcp_import_file")
def naftal_import_file(path: str, contract_title: str = "", contract_id: int | None = None,
                       version_label: str = "") -> dict[str, Any]:
    """Importe un fichier PDF, DOCX ou TXT de CE PC dans NAFTAL (extraction du texte).
    Rattache-le a un contrat existant (contract_id) ou cree un contrat (contract_title)."""
    s = get_settings()
    p = Path(path).expanduser()
    if not p.is_file():
        raise ToolError(f"Fichier introuvable : {p}")
    if p.suffix.lower() not in s.allowed_extensions:
        raise ToolError(f"Format non pris en charge ({p.suffix or '?'}) : PDF, DOCX ou TXT.")
    size = p.stat().st_size
    if size > s.max_upload_bytes:
        raise ToolError(f"Fichier trop volumineux ({size // 1048576} Mo > {s.max_upload_mb} Mo).")
    with session_scope() as db:
        if contract_id is not None:
            if not db.get(Contract, int(contract_id)):
                raise ToolError(f"Contrat {contract_id} introuvable.")
            cid = int(contract_id)
        else:
            c = Contract(title=contract_title.strip() or p.stem, notes=f"Importe via Claude (MCP) : {p.name}")
            db.add(c)
            db.commit()
            cid = c.id
        d = ingest_document(db, p.read_bytes(), p.name, None, cid, version_label)
        label = _doc_label(db, d)
    return {"importe": label, **({} if label["texte_extrait"] else
                                 {"attention": "Aucun texte extrait : document probablement scanne."})}


@_audited("mcp_generate_report")
def naftal_generate_report(kind: str, document_id: int, fmt: str = "docx",
                           document_id_b: int | None = None) -> dict[str, Any]:
    """Genere un rapport professionnel sur CE PC et renvoie son chemin.
    kind : « analyse », « risques » ou « comparaison » (document_id = version A,
    document_id_b = version B). fmt : « docx », « pdf » ou « xlsx » (pas xlsx pour risques)."""
    kind, fmt = kind.strip().lower(), fmt.strip().lower()
    with session_scope() as db:
        d = _get_doc(db, document_id)
        meta = {"document": d.filename}
        if d.contract_id and (c := db.get(Contract, d.contract_id)):
            meta.update(contract=c.title, reference=c.reference)
        try:
            if kind == "analyse":
                path = generate_analysis_report(meta, asdict(analyze_text(d.extracted_text)), fmt)
            elif kind == "risques":
                path = generate_risk_report(meta, risk_report(asdict(analyze_text(d.extracted_text))), fmt)
            elif kind == "comparaison":
                if document_id_b is None:
                    raise ToolError("document_id_b est requis pour une comparaison.")
                b = _get_doc(db, document_id_b)
                meta["document"] = f"{d.filename} (A) / {b.filename} (B)"
                path = generate_comparison_report(meta, asdict(compare_texts(d.extracted_text, b.extracted_text)), fmt)
            else:
                raise ToolError("kind doit valoir « analyse », « risques » ou « comparaison ».")
        except ValueError as exc:
            raise ToolError(str(exc)) from exc
    return {"fichier": str(Path(path).resolve()), "format": fmt,
            "note": "Rapport genere par le moteur de regles ; a relire avant toute diffusion."}


TOOLS: tuple[Callable, ...] = (
    naftal_list_documents, naftal_read_document, naftal_analyze_document, naftal_analyze_text,
    naftal_compare_documents, naftal_compare_texts, naftal_risk_report, naftal_search,
    naftal_legal_references, naftal_import_file, naftal_generate_report,
)
WRITE_TOOLS = {"naftal_import_file", "naftal_generate_report", "naftal_analyze_document"}


# --------------------------------------------------------------------------- #
# Prompts : le « cerveau juridique » NAFTAL apporte dans la conversation
# --------------------------------------------------------------------------- #
def prompt_revue_contrat(document_id: str) -> str:
    """Revue complete d'un contrat enregistre, selon la methode NAFTAL (checklist,
    pre-analyse par regles, puis relecture critique)."""
    return f"""{legal_brain.SYSTEM_PROMPT}
Methode (document_id = {document_id}) :
1. Appelle naftal_read_document pour lire le texte INTEGRAL (toutes les tranches).
2. Appelle naftal_analyze_document : c'est une pre-analyse par regles, a confirmer ou nuancer.
3. {legal_brain.CHECKLIST}
4. Pour chaque point significatif : article vise, redaction actuelle (citation exacte),
   defaut, risque et gravite, redaction de remplacement en francais juridique.
   Format condense pour les points mineurs. Puis SYNTHESE et PROTECTIONS ABSENTES.
5. Avant de repondre, relis-toi comme un auditeur independant : toute citation est-elle
   exacte ? toute reference legale porte-t-elle « (a verifier) » ? un point de la
   checklist est-il oublie ? Corrige, puis donne la version finale.
Si utile, naftal_search pour comparer avec la pratique d'autres contrats enregistres."""


def prompt_correction_avenant(document_id: str, base_document_id: str = "") -> str:
    """Correction juridique d'un avenant en suivi des modifications."""
    base = (f"Lis aussi le contrat de base (document_id = {base_document_id}) avec naftal_read_document "
            "et verifie la coherence (numerotation, renvois, definitions).") if base_document_id else \
        "Aucun contrat de base fourni : signale ce qui ne peut pas etre verifie sans lui."
    return f"""{legal_brain.SYSTEM_PROMPT}
Lis l'avenant (document_id = {document_id}) avec naftal_read_document. {base}
Corrige-le en mode SUIVI DES MODIFICATIONS : [AJOUT] / [SUPPRESSION] / [REMPLACEMENT],
chaque modification avec sa RAISON juridique. Ne retouche PAS les conditions
commerciales (prix, quantites, remises) : liste-les a part. N'invente aucune clause."""


def prompt_memo_juridique(question: str) -> str:
    """Memorandum juridique interne, appuye sur le corpus NAFTAL."""
    return f"""{legal_brain.SYSTEM_PROMPT}
Utilise naftal_search (et naftal_legal_references si utile) pour t'appuyer sur les contrats
et references enregistres ; cite leurs sources. Redige un MEMORANDUM interne structure
(objet, rappel des faits, analyse, risques, recommandation). Toute reference legale :
« (a verifier) » si non confirmee sur le JORADP.

Sujet : {question}"""


PROMPTS: tuple[Callable, ...] = (prompt_revue_contrat, prompt_correction_avenant, prompt_memo_juridique)


# --------------------------------------------------------------------------- #
# Construction du serveur MCP
# --------------------------------------------------------------------------- #
def _wrap_errors(fn: Callable) -> Callable:
    """Transforme notre ToolError en ToolError du SDK MCP.

    Indispensable : le SDK v2 ne transmet a la conversation que le message des
    ToolError ; pour toute autre exception il le garde cote serveur et la
    conversation ne voit que « Error executing tool … », sans savoir pourquoi
    (article inexistant, PDF scanne, chemin faux…) ni comment corriger l'appel.
    """
    from mcp.server.mcpserver.exceptions import ToolError as SDKToolError

    @wraps(fn)
    def inner(*args: Any, **kwargs: Any) -> Any:
        try:
            return fn(*args, **kwargs)
        except ToolError as exc:
            raise SDKToolError(str(exc)) from None
    return inner


def build_server():
    from mcp.server.mcpserver import MCPServer
    from mcp.types import ToolAnnotations

    create_all()
    with session_scope() as db:
        seed_references(db)

    server = MCPServer(SERVER_NAME, title="NAFTAL Legal Intelligence", version=__version__,
                       instructions=INSTRUCTIONS)
    for fn in TOOLS:
        name = fn.__name__
        read_only = name not in WRITE_TOOLS
        # structured_output=True : sinon, avec « from __future__ import annotations », le type
        # de retour « dict » reste une chaine non resolue et le SDK ne renvoie que du texte.
        server.tool(name=name, structured_output=True, annotations=ToolAnnotations(
            readOnlyHint=read_only, destructiveHint=False, openWorldHint=False))(_wrap_errors(fn))
    for fn in PROMPTS:
        server.prompt(name=fn.__name__.removeprefix("prompt_"))(fn)
    return server


def main() -> None:
    build_server().run("stdio")


if __name__ == "__main__":
    main()
