"""Moteur d'analyse multi-etapes (deterministe).

STAGE 1 Extraction      -> fournie en amont (module extraction)
STAGE 2 Structure       -> segmentation en clauses
STAGE 3 Clauses         -> classification par categorie
STAGE 4 Analyse         -> presence/absence des provisions, motifs de risque
STAGE 5 Risques         -> severite et score agrege
STAGE 6 Verification     -> coherence interne (incoherences, doublons)
STAGE 7 Rapport         -> synthese structuree

Chaque constat renvoie a un article et a un extrait reels. Aucune provision
n'est inventee : une provision absente est marquee present=False.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field

from ..extraction.segmentation import Clause, segment_clauses
from .rules import PROVISIONS, RISK_PATTERNS, norm

_SEV_POINTS = {"CRITICAL": 28, "HIGH": 14, "MEDIUM": 6, "LOW": 2, "INFO": 0}
_SEV_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "INFO": 4}

_MONTHS = (
    "janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|"
    "septembre|octobre|novembre|decembre|décembre"
)
_DATE_RE = re.compile(
    rf"\b(\d{{1,2}}\s+(?:{_MONTHS})\s+\d{{4}}|\d{{1,2}}[/\-.]\d{{1,2}}[/\-.]\d{{2,4}})\b",
    re.IGNORECASE,
)
_REF_RE = re.compile(
    r"(?:contrat|marche|march[ée]|convention|r[ée]f[ée]rence|r[ée]f\.?|n[°o]|num[ée]ro)\s*"
    r"[:°n]?\s*([A-Z0-9][A-Z0-9][A-Z0-9\-/\.]{1,28})",
    re.IGNORECASE,
)
_LEGAL_FORM = r"(?:SPA|S\.P\.A|SARL|S\.A\.R\.L|EURL|E\.U\.R\.L|SNC|GIE|EPE|EPIC|SA|S\.A)"
_PARTY_RE = re.compile(rf"\b([A-ZÉÈÀÂÇ][\wÉÈÀÂÇéèàâç&.'\- ]{{1,70}}?)\s+({_LEGAL_FORM})\b")
_EXCERPT_MAX = 600


@dataclass
class Finding:
    category: str
    article_ref: str
    excerpt: str
    problem: str
    legal_significance: str
    commercial_consequence: str
    severity: str
    recommendation: str
    proposed_wording: str
    present: bool
    source: str = "rule"


@dataclass
class AnalysisOutput:
    summary: str
    structure: list[dict] = field(default_factory=list)
    parties: list[str] = field(default_factory=list)
    references: list[str] = field(default_factory=list)
    dates: list[str] = field(default_factory=list)
    findings: list[dict] = field(default_factory=list)
    counts: dict = field(default_factory=dict)
    risk_score: int = 0
    clause_count: int = 0
    used_llm: bool = False

    def issues(self) -> list[dict]:
        """Constats autres qu'informatifs (classes par severite)."""
        return [f for f in self.findings if f["severity"] != "INFO"]


def _excerpt(text: str, limit: int = _EXCERPT_MAX) -> str:
    text = text.strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def _extract_parties(text: str) -> list[str]:
    head = text[:3000]
    found: list[str] = []
    for m in _PARTY_RE.finditer(head):
        name = f"{m.group(1).strip()} {m.group(2).strip()}"
        name = re.sub(r"\s+", " ", name).strip(" .,-")
        if 3 < len(name) < 90 and name not in found:
            found.append(name)
    if "naftal" in norm(head) and not any("naftal" in norm(p) for p in found):
        found.insert(0, "NAFTAL")
    return found[:8]


def _extract_references(text: str) -> list[str]:
    refs: list[str] = []
    for m in _REF_RE.finditer(text[:4000]):
        ref = m.group(1).strip(" .,-")
        if any(ch.isdigit() for ch in ref) and ref not in refs:
            refs.append(ref)
    return refs[:10]


def _extract_dates(text: str) -> list[str]:
    seen: list[str] = []
    for m in _DATE_RE.finditer(text):
        d = m.group(1).strip()
        if d not in seen:
            seen.append(d)
    return seen[:15]


def _classify_clause(clause: Clause) -> set[str]:
    """Categories de provisions couvertes par cette clause."""
    body = norm(clause.ref + " " + clause.title + " " + clause.text)
    hits: set[str] = set()
    for prov in PROVISIONS:
        n = sum(1 for kw in prov.keywords if kw in body)
        if n >= prov.min_hits:
            hits.add(prov.key)
    return hits


