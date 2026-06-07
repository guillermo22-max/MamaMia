from datetime import timedelta
import hashlib
import logging
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from .... import schemas
from ....core.auth import create_access_token, get_current_user, hash_password, verify_password
from ....core.config import settings
from ....core.datetime import utc_now
from ....core.rate_limit import rate_limit_key, rate_limiter
from ....db.database import get_db
from ....models import PasswordResetToken, User
from ....services.email import send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger(__name__)

PASSWORD_RESET_MESSAGE = "Solicitud recibida. Si la direccion esta asociada a una cuenta, recibiras un correo con las instrucciones para restablecer tu contrasena."


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


@router.post("/signup", response_model=schemas.TokenOut, status_code=201)
def signup(payload: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(rate_limit_key(request, "signup", payload.email), limit=5, window_seconds=300)
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con este correo")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": user}


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(rate_limit_key(request, "login", payload.email), limit=10, window_seconds=300)
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contrasena incorrectos")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "user": user}


@router.post("/forgot-password", response_model=schemas.MessageOut)
def forgot_password(payload: schemas.PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    rate_limiter.check(rate_limit_key(request, "forgot-password", payload.email), limit=5, window_seconds=600)
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        return {"message": PASSWORD_RESET_MESSAGE}

    now = utc_now()
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": now})

    raw_token = secrets.token_urlsafe(40)
    reset_token = PasswordResetToken(
        token_hash=hash_reset_token(raw_token),
        expires_at=now + timedelta(minutes=settings.password_reset_expire_minutes),
        user_id=user.id,
    )
    db.add(reset_token)
    db.commit()

    reset_url = f"{settings.frontend_url.rstrip('/')}/restablecer-password?token={raw_token}"
    try:
        send_password_reset_email(user.email, user.name, reset_url)
    except Exception as exc:
        logger.exception("Error sending password reset email")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="No se pudo enviar el correo de restablecimiento en este momento. Intentalo de nuevo mas tarde.",
        ) from exc

    return {"message": PASSWORD_RESET_MESSAGE}


@router.post("/reset-password", response_model=schemas.MessageOut)
def reset_password(payload: schemas.PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hash_reset_token(payload.token)
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == token_hash,
        PasswordResetToken.used_at.is_(None),
    ).first()

    if not reset_token or reset_token.expires_at < utc_now():
        raise HTTPException(status_code=400, detail="El enlace es invalido o ya expiro")

    user = db.get(User, reset_token.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="El enlace es invalido o ya expiro")

    user.password_hash = hash_password(payload.password)
    reset_token.used_at = utc_now()
    db.commit()
    return {"message": "Tu contrasena fue actualizada. Ya puedes iniciar sesion."}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
