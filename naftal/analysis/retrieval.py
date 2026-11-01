"""Memoire RAG : recherche hybride sur le corpus de l'utilisateur.

Objectif : ancrer les reponses de l'IA et la recherche plein texte sur les
PROPRES contrats et references de l'utilisateur.

Moteur (v2) :
  - lexical : BM25 sur des jetons racinises (lexicon.stem), sans mots vides, avec
    un bonus pour les termes du titre de clause, et expansion de la requete par
    les groupes de synonymes juridiques (poids reduit) ;
  - semantique OPTIONNEL : si une fonction d'embeddings est fournie, les rangs
    lexical et semantique sont fusionnes par Reciprocal Rank Fusion (RRF).

Par defaut tout est local, deterministe et sans dependance (confidentialite).
Si le backend d'embeddings est configure mais echoue, la recherche REPLIE sur le
lexical et le signale (`mode`, `dense_error`) au lieu d'echouer en silence.
"""
from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass, field
from typing import Callable

from . import lexicon

EmbedFn = Callable[[list[str]], list[list[float]]]

_K1 = 1.4          # saturation de la frequence des termes (BM25)
_B = 0.75          # normalisation par la longueur
_TITLE_BOOST = 2   # occurrences supplementaires accordees aux termes du titre
_RRF_K = 60        # constante de Reciprocal Rank Fusion
_DENSE_POOL = 30   # nombre de candidats par liste avant fusion
# Au sein d'une « famille » (mot de la requete + voisins de groupe) : meilleur terme
# + _FAMILY_TAIL x (somme des autres termes presents). 0 = max pur ; 1 = somme pure.
# Choix : 0 (le terme exact l'emporte, les synonymes ne s'additionnent pas). Mesure :
# sur l'interface (2 contrats), « rupture avant terme » -> clause de resiliation au
# rang 1 avec 0, mais au rang 3 des que le dernier > 0 (la clause « Duree » cumule
# duree + reconduit + tacitement). Sur le jeu d'evaluation (28 passages) 0 a 0.2 sont
# equivalents et 0.3+ gagne UNE requete : echantillons trop petits pour trancher ;
# le max pur est retenu pour sa simplicite et l'absence de parametre ajuste.
_FAMILY_TAIL = 0.0


@dataclass
class Passage:
    doc_id: str          # identifiant lisible (ex. "Contrat X — Article 3")
    text: str
    source: str = ""     # "contrat" | "reference"
    meta: dict = field(default_factory=dict)   # ex. {"document_id": 3, "ref": "Article 3"}
    _tf: Counter = field(default_factory=Counter, repr=False)
    _len: int = field(default=0, repr=False)
    _vec: list[float] | None = field(default=None, repr=False)


