"""Authentification, gestion des utilisateurs (RBAC) et journal d'audit."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from ..db import get_session
from ..models import ROLES, AuditLog, User
from ..schemas import LoginIn, UserCreateIn, UserOut
from ..security import (
    find_user_by_email,
    get_current_user,
    hash_password,
    log_action,
    require_admin,
    verify_password,
)
from ..service import client_ip

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/auth/login", response_model=UserOut)
def login(data: LoginIn, request: Request, db: Session = Depends(get_session)):
    user = find_user_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        # Message volontairement generique (ne revele pas si l'email existe).
        log_action(db, None, "login_echec", data.email, client_ip(request))
        raise HTTPException(status_code=401, detail="Identifiants invalides.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte desactive.")
    request.session["user_id"] = user.id
    log_action(db, user, "login", "", client_ip(request))
    return user


@router.post("/auth/logout")
def logout(request: Request, db: Session = Depends(get_session)):
    uid = request.session.get("user_id")
    request.session.clear()
    if uid:
        user = db.get(User, uid)
        log_action(db, user, "logout", "", client_ip(request))
    return {"ok": True}


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_session), _: User = Depends(require_admin)):
    return list(db.scalars(select(User).order_by(User.email)))


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(
    data: UserCreateIn,
    request: Request,
    db: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    if data.role not in ROLES:
        raise HTTPException(status_code=422, detail=f"Role invalide. Valeurs : {sorted(ROLES)}")
    if find_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="Un utilisateur avec cet e-mail existe deja.")
    user = User(
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, admin, "creation_utilisateur", f"{user.email} ({user.role})", client_ip(request))
    return user


@router.get("/audit")
def audit(limit: int = 100, db: Session = Depends(get_session), _: User = Depends(require_admin)):
    limit = max(1, min(limit, 500))
    rows = db.scalars(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit))
    return [
        {
            "id": r.id, "user_email": r.user_email, "action": r.action,
            "detail": r.detail, "ip": r.ip, "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
