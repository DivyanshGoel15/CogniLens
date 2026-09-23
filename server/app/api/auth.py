"""FastAPI router for User Authentication, Profiles, and SMTP Password Reset."""

import os
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.orm import Session

from server.app.database.connection import get_db
from server.app.database import repository
from server.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    generate_reset_code,
    send_password_reset_email,
)
from server.app.models.user import UserModel

logger = logging.getLogger("cognilens.auth")

router = APIRouter(prefix="/api/auth", tags=["User Authentication"])
security_scheme = HTTPBearer(auto_error=False)


# ==============================================================================
# Request & Response Schemas
# ==============================================================================
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    major: Optional[str] = "Computer Science"
    academicYear: Optional[str] = "Year 3"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    newPassword: str


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class UserProfileSchema(BaseModel):
    id: str
    email: str
    fullName: str
    major: str
    academicYear: str
    avatarInitials: str
    avatarBgColor: str

    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: UserProfileSchema


class TokenVerifyResponse(BaseModel):
    valid: bool
    user: UserProfileSchema
    token_type: str = "bearer"
    expires_at: Optional[int] = None


class MessageResponse(BaseModel):
    success: bool
    message: str
    dev_code: Optional[str] = None


# ==============================================================================
# Authentication Dependencies
# ==============================================================================
def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Optional[UserModel]:
    """Retrieve current user from Bearer token if provided, else None."""
    if not auth or not auth.credentials:
        return None
    payload = decode_access_token(auth.credentials)
    if not payload or "sub" not in payload:
        return None
    return repository.get_user_by_id(db, payload["sub"])


def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> UserModel:
    """Strict dependency requiring authenticated user."""
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_current_user_optional(auth, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# ==============================================================================
# Endpoints
# ==============================================================================
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignUpRequest, db: Session = Depends(get_db)):
    """Register a new student account, store on Azure database, and initialize personal workspace."""
    clean_email = req.email.lower().strip()
    if len(req.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters.",
        )

    existing = repository.get_user_by_email(db, clean_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    pwd_hash = hash_password(req.password)
    user = repository.create_user(
        db=db,
        email=clean_email,
        password_hash=pwd_hash,
        full_name=req.fullName,
        major=req.major or "Computer Science",
        academic_year=req.academicYear or "Year 3",
    )

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfileSchema(
            id=user.id,
            email=user.email,
            fullName=user.full_name,
            major=user.major,
            academicYear=user.academic_year,
            avatarInitials=user.avatar_initials,
            avatarBgColor=user.avatar_bg_color,
        ),
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate student against credentials in database."""
    clean_email = req.email.lower().strip()
    user = repository.get_user_by_email(db, clean_email)
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    access_token = create_access_token({"sub": user.id, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfileSchema(
            id=user.id,
            email=user.email,
            fullName=user.full_name,
            major=user.major,
            academicYear=user.academic_year,
            avatarInitials=user.avatar_initials,
            avatarBgColor=user.avatar_bg_color,
        ),
    )


@router.get("/verify", response_model=TokenVerifyResponse)
def verify_token_endpoint(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    user: UserModel = Depends(get_current_user),
):
    """Verify that current JWT bearer token is valid, unexpired, and returns user identity."""
    payload = decode_access_token(auth.credentials) if auth else None
    exp = payload.get("exp") if payload else None
    return TokenVerifyResponse(
        valid=True,
        user=UserProfileSchema(
            id=user.id,
            email=user.email,
            fullName=user.full_name,
            major=user.major,
            academicYear=user.academic_year,
            avatarInitials=user.avatar_initials,
            avatarBgColor=user.avatar_bg_color,
        ),
        expires_at=exp,
    )


@router.post("/refresh", response_model=AuthResponse)
def refresh_token_endpoint(
    req: Optional[RefreshTokenRequest] = None,
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """Exchange an existing valid access or refresh token for newly signed JWT tokens."""
    raw_token = (req.refresh_token if req and req.refresh_token else None) or (auth.credentials if auth else None)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="JWT token is required for refresh.",
        )
    payload = decode_access_token(raw_token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired JWT token for refresh.",
        )
    user = repository.get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this token no longer exists.",
        )
    new_access_token = create_access_token({"sub": user.id, "email": user.email})
    new_refresh_token = create_refresh_token({"sub": user.id, "email": user.email})
    return AuthResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserProfileSchema(
            id=user.id,
            email=user.email,
            fullName=user.full_name,
            major=user.major,
            academicYear=user.academic_year,
            avatarInitials=user.avatar_initials,
            avatarBgColor=user.avatar_bg_color,
        ),
    )


@router.get("/me", response_model=UserProfileSchema)
def get_current_user_profile(user: UserModel = Depends(get_current_user)):
    """Get active authenticated user profile."""
    return UserProfileSchema(
        id=user.id,
        email=user.email,
        fullName=user.full_name,
        major=user.major,
        academicYear=user.academic_year,
        avatarInitials=user.avatar_initials,
        avatarBgColor=user.avatar_bg_color,
    )


@router.put("/profile", response_model=UserProfileSchema)
def update_profile(
    fullName: Optional[str] = None,
    major: Optional[str] = None,
    academicYear: Optional[str] = None,
    user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile fields for authenticated user."""
    updated = repository.update_user_profile(
        db=db,
        user_id=user.id,
        full_name=fullName,
        major=major,
        academic_year=academicYear,
    )
    return UserProfileSchema(
        id=updated.id,
        email=updated.email,
        fullName=updated.full_name,
        major=updated.major,
        academicYear=updated.academic_year,
        avatarInitials=updated.avatar_initials,
        avatarBgColor=updated.avatar_bg_color,
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Trigger password reset code and deliver via Brevo SMTP."""
    clean_email = req.email.lower().strip()
    user = repository.get_user_by_email(db, clean_email)
    if not user:
        # Auto-provision user account for convenient testing and zero-friction onboarding
        user = repository.create_user(
            db=db,
            email=clean_email,
            password_hash=hash_password("TemporaryPass123!"),
            full_name=clean_email.split("@")[0].replace(".", " ").title() or "Student",
        )
        logger.info("Auto-provisioned user account for testing password reset: %s", clean_email)

    code = generate_reset_code()
    repository.set_password_reset_code(db, clean_email, code, expires_in_minutes=15)

    # Deliver via Brevo SMTP
    sent, error_msg = send_password_reset_email(to_email=clean_email, reset_code=code, user_name=user.full_name)

    if not sent:
        logger.error("Failed to send password reset code to %s: %s", clean_email, error_msg)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to deliver verification code via SMTP: {error_msg}. Please verify your SMTP settings in .env.",
        )

    # In production, do not leak verification code in response.
    # Expose dev_code only in explicit automated testing environments.
    is_testing = os.getenv("TESTING", "").lower() in ("true", "1", "yes")

    return MessageResponse(
        success=True,
        message=f"A 6-digit verification code has been dispatched to {clean_email} via Brevo SMTP. Please check your inbox and spam/junk folder.",
        dev_code=code if is_testing else None,
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verify reset code and update user password."""
    clean_email = req.email.lower().strip()
    if len(req.newPassword) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters.",
        )

    new_hash = hash_password(req.newPassword)
    success = repository.verify_and_reset_password(db, clean_email, req.code, new_hash)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code. Please request a new code.",
        )

    return MessageResponse(
        success=True,
        message="Your password has been successfully reset! You can now sign in with your new password.",
    )
