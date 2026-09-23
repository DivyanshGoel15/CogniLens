"""Security, Cryptography, JWT Token, and SMTP Email Utilities for CogniLens."""

import os
import secrets
import hashlib
import smtplib
import email.utils
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
import logging
import jwt
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("cognilens.security")

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cognilens_default_jwt_secret_dev_key_2026")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_DAYS", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "60"))


# ---------------------------------------------------------------------------
# Password Hashing via PBKDF2-HMAC-SHA256 (NIST-approved standard)
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """Hash a plaintext password with a unique cryptographic salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its salt$hash representation."""
    try:
        salt, expected_key = hashed_password.split("$", 1)
        actual_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        )
        return secrets.compare_digest(actual_key.hex(), expected_key)
    except Exception as exc:
        logger.warning("Error verifying password: %s", exc)
        return False


# ---------------------------------------------------------------------------
# JWT Token Generation and Decoding
# ---------------------------------------------------------------------------
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token for user authentication."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a long-lived JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a signed JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.debug("JWT token has expired.")
        return None
    except jwt.InvalidTokenError as exc:
        logger.debug("Invalid JWT token: %s", exc)
        return None


# ---------------------------------------------------------------------------
# 6-Digit Password Reset Code Generator
# ---------------------------------------------------------------------------
def generate_reset_code() -> str:
    """Generate a cryptographically secure 6-digit numeric verification code."""
    return str(secrets.randbelow(900000) + 100000)


# ---------------------------------------------------------------------------
# SMTP Email Sending for Forgot Password
# ---------------------------------------------------------------------------
def send_password_reset_email(to_email: str, reset_code: str, user_name: str = "Learner") -> Tuple[bool, Optional[str]]:
    """Send a password reset email with the 6-digit verification code via SMTP.
    
    Reads SMTP credentials from .env (Brevo / Sendinblue / Custom SMTP).
    Returns (success: bool, error_message: Optional[str]).
    """
    smtp_host = os.getenv("SMTP_HOST", "smtp-relay.brevo.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM_EMAIL", "").strip()
    if not smtp_from or smtp_from.endswith("@smtp-brevo.com"):
        smtp_from = "divyansh2005goel@gmail.com"

    # Log to server console for monitoring
    logger.info("=== DISPATCHING PASSWORD RESET CODE VIA BREVO SMTP TO %s: [%s] (from: %s) ===", to_email, reset_code, smtp_from)

    if not smtp_user or not smtp_password:
        err_msg = "SMTP credentials (SMTP_USER or SMTP_PASSWORD) are not configured in .env."
        logger.warning(err_msg)
        return False, err_msg

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"CogniLens — Password Reset Code: {reset_code}"
    msg["From"] = f"CogniLens AI <{smtp_from}>"
    msg["To"] = to_email
    msg["Reply-To"] = smtp_from
    msg["Date"] = email.utils.formatdate(localtime=True)
    msg["Message-ID"] = email.utils.make_msgid(domain="cognilens.ai")
    msg["X-Mailer"] = "CogniLens-Auth-Mailer"

    plain_text = f"""Hello {user_name},

You requested to reset your password for your CogniLens account.

Your 6-digit verification code is: {reset_code}

This code will expire in 15 minutes. If you did not request this reset, you can safely ignore this email.

Happy Learning,
The CogniLens Team
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .logo {{ display: flex; align-items: center; gap: 8px; font-size: 22px; font-weight: bold; color: #ffffff; margin-bottom: 24px; }}
        .badge {{ background: #2563eb; color: #ffffff; padding: 4px 10px; border-radius: 8px; font-size: 12px; }}
        .code-box {{ background: #1e293b; border: 2px dashed #3b82f6; border-radius: 12px; padding: 18px; text-align: center; margin: 28px 0; }}
        .code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <span>🧠 Cogni<span style="color:#60a5fa;">Lens</span></span>
        </div>
        <h2 style="margin-top:0; color:#ffffff; font-size:20px;">Password Reset Request</h2>
        <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Hello <strong>{user_name}</strong>,</p>
        <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">
          We received a request to reset your password. Use the verification code below to set a new password:
        </p>
        <div class="code-box">
          <div class="code">{reset_code}</div>
          <div style="font-size:12px; color:#94a3b8; margin-top:8px;">Valid for 15 minutes</div>
        </div>
        <p style="color:#94a3b8; font-size:13px; line-height:1.5;">
          If you did not request this code, no action is needed — your account remains secure.
        </p>
        <div class="footer">
          CogniLens Multimodal Learning Platform &bull; Secure Authentication
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(plain_text, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    last_error = None

    # Attempt 1: Primary configured port
    try:
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=12)
            use_tls = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
            if use_tls:
                server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        logger.info("Successfully sent password reset email via SMTP to %s (port %d)", to_email, smtp_port)
        return True, None
    except Exception as exc:
        last_error = str(exc)
        logger.warning("Primary SMTP attempt to %s failed on port %d: %s. Trying fallback port...", to_email, smtp_port, exc)

    # Attempt 2: Fallback port (switch between 465 SSL and 587 STARTTLS)
    fallback_port = 465 if smtp_port != 465 else 587
    try:
        if fallback_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, fallback_port, timeout=12)
        else:
            server = smtplib.SMTP(smtp_host, fallback_port, timeout=12)
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        logger.info("Successfully sent password reset email via SMTP fallback to %s (port %d)", to_email, fallback_port)
        return True, None
    except Exception as fallback_exc:
        logger.exception("Failed to deliver reset email via SMTP fallback to %s on port %d: %s", to_email, fallback_port, fallback_exc)
        return False, f"SMTP error on port {smtp_port}: {last_error}; on port {fallback_port}: {fallback_exc}"
