"""Point d'entree : amorcage de l'administrateur puis lancement du serveur.

Usage :
    python -m naftal                 # amorce l'admin et lance le serveur
    python -m naftal --seed-only     # cree seulement l'administrateur
    python -m naftal --host 0.0.0.0 --port 8000
    python -m naftal --setup-llm     # active l'IA (cle saisie en mode masque)
    python -m naftal --check-llm     # teste la connexion IA sans envoyer de contrat
    python -m naftal --bakeoff demo  # banc d'essai AVEUGLE : chat nu / chat+regles / pipeline NAFTAL
    python -m naftal --bakeoff-reveal DOSSIER   # revele quel bras est quelle sortie
    python -m naftal --install-claude  # branche NAFTAL dans Claude Desktop (outils dans la conversation)
    python -m naftal --check-mcp       # verifie que le serveur MCP repond
    python -m naftal --claude-config   # affiche le bloc de configuration a coller a la main
"""
from __future__ import annotations

import argparse
import secrets

from .config import get_settings
from .db import create_all, session_scope
from .legal import seed_references
from .models import ROLE_ADMIN, User
from .security import find_user_by_email, hash_password


def ensure_admin() -> None:
    settings = get_settings()
    create_all()
    with session_scope() as db:
        seed_references(db)
        existing = find_user_by_email(db, settings.admin_email)
        if existing:
            print(f"[naftal] Administrateur present : {settings.admin_email}")
            return
        password = settings.admin_password or secrets.token_urlsafe(12)
        admin = User(
            email=settings.admin_email.lower().strip(),
            full_name="Administrateur",
            role=ROLE_ADMIN,
            password_hash=hash_password(password),
        )
        db.add(admin)
        db.commit()
        print("=" * 64)
        print("[naftal] Compte administrateur cree :")
        print(f"         e-mail        : {settings.admin_email}")
        if settings.admin_password:
            print("         mot de passe  : (celui defini dans NAFTAL_ADMIN_PASSWORD)")
        else:
            print(f"         mot de passe  : {password}")
            print("         >>> Notez ce mot de passe : il ne sera plus affiche. <<<")
        print("=" * 64)


def _print_status_banner() -> None:
    """Rappelle a chaque demarrage si des textes peuvent sortir de la machine."""
    from .llm import llm_status
    from .llm.embeddings import embeddings_status

    s = get_settings()
    if s.env_loaded:
        print(f"[naftal] Reglages lus dans {s.env_file} : {', '.join(s.env_loaded)} (valeurs non affichees)")
    llm, emb = llm_status(), embeddings_status()
    if llm["enabled"]:
        print(f"[naftal] IA externe : ACTIVE ({llm['provider']} / {llm['model'] or 'modele par defaut'})"
              " - le texte des documents analyses avec l'IA est envoye a ce fournisseur.")
    else:
        print("[naftal] IA externe : desactivee - tout reste sur cet ordinateur.")
    if emb["enabled"]:
        print("[naftal] Recherche semantique : ACTIVE - les passages des contrats indexes sont envoyes au fournisseur.")


def main() -> None:
    parser = argparse.ArgumentParser(description="NAFTAL LEGAL INTELLIGENCE")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--seed-only", action="store_true", help="Cree l'admin sans lancer le serveur.")
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--setup-llm", action="store_true",
                        help="Assistant d'activation de l'IA (cle masquee, test de connexion).")
    parser.add_argument("--check-llm", action="store_true",
                        help="Teste la connexion IA avec un message anodin (aucun contrat envoye).")
    parser.add_argument("--bakeoff", metavar="demo|FICHIER",
                        help="Banc d'essai aveugle (3 bras, meme modele) sur le contrat de demo ou un fichier.")
    parser.add_argument("--runs", type=int, default=1, help="Executions par bras (defaut 1 ; 3 recommande).")
    parser.add_argument("--seed", type=int, default=None, help="Graine du melange des sorties (reproductible).")
    parser.add_argument("--truth", metavar="JSON", default=None,
                        help="Verite terrain (defauts attendus) pour un fichier personnel.")
    parser.add_argument("--yes", action="store_true", help="Confirme l'envoi externe (sans question).")
    parser.add_argument("--bakeoff-reveal", metavar="DOSSIER", default=None,
                        help="Revele la correspondance sortie -> bras d'un banc d'essai termine.")
    parser.add_argument("--install-claude", action="store_true",
                        help="Ajoute NAFTAL a Claude Desktop (verification + sauvegarde de la config).")
    parser.add_argument("--check-mcp", action="store_true",
                        help="Lance le serveur MCP comme Claude Desktop et verifie qu'il repond.")
    parser.add_argument("--claude-config", action="store_true",
                        help="Affiche le bloc de configuration Claude Desktop (chemins absolus de ce poste).")
    args = parser.parse_args()

    if args.install_claude or args.check_mcp or args.claude_config:
        from .claude_desktop import cli as claude_cli

        action = "install" if args.install_claude else ("check" if args.check_mcp else "config")
        raise SystemExit(claude_cli(action))

    if args.bakeoff_reveal:
        from .bakeoff import BakeoffError, reveal

        try:
            print(reveal(args.bakeoff_reveal))
        except BakeoffError as exc:
            print(f"[ECHEC] {exc}")
            raise SystemExit(1)
        raise SystemExit(0)
    if args.bakeoff:
        from .bakeoff import cli as bakeoff_cli

        raise SystemExit(bakeoff_cli(args.bakeoff, runs=args.runs, seed=args.seed,
                                     truth_path=args.truth, yes=args.yes))

    if args.setup_llm or args.check_llm:
        from .setup_cli import check_llm, setup_llm

        if args.setup_llm:
            ok = setup_llm()
        else:
            ok, message = check_llm()
            print(("[OK] " if ok else "[ECHEC] ") + message)
        raise SystemExit(0 if ok else 1)

    ensure_admin()
    if args.seed_only:
        return

    import uvicorn

    _print_status_banner()
    print(f"[naftal] Interface disponible sur http://{args.host}:{args.port}/")
    uvicorn.run("naftal.app:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
