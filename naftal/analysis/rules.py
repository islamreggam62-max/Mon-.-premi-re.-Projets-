"""Regles d'analyse : catalogue des provisions attendues et motifs de risque.

Principe directeur : le moteur ne cite que ce qu'il trouve reellement dans le
texte extrait. Une provision absente est signalee comme ABSENTE (present=False),
jamais inventee. Les severites sont des heuristiques d'aide a la revue ; elles
ne constituent pas un avis juridique definitif.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field


def norm(text: str) -> str:
    """Minuscule + suppression des accents, pour une detection robuste."""
    text = text.lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return text


@dataclass(frozen=True)
class Provision:
    key: str
    label: str                    # libelle FR de la provision
    keywords: tuple[str, ...]     # termes (normalises) indiquant sa presence
    missing_severity: str         # severite si absente
    significance: str             # portee juridique
    consequence: str              # consequence commerciale
    missing_reco: str             # recommandation si absente
    proposed_wording: str         # proposition de redaction si absente
    min_hits: int = 1             # nombre de termes a trouver pour considerer presente


# Catalogue des provisions attendues dans un contrat commercial.
PROVISIONS: tuple[Provision, ...] = (
    Provision(
        key="objet",
        label="Objet du contrat",
        keywords=("objet du present", "a pour objet", "objet du contrat"),
        missing_severity="HIGH",
        significance="L'objet determine l'etendue des engagements ; son absence rend le contrat imprecis et potentiellement nul pour indetermination.",
        consequence="Risque de litige sur le perimetre des prestations et de contestation de la validite du contrat.",
        missing_reco="Inserer une clause d'objet definissant precisement les prestations/fournitures.",
        proposed_wording="Article [N] — Objet : Le present contrat a pour objet [description precise des biens/services], dans les conditions definies ci-apres.",
    ),
    Provision(
        key="parties",
        label="Identification des parties",
        keywords=("entre les soussignes", "d'une part", "ci-apres denomme", "entre :", "represente par"),
        missing_severity="HIGH",
        significance="L'identification complete des parties (denomination, forme, siege, pouvoirs du signataire) conditionne l'opposabilite du contrat.",
        consequence="Difficulte a executer ou a poursuivre en cas de defaut d'identification ou de pouvoirs.",
        missing_reco="Completer l'identite de chaque partie et la qualite/pouvoirs du signataire.",
        proposed_wording="Entre : [Denomination], [forme sociale], au capital de [montant], RC n° [...], siege [...], representee par [nom, qualite] dument habilite(e).",
    ),
    Provision(
        key="prix_paiement",
        label="Prix et conditions de paiement",
        keywords=("paiement", "prix", "facture", "reglement", "echeance", "montant", "da ht", "dinars"),
        missing_severity="HIGH",
        significance="Les modalites de prix et de paiement (montant, delai, mode, penalites de retard) sont essentielles a l'equilibre financier.",
        consequence="Exposition a des retards de paiement, a des litiges sur les montants et a des difficultes de recouvrement.",
        missing_reco="Preciser le prix, la devise, le delai et le mode de paiement, ainsi que les penalites de retard.",
        proposed_wording="Article [N] — Prix et paiement : Le prix est fixe a [montant] [devise] [HT/TTC]. Le paiement intervient a [delai] par [mode]. Tout retard entraine une penalite de [taux] sans mise en demeure prealable.",
        min_hits=1,
    ),
    Provision(
        key="duree",
        label="Duree et renouvellement",
        keywords=("duree", "entree en vigueur", "prend effet", "reconduction", "renouvellement", "proroge"),
        missing_severity="MEDIUM",
        significance="La duree fixe le terme des obligations ; les modalites de renouvellement evitent les reconductions non voulues.",
        consequence="Incertitude sur la fin des engagements et risque de reconduction tacite non maitrisee.",
        missing_reco="Fixer une duree determinee, la date d'effet et les conditions de renouvellement.",
        proposed_wording="Article [N] — Duree : Le contrat prend effet le [date] pour une duree de [X] mois. Il peut etre renouvele par accord ecrit des parties, a defaut il prend fin de plein droit.",
    ),
    Provision(
        key="resiliation",
        label="Resiliation / resolution",
        keywords=("resiliation", "resolution", "resilier", "mettre fin", "clause resolutoire", "preavis"),
        missing_severity="HIGH",
        significance="Les modalites de resiliation encadrent la sortie du contrat (preavis, faute, clause resolutoire) et protegent contre une rupture abusive.",
        consequence="Risque de blocage contractuel ou de rupture unilaterale sans cadre, source de contentieux et d'indemnites.",
        missing_reco="Prevoir les cas et la procedure de resiliation (preavis, mise en demeure, effets).",
        proposed_wording="Article [N] — Resiliation : En cas de manquement grave non repare dans un delai de [X] jours apres mise en demeure, la partie lesee peut resilier de plein droit, sans prejudice de dommages-interets.",
    ),
    Provision(
        key="responsabilite",
        label="Responsabilite",
        keywords=("responsabilite", "responsable", "dommages", "prejudice", "indemnisation", "indemnite"),
        missing_severity="HIGH",
        significance="La clause de responsabilite repartit les risques et peut plafonner l'exposition ; son absence laisse jouer le droit commun, souvent defavorable.",
        consequence="Exposition potentiellement illimitee aux dommages et difficulte a anticiper le risque financier.",
        missing_reco="Definir l'etendue et, le cas echeant, le plafond de responsabilite de chaque partie.",
        proposed_wording="Article [N] — Responsabilite : La responsabilite de chaque partie au titre du present contrat est limitee aux dommages directs et plafonnee a [montant / X% du montant du contrat], hors faute lourde ou dolosive.",
    ),
    Provision(
        key="garanties",
        label="Garanties et assurances",
        keywords=("garantie", "garantir", "assurance", "police d'assurance", "caution", "responsabilite civile"),
        missing_severity="MEDIUM",
        significance="Les garanties et assurances securisent l'execution et couvrent les sinistres (RC, dommages, caution de bonne execution).",
        consequence="Absence de couverture en cas de sinistre ou de defaillance, charge financiere directe.",
        missing_reco="Exiger les garanties et attestations d'assurance adaptees a l'objet.",
        proposed_wording="Article [N] — Assurances : [La partie] justifie d'une police d'assurance RC couvrant les consequences pecuniaires de sa responsabilite, pour un montant minimal de [montant], et en remet attestation.",
    ),
    Provision(
        key="force_majeure",
        label="Force majeure",
        keywords=("force majeure", "cas fortuit", "evenement imprevisible"),
        missing_severity="MEDIUM",
        significance="La clause de force majeure suspend ou libere des obligations en cas d'evenement imprevisible, irresistible et exterieur.",
        consequence="A defaut, application du droit commun uniquement, avec incertitude sur la suspension des obligations.",
        missing_reco="Definir les evenements de force majeure, leurs effets (suspension/resiliation) et les obligations d'information.",
        proposed_wording="Article [N] — Force majeure : Aucune partie n'est responsable d'un manquement du a un cas de force majeure au sens de l'article 127 du Code civil algerien. La partie affectee en informe l'autre sous [X] jours. Au-dela de [X] jours, chaque partie peut resilier sans indemnite.",
    ),
    Provision(
        key="litiges",
        label="Droit applicable et reglement des litiges",
        keywords=("droit applicable", "loi applicable", "competence", "tribunal", "juridiction", "arbitrage", "litige", "differend"),
        missing_severity="MEDIUM",
        significance="La clause de droit applicable et de competence determine la loi et le juge en cas de differend.",
        consequence="A defaut, incertitude sur la juridiction competente et risque de procedures dans un for defavorable.",
        missing_reco="Designer le droit algerien et la juridiction competente (ou l'arbitrage, selon la politique interne).",
        proposed_wording="Article [N] — Droit applicable et litiges : Le present contrat est regi par le droit algerien. Tout differend releve de la competence des tribunaux d'Alger, a defaut de reglement amiable prealable.",
    ),
    Provision(
        key="confidentialite",
        label="Confidentialite",
        keywords=("confidentialite", "confidentiel", "secret", "non-divulgation", "ne pas divulguer"),
        missing_severity="LOW",
        significance="La clause de confidentialite protege les informations echangees pendant et apres le contrat.",
        consequence="Risque de divulgation d'informations commerciales sensibles sans recours contractuel.",
        missing_reco="Ajouter une obligation de confidentialite avec duree post-contractuelle.",
        proposed_wording="Article [N] — Confidentialite : Chaque partie s'engage a ne pas divulguer les informations confidentielles de l'autre pendant la duree du contrat et [X] ans apres son terme.",
    ),
)


@dataclass(frozen=True)
class RiskPattern:
    key: str
    category: str
    pattern: re.Pattern
    severity: str
    problem: str
    significance: str
    consequence: str
    recommendation: str
    proposed_wording: str = ""


def _rx(p: str) -> re.Pattern:
    return re.compile(p, re.IGNORECASE)


# Motifs de risque detectables dans les clauses PRESENTES.
RISK_PATTERNS: tuple[RiskPattern, ...] = (
    RiskPattern(
        key="resp_illimitee",
        category="Responsabilite",
        pattern=_rx(r"responsabilit\w*[^.\n]{0,50}?illimit"),
        severity="CRITICAL",
        problem="Clause prevoyant une responsabilite illimitee.",
        significance="Une responsabilite illimitee expose la partie concernee a des dommages sans plafond.",
        consequence="Exposition financiere potentiellement majeure, non bornee.",
        recommendation="Introduire un plafond de responsabilite (montant ou pourcentage du contrat) et limiter aux dommages directs.",
        proposed_wording="La responsabilite est limitee aux dommages directs et plafonnee a [montant / X% du montant du contrat], hors faute lourde ou dolosive.",
    ),
    RiskPattern(
        key="exoneration_totale",
        category="Responsabilite",
        pattern=_rx(r"(ne\s+saurait|ne\s+peut|ne\s+pourra)\s+(en\s+aucun\s+cas\s+)?etre\s+tenu\w*\s+responsable|degag\w*\s+de\s+toute\s+responsabilite|exonere\w*\s+de\s+toute\s+responsabilite"),
        severity="HIGH",
        problem="Clause d'exoneration totale de responsabilite au profit d'une seule partie.",
        significance="Une exoneration totale peut etre jugee abusive et desequilibre le contrat ; certaines exonerations sont inopposables en cas de faute lourde ou dolosive.",
        consequence="Transfert integral du risque sur l'autre partie ; clause potentiellement contestable.",
        recommendation="Reequilibrer : exclure les dommages indirects mais maintenir la responsabilite pour faute lourde/dolosive et dommages directs.",
    ),
    RiskPattern(
        key="tacite_sans_preavis",
        category="Duree et renouvellement",
        pattern=_rx(r"(tacite\s+reconduction|reconduit\w*\s+tacitement|renouvel\w*\s+automatiquement)"),
        severity="MEDIUM",
        problem="Reconduction tacite/automatique du contrat.",
        significance="La reconduction tacite peut engager pour une nouvelle periode sans decision expresse.",
        consequence="Engagement prolonge non maitrise et difficulte a sortir du contrat.",
        recommendation="Assortir la reconduction d'un preavis de non-renouvellement clair (ex. 3 mois) et notifie par ecrit.",
        proposed_wording="Le contrat peut etre reconduit sauf denonciation par l'une des parties par ecrit avec un preavis de [X] mois avant le terme.",
    ),
    RiskPattern(
        key="resiliation_unilaterale",
        category="Resiliation",
        pattern=_rx(r"resili\w*[^.\n]{0,45}?(a\s+tout\s+moment|unilateral\w*|sans\s+motif|discretionnaire)"),
        severity="HIGH",
        problem="Faculte de resiliation unilaterale/discretionnaire.",
        significance="Une resiliation sans motif ou discretionnaire au profit d'une partie cree un desequilibre et une insecurite.",
        consequence="Risque d'interruption brutale de la relation et de perte d'investissements.",
        recommendation="Encadrer : motifs, preavis suffisant, indemnisation eventuelle, reciprocite.",
    ),
    RiskPattern(
        key="penalite_sans_plafond",
        category="Penalites",
        pattern=_rx(r"penalit\w*|dommages\s*-?\s*interets|interets\s+de\s+retard"),
        severity="LOW",
        problem="Penalites stipulees : verifier la presence d'un plafond.",
        significance="Des penalites non plafonnees peuvent devenir disproportionnees.",
        consequence="Exposition a des penalites cumulatives importantes.",
        recommendation="Verifier/introduire un plafond global aux penalites (ex. 10% du montant du contrat).",
    ),
    RiskPattern(
        key="juridiction_etrangere",
        category="Droit applicable et reglement des litiges",
        pattern=_rx(r"(droit|loi)\s+(francais|suisse|anglais|etranger)|tribunaux\s+de\s+(paris|geneve|londres)|arbitrage\s+(international|cci|icc)"),
        severity="MEDIUM",
        problem="Droit applicable etranger ou arbitrage international.",
        significance="Le choix d'un droit/for etranger peut desavantager la partie algerienne et complexifier l'execution.",
        consequence="Couts et aleas proceduraux accrus ; necessite de verifier la conformite a la politique interne.",
        recommendation="Privilegier le droit algerien et une juridiction nationale, sauf raison imperative documentee.",
    ),
    RiskPattern(
        key="revision_unilaterale_prix",
        category="Prix et conditions de paiement",
        pattern=_rx(r"(prix|tarif)\w*[^.\n]{0,40}?(revisable\w*|revis\w*|modifi\w*)[^.\n]{0,25}?(unilateral|a\s+tout\s+moment|librement|discretion)|se\s+reserve\s+le\s+droit\s+de\s+modifier\s+(le\s+)?(prix|tarif)"),
        severity="HIGH",
        problem="Revision unilaterale du prix.",
        significance="Une revision unilaterale du prix par une partie rompt l'equilibre economique.",
        consequence="Augmentation imprevisible des couts.",
        recommendation="Encadrer la revision (formule d'indexation objective, plafond, accord prealable).",
    ),
)
