"""Banc d'essai AVEUGLE : l'IA specialisee NAFTAL contre une conversation simple.

Trois bras, MEME modele, MEME contrat, MEME budget de sortie par appel :
  A  « chat nu »          : aucun systeme, consigne minimale (pire cas).
  B  « chat + regles »    : systeme NAFTAL (persona + regles de rigueur) + la MEME consigne
                            minimale. Le plus proche d'un chat ordinaire dote de vos preferences.
  C  « pipeline NAFTAL »  : systeme + checklist + pre-analyse par regles + auto-verification.

A -> B mesure ce qu'apportent la persona et les regles ; B -> C mesure ce qu'apportent
la checklist, la pre-analyse et le second passage d'audit. C'est la question posee :
« l'outil est-il plus fort qu'un chat ordinaire sur les contrats ? ».

Pourquoi c'est une mesure et non un avis : les sorties sont anonymisees et melangees ;
le juriste les classe SANS savoir de quel bras elles viennent ; les mesures objectives
(citations verbatim, renvois d'articles reels, references legales marquees « a verifier »,
rappel des defauts plantes) ne sont revelees qu'apres. Sa conception evite le piege
« le concepteur est aussi le juge ».

Limites (a garder en tete) :
- un chat reel (claude.ai) ajoute ses propres reglages, memoire et competences que l'API
  n'a pas : le bras B est une approximation, pas votre chat ;
- un contrat, peu d'executions, modele non deterministe : utilisez `--runs 3` ;
- l'anonymat est partiel (la mise en forme peut trahir le bras C) ;
- le « rappel » par expressions regulieres est grossier ; le jugement humain prime.
"""
from __future__ import annotations

import json
import random
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Callable

from .analysis import ai_pipeline
from .analysis.rules import norm
from .config import get_settings
from .extraction.segmentation import segment_clauses
from .llm import legal_brain
from .llm.provider import LLMResult

ARMS = ("A", "B", "C")
ARM_LABELS = {
    "A": "chat nu (aucun systeme)",
    "B": "chat + regles NAFTAL (persona / rigueur)",
    "C": "pipeline NAFTAL complet (checklist + pre-analyse + auto-verification)",
}
MAX_TOKENS = 2600
CALLS_PER_RUN = {"A": 1, "B": 1, "C": 2}

SAMPLES = Path(__file__).resolve().parent / "samples"

LLMFn = Callable[[str, str, int], LLMResult]


class BakeoffError(RuntimeError):
    pass


def minimal_prompt(contract_text: str) -> str:
    """Consigne volontairement simple, identique pour les bras A et B."""
    return (
        "Analyse ce contrat du point de vue juridique et signale les problemes, "
        "avec des propositions de correction.\n\nCONTRAT :\n\"\"\"\n"
        f"{contract_text}\n\"\"\""
    )


# --------------------------------------------------------------------------- #
# Execution d'un bras
# --------------------------------------------------------------------------- #
def run_arm(arm: str, contract_text: str, llm_fn: LLMFn) -> dict:
    calls = tin = tout = 0

    def counted(system: str, prompt: str, max_tokens: int) -> LLMResult:
        nonlocal calls, tin, tout
        res = llm_fn(system, prompt, max_tokens)
        calls += 1
        tin += res.tokens_in or 0
        tout += res.tokens_out or 0
        return res

    t0 = time.monotonic()
    extra: dict = {}
    if arm in ("A", "B"):
        system = "" if arm == "A" else legal_brain.SYSTEM_PROMPT
        res = counted(system, minimal_prompt(contract_text), MAX_TOKENS)
        ok, text, error = res.ok, (res.text if res.ok else ""), res.error
    elif arm == "C":
        out = ai_pipeline.deep_analysis(
            contract_text, retriever=None, llm_fn=counted, self_verify=True, max_tokens=MAX_TOKENS)
        ok, text, error = bool(out.get("ok")), out.get("analysis", ""), out.get("error", "")
        extra["self_verified"] = bool(out.get("self_verified"))
    else:
        raise ValueError(f"Bras inconnu : {arm}")
    return {"arm": arm, "ok": ok, "text": text, "error": error, "calls": calls,
            "tokens_in": tin, "tokens_out": tout, "seconds": round(time.monotonic() - t0, 1), **extra}


# --------------------------------------------------------------------------- #
# Mesures objectives (ne dependent d'aucun jugement)
# --------------------------------------------------------------------------- #
_QUOTE = re.compile(r"«\s*(.+?)\s*»|“([^”\n]{25,}?)”|\"([^\"\n]{25,}?)\"", re.S)
_ELLIPSIS = re.compile(r"…|\[\s*(?:\.\.\.|…)\s*\]|\.\.\.")
_ART = re.compile(
    r"\bart(?:icle)?s?\.?\s*(\d{1,3})\b"
    r"(?!\s*(?:du|de la|de l['’]|des)\s+(?:code|loi|ordonnance|decret|constitution))")
