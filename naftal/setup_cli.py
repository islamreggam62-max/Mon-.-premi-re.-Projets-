"""Assistant d'activation de la couche LLM et test de connexion.

    python -m naftal --setup-llm    # demande le modele et la cle (saisie MASQUEE)
    python -m naftal --check-llm    # teste la connexion SANS envoyer aucun contrat

Securite :
- la cle est saisie via getpass (masquee) : elle n'apparait ni a l'ecran, ni dans
  l'historique du terminal, ni dans une conversation ;
- elle est ecrite dans le fichier `.env` (droits 0600, exclu de git) ;
- elle n'est JAMAIS affichee ; les messages d'erreur la masquent ;
- activer la couche exige une confirmation explicite, car le texte des documents
  analyses sera alors transmis au fournisseur externe.
"""
from __future__ import annotations

import getpass
import os
import re
from pathlib import Path
from typing import Callable

from .config import get_settings, reset_settings
from .envfile import default_env_path, write_env_values
from .llm.provider import DEFAULT_ANTHROPIC_MODEL, run_llm

MODEL_CHOICES = (
    "claude-opus-5-5",
    "claude-sonnet-5-5",
    "claude-haiku-5-5",
    "claude-fable-5-1",
)

_YES = {"oui", "o", "yes", "y"}

_CONSENT = """\
ATTENTION - confidentialite
  En activant cette couche, le TEXTE des contrats que vous analysez avec l'IA sera
  ENVOYE a Anthropic (service externe) pour etre traite. A reserver aux documents dont
  l'envoi externe est autorise. Sans cette couche, tout reste sur votre ordinateur.
  Vous pourrez la desactiver a tout moment (NAFTAL_LLM_ENABLED=0 dans le fichier .env)."""


def _redact(text: str, secret: str) -> str:
    return text.replace(secret, "***") if secret else text


def _hint(status: int | None, error: str) -> str:
    low = error.lower()
    if status == 401:
        return "Cle d'API refusee : verifiez qu'elle est complete, sans espace, et encore active."
    if status == 403:
        return "Acces refuse : cette cle n'a pas le droit d'utiliser ce modele ou ce service."
    if status == 404:
        return "Modele introuvable : le nom du modele est probablement incorrect pour votre compte."
    if status == 429:
        return "Trop de requetes ou limite atteinte : reessayez dans un instant."
    if status in (400, 402) and ("credit" in low or "billing" in low):
        return ("Credit insuffisant : l'API Anthropic est facturee a part de l'abonnement "
                "claude.ai ; ajoutez du credit dans votre console.")
    if status and status >= 500:
        return "Le service du fournisseur est indisponible : reessayez plus tard."
    if "connection" in low or "timed out" in low or "timeout" in low or "proxy" in low:
        return "Connexion reseau impossible : verifiez Internet / pare-feu / proxy de l'entreprise."
    return "Erreur non reconnue : voir le detail ci-dessus."


def check_llm(run: Callable | None = None, settings=None) -> tuple[bool, str]:
    """Teste la configuration LLM avec un message anodin (aucun contrat n'est envoye)."""
    s = settings or get_settings()
    run = run or run_llm
    if not s.llm_enabled:
        found = "existe" if Path(s.env_file).is_file() else "INTROUVABLE"
        return False, (
            "La couche LLM est desactivee (NAFTAL_LLM_ENABLED n'est pas a 1).\n"
            f"  Fichier .env cherche : {s.env_file} ({found}).\n"
            "  Lancez :  python -m naftal --setup-llm")
    if not s.llm_api_key:
        return False, "Cle d'API absente (NAFTAL_LLM_API_KEY). Lancez : python -m naftal --setup-llm"

    res = run("Tu es un test de connexion.", "Reponds uniquement par : OK", 20)
    if res.ok:
        tok = f" ; jetons entree/sortie : {res.tokens_in}/{res.tokens_out}" if res.tokens_in is not None else ""
        return True, (f"Connexion reussie - fournisseur {res.provider}, modele {res.model}"
                      f" ; reponse : {res.text.strip()[:30]!r}{tok}")
    err = _redact(res.error or "", s.llm_api_key)
    m = re.match(r"HTTP (\d{3})", err)
    status = int(m.group(1)) if m else None
    return False, f"Echec de la connexion : {err[:300]}\n  -> {_hint(status, err)}"


def setup_llm(
    env_path: str | Path | None = None,
    *,
    input_fn: Callable[[str], str] = input,
    getpass_fn: Callable[[str], str] = getpass.getpass,
    out: Callable[[str], None] = print,
    check_fn: Callable[[], tuple[bool, str]] | None = None,
    environ: dict | None = None,
) -> bool:
    """Assistant interactif. Retourne True si la configuration est enregistree ET testee."""
    environ = os.environ if environ is None else environ
    path = Path(env_path) if env_path else default_env_path()

    out(_CONSENT)
    if input_fn("\nTapez OUI pour activer l'IA externe (autre chose = annuler) : ").strip().lower() not in _YES:
        out("Annule : rien n'a ete modifie.")
        return False

    out("\nModeles proposes (a confirmer dans votre console Anthropic) :")
    for i, name in enumerate(MODEL_CHOICES, 1):
        out(f"  {i}. {name}" + ("   <- par defaut" if name == DEFAULT_ANTHROPIC_MODEL else ""))
    raw = input_fn(f"Numero ou nom du modele [Entree = {DEFAULT_ANTHROPIC_MODEL}] : ").strip()
    if not raw:
        model = DEFAULT_ANTHROPIC_MODEL
    elif raw.isdigit() and 1 <= int(raw) <= len(MODEL_CHOICES):
        model = MODEL_CHOICES[int(raw) - 1]
    else:
        model = raw

    out("\nCollez votre cle d'API (la saisie est MASQUEE : rien ne s'affiche, c'est normal),")
    out("puis appuyez sur Entree. Elle vient de console.anthropic.com > API keys.")
    key = getpass_fn("Cle d'API : ").strip()
    if not key or re.search(r"\s", key):
        out("Cle vide ou contenant des espaces : annule, rien n'a ete modifie.")
        return False
    if not key.startswith("sk-ant-"):
        out("Remarque : une cle Anthropic commence normalement par « sk-ant- ». Verifiez-la.")

    updates = {
        "NAFTAL_LLM_ENABLED": "1",
        "NAFTAL_LLM_PROVIDER": "anthropic",
        "NAFTAL_LLM_MODEL": model,
        "NAFTAL_LLM_API_KEY": key,
    }
    write_env_values(path, updates)
    environ.update(updates)          # prise en compte immediate dans ce processus
    if environ is os.environ:
        reset_settings()
    out(f"\nConfiguration enregistree dans : {path}")
    out("(Ce fichier contient votre cle : ne le partagez pas et ne l'envoyez pas par e-mail.)")

    ok, message = (check_fn or check_llm)()
    out(("\n[OK] " if ok else "\n[ECHEC] ") + message)
    if not ok:
        out("La configuration reste enregistree ; corrigez le probleme puis lancez :  "
            "python -m naftal --check-llm")
    return ok
