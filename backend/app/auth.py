"""auth.py — self-hosted, invite-only authentication.

Bidframe is a paid product, so the API is gated: every tender endpoint requires a
valid bearer token and only ever returns the caller's own tenders. There is no public
signup — accounts are created by an admin (see `python -m app.admin create-user`).

Design choices (deliberately dependency-light + standard):
- Passwords: PBKDF2-HMAC-SHA256 with a per-user random salt (stdlib `hashlib`), stored
  as `pbkdf2_sha256$rounds$salt$hash`. Verified in constant time (`hmac.compare_digest`).
- Sessions: stateless JWT (HS256, PyJWT) signed with AUTH_SECRET, 7-day expiry. The
  frontend sends it as `Authorization: Bearer <token>`.
- Enforcement: `current_user` is a FastAPI dependency — attach it to a route and the
  route is closed to anyone without a valid token.

Set AUTH_SECRET in the environment for any real deployment; the dev default is
intentionally weak and refused-looking so an unset prod secret is obvious.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time
from typing import Optional

import jwt
from fastapi import Header, HTTPException
from pydantic import BaseModel

from . import store


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUser(BaseModel):
    id: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: AuthUser

_PBKDF2_ROUNDS = 200_000
_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days
_DEV_SECRET = "dev-insecure-secret-change-me-in-production-please"  # >=32 bytes, still obviously a placeholder


# ---- Passwords ---------------------------------------------------------------

def hash_password(password: str) -> str:
    """Return a self-describing PBKDF2 hash: pbkdf2_sha256$rounds$salt_hex$hash_hex."""
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time check of a plaintext password against a stored PBKDF2 hash."""
    try:
        algo, rounds_s, salt_hex, hash_hex = stored.split("$")
        if algo != "pbkdf2_sha256":
            return False
        rounds = int(rounds_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, AttributeError):
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)
    return hmac.compare_digest(dk, expected)


# ---- Tokens ------------------------------------------------------------------

def _secret() -> str:
    return os.environ.get("AUTH_SECRET", _DEV_SECRET)


def create_token(user_id: str) -> str:
    now = int(time.time())
    payload = {"sub": user_id, "iat": now, "exp": now + _TOKEN_TTL_SECONDS}
    return jwt.encode(payload, _secret(), algorithm="HS256")


def _decode_token(token: str) -> Optional[str]:
    """Return the subject (user id) of a valid, unexpired token, else None."""
    try:
        payload = jwt.decode(token, _secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None


# ---- Resolution --------------------------------------------------------------

def user_from_token(token: Optional[str]) -> Optional[dict]:
    """Return the account for a valid token, or None. Used both by the header
    dependency and by routes that must accept a `?token=` query param (a browser
    can't set an Authorization header on a plain <iframe>/link navigation)."""
    if not token:
        return None
    user_id = _decode_token(token)
    if not user_id:
        return None
    return store.get_user_by_id(user_id)


def current_user(authorization: str = Header(None)) -> dict:
    """Resolve the caller from the Authorization header, or 401. Attach to any route
    (`user: dict = Depends(current_user)`) to require a signed-in account."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    user = user_from_token(authorization[7:].strip())
    if user is None:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
    return user
