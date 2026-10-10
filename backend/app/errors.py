"""Business exceptions and the uniform error JSON shape.

Services raise these; the HTTP layer maps every one of them to
``{"error": {"code", "message"}}`` with a proper status code, so the frontend
can branch on `code` (e.g. BUDGET_EXCEEDED) instead of parsing text.
"""

from typing import Any


class AppError(Exception):
    status_code = 500
    code = "internal_error"

    def __init__(self, message: str = "", details: Any = None) -> None:
        super().__init__(message or self.code)
        self.message = message or self.code
        self.details = details


class InvalidCredentials(AppError):
    status_code = 401
    code = "invalid_credentials"


class AuthRequired(AppError):
    status_code = 401
    code = "auth_required"


class InvalidSession(AppError):
    status_code = 401
    code = "invalid_session"


class NotFound(AppError):
    status_code = 404
    code = "not_found"


class Conflict(AppError):
    status_code = 409
    code = "conflict"


class RuleValidation(AppError):
    """A business rule rejected the request (empty cart, budget exceeded...)."""

    status_code = 422
    code = "rule_validation"


class ExternalApi(AppError):
    """An upstream service (TheMealDB) failed."""

    status_code = 502
    code = "external_api_error"
