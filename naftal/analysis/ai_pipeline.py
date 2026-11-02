"""Pipeline d'analyse IA multi-etapes (ce qui depasse une reponse de chat unique).

Etapes :
  1. Pre-analyse DETERMINISTE par regles (filet de securite, ancrage).
  2. Recuperation RAG du contexte pertinent dans le corpus de l'utilisateur.
  3. Analyse LLM specialisee (persona + checklist du cerveau juridique).
  4. Passe d'AUTO-VERIFICATION : un second appel audite et consolide la 1re analyse.

La passe d'auto-verification est precisement ce qu'une reponse de chat en un seul
coup ne fait pas : elle reduit les erreurs et les inventions, et impose la mention
« a verifier » sur les references non confirmees.

Repli : si la couche LLM est desactivee ou indisponible, le pipeline renvoie
proprement l'analyse deterministe, en le signalant (jamais d'echec silencieux).
"""
from __future__ import annotations

from dataclasses import asdict
from typing import Callable

from ..llm import legal_brain
from ..llm.provider import LLMResult, run_llm
from .engine import analyze_text
from .retrieval import Retriever

# Type d'une fonction LLM injectable (facilite les tests).
LLMFn = Callable[[str, str, int], LLMResult]


def _rule_summary(contract_text: str) -> tuple[str, int]:
    out = analyze_text(contract_text)
    lines = []
    for f in out.issues():
        lines.append(f"- [{f['severity']}] {f['category']} @ {f['article_ref']} : {f['problem']}")
    return ("\n".join(lines) if lines else "(aucun point releve par les regles)", out.risk_score)


def deep_analysis(
    contract_text: str,
    retriever: Retriever | None = None,
    llm_fn: LLMFn = run_llm,
    self_verify: bool = True,
    max_tokens: int = 2600,
) -> dict:
    """Analyse approfondie : regles -> RAG -> LLM -> auto-verification."""
    if not (contract_text or "").strip():
        return {"ok": False, "used_llm": False, "error": "Texte de contrat vide."}

    rule_summary, rule_score = _rule_summary(contract_text)

    # Contexte RAG (optionnel).
    corpus = None
    if retriever is not None:
        corpus = retriever.context_block(contract_text[:1500], k=4) or None

    # Etape 3 : analyse LLM specialisee.
    first = llm_fn(
        legal_brain.SYSTEM_PROMPT,
        legal_brain.prompt_full_analysis(contract_text, rule_summary, corpus),
        max_tokens,
    )
    if not first.ok:
        # Repli deterministe : on ne pretend jamais avoir fait une analyse IA.
        return {
            "ok": False,
            "used_llm": False,
            "fallback": True,
            "rule_score": rule_score,
            "rule_summary": rule_summary,
            "error": first.error,
            "note": (
                "Couche IA indisponible — analyse deterministe (par regles) seulement. "
                "Activez la couche LLM pour l'analyse approfondie."
            ),
        }

    final_text = first.text
    verified = False
    if self_verify:
        critique = llm_fn(
            legal_brain.SYSTEM_PROMPT,
            legal_brain.prompt_self_critique(contract_text, first.text),
            max_tokens,
        )
        if critique.ok and critique.text.strip():
            final_text = critique.text
            verified = True

    return {
        "ok": True,
        "used_llm": True,
        "self_verified": verified,
        "rule_score": rule_score,
        "rule_summary": rule_summary,
        "grounded_on_corpus": bool(corpus),
        "draft_analysis": first.text,       # 1re passe (transparence)
        "analysis": final_text,              # version consolidee/auditee
        "model": first.model,
        "provider": first.provider,
        "tokens": {"in": first.tokens_in, "out": first.tokens_out},
    }


def _single(system: str, prompt: str, llm_fn: LLMFn, max_tokens: int, label: str) -> dict:
    res = llm_fn(system, prompt, max_tokens)
    if not res.ok:
        return {"ok": False, "used_llm": False, "error": res.error,
                "note": "Couche IA indisponible pour cette operation."}
    return {"ok": True, "used_llm": True, "result": res.text, "kind": label,
            "model": res.model, "provider": res.provider}


def amendment_correction(amendment_text: str, base_contract: str | None = None,
                         llm_fn: LLMFn = run_llm, max_tokens: int = 2600) -> dict:
    return _single(
        legal_brain.SYSTEM_PROMPT,
        legal_brain.prompt_amendment_correction(amendment_text, base_contract),
        llm_fn, max_tokens, "avenant",
    )


def legal_memo(question: str, retriever: Retriever | None = None,
               llm_fn: LLMFn = run_llm, max_tokens: int = 2200) -> dict:
    corpus = retriever.context_block(question, k=5) if retriever else None
    return _single(
        legal_brain.SYSTEM_PROMPT,
        legal_brain.prompt_memo(question, corpus or None),
        llm_fn, max_tokens, "memorandum",
    )


def clause_rewrite(clause_text: str, objective: str = "",
                   llm_fn: LLMFn = run_llm, max_tokens: int = 1200) -> dict:
    return _single(
        legal_brain.SYSTEM_PROMPT,
        legal_brain.prompt_clause_rewrite(clause_text, objective),
        llm_fn, max_tokens, "reecriture",
    )
