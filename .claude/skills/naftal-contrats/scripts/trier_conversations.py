#!/usr/bin/env python3
"""Extrait d'un export claude.ai les conversations qui portent sur les contrats.

Usage :
    python3 trier_conversations.py <export> -o <dossier> [--tout]

<export> : le zip de claude.ai (Settings > Privacy > Export data), son conversations.json,
ou un dossier de fichiers .json / .md produits par une extension d'export.
Chaque conversation retenue est écrite en Markdown dans <dossier>, avec un INDEX.md.
--tout : garde toutes les conversations (sans filtre).
Le dossier de sortie doit rester dans prive/ (exclu de git).
"""
import argparse
import json
import re
import sys
import zipfile
from pathlib import Path

MOTS = [
    r"contrats?", r"avenants?", r"convention", r"visée?s?", r"corrigée?s?", r"bordereau",
    r"fiche de suivi", r"naftal", r"d\.?com\b", r"mise en demeure", r"résiliation",
    r"cahier des charges", r"caution", r"l\s?089", r"commission", r"marché",
    r"عقد", r"عقود", r"ملحق", r"أفنون", r"تأشير", r"فسخ", r"إعذار", r"كفالة",
]
MOTIF = re.compile("|".join(MOTS), re.IGNORECASE)
SEUIL = 3  # nombre minimal de mots-clés distincts pour retenir une conversation


def texte_message(m):
    if m.get("text"):
        return m["text"]
    morceaux = []
    for c in m.get("content") or []:
        if isinstance(c, dict) and c.get("type") == "text":
            morceaux.append(c.get("text", ""))
    return "\n".join(morceaux)


def charger(chemin):
    """Renvoie une liste de conversations {titre, date, messages: [(auteur, texte)]}."""
    chemin = Path(chemin)
    brut = []
    if chemin.suffix == ".zip":
        with zipfile.ZipFile(chemin) as z:
            for nom in z.namelist():
                if nom.endswith("conversations.json"):
                    brut.extend(json.loads(z.read(nom)))
    elif chemin.is_dir():
        for f in sorted(chemin.rglob("*")):
            if f.suffix == ".json":
                d = json.loads(f.read_text(encoding="utf-8"))
                brut.extend(d if isinstance(d, list) else [d])
            elif f.suffix == ".md":
                brut.append({"name": f.stem, "created_at": "", "_markdown": f.read_text(encoding="utf-8")})
    else:
        d = json.loads(chemin.read_text(encoding="utf-8"))
        brut.extend(d if isinstance(d, list) else [d])

    conversations = []
    for c in brut:
        if "_markdown" in c:
            messages = [("", c["_markdown"])]
        else:
            messages = [(m.get("sender", ""), texte_message(m)) for m in c.get("chat_messages") or []]
        conversations.append({
            "titre": c.get("name") or "(sans titre)",
            "date": (c.get("created_at") or "")[:10],
            "messages": messages,
        })
    return conversations


def pertinente(conv):
    tout = conv["titre"] + "\n" + "\n".join(t for _, t in conv["messages"])
    return len({m.group(0).lower() for m in MOTIF.finditer(tout)}) >= SEUIL


def nom_fichier(conv, i):
    base = re.sub(r"[^\w\-]+", "_", conv["titre"], flags=re.UNICODE).strip("_")[:60]
    return f"{conv['date'] or 'sans-date'}_{i:03d}_{base}.md"


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("export")
    ap.add_argument("-o", "--sortie", required=True)
    ap.add_argument("--tout", action="store_true")
    args = ap.parse_args()

    sortie = Path(args.sortie)
    sortie.mkdir(parents=True, exist_ok=True)
    conversations = charger(args.export)
    retenues = [c for c in conversations if args.tout or pertinente(c)]
    retenues.sort(key=lambda c: c["date"])

    index = ["# Conversations claude.ai retenues", "",
             f"{len(retenues)} sur {len(conversations)} conversations.", "",
             "| Date | Titre | Messages | Fichier |", "|---|---|---|---|"]
    for i, c in enumerate(retenues, 1):
        f = nom_fichier(c, i)
        corps = [f"# {c['titre']}", "", f"Date : {c['date']}", ""]
        for auteur, texte in c["messages"]:
            corps += [f"## {'Utilisateur' if auteur == 'human' else 'Claude' if auteur else ''}".rstrip(),
                      "", texte.strip(), ""]
        (sortie / f).write_text("\n".join(corps), encoding="utf-8")
        index.append(f"| {c['date']} | {c['titre']} | {len(c['messages'])} | {f} |")
    (sortie / "INDEX.md").write_text("\n".join(index) + "\n", encoding="utf-8")
    print(f"{len(retenues)} conversation(s) retenue(s) sur {len(conversations)} -> {sortie}")


if __name__ == "__main__":
    sys.exit(main())
