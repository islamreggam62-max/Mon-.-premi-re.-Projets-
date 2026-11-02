"""Branchement de NAFTAL dans Claude Desktop (serveur MCP local).

    python -m naftal --claude-config     # affiche le bloc de configuration (chemins absolus)
    python -m naftal --install-claude    # l'ajoute a la configuration de Claude Desktop (sauvegarde)
    python -m naftal --check-mcp         # verifie que le serveur repond (vraie poignee de main MCP)

Pourquoi des chemins absolus : Claude Desktop lance le serveur depuis SON propre
dossier ; sans chemins explicites, Python ne trouve pas le projet et NAFTAL ouvrirait
une AUTRE base de donnees (vide) que celle de l'application web.
"""
from __future__ import annotations

import asyncio
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

from .config import get_settings

SERVER_KEY = "naftal-legal-intelligence"
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def server_entry() -> dict:
    """Entree « mcpServers » pour Claude Desktop, avec les chemins de CE poste."""
    s = get_settings()
    return {
        "command": sys.executable,
        "args": ["-m", "naftal.mcp_server"],
        "env": {
            "PYTHONPATH": str(PROJECT_ROOT),
            "NAFTAL_DATA_DIR": str(Path(s.data_dir).resolve()),
            "NAFTAL_ENV_FILE": str(Path(s.env_file).resolve()),
            "PYTHONIOENCODING": "utf-8",
            "PYTHONUTF8": "1",
        },
    }


def config_snippet() -> str:
    return json.dumps({"mcpServers": {SERVER_KEY: server_entry()}}, ensure_ascii=False, indent=2)


def default_config_path() -> Path | None:
    """Emplacement usuel du fichier de Claude Desktop (a verifier selon la version)."""
    if sys.platform == "win32":
        appdata = os.environ.get("APPDATA")
        return Path(appdata) / "Claude" / "claude_desktop_config.json" if appdata else None
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
    return None  # pas de Claude Desktop officiel sous Linux


class InstallError(RuntimeError):
    pass


def install(config_path: str | Path, entry: dict | None = None) -> dict:
    """Ajoute/remplace l'entree NAFTAL sans toucher aux autres serveurs ; sauvegarde avant."""
    path = Path(config_path)
    entry = entry or server_entry()
    data: dict = {}
    backup = None
    if path.is_file():
        raw = path.read_bytes()
        try:
            text = raw.decode("utf-8-sig").strip()
            data = json.loads(text) if text else {}
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            # Ne jamais ecraser une configuration qu'on ne sait pas lire.
            raise InstallError(f"Le fichier {path} n'est pas un JSON valide ({exc}). Rien n'a ete modifie ; "
                               "corrigez-le ou ajoutez le bloc a la main (--claude-config).") from exc
        if not isinstance(data, dict):
            raise InstallError(f"Le fichier {path} ne contient pas un objet JSON. Rien n'a ete modifie.")
        backup = path.with_name(f"{path.name}.bak-{datetime.now():%Y%m%d-%H%M%S}")
        shutil.copy2(path, backup)
    servers = data.get("mcpServers")
    if servers is None:
        servers = data["mcpServers"] = {}
    elif not isinstance(servers, dict):
        raise InstallError("« mcpServers » n'est pas un objet dans la configuration. Rien n'a ete modifie.")
    replaced = SERVER_KEY in servers
    servers[SERVER_KEY] = entry
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)  # ecriture atomique : pas de fichier a moitie ecrit
    return {"path": str(path), "backup": str(backup) if backup else None, "replaced": replaced,
            "other_servers": sorted(k for k in servers if k != SERVER_KEY)}


async def _handshake(entry: dict, timeout: float = 60) -> dict:
    from mcp.client.session import ClientSession
    from mcp.client.stdio import StdioServerParameters, stdio_client

    env = {**os.environ, **entry.get("env", {})}
    params = StdioServerParameters(command=entry["command"], args=entry["args"], env=env)
    with open(os.devnull, "w") as devnull:  # les journaux du serveur ne polluent pas l'affichage
        async with stdio_client(params, errlog=devnull) as (read, write):
            async with ClientSession(read, write) as session:
                init = await asyncio.wait_for(session.initialize(), timeout)
                tools = await session.list_tools()
                prompts = await session.list_prompts()
                listed = await session.call_tool("naftal_list_documents", {})
    payload = getattr(listed, "structured_content", None)
    if not payload:  # repli : resultat renvoye en texte JSON
        try:
            payload = json.loads(listed.content[0].text)
        except (AttributeError, IndexError, TypeError, ValueError):
            payload = {}
    return {"server": init.server_info.name, "version": init.server_info.version,
            "tools": [t.name for t in tools.tools], "prompts": [p.name for p in prompts.prompts],
            "documents": payload.get("nombre"), "call_error": bool(getattr(listed, "is_error", False))}


def check(entry: dict | None = None) -> tuple[bool, str]:
    """Lance le serveur EXACTEMENT comme Claude Desktop le ferait et verifie qu'il repond."""
    try:
        import mcp  # noqa: F401
    except ImportError:
        return False, ("Bibliotheque MCP absente. Installez-la :  pip install -r naftal/requirements.txt")
    try:
        r = asyncio.run(_handshake(entry or server_entry()))
    except Exception as exc:  # noqa: BLE001 - diagnostic pour l'utilisateur
        return False, f"Le serveur MCP ne repond pas : {type(exc).__name__}: {exc}"
    if r["call_error"]:
        return False, "Le serveur repond mais l'outil de test a echoue (voir journaux de Claude Desktop)."
    return True, (f"Serveur « {r['server']} » v{r['version']} operationnel : {len(r['tools'])} outils, "
                  f"{len(r['prompts'])} modeles de demande, {r['documents']} document(s) visibles.")


def cli(action: str, out=print) -> int:
    if action == "config":
        out("Ajoutez ce bloc dans la configuration de Claude Desktop (claude_desktop_config.json)\n"
            "— s'il y a deja une section « mcpServers », ajoutez seulement l'entree "
            f"« {SERVER_KEY} » a l'interieur :\n")
        out(config_snippet())
        return 0
    if action == "check":
        ok, msg = check()
        out(("[OK] " if ok else "[ECHEC] ") + msg)
        return 0 if ok else 1
    if action == "install":
        ok, msg = check()
        if not ok:
            out("[ECHEC] Verification prealable : " + msg + "\nRien n'a ete modifie dans Claude Desktop.")
            return 1
        out("[OK] " + msg)
        path = default_config_path()
        if path is None:
            out("Systeme sans Claude Desktop officiel : ajoutez ce bloc a la main :\n" + config_snippet())
            return 1
        try:
            r = install(path)
        except (InstallError, OSError) as exc:
            out(f"[ECHEC] {exc}")
            return 1
        out(f"Configuration {'mise a jour' if r['replaced'] else 'ajoutee'} : {r['path']}")
        if r["backup"]:
            out(f"Sauvegarde de l'ancienne configuration : {r['backup']}")
        if r["other_servers"]:
            out("Autres serveurs conserves : " + ", ".join(r["other_servers"]))
        out("\nETAPE SUIVANTE : QUITTEZ completement Claude Desktop (pas seulement la fenetre) puis "
            "rouvrez-le.\nSi les outils NAFTAL n'apparaissent pas, ouvrez dans Claude Desktop le fichier "
            "de configuration via ses parametres (section developpeur) et verifiez que c'est bien "
            "ce fichier — l'emplacement peut differer selon la version installee.")
        return 0
    raise ValueError(action)
