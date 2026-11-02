"""Securite : hachage des mots de passe, sessions, RBAC, audit.

Le hachage utilise scrypt (bibliotheque standard Python) : aucune dependance
externe, parametres recommandes. Les mots de passe ne sont jamais stockes en
clair ni journalises.
"""
from __future__ import annotations

import hashlib
import hmac
import os
from base64 import b64decode, b64encode

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_session
from .models import ROLE_ADMIN, ROLE_JURISTE, AuditLog, User

# Parametres scrypt (cout CPU/memoire). n=2**15 est un bon compromis interactif.
# maxmem doit depasser 128*N*r*p (= 32 Mio ici) sinon OpenSSL refuse l'operation.
_SCRYPT_N = 2**15
_SCRYPT_R = 8
_SCRYPT_P = 1
_DKLEN = 32
_SCRYPT_MAXMEM = 128 * 1024 * 1024  # 128 Mio


def hash_password(password: str) -> str:
    if not password or len(password) < 8:
        raise ValueError("Le mot de passe doit comporter au moins 8 caracteres.")
    salt = os.urandom(16)
    dk = hashlib.scrypt(
        password.encode("utf-8"), salt=salt, n=_SCRYPT_N, r=_SCRYPT_R, p=_SCRYPT_P,
        dklen=_DKLEN, maxmem=_SCRYPT_MAXMEM,
    )
    return f"scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${b64encode(salt).decode()}${b64encode(dk).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt_b64, hash_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        salt = b64decode(salt_b64)
        expected = b64decode(hash_b64)
        dk = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected),
            maxmem=_SCRYPT_MAXMEM,
        )
        return hmac.compare_digest(dk, expected)
    except (ValueError, TypeError):
        return False


# --------------------------------------------------------------------------- #
# Sessions / utilisateur courant
# --------------------------------------------------------------------------- #
def get_current_user(
    request: Request, db: Session = Depends(get_session)
) -> User:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentification requise."
        )
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invalide."
        )
    return user


def get_current_user_optional(
    request: Request, db: Session = Depends(get_session)
) -> User | None:
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return db.get(User, user_id)


def require_roles(*roles: str):
    """Dependance FastAPI : exige que l'utilisateur ait l'un des roles donnes."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role == ROLE_ADMIN:
            return user  # l'administrateur a tous les droits
        if roles and user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Droits insuffisants pour cette operation.",
            )
        return user

    return checker


# Les juristes et administrateurs peuvent ecrire ; les lecteurs sont en lecture seule.
require_writer = require_roles(ROLE_JURISTE)
require_admin = require_roles(ROLE_ADMIN)


def log_action(
    db: Session, user: User | None, action: str, detail: str = "", ip: str = ""
) -> None:
    entry = AuditLog(
        user_id=user.id if user else None,
        user_email=user.email if user else "",
        action=action,
        detail=detail[:2000],
        ip=ip,
    )
    db.add(entry)
    db.commit()


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower().strip()))
