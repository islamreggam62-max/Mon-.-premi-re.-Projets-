"""Decoupage d'un contrat en clauses/articles.

Adapte aux contrats commerciaux francais : reconnait « Article 5 »,
« ARTICLE V », « Art. 12 », « Article premier », ainsi que les numerotations
decimales (« 3.2 »). Le texte original de chaque clause est preserve
integralement (aucune reecriture), pour permettre des citations fiables.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Ordinaux ecrits en toutes lettres frequents dans les contrats.
_ORDINALS = {
    "premier": 1, "première": 1, "premiere": 1,
    "deuxième": 2, "deuxieme": 2, "second": 2, "seconde": 2,
    "troisième": 3, "troisieme": 3, "quatrième": 4, "quatrieme": 4,
    "cinquième": 5, "cinquieme": 5, "sixième": 6, "sixieme": 6,
    "septième": 7, "septieme": 7, "huitième": 8, "huitieme": 8,
    "neuvième": 9, "neuvieme": 9, "dixième": 10, "dixieme": 10,
}

_ROMAN = {
    "I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6, "VII": 7, "VIII": 8,
    "IX": 9, "X": 10, "XI": 11, "XII": 12, "XIII": 13, "XIV": 14, "XV": 15,
    "XVI": 16, "XVII": 17, "XVIII": 18, "XIX": 19, "XX": 20,
}

# En-tete d'article : capture le libelle complet et le reste de la ligne (titre).
_ARTICLE_RE = re.compile(
    r"^[ \t]*"
    r"(?P<label>(?:article|art\.?)\s+"
    r"(?P<num>\d{1,3}|premier|première|premiere|deuxième|deuxieme|second|seconde|"
    r"troisième|troisieme|quatrième|quatrieme|cinquième|cinquieme|sixième|sixieme|"
    r"septième|septieme|huitième|huitieme|neuvième|neuvieme|dixième|dixieme|"
    r"[IVXL]{1,6}))"
    r"[ \t]*[:.\-–—)]?[ \t]*(?P<title>.*)$",
    re.IGNORECASE,
)

# Numerotation decimale type « 3. » ou « 3.2 Objet ... » en debut de ligne.
_DECIMAL_RE = re.compile(
    r"^[ \t]*(?P<num>\d{1,2}(?:\.\d{1,2}){0,2})[ \t]*[.)\-–—:][ \t]+(?P<title>\S.*)$"
)


@dataclass
class Clause:
    ref: str          # ex. "Article 5" ou "3.2" ou "Préambule"
    number: int | None  # numero principal normalise (pour tri/alignement)
    title: str        # titre de la clause (peut etre vide)
    text: str         # texte integral de la clause (en-tete comprise)
    start_line: int

    @property
    def body(self) -> str:
        """Corps de la clause sans la ligne d'en-tete."""
        lines = self.text.split("\n")
        return "\n".join(lines[1:]).strip() if len(lines) > 1 else ""


def _normalize_num(raw: str) -> int | None:
    raw = raw.strip().lower()
    if raw.isdigit():
        return int(raw)
    if raw in _ORDINALS:
        return _ORDINALS[raw]
    up = raw.upper()
    if up in _ROMAN:
        return _ROMAN[up]
    # numerotation decimale : on prend l'entier de tete
    if "." in raw and raw.split(".")[0].isdigit():
        return int(raw.split(".")[0])
    return None


def _match_heading(line: str) -> tuple[str, int | None, str] | None:
    """Retourne (ref, number, title) si la ligne est un en-tete de clause."""
    stripped = line.strip()
    if not stripped or len(stripped) > 160:
        return None
    m = _ARTICLE_RE.match(line)
    if m:
        num_raw = m.group("num")
        number = _normalize_num(num_raw)
        label = re.sub(r"\s+", " ", m.group("label").strip())
        # Normalise « Art. » / « ARTICLE » en « Article N ».
        ref = f"Article {num_raw}" if number is not None else label
        ref = ref[0].upper() + ref[1:]
        return ref, number, m.group("title").strip()
    m = _DECIMAL_RE.match(line)
    if m:
        num_raw = m.group("num")
        return num_raw, _normalize_num(num_raw), m.group("title").strip()
    return None


def segment_clauses(text: str) -> list[Clause]:
    """Decoupe le texte en clauses. Conserve le texte original tel quel."""
    if not text or not text.strip():
        return []
    lines = text.split("\n")
    headings: list[tuple[int, str, int | None, str]] = []
    for i, line in enumerate(lines):
        h = _match_heading(line)
        if h:
            headings.append((i, h[0], h[1], h[2]))

    clauses: list[Clause] = []
    # Preambule : tout ce qui precede le premier en-tete.
    first_idx = headings[0][0] if headings else len(lines)
    preamble = "\n".join(lines[:first_idx]).strip()
    if preamble:
        clauses.append(
            Clause(ref="Préambule", number=0, title="", text=preamble, start_line=0)
        )

    for j, (line_idx, ref, number, title) in enumerate(headings):
        end = headings[j + 1][0] if j + 1 < len(headings) else len(lines)
        block = "\n".join(lines[line_idx:end]).strip()
        clauses.append(
            Clause(ref=ref, number=number, title=title, text=block, start_line=line_idx)
        )
    return clauses
