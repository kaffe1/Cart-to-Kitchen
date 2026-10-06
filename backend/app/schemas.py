"""Request validation models. Responses are plain dicts built by the service
layer with the exact camelCase field names the frontend TypeScript types use."""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CamelModel(BaseModel):
    """Accepts snake_case input, camelCase via alias (frontend convention)."""

    model_config = ConfigDict(populate_by_name=True)


class RegisterInput(CamelModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(alias="displayName", min_length=1, max_length=40)


class LoginInput(CamelModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class QuantityInput(CamelModel):
    quantity: Annotated[int, Field(ge=0, le=99)]


class UpdateMeInput(CamelModel):
    display_name: str | None = Field(alias="displayName", default=None, min_length=1, max_length=40)
    email: EmailStr | None = None
    new_password: str | None = Field(alias="newPassword", default=None, min_length=6, max_length=128)
    current_password: str | None = Field(alias="currentPassword", default=None)
