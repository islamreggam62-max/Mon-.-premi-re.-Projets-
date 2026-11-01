"""Lecture / ecriture d'un fichier `.env` minimal, SANS dependance.

Pourquoi : l'utilisateur n'est pas developpeur ; redefinir des variables a chaque
ouverture d'un terminal est fragile. Un fichier `.env` a la racine du projet les
conserve. Regles :
- l'environnement REEL l'emporte toujours sur le fichier ;
- seules les cles `NAFTAL_*` et `DATABASE_URL` sont lues (rien d'autre n'est importe) ;
- une valeur vide est ignoree (elle ne doit pas ecraser une valeur par defaut) ;
- le fichier peut contenir une cle d'API : il est ecrit en mode 0600 (POSIX) et est
  exclu de git (.gitignore). Ne le partagez pas et ne l'envoyez pas par e-mail.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

_LINE = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$")
_QUOTED = re.compile(r"""^\s*(["'])(.*?)\1\s*(?:#.*)?$""")
_EXACT_KEYS = {"DATABASE_URL"}


def default_env_path() -> Path:
    """`NAFTAL_ENV_FILE` si defini, sinon `.env` dans le dossier de lancement."""
    custom = os.environ.get("NAFTAL_ENV_FILE")
    return Path(custom) if custom else Path.cwd() / ".env"


def _decode(raw: bytes) -> str:
    # Le Bloc-notes de Windows ajoute souvent un BOM UTF-8 ; la redirection `>` de
    # Windows PowerShell 5 ecrit de l'UTF-16. On accepte les deux.
    if raw.startswith((b"\xff\xfe", b"\xfe\xff")):
        return raw.decode("utf-16", errors="replace")
    return raw.decode("utf-8-sig", errors="replace")


def _clean_value(value: str) -> str:
    q = _QUOTED.match(value)
    if q:                                   # "valeur"  # commentaire eventuel
        return q.group(2)
    m = re.search(r"\s+#", value)           # valeur  # commentaire
    if m:
        value = value[: m.start()]
    return value.strip()


def parse_env_text(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        m = _LINE.match(line)
        if m:
            out[m.group(1)] = _clean_value(m.group(2))
    return out


def load_env_file(path: str | Path, environ: dict | None = None) -> list[str]:
    """Charge `path` dans `environ` (os.environ par defaut) sans ecraser l'existant.

    Retourne les NOMS des cles chargees (jamais leurs valeurs).
    """
    environ = os.environ if environ is None else environ
    p = Path(path)
    try:
        if not p.is_file():
            return []
        raw = p.read_bytes()
    except OSError:
        return []
    loaded: list[str] = []
    for key, value in parse_env_text(_decode(raw)).items():
        if not (key.startswith("NAFTAL_") or key in _EXACT_KEYS):
            continue
        if key in environ or value == "":
            continue
        environ[key] = value
        loaded.append(key)
    return loaded


def _format_value(value: str) -> str:
    if "\n" in value or "\r" in value:
        raise ValueError("Une valeur ne peut pas contenir de saut de ligne.")
    if value == "" or not re.search(r"[\s#\"']", value):
        return value
    if '"' not in value:
        return f'"{value}"'
    if "'" not in value:
        return f"'{value}'"
    raise ValueError("Valeur avec guillemets simples et doubles non prise en charge.")


def write_env_values(path: str | Path, updates: dict[str, str]) -> None:
    """Met a jour (ou ajoute) des cles dans `path`, en preservant le reste du fichier."""
    p = Path(path)
    lines: list[str] = []
    if p.is_file():
        lines = _decode(p.read_bytes()).splitlines()
    pending = dict(updates)
    out: list[str] = []
    for line in lines:
        m = _LINE.match(line)
        if m and m.group(1) in pending:
            key = m.group(1)
            out.append(f"{key}={_format_value(pending.pop(key))}")
        else:
            out.append(line)
    if pending:
        if out and out[-1].strip():
            out.append("")
        out.append("# --- ajoute par l'assistant de configuration NAFTAL ---")
        for key, value in pending.items():
            out.append(f"{key}={_format_value(value)}")
    data = ("\n".join(out) + "\n").encode("utf-8")
    # Cree le fichier directement en 0600 (pas de fenetre ou il serait lisible par tous).
    fd = os.open(str(p), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    try:
        os.chmod(p, 0o600)      # fichier pre-existant : resserre aussi ses droits
    except OSError:
        pass
