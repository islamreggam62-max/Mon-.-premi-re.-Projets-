"""Comparaison approfondie de deux versions d'un contrat.

La comparaison ne se limite pas aux differences textuelles : elle aligne les
clauses (par reference puis par similarite), classe chaque changement
(cosmetique, linguistique, structurel, substantiel, financier, haut risque) et
en evalue l'impact. Le libelle original de chaque clause est preserve.
"""
from __future__ import annotations

import difflib
import re
from dataclasses import asdict, dataclass, field

from ..extraction.segmentation import Clause, segment_clauses
from .engine import analyze_text
from .rules import RISK_PATTERNS, norm

# Un montant/taux/delai = un nombre SUIVI d'une unite (evite de capter les
# renvois d'articles « 127 » ou « version 2 », qui ne sont pas financiers).
_NUM_RE = re.compile(
    r"(\d[\d\s.,]*)\s*(%|da\b|dinars?|dzd|eur\b|usd\b|mois|jours?|ans?|annees?|annee|semaines?)",
    re.IGNORECASE,
)
_MATCH_THRESHOLD = 0.5
_RISK_TERMS = (
    "responsabilite illimitee", "tacite reconduction", "reconduit tacitement",
    "resiliation unilateral", "resilier a tout moment", "sans preavis",
    "ne saurait etre tenu responsable", "exonere de toute responsabilite",
    "revisable unilateral", "penalite",
)
_OBLIGATION_TERMS = ("doit", "s'engage", "garantit", "s'oblige", "est tenu", "devra", "s'interdit")

_CLASS_RISK = {
    "cosmetique": "LOW",
    "linguistique": "LOW",
    "structurelle": "MEDIUM",
    "substantielle": "HIGH",
    "financiere": "HIGH",
    "haut_risque": "CRITICAL",
}
_RISK_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


@dataclass
class ChangeItem:
    kind: str            # "ajout" | "suppression" | "modification"
    ref_a: str
    ref_b: str
    change_class: str    # cosmetique / linguistique / ... / haut_risque
    risk: str            # LOW..CRITICAL
    before: str
    after: str
    explanation: str
    legal_impact: str
    recommended_action: str
    diff: str = ""


@dataclass
class ComparisonOutput:
    summary: str
    changes: list[dict] = field(default_factory=list)
    counts: dict = field(default_factory=dict)
    risk_score_a: int = 0
    risk_score_b: int = 0


def _numbers(text: str) -> set[str]:
    out: set[str] = set()
    for value, unit in _NUM_RE.findall(text):
        v = re.sub(r"\s+", "", value).rstrip(".,")
        out.add(f"{v}{unit.lower().strip()}")
    return out


def _unified_diff(a: str, b: str) -> str:
    diff = difflib.unified_diff(
        a.split("\n"), b.split("\n"), fromfile="version A", tofile="version B", lineterm=""
    )
    return "\n".join(list(diff)[:60])


def _classify_change(a: str, b: str) -> tuple[str, str, str]:
    """Retourne (change_class, explanation, legal_impact)."""
    na, nb = norm(a), norm(b)
    # Cosmetique : identique apres normalisation forte (casse, espaces, ponctuation).
    strip_a = re.sub(r"[\s\W_]+", "", na)
    strip_b = re.sub(r"[\s\W_]+", "", nb)
    if strip_a == strip_b:
        return ("cosmetique", "Modification de pure forme (casse, espaces, ponctuation).", "Aucun impact juridique.")

    # Haut risque : apparition d'un terme sensible absent de la version A.
    for term in _RISK_TERMS:
        if term in nb and term not in na:
            return (
                "haut_risque",
                f"Introduction d'une stipulation sensible (« {term} »).",
                "Transfert ou aggravation de risque (responsabilite, sortie du contrat, prix).",
            )

    # Financiere : les montants/pourcentages/delais changent.
    num_a, num_b = _numbers(a), _numbers(b)
    if num_a != num_b:
        added = sorted(num_b - num_a)
        removed = sorted(num_a - num_b)
        detail = []
        if removed:
            detail.append("retire : " + ", ".join(removed[:6]))
        if added:
            detail.append("ajoute : " + ", ".join(added[:6]))
        return (
            "financiere",
            "Modification de valeurs chiffrees (montants, taux ou delais) — " + " ; ".join(detail) + ".",
            "Impact direct sur l'exposition financiere ou les delais.",
        )

    # Substantielle : ajout/retrait d'obligations (verbes d'engagement).
    ob_a = sum(na.count(t) for t in _OBLIGATION_TERMS)
    ob_b = sum(nb.count(t) for t in _OBLIGATION_TERMS)
    if ob_a != ob_b:
        sens = "ajout" if ob_b > ob_a else "retrait"
        return (
            "substantielle",
            f"Modification des obligations ({sens} d'engagements contractuels).",
            "Changement de l'etendue des droits et obligations des parties.",
        )

    # Structurelle : reorganisation notable (longueur tres differente).
    ratio = difflib.SequenceMatcher(None, na, nb).ratio()
    if ratio < 0.6 or abs(len(na) - len(nb)) > max(80, 0.4 * max(len(na), 1)):
        return ("structurelle", "Reecriture structurelle de la clause.", "A verifier : la portee juridique peut avoir change.")

    return ("linguistique", "Modification de redaction sans changement chiffre ni d'obligation apparent.", "Impact juridique a priori limite, a confirmer.")


