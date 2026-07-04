"""Authentication router."""
import uuid
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, RefreshToken
from app.schemas.user import (
    UserCreate, UserLogin, UserOut, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest, UpdateProfileRequest
)
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_access_token, get_user_by_email, get_user_by_id, authenticate_user,
    rotate_refresh_token, revoke_all_refresh_tokens
)
from app.config import settings

router = APIRouter()


def get_current_user(token: str = Depends(lambda: None), db: Session = Depends(get_db)) -> User:
    """FastAPI dependency — extract and validate JWT."""
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    raise NotImplementedError("Use get_current_user_dep instead")


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()


def get_current_user_dep(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = get_user_by_id(db, uuid.UUID(user_id_str))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        verification_token=secrets.token_urlsafe(32),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(db, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    token_obj = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == body.refresh_token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not token_obj:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = get_user_by_id(db, token_obj.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    new_refresh = rotate_refresh_token(db, body.refresh_token, user.id)
    access_token = create_access_token(str(user.id))
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserOut.model_validate(user),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(current_user: User = Depends(get_current_user_dep), db: Session = Depends(get_db)):
    revoke_all_refresh_tokens(db, current_user.id)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user_dep)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.github_url is not None:
        current_user.github_url = body.github_url
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if user:
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=2)
        db.commit()
        # TODO: send email with reset link
    # Always return 204 to prevent email enumeration


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.reset_token == body.token,
            User.reset_token_expires > datetime.utcnow(),
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user.hashed_password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    revoke_all_refresh_tokens(db, user.id)
    db.commit()
