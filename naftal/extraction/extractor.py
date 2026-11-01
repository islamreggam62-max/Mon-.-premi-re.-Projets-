"""Extraction du texte complet des contrats (PDF, DOCX, TXT).

Principe de rigueur : le systeme ne pretend jamais avoir analyse un texte qu'il
n'a pas pu extraire. En cas d'echec (par ex. PDF scanne sans couche texte),
`ExtractionResult.ok` vaut False et `note` explique la limite.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ExtractionResult:
    text: str
    page_count: int
    char_count: int
    ok: bool
    note: str = ""
    mime_type: str = ""
    sha256: str = ""
    warnings: list[str] = field(default_factory=list)


def sha256_of_file(path: str | Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _clean(text: str) -> str:
    # Normalise les sauts de ligne et supprime les espaces en fin de ligne.
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.rstrip() for ln in text.split("\n")]
    out: list[str] = []
    blank = 0
    for ln in lines:
        if ln.strip() == "":
            blank += 1
            if blank <= 2:  # au plus une ligne vide consecutive conservee (bloc)
                out.append("")
        else:
            blank = 0
            out.append(ln)
    return "\n".join(out).strip()


def _extract_txt(path: Path) -> ExtractionResult:
    raw = path.read_bytes()
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = raw.decode("utf-8", errors="replace")
    text = _clean(text)
    return ExtractionResult(
        text=text,
        page_count=max(1, text.count("\f") + 1),
        char_count=len(text),
        ok=bool(text.strip()),
        note="" if text.strip() else "Fichier texte vide.",
        mime_type="text/plain",
    )


def _extract_docx(path: Path) -> ExtractionResult:
    from docx import Document as Docx  # import tardif

    doc = Docx(str(path))
    parts: list[str] = []
    for para in doc.paragraphs:
        parts.append(para.text)
    # Tableaux (frequents dans les contrats : prix, quantites, annexes).
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells]
            if any(cells):
                parts.append(" | ".join(cells))
    text = _clean("\n".join(parts))
    return ExtractionResult(
        text=text,
        page_count=0,  # DOCX ne fournit pas de pagination fiable
        char_count=len(text),
        ok=bool(text.strip()),
        note="" if text.strip() else "Document DOCX sans texte exploitable.",
        mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


def _extract_pdf(path: Path) -> ExtractionResult:
    warnings: list[str] = []
    text = ""
    page_count = 0
    # 1) pdfplumber (meilleure mise en page) ; repli sur pypdf.
    try:
        import pdfplumber

        with pdfplumber.open(str(path)) as pdf:
            page_count = len(pdf.pages)
            pages = []
            for p in pdf.pages:
                pages.append(p.extract_text() or "")
            text = "\n\f\n".join(pages)
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"pdfplumber: {exc}")
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            page_count = len(reader.pages)
            pages = [(pg.extract_text() or "") for pg in reader.pages]
            text = "\n\f\n".join(pages)
        except Exception as exc2:  # noqa: BLE001
            warnings.append(f"pypdf: {exc2}")

    text = _clean(text)
    ok = bool(text.strip())
    note = ""
    if not ok:
        note = (
            "Aucun texte extrait du PDF. Le document est probablement scanne "
            "(image sans couche texte) ; une reconnaissance optique (OCR) serait "
            "necessaire. L'analyse ne peut pas porter sur un texte non extrait."
        )
    return ExtractionResult(
        text=text,
        page_count=page_count,
        char_count=len(text),
        ok=ok,
        note=note,
        mime_type="application/pdf",
        warnings=warnings,
    )


def extract_text(path: str | Path) -> ExtractionResult:
    path = Path(path)
    suffix = path.suffix.lower()
    if suffix == ".txt":
        res = _extract_txt(path)
    elif suffix == ".docx":
        res = _extract_docx(path)
    elif suffix == ".pdf":
        res = _extract_pdf(path)
    else:
        res = ExtractionResult(
            text="",
            page_count=0,
            char_count=0,
            ok=False,
            note=f"Format non pris en charge : {suffix or '(inconnu)'}.",
        )
    res.sha256 = sha256_of_file(path)
    return res
