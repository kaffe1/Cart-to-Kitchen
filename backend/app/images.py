"""Shared guard for user-uploaded images (avatar, review photos): one
whitelist, one size cap — nothing more."""

from __future__ import annotations

from fastapi import UploadFile

from .errors import RuleValidation

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
MAX_IMAGE_BYTES = 2 * 1024 * 1024


async def read_image(upload: UploadFile) -> tuple[bytes, str]:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise RuleValidation("Only PNG, JPEG or WebP images are accepted.")
    data = await upload.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise RuleValidation("Image is larger than 2 MB.")
    return data, upload.content_type
