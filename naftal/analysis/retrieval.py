"""Memoire RAG : recherche sur le corpus de l'utilisateur, sans dependance externe.

Objectif : ancrer les reponses de l'IA sur les PROPRES contrats et references de
l'utilisateur (ce qu'une conversation vierge ne peut pas faire). On decoupe les
documents en passages, on les indexe par TF-IDF (implementation pure Python) et
on recupere les passages les plus pertinents pour une requete.

Cette approche est locale, deterministe et sans dependance. Elle peut etre
remplacee plus tard par des embeddings LLM pour une meilleure qualite semantique
(voir DEVELOPMENT_LOG). Ici, la robustesse et la confidentialite priment.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field

from .rules import norm

# Mots vides francais frequents (liste courte, suffisante pour la ponderation).
_STOP = {
    "le", "la", "les", "un", "une", "des", "de", "du", "au", "aux", "et", "ou",
    "a", "en", "dans", "par", "pour", "sur", "sous", "avec", "sans", "que", "qui",
    "ce", "cet", "cette", "ces", "se", "sa", "son", "ses", "est", "sont", "etre",
    "il", "elle", "ils", "elles", "ne", "pas", "plus", "au", "aux", "d", "l", "s",
    "present", "contrat", "clause", "article", "partie", "parties",
}
_WORD = re.compile(r"[a-z0-9]{2,}")


def _tokens(text: str) -> list[str]:
    return [w for w in _WORD.findall(norm(text)) if w not in _STOP and len(w) > 1]


@dataclass
class Passage:
    doc_id: str          # identifiant lisible (ex. "Contrat X — Article 3")
    text: str
    source: str = ""     # type de source ("contrat", "reference")
    _tf: Counter = field(default_factory=Counter, repr=False)


@dataclass
class Retriever:
    passages: list[Passage] = field(default_factory=list)
    _idf: dict[str, float] = field(default_factory=dict, repr=False)

    def add(self, doc_id: str, text: str, source: str = "") -> None:
        text = (text or "").strip()
        if not text:
            return
        self.passages.append(Passage(doc_id=doc_id, text=text, source=source, _tf=Counter(_tokens(text))))

    def build(self) -> "Retriever":
        n = len(self.passages)
        df: Counter = Counter()
        for p in self.passages:
            df.update(set(p._tf))
        self._idf = {t: math.log((1 + n) / (1 + d)) + 1 for t, d in df.items()}
        return self

    def _vec(self, tf: Counter) -> dict[str, float]:
        total = sum(tf.values()) or 1
        return {t: (c / total) * self._idf.get(t, math.log(len(self.passages) + 1) + 1) for t, c in tf.items()}

    def search(self, query: str, k: int = 4) -> list[tuple[Passage, float]]:
        if not self.passages:
            return []
        if not self._idf:
            self.build()
        qv = self._vec(Counter(_tokens(query)))
        if not qv:
            return []
        qnorm = math.sqrt(sum(v * v for v in qv.values())) or 1.0
        scored: list[tuple[Passage, float]] = []
        for p in self.passages:
            pv = self._vec(p._tf)
            dot = sum(qv.get(t, 0.0) * v for t, v in pv.items())
            pnorm = math.sqrt(sum(v * v for v in pv.values())) or 1.0
            sim = dot / (qnorm * pnorm)
            if sim > 0:
                scored.append((p, sim))
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:k]

    def context_block(self, query: str, k: int = 4, max_chars: int = 2500) -> str:
        """Texte de contexte pret a injecter dans un prompt."""
        hits = self.search(query, k)
        out, used = [], 0
        for p, score in hits:
            snippet = p.text.strip()
            if len(snippet) > 700:
                snippet = snippet[:700].rstrip() + "…"
            block = f"[{p.doc_id}] ({p.source})\n{snippet}"
            if used + len(block) > max_chars:
                break
            out.append(block)
            used += len(block)
        return "\n\n".join(out)


def build_corpus_retriever(documents: list[dict], references: list[dict] | None = None) -> Retriever:
    """Construit un retriever a partir de documents (clauses) et references.

    documents : [{"label": str, "text": str}]
    references : [{"label": str, "text": str}]
    """
    from ..extraction.segmentation import segment_clauses

    r = Retriever()
    for doc in documents:
        label = doc.get("label", "document")
        for clause in segment_clauses(doc.get("text", "")):
            r.add(f"{label} — {clause.ref}", clause.text, source="contrat")
    for ref in references or []:
        r.add(ref.get("label", "reference"), ref.get("text", ""), source="reference")
    return r.build()
