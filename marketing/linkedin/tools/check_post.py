#!/usr/bin/env python3
"""Measure a LinkedIn draft before it is published.

Usage:
    python3 marketing/linkedin/tools/check_post.py DRAFT.md [--kind post|comment|headline|about|tagline]
    cat draft.txt | python3 marketing/linkedin/tools/check_post.py - --kind comment

Prints, as JSON: length (LinkedIn-style UTF-16 units and plain characters),
the limit for the field, words, lines, hashtags, links, em dashes, the text
visible before "see more" (about 140 characters on mobile, 210 on desktop),
and the phrases from ai-phrases.md found in the text.

If the file has a "<!-- post -->" ... "<!-- /post -->" block (the format the
skills save drafts in), only that block is measured.

Standard library only. Limits come from linkedin-rules.md; update both together.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PHRASES_FILE = HERE.parent / "ai-phrases.md"

# Field limits, in LinkedIn characters (see linkedin-rules.md for confidence).
LIMITS = {
    "post": 3000,
    "comment": 1250,
    "headline": 220,
    "about": 2600,
    "tagline": 120,
}
FOLD_MOBILE = 140
FOLD_DESKTOP = 210

POST_BLOCK = re.compile(r"<!--\s*post\s*-->(.*?)<!--\s*/post\s*-->", re.S | re.I)
HASHTAG = re.compile(r"(?<![\w&])#[^\s#]+", re.U)
LINK = re.compile(r"https?://\S+|\bwww\.\S+", re.I)


def utf16_len(text: str) -> int:
    """Length as LinkedIn and most web counters measure it (emoji = 2)."""
    return len(text.encode("utf-16-le")) // 2


def extract_post(text: str) -> str:
    match = POST_BLOCK.search(text)
    return (match.group(1) if match else text).strip()


def load_phrases(path: Path = PHRASES_FILE) -> list[str]:
    """Literal phrases listed in ai-phrases.md.

    A phrase line starts with a bold label and separates its items with '·'
    ("**Openers:** Let's dive in · Picture this"). Structures are written as
    bullets in that file and are left to the reader: they cannot be matched
    literally.
    """
    if not path.exists():
        return []
    phrases: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line.startswith("**") or "·" not in line:
            continue
        line = re.sub(r"^\*\*[^*]+\*\*\s*", "", line)  # drop the bold label
        for item in line.split("·"):
            item = re.sub(r"\([^)]*\)", "", item)  # "(as a verb)" and the like
            item = item.strip().strip("\"«»“”.…:").strip()
            item = item.rstrip("…").strip()
            if 2 < len(item) <= 40 and not item.startswith("<"):
                phrases.append(item)
    return sorted(set(phrases), key=str.lower)


def find_phrases(text: str, phrases: list[str]) -> list[str]:
    found = []
    lowered = text.lower()
    for phrase in phrases:
        needle = phrase.lower()
        # Whole-word match for Latin script; plain substring otherwise.
        if re.search(r"[a-zà-ÿ]", needle):
            if re.search(r"(?<!\w)" + re.escape(needle) + r"(?!\w)", lowered):
                found.append(phrase)
        elif needle in lowered:
            found.append(phrase)
    return found


def fold(text: str, limit: int) -> str:
    """Text shown before "see more": at most `limit` units, cut on a space."""
    out = ""
    for ch in text:
        if utf16_len(out + ch) > limit:
            cut = out.rsplit(" ", 1)[0] if " " in out else out
            return cut.rstrip() + "…"
        out += ch
    return out


def check(text: str, kind: str = "post") -> dict:
    body = extract_post(text)
    limit = LIMITS[kind]
    length = utf16_len(body)
    first_line = next((l for l in body.splitlines() if l.strip()), "")
    return {
        "kind": kind,
        "length_utf16": length,
        "length_chars": len(body),
        "limit": limit,
        "within_limit": length <= limit,
        "remaining": limit - length,
        "words": len(re.findall(r"\w+", body, re.U)),
        "lines": body.count("\n") + 1 if body else 0,
        "first_line_length": utf16_len(first_line),
        "hashtags": HASHTAG.findall(body),
        "links": LINK.findall(body),
        "em_dashes": body.count("—"),
        "fold_mobile": fold(body, FOLD_MOBILE),
        "fold_desktop": fold(body, FOLD_DESKTOP),
        "ai_phrases_found": find_phrases(body, load_phrases()),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("path", help="draft file, or - for stdin")
    parser.add_argument("--kind", choices=sorted(LIMITS), default="post")
    args = parser.parse_args(argv)
    text = sys.stdin.read() if args.path == "-" else Path(args.path).read_text(encoding="utf-8")
    result = check(text, args.kind)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["within_limit"] else 1


if __name__ == "__main__":
    sys.exit(main())