def _risk_patterns_in(text: str) -> list[tuple[str, str]]:
    """Motifs de risque (reutilise le detecteur du moteur d'analyse)."""
    out: list[tuple[str, str]] = []
    nt = norm(text)
    for rp in RISK_PATTERNS:
        if rp.pattern.search(text):
            if rp.key == "penalite_sans_plafond" and re.search(
                r"plafon|dans la limite de|au maximum|ne (?:peut|pourra) exceder", nt
            ):
                continue
            if rp.key == "exoneration_totale" and ("force majeure" in nt or "cas fortuit" in nt):
                continue
            out.append((rp.severity, rp.problem))
    return out


def _worst(sevs: list[str]) -> str | None:
    present = [s for s in sevs if s in _RISK_ORDER]
    return min(present, key=lambda s: _RISK_ORDER[s]) if present else None


def _action_for(change_class: str) -> str:
    return {
        "cosmetique": "Aucune action : changement de forme.",
        "linguistique": "Relecture simple pour confirmer l'absence d'effet juridique.",
        "structurelle": "Verifier que la portee de la clause est preservee.",
        "substantielle": "Revue juridique : valider le nouvel equilibre des obligations.",
        "financiere": "Revue avec le gestionnaire : valider l'impact financier/delais (conditions commerciales).",
        "haut_risque": "Revue juridique prioritaire : negocier/encadrer la stipulation sensible.",
    }.get(change_class, "Revue juridique.")


def _similarity(ca: Clause, cb: Clause) -> float:
    """Similarite de deux clauses : corps + bonus si meme titre."""
    body = difflib.SequenceMatcher(None, norm(ca.text), norm(cb.text)).ratio()
    if ca.title and cb.title:
        title = difflib.SequenceMatcher(None, norm(ca.title), norm(cb.title)).ratio()
        return 0.75 * body + 0.25 * title
    return body


