"""Jeu d'evaluation du RAG (petit, synthetique, ecrit AVANT le nouveau lexique).

Limites honnetes : 20 requetes sur 3 contrats synthetiques (28 clauses). C'est un
garde-fou de regression et un indicateur, PAS une preuve de performance sur les
contrats reels de NAFTAL. Les requetes et le lexique ont le meme auteur : une
partie du gain mesure est donc potentiellement optimiste.
"""
from __future__ import annotations

from pathlib import Path

_HERE = Path(__file__).resolve().parent
_SAMPLES = _HERE.parent / "naftal" / "samples"

# (requete, {passages attendus}) ; identifiant de passage = "<corpus> — Article N"
GOLD: list[tuple[str, set[str]]] = [
    # --- Formulations proches du texte du contrat (controle de non-regression) ---
    ("responsabilité illimitée du client", {"V2 — Article 5"}),
    ("reconduction tacite du contrat", {"V2 — Article 2"}),
    ("préavis de huit jours", {"V2 — Article 7"}),
    ("révision unilatérale des prix", {"V2 — Article 3"}),
    ("attestation d'assurance responsabilité civile", {"V1 — Article 6", "T — Article 6"}),
    ("intérêts moratoires retard de règlement", {"T — Article 3"}),
    # --- Formulations differentes du texte (synonymes, flexions, termes voisins) ---
    ("résiliation anticipée du contrat", {"V1 — Article 8", "V2 — Article 7", "T — Article 8"}),
    ("indemnisation du donneur d'ordre pour les pertes", {"T — Article 5"}),
    ("force majeure", {"V1 — Article 7", "V2 — Article 6", "T — Article 7"}),
    ("tribunal compétent en cas de litige", {"V1 — Article 9", "V2 — Article 8", "T — Article 9"}),
    ("obligation de non-divulgation", {"T — Article 10"}),
    ("durée du contrat et reconduction", {"V1 — Article 2", "V2 — Article 2", "T — Article 2"}),
    ("plafond de responsabilité", {"V1 — Article 5", "T — Article 5"}),
    ("règlement amiable des différends", {"V1 — Article 9", "T — Article 9"}),
    ("sinistre", {"T — Article 6", "V1 — Article 6"}),
    ("rémunération du transporteur", {"T — Article 3"}),
    ("rupture avant le terme avec préavis", {"V2 — Article 7", "T — Article 8", "V1 — Article 8"}),
    ("délai de paiement des factures", {"V1 — Article 3", "V2 — Article 3", "T — Article 3"}),
    ("arbitrage international", {"V2 — Article 8"}),
    ("événement imprévisible", {"V1 — Article 7", "V2 — Article 6", "T — Article 7"}),
]


def load_corpus() -> list[dict]:
    return [
        {"label": "V1", "text": (_SAMPLES / "contrat_demo_v1.txt").read_text()},
        {"label": "V2", "text": (_SAMPLES / "contrat_demo_v2.txt").read_text()},
        {"label": "T", "text": (_HERE / "fixtures" / "contrat_transport.txt").read_text()},
    ]


def evaluate(search_ids, queries=None) -> dict:
    """search_ids(query, k) -> liste ordonnee d'identifiants de passages.

    Retourne MRR@10, hit@1, hit@3 et rappel moyen@5, plus le detail par requete.
    """
    queries = queries or GOLD
    rr, h1, h3, rec5, detail = [], 0, 0, [], []
    for query, gold in queries:
        ranked = search_ids(query, 10)
        first = next((i for i, d in enumerate(ranked, 1) if d in gold), None)
        rr.append(1.0 / first if first else 0.0)
        h1 += 1 if first == 1 else 0
        h3 += 1 if first is not None and first <= 3 else 0
        rec5.append(len(gold & set(ranked[:5])) / len(gold))
        detail.append((query, first))
    n = len(queries)
    return {
        "n": n,
        "mrr": sum(rr) / n,
        "hit@1": h1 / n,
        "hit@3": h3 / n,
        "recall@5": sum(rec5) / n,
        "detail": detail,
    }
