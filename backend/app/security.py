"""Password hashing and JWT session tokens.

Tokens are signed with HS256 and always verified server-side. The token travels
in an HttpOnly cookie; it is also returned in the login/register response body
because the frontend `AuthResult` contract includes an `accessToken` field.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from .errors import InvalidSession


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except ValueError:
        return False


def create_session_token(user_id: int, *, secret: str, algorithm: str, hours: int) -> str:
    now = datetime.now(UTC)
    claims = {"sub": str(user_id), "iat": now, "exp": now + timedelta(hours=hours)}
    return jwt.encode(claims, secret, algorithm=algorithm)


def read_session_token(token: str, *, secret: str, algorithm: str) -> int:
    """Verify signature + expiry server-side and return the user id."""
    try:
        claims = jwt.decode(token, secret, algorithms=[algorithm])
        return int(claims["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise InvalidSession("session token is invalid or expired") from exc