def compare_texts(text_a: str, text_b: str) -> ComparisonOutput:
    clauses_a = segment_clauses(text_a)
    clauses_b = segment_clauses(text_b)

    changes: list[ChangeItem] = []

    # Alignement par SIMILARITE DE CONTENU (robuste a la renumerotation).
    # On classe toutes les paires possibles par similarite decroissante, puis
    # on apparie gloutonnement au-dessus d'un seuil.
    scored: list[tuple[float, int, int]] = []
    for i, ca in enumerate(clauses_a):
        for j, cb in enumerate(clauses_b):
            scored.append((_similarity(ca, cb), i, j))
    scored.sort(reverse=True)

    used_a: set[int] = set()
    used_b: set[int] = set()
    pairs: list[tuple[int, int]] = []
    for ratio, i, j in scored:
        if ratio < _MATCH_THRESHOLD:
            break
        if i in used_a or j in used_b:
            continue
        used_a.add(i)
        used_b.add(j)
        pairs.append((i, j))

    # Paires appariees : inchangees ou modifiees.
    for i, j in sorted(pairs):
        ca, cb = clauses_a[i], clauses_b[j]
        if ca.text.strip() == cb.text.strip():
            continue  # clause inchangee
        cls, expl, impact = _classify_change(ca.text, cb.text)
        risk = _CLASS_RISK[cls]
        # Motif de risque NOUVELLEMENT introduit (present apres, absent avant).
        new_risks = [p for p in _risk_patterns_in(cb.text) if p not in _risk_patterns_in(ca.text)]
        worst = _worst([s for s, _ in new_risks])
        if worst and _RISK_ORDER[worst] < _RISK_ORDER[risk]:
            cls = "haut_risque"
            risk = worst
            expl += " Stipulation sensible introduite : " + "; ".join(p for _, p in new_risks) + "."
            impact = "Aggravation du risque (responsabilite, prix, sortie du contrat)."
        if norm(ca.ref) != norm(cb.ref):
            expl = f"Clause renumerotee ({ca.ref} → {cb.ref}). " + expl
        changes.append(
            ChangeItem(
                kind="modification", ref_a=ca.ref, ref_b=cb.ref,
                change_class=cls, risk=risk,
                before=ca.text, after=cb.text,
                explanation=expl, legal_impact=impact,
                recommended_action=_action_for(cls), diff=_unified_diff(ca.text, cb.text),
            )
        )

    # Clauses de A non appariees -> supprimees.
    for i, ca in enumerate(clauses_a):
        if i in used_a:
            continue
        changes.append(
            ChangeItem(
                kind="suppression", ref_a=ca.ref, ref_b="(absente)",
                change_class="substantielle", risk="HIGH",
                before=ca.text, after="",
                explanation=f"Clause « {ca.ref} » ({ca.title or 'sans titre'}) supprimee dans la nouvelle version.",
                legal_impact="Perte possible d'une protection ou d'une obligation.",
                recommended_action="Verifier pourquoi la clause a ete retiree et l'impact de sa disparition.",
            )
        )

    # Clauses de B non appariees -> ajoutees.
    for j, cb in enumerate(clauses_b):
        if j in used_b:
            continue
        risks = _risk_patterns_in(cb.text)
        worst = _worst([s for s, _ in risks])
        risk = worst if worst else "MEDIUM"
        expl = f"Nouvelle clause « {cb.ref} » ({cb.title or 'sans titre'}) ajoutee dans la nouvelle version."
        if risks:
            expl += " Stipulation sensible : " + "; ".join(p for _, p in risks) + "."
        changes.append(
            ChangeItem(
                kind="ajout", ref_a="(absente)", ref_b=cb.ref,
                change_class="haut_risque" if risk in ("CRITICAL", "HIGH") else "substantielle",
                risk=risk, before="", after=cb.text,
                explanation=expl,
                legal_impact="Nouvelle obligation ou nouveau droit introduit.",
                recommended_action="Revue juridique de la clause ajoutee.",
            )
        )

    changes.sort(key=lambda c: (_RISK_ORDER.get(c.risk, 9), c.ref_b, c.ref_a))

    counts: dict[str, int] = {"ajout": 0, "suppression": 0, "modification": 0}
    risk_counts: dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for c in changes:
        counts[c.kind] += 1
        risk_counts[c.risk] = risk_counts.get(c.risk, 0) + 1

    out_a = analyze_text(text_a)
    out_b = analyze_text(text_b)

    summary = (
        f"{len(changes)} changement(s) : {counts['ajout']} ajout(s), "
        f"{counts['suppression']} suppression(s), {counts['modification']} modification(s). "
        f"Repartition des risques — critique {risk_counts['CRITICAL']}, eleve {risk_counts['HIGH']}, "
        f"moyen {risk_counts['MEDIUM']}, faible {risk_counts['LOW']}. "
        f"Score de risque : version A {out_a.risk_score}/100 -> version B {out_b.risk_score}/100."
    )

    return ComparisonOutput(
        summary=summary,
        changes=[asdict(c) for c in changes],
        counts={"kinds": counts, "risks": risk_counts},
        risk_score_a=out_a.risk_score,
        risk_score_b=out_b.risk_score,
    )
