"""Point d'entree : amorcage de l'administrateur puis lancement du serveur.

Usage :
    python -m naftal                 # amorce l'admin et lance le serveur
    python -m naftal --seed-only     # cree seulement l'administrateur
    python -m naftal --host 0.0.0.0 --port 8000
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


def main() -> None:
    parser = argparse.ArgumentParser(description="NAFTAL LEGAL INTELLIGENCE")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--seed-only", action="store_true", help="Cree l'admin sans lancer le serveur.")
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args()

    ensure_admin()
    if args.seed_only:
        return

    import uvicorn

    print(f"[naftal] Interface disponible sur http://{args.host}:{args.port}/")
    uvicorn.run("naftal.app:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