_LEGAL = re.compile(
    r"code civil|code de commerce|code des marches|loi n|ordonnance n|"
    r"decret (?:presidentiel |executif |legislatif )?n|article \d+ du code")


def _canon(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", norm(text)).strip()


def quote_stats(output: str, contract_text: str) -> tuple[int, int]:
    """(citations verifiables, citations reellement presentes dans le contrat)."""
    hay, total, ok = _canon(contract_text), 0, 0
    for m in _QUOTE.finditer(output):
        quote = next((g for g in m.groups() if g), "")
        frags = [f for f in _ELLIPSIS.split(quote) if len(_canon(f)) >= 20]
        if not frags:
            continue
        total += 1
        ok += all(_canon(f) in hay for f in frags)
    return total, ok


def article_ref_stats(output: str, contract_text: str) -> tuple[int, int]:
    """(renvois « Article N » au contrat, renvois a un article qui existe vraiment).

    Exclut « article 127 du Code civil » & co (renvois a la loi, pas au contrat)."""
    real = {c.number for c in segment_clauses(contract_text) if c.number}
    refs = [int(n) for n in _ART.findall(norm(output))]
    return len(refs), sum(1 for n in refs if n in real)


def legal_ref_stats(output: str) -> tuple[int, int]:
    """(lignes citant un texte juridique, dont la ligne ou la suivante dit « a verifier »)."""
    lines = output.split("\n")
    total = flagged = 0
    for i, line in enumerate(lines):
        if _LEGAL.search(norm(line)):
            total += 1
            window = norm(line + " " + (lines[i + 1] if i + 1 < len(lines) else ""))
            flagged += "verifier" in window
    return total, flagged


def truth_recall(output: str, truth: dict | None) -> tuple[int, int, list[str]]:
    if not truth:
        return 0, 0, []
    text, found, missed = norm(output), 0, []
    for issue in truth["issues"]:
        if re.search(issue["pattern"], text):
            found += 1
        else:
            missed.append(issue["label"])
    return found, len(truth["issues"]), missed


def objective_metrics(result: dict, contract_text: str, truth: dict | None) -> dict:
    text = result["text"]
    qt, qok = quote_stats(text, contract_text)
    at, aok = article_ref_stats(text, contract_text)
    lt, lflag = legal_ref_stats(text)
    found, n_truth, missed = truth_recall(text, truth)
    return {
        "arm": result["arm"], "calls": result["calls"], "tokens_in": result["tokens_in"],
        "tokens_out": result["tokens_out"], "seconds": result["seconds"],
        "words": len(text.split()), "quotes": qt, "quotes_verbatim": qok,
        "article_refs": at, "article_refs_valid": aok,
        "legal_refs": lt, "legal_refs_flagged": lflag,
        "truth_found": found, "truth_total": n_truth, "truth_missed": missed,
        "self_verified": result.get("self_verified"),
    }


def _never_found(all_metrics: list[dict], truth: dict | None) -> str:
    """Pour chaque bras : les defauts attendus manques dans TOUTES ses executions."""
    if not truth:
        return ""
    lines = []
    for arm in ARMS:
        sets = [set(m["truth_missed"]) for m in all_metrics if m["arm"] == arm]
        if sets:
            missed = sorted(set.intersection(*sets))
            where = "dans aucune execution" if len(sets) > 1 else "(1 execution)"
            lines.append(f"- Bras {arm} n'a PAS retrouve {where} : {'; '.join(missed) or 'rien (tout retrouve)'}\n")
    return "".join(lines)


def _rate(num: int, den: int) -> str:
    return f"{num}/{den}" + (f" ({100 * num / den:.0f} %)" if den else " (n/a)")


def metrics_table(all_metrics: list[dict]) -> str:
    lines = ["| Bras | runs | appels | mots | citations verbatim | renvois d'articles reels | "
             "refs legales « a verifier » | defauts plantes retrouves | secondes |",
             "|---|---|---|---|---|---|---|---|---|"]
    for arm in ARMS:
        ms = [m for m in all_metrics if m["arm"] == arm]
        if not ms:
            continue
        s = lambda k: sum(m[k] for m in ms)  # noqa: E731
        lines.append(
            f"| **{arm}** {ARM_LABELS[arm]} | {len(ms)} | {s('calls')} | {s('words') // len(ms)} | "
            f"{_rate(s('quotes_verbatim'), s('quotes'))} | {_rate(s('article_refs_valid'), s('article_refs'))} | "
            f"{_rate(s('legal_refs_flagged'), s('legal_refs'))} | "
            f"{_rate(s('truth_found'), s('truth_total')) if s('truth_total') else 'n/a (pas de verite terrain)'} | "
            f"{s('seconds') / len(ms):.0f} |")
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# Conditionnement aveugle
# --------------------------------------------------------------------------- #
_RUBRIC = [
    ("Fidelite au contrat", "Cite-t-il les vrais articles et le vrai texte, sans rien inventer ?"),
    ("Risques majeurs", "Voit-il les problemes qui comptent vraiment (pas seulement des details) ?"),
    ("Justesse juridique", "Les analyses tiennent-elles en droit algerien ? Pas de fausse certitude ?"),
    ("Redactions proposees", "Les clauses de remplacement sont-elles utilisables telles quelles ?"),
    ("Honnetete des sources", "Les references de textes sont-elles prudentes (« a verifier ») et non inventees ?"),
    ("Style juridique", "Francais juridique precis, sobre, professionnel ?"),
    ("Utilite pratique", "Vous ferait-il gagner du temps sur un vrai dossier ?"),
]


def _sheet(ids: list[str], name: str) -> str:
    head = "| Sortie | " + " | ".join(r[0] for r in _RUBRIC) + " |"
    sep = "|---|" + "---|" * len(_RUBRIC)
    rows = "\n".join("| " + i + " |" + " |" * len(_RUBRIC) for i in sorted(ids))
    crit = "\n".join(f"- **{k}** : {v}" for k, v in _RUBRIC)
    return (
        f"# Fiche de notation (aveugle) — {name}\n\n"
        "Lisez les fichiers du dossier `sorties/` **dans le desordre, sans ouvrir "
        "`a_ouvrir_apres_le_classement/`**. Notez chaque sortie de 1 (mauvais) a 5 (excellent) :\n\n"
        f"{crit}\n\n{head}\n{sep}\n{rows}\n\n"
        "**Classement global (de la meilleure a la moins bonne)** : ____ > ____ > ____ ...\n\n"
        "**Erreurs graves reperees** (invention, faux article, conseil dangereux) :\n\n"
        "Quand c'est fini : `python -m naftal --bakeoff-reveal <ce dossier>`.\n")


def run_bakeoff(contract_text: str, contract_name: str, *, runs: int = 1, llm_fn: LLMFn,
                truth: dict | None = None, seed: int | None = None,
                out_dir: str | Path | None = None, progress: Callable[[str], None] = print) -> Path:
    runs = max(1, runs)
    jobs = [(arm, r) for r in range(1, runs + 1) for arm in ARMS]
    results: dict[tuple[str, int], dict] = {}
    for arm, r in jobs:
        progress(f"  bras {arm} — execution {r}/{runs} ...")
        res = run_arm(arm, contract_text, llm_fn)
        if not res["ok"]:
            # Echec : on s'arrete tout de suite (inutile de payer d'autres appels vouant a l'echec).
            raise BakeoffError(f"Le bras {arm} (execution {r}) a echoue : {res['error']}")
        results[(arm, r)] = res

    rng = random.Random(seed)
    ids = [f"S{i:02d}" for i in range(1, len(jobs) + 1)]
    rng.shuffle(ids)
    mapping = {job: sid for job, sid in zip(jobs, ids)}

    root = Path(out_dir) if out_dir else get_settings().export_dir / f"bakeoff-{datetime.now():%Y%m%d-%H%M%S}"
    (root / "sorties").mkdir(parents=True, exist_ok=True)
    (root / "a_ouvrir_apres_le_classement").mkdir(exist_ok=True)
    for (arm, r), sid in mapping.items():
        (root / "sorties" / f"{sid}.md").write_text(
            f"# Sortie {sid}\n\n{results[(arm, r)]['text'].strip()}\n", encoding="utf-8")

    metrics = [objective_metrics(results[job], contract_text, truth) for job in jobs]
    reveal = root / "a_ouvrir_apres_le_classement"
    (reveal / "cle.json").write_text(json.dumps(
        {f"{sid}": {"bras": arm, "execution": r, "bras_libelle": ARM_LABELS[arm]}
         for (arm, r), sid in sorted(mapping.items(), key=lambda kv: kv[1])},
        ensure_ascii=False, indent=2), encoding="utf-8")
    (reveal / "mesures_objectives.md").write_text(
        "# Mesures objectives (a lire APRES avoir classe les sorties)\n\n"
        f"Contrat : {contract_name} — {runs} execution(s) par bras.\n\n{metrics_table(metrics)}\n\n"
        "Lecture : « citations verbatim » = citations « ... » retrouvees mot pour mot dans le contrat ; "
        "« renvois d'articles reels » = « Article N » qui existent vraiment ; « refs legales » = lignes "
        "citant un texte de loi dont la ligne (ou la suivante) dit « a verifier » ; « defauts plantes » = "
        "recherche par expressions regulieres (grossiere : un mot cite en passant compte).\n\n"
        + _never_found(metrics, truth)
        + ("\nAttention : le second passage d'audit du bras C n'a pas abouti dans au moins une "
           "execution (resultat = premiere passe seule).\n"
           if any(m["self_verified"] is False for m in metrics) else ""),
        encoding="utf-8")
    (reveal / "mesures.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    (root / "fiche_notation.md").write_text(_sheet(ids, contract_name), encoding="utf-8")
    (root / "LISEZMOI.md").write_text(
        "1. Lisez les fichiers de `sorties/` (dans le desordre) SANS ouvrir `a_ouvrir_apres_le_classement/`.\n"
        "2. Remplissez `fiche_notation.md`.\n"
        "3. Lancez `python -m naftal --bakeoff-reveal <ce dossier>` pour voir quel bras est quelle sortie.\n",
        encoding="utf-8")
    return root


def reveal(folder: str | Path) -> str:
    root = Path(folder)
    key_file = root / "a_ouvrir_apres_le_classement" / "cle.json"
    if not key_file.is_file():
        raise BakeoffError(f"Dossier de banc d'essai introuvable : {root}")
    key = json.loads(key_file.read_text(encoding="utf-8"))
    out = ["Correspondance sortie -> bras :"]
    out += [f"  {sid} = bras {v['bras']} ({v['bras_libelle']}), execution {v['execution']}"
            for sid, v in sorted(key.items())]
    out += ["", (root / "a_ouvrir_apres_le_classement" / "mesures_objectives.md").read_text(encoding="utf-8")]
    return "\n".join(out)


def load_demo() -> tuple[str, str, dict]:
    text = (SAMPLES / "contrat_demo_v2.txt").read_text(encoding="utf-8")
    truth = json.loads((SAMPLES / "contrat_demo_v2.truth.json").read_text(encoding="utf-8"))
    return text, "contrat_demo_v2.txt (synthetique)", truth


# --------------------------------------------------------------------------- #
# Ligne de commande
# --------------------------------------------------------------------------- #
def cli(target: str, *, runs: int = 1, seed: int | None = None, truth_path: str | None = None,
        yes: bool = False, input_fn: Callable[[str], str] = input, llm_fn: LLMFn | None = None,
        out: Callable[[str], None] = print) -> int:
    """`python -m naftal --bakeoff demo|FICHIER`. Retourne le code de sortie."""
    from .extraction import extract_text
    from .llm.provider import run_llm

    s = get_settings()
    real = llm_fn is None
    llm_fn = llm_fn or run_llm
    if real and not (s.llm_enabled and s.llm_api_key):
        out("[ECHEC] L'IA externe n'est pas activee. Lancez d'abord :  python -m naftal --setup-llm")
        return 1

    truth = None
    if target == "demo":
        text, name, truth = load_demo()
    else:
        path = Path(target)
        if not path.is_file():
            out(f"[ECHEC] Fichier introuvable : {path}")
            return 1
        res = extract_text(path)
        if not res.ok:
            out(f"[ECHEC] Texte non extrait : {res.note}")
            return 1
        text, name = res.text, path.name
    if truth_path:
        try:
            truth = json.loads(Path(truth_path).read_text(encoding="utf-8"))
            truth["issues"]
        except (OSError, ValueError, KeyError) as exc:
            out(f"[ECHEC] Fichier de verite terrain illisible : {exc}")
            return 1

    runs = max(1, runs)
    n_calls = runs * sum(CALLS_PER_RUN.values())
    out(f"Banc d'essai aveugle sur « {name} » : {runs} execution(s) x 3 bras = {n_calls} appels "
        "(le bras C en fait 2 par execution : analyse + audit). Modele : "
        f"{s.llm_provider} / {s.llm_model or 'defaut'}. Cout et duree a surveiller.")
    if target != "demo":
        out("ATTENTION : le TEXTE de ce document sera envoye au fournisseur externe "
            f"{n_calls} fois. A reserver aux documents dont l'envoi externe est autorise.")
        if not yes and input_fn("Tapez OUI pour continuer : ").strip().lower() not in {"oui", "o", "yes", "y"}:
            out("Annule : rien n'a ete envoye.")
            return 1
    else:
        out("(Contrat synthetique de demonstration : aucune confidentialite en jeu.)")

    try:
        folder = run_bakeoff(text, name, runs=runs, llm_fn=llm_fn, truth=truth, seed=seed, progress=out)
    except BakeoffError as exc:
        out(f"[ECHEC] {exc}")
        return 1
    out(f"\nTermine. Dossier : {folder}\n"
        "1) Lisez les fichiers de sorties/ SANS ouvrir a_ouvrir_apres_le_classement/.\n"
        "2) Remplissez fiche_notation.md.\n"
        f"3) Puis : python -m naftal --bakeoff-reveal \"{folder}\"")
    return 0
