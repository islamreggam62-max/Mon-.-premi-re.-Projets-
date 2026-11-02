"""Module C — Evaluation des risques contractuels.

Regroupe les constats d'une analyse par domaine de risque (juridique,
financier, operationnel, reglementaire) et determine un niveau global.
S'appuie uniquement sur les constats du moteur : aucune clause n'est qualifiee
d'illegale sans fondement — les categories decrivent une exposition, pas un
jugement de legalite.
"""
from __future__ import annotations

from .engine import AnalysisOutput

_DOMAIN_BY_CATEGORY = {
    "Prix et conditions de paiement": "financier",
    "Penalites": "financier",
    "Responsabilite": "juridique",
    "Resiliation": "juridique",
    "Objet du contrat": "juridique",
    "Identification des parties": "juridique",
    "Coherence": "juridique",
    "Droit applicable et reglement des litiges": "reglementaire",
    "Duree et renouvellement": "operationnel",
    "Garanties et assurances": "operationnel",
    "Force majeure": "operationnel",
    "Confidentialite": "operationnel",
}

_SEV_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
_DOMAIN_LABELS = {
    "juridique": "Risques juridiques",
    "financier": "Risques financiers",
    "operationnel": "Risques operationnels",
    "reglementaire": "Risques reglementaires",
}


def _overall_level(score: int, issues: list[dict]) -> str:
    sevs = [f["severity"] for f in issues if f["severity"] in _SEV_ORDER]
    worst = min(sevs, key=lambda s: _SEV_ORDER[s]) if sevs else "LOW"
    # Combine severite maximale et score agrege.
    if worst == "CRITICAL" or score >= 70:
        return "CRITICAL"
    if worst == "HIGH" or score >= 40:
        return "HIGH"
    if worst == "MEDIUM" or score >= 15:
        return "MEDIUM"
    return "LOW"


def risk_report(analysis) -> dict:
    """Accepte un AnalysisOutput ou le dict persiste d'une analyse."""
    if isinstance(analysis, dict):
        findings = analysis.get("findings", [])
        issues = [f for f in findings if f.get("severity") != "INFO"]
        counts = analysis.get("counts", {})
        risk_score = analysis.get("risk_score", 0)
        return _build(issues, counts, risk_score)
    issues = analysis.issues()
    return _build(issues, analysis.counts, analysis.risk_score)


def _build(issues: list[dict], counts: dict, risk_score: int) -> dict:
    domains: dict[str, list[dict]] = {k: [] for k in _DOMAIN_LABELS}
    for f in issues:
        domain = _DOMAIN_BY_CATEGORY.get(f["category"], "juridique")
        domains[domain].append(f)
    for lst in domains.values():
        lst.sort(key=lambda f: _SEV_ORDER.get(f["severity"], 9))

    domain_summary = []
    for key, label in _DOMAIN_LABELS.items():
        lst = domains[key]
        worst = (
            min((f["severity"] for f in lst), key=lambda s: _SEV_ORDER.get(s, 9))
            if lst
            else "LOW"
        )
        domain_summary.append(
            {
                "domain": key,
                "label": label,
                "count": len(lst),
                "level": worst if lst else "—",
                "findings": lst,
            }
        )

    return {
        "overall_level": _overall_level(risk_score, issues),
        "risk_score": risk_score,
        "counts": counts,
        "domains": domain_summary,
        "total_issues": len(issues),
    }