@dataclass
class Retriever:
    passages: list[Passage] = field(default_factory=list)
    embed_fn: EmbedFn | None = None
    dense_error: str = ""
    _idf: dict[str, float] = field(default_factory=dict, repr=False)
    _avgdl: float = field(default=1.0, repr=False)
    _built: bool = field(default=False, repr=False)
    _dense_ok: bool = field(default=False, repr=False)

    # ------------------------------------------------------------------ #
    def add(self, doc_id: str, text: str, source: str = "", title: str = "",
            meta: dict | None = None) -> None:
        text = (text or "").strip()
        if not text:
            return
        toks = lexicon.tokens(text)
        tf = Counter(toks)
        for t in lexicon.tokens(title):          # bonus : le titre pese davantage
            tf[t] += _TITLE_BOOST
        self.passages.append(
            Passage(doc_id=doc_id, text=text, source=source, meta=dict(meta or {}),
                    _tf=tf, _len=max(1, len(toks)))
        )
        self._built = False

    def build(self) -> "Retriever":
        n = len(self.passages)
        df: Counter = Counter()
        for p in self.passages:
            df.update(p._tf.keys())
        # IDF de BM25 (toujours > 0 grace au « 1 + »)
        self._idf = {t: math.log(1 + (n - d + 0.5) / (d + 0.5)) for t, d in df.items()}
        self._avgdl = (sum(p._len for p in self.passages) / n) if n else 1.0
        self._built = True
        self._build_dense()
        return self

    def _build_dense(self) -> None:
        self._dense_ok = False
        self.dense_error = ""
        if self.embed_fn is None or not self.passages:
            return
        try:
            vecs = self.embed_fn([p.text[:2000] for p in self.passages])
            if len(vecs) != len(self.passages):
                raise ValueError("nombre de vecteurs inattendu")
            for p, v in zip(self.passages, vecs):
                p._vec = v
            self._dense_ok = True
        except Exception as exc:  # noqa: BLE001 - repli explicite, jamais silencieux
            self.dense_error = f"{type(exc).__name__}: {exc}"

    @property
    def mode(self) -> str:
        """« lexical », « hybride » ou « lexical (repli) » si les embeddings ont echoue."""
        if self.embed_fn is None:
            return "lexical"
        if not self._built:
            return "hybride (non construit)"
        return "hybride" if self._dense_ok else "lexical (repli)"

    # ------------------------------------------------------------------ #
    def _bm25(self, families: list[dict[str, float]]) -> list[tuple[Passage, float]]:
        """BM25 : chaque mot de la requete contribue par une famille a rendement decroissant."""
        scored: list[tuple[Passage, float]] = []
        for p in self.passages:
            denom_norm = 1 - _B + _B * p._len / self._avgdl
            s = 0.0
            for family in families:
                best, total = 0.0, 0.0
                for term, w in family.items():
                    tf = p._tf.get(term)
                    if not tf:
                        continue
                    v = w * self._idf.get(term, 0.0) * tf * (_K1 + 1) / (tf + _K1 * denom_norm)
                    total += v
                    if v > best:
                        best = v
                s += best + _FAMILY_TAIL * (total - best)
            if s > 0:
                scored.append((p, s))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    def _dense_rank(self, query: str) -> list[tuple[Passage, float]]:
        try:
            qv = self.embed_fn([query])[0]  # type: ignore[misc]
        except Exception as exc:  # noqa: BLE001
            self.dense_error = f"{type(exc).__name__}: {exc}"
            return []
        qn = math.sqrt(sum(x * x for x in qv)) or 1.0
        out: list[tuple[Passage, float]] = []
        for p in self.passages:
            if p._vec is None:
                continue
            pn = math.sqrt(sum(x * x for x in p._vec)) or 1.0
            sim = sum(a * b for a, b in zip(qv, p._vec)) / (qn * pn)
            out.append((p, sim))
        out.sort(key=lambda x: x[1], reverse=True)
        return out

    def search(self, query: str, k: int = 4) -> list[tuple[Passage, float]]:
        if not self.passages or not (query or "").strip():
            return []
        if not self._built:
            self.build()
        families = lexicon.query_families(query)
        lexical = self._bm25(families) if families else []

        if not (self.embed_fn and self._dense_ok):
            return lexical[:k]

        dense = self._dense_rank(query)[:_DENSE_POOL]
        if not dense:               # embeddings de la requete indisponibles -> lexical
            return lexical[:k]
        fused: dict[int, float] = {}
        by_id: dict[int, Passage] = {}
        for ranking in (lexical[:_DENSE_POOL], dense):
            for rank, (p, _s) in enumerate(ranking, 1):
                fused[id(p)] = fused.get(id(p), 0.0) + 1.0 / (_RRF_K + rank)
                by_id[id(p)] = p
        ordered = sorted(fused.items(), key=lambda kv: kv[1], reverse=True)
        return [(by_id[i], s) for i, s in ordered[:k]]

    def context_block(self, query: str, k: int = 4, max_chars: int = 2500) -> str:
        """Texte de contexte pret a injecter dans un prompt."""
        out, used = [], 0
        for p, _score in self.search(query, k):
            snippet = p.text.strip()
            if len(snippet) > 700:
                snippet = snippet[:700].rstrip() + "…"
            block = f"[{p.doc_id}] ({p.source})\n{snippet}"
            if used + len(block) > max_chars:
                break
            out.append(block)
            used += len(block)
        return "\n\n".join(out)


def build_corpus_retriever(documents: list[dict], references: list[dict] | None = None,
                           embed_fn: EmbedFn | None = None) -> Retriever:
    """Construit un retriever a partir de documents (clauses) et de references.

    documents : [{"label": str, "text": str, "id": int | None}]
    references : [{"label": str, "text": str}]
    """
    from ..extraction.segmentation import segment_clauses

    r = Retriever(embed_fn=embed_fn)
    for doc in documents:
        label = doc.get("label", "document")
        for clause in segment_clauses(doc.get("text", "")):
            r.add(
                f"{label} — {clause.ref}", clause.text, source="contrat",
                title=f"{clause.title}",
                meta={"document_id": doc.get("id"), "ref": clause.ref, "title": clause.title},
            )
    for ref in references or []:
        r.add(ref.get("label", "reference"), ref.get("text", ""), source="reference")
    return r.build()