def _detect_inconsistencies(clauses: list[Clause], full_norm: str) -> list[Finding]:
    findings: list[Finding] = []
    # Droit applicable contradictoire : algerien ET etranger mentionnes.
    alg = "droit algerien" in full_norm or "loi algerienne" in full_norm
    etr = bool(re.search(r"(droit|loi)\s+(francais|suisse|anglais|etranger)", full_norm))
    if alg and etr:
        findings.append(
            Finding(
                category="Coherence",
                article_ref="(plusieurs clauses)",
                excerpt="Mentions simultanees d'un droit algerien et d'un droit etranger.",
                problem="Incoherence possible sur le droit applicable (algerien et etranger mentionnes).",
                legal_significance="Deux lois applicables contradictoires creent une insecurite juridique.",
                commercial_consequence="Risque de conflit de lois et d'issue de litige imprevisible.",
                severity="HIGH",
                recommendation="Harmoniser la clause de droit applicable sur une seule loi.",
                proposed_wording="",
                present=True,
            )
        )
    # Durees multiples contradictoires (ex. 12 mois et 24 mois).
    durees = set(re.findall(r"duree[^.\n]{0,40}?(\d{1,3})\s*(?:mois|ans|annee)", full_norm))
    if len(durees) > 1:
        findings.append(
            Finding(
                category="Coherence",
                article_ref="(clauses de duree)",
                excerpt="Durees differentes detectees : " + ", ".join(sorted(durees)),
                problem="Plusieurs durees differentes mentionnees dans le contrat.",
                legal_significance="Une duree contractuelle doit etre univoque.",
                commercial_consequence="Ambiguite sur le terme des engagements.",
                severity="MEDIUM",
                recommendation="Verifier et unifier la duree du contrat dans toutes les clauses.",
                proposed_wording="",
                present=True,
            )
        )
    return findings


def analyze_text(text: str, use_llm: bool = False) -> AnalysisOutput:
    clauses = segment_clauses(text)
    full_norm = norm(text)
    structure = [{"ref": c.ref, "title": c.title} for c in clauses]

    # STAGE 3 : classification de chaque clause.
    coverage: dict[str, list[Clause]] = {p.key: [] for p in PROVISIONS}
    for clause in clauses:
        for key in _classify_clause(clause):
            coverage[key].append(clause)

    findings: list[Finding] = []
    prov_by_key = {p.key: p for p in PROVISIONS}

    # STAGE 4a : provisions presentes (constat informatif) ou absentes.
    for prov in PROVISIONS:
        matched = coverage[prov.key]
        if matched:
            primary = matched[0]
            findings.append(
                Finding(
                    category=prov.label,
                    article_ref=primary.ref,
                    excerpt=_excerpt(primary.text),
                    problem="Provision presente dans le contrat.",
                    legal_significance=prov.significance,
                    commercial_consequence="",
                    severity="INFO",
                    recommendation="",
                    proposed_wording="",
                    present=True,
                )
            )
        else:
            findings.append(
                Finding(
                    category=prov.label,
                    article_ref="(absente)",
                    excerpt="",
                    problem=f"Provision ABSENTE : {prov.label}.",
                    legal_significance=prov.significance,
                    commercial_consequence=prov.consequence,
                    severity=prov.missing_severity,
                    recommendation=prov.missing_reco,
                    proposed_wording=prov.proposed_wording,
                    present=False,
                )
            )

    # STAGE 4b : motifs de risque dans les clauses presentes.
    for clause in clauses:
        for rp in RISK_PATTERNS:
            m = rp.pattern.search(clause.text)
            if not m:
                continue
            nclause = norm(clause.text)
            # Le motif "penalite" n'est signale que si aucun plafond n'apparait.
            if rp.key == "penalite_sans_plafond":
                if re.search(r"plafon|dans la limite de|au maximum|ne (?:peut|pourra) exceder", nclause):
                    continue
            # L'exoneration dans une clause de force majeure est legitime.
            if rp.key == "exoneration_totale" and ("force majeure" in nclause or "cas fortuit" in nclause):
                continue
            findings.append(
                Finding(
                    category=rp.category,
                    article_ref=clause.ref,
                    excerpt=_excerpt(clause.text),
                    problem=rp.problem,
                    legal_significance=rp.significance,
                    commercial_consequence=rp.consequence,
                    severity=rp.severity,
                    recommendation=rp.recommendation,
                    proposed_wording=rp.proposed_wording,
                    present=True,
                )
            )

    # STAGE 6 : verification de coherence.
    findings.extend(_detect_inconsistencies(clauses, full_norm))

    # STAGE 5 : score de risque agrege (0-100).
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    points = 0
    for f in findings:
        counts[f.severity] = counts.get(f.severity, 0) + 1
        points += _SEV_POINTS.get(f.severity, 0)
    risk_score = min(100, points)

    findings.sort(key=lambda f: (_SEV_ORDER.get(f.severity, 9), not f.present))

    # STAGE 7 : synthese.
    present_provs = sum(1 for p in PROVISIONS if coverage[p.key])
    missing = [prov_by_key[p.key].label for p in PROVISIONS if not coverage[p.key]]
    n_issues = counts["CRITICAL"] + counts["HIGH"] + counts["MEDIUM"] + counts["LOW"]
    summary_lines = [
        f"{len(clauses)} clause(s) identifiee(s) ; {present_provs}/{len(PROVISIONS)} provisions-cles presentes.",
        f"{n_issues} point(s) d'attention : {counts['CRITICAL']} critique(s), "
        f"{counts['HIGH']} eleve(s), {counts['MEDIUM']} moyen(s), {counts['LOW']} faible(s).",
    ]
    if missing:
        summary_lines.append("Provisions absentes : " + ", ".join(missing) + ".")
    summary_lines.append(f"Score de risque global : {risk_score}/100.")

    return AnalysisOutput(
        summary="\n".join(summary_lines),
        structure=structure,
        parties=_extract_parties(text),
        references=_extract_references(text),
        dates=_extract_dates(text),
        findings=[asdict(f) for f in findings],
        counts=counts,
        risk_score=risk_score,
        clause_count=len(clauses),
        used_llm=use_llm,
    )
