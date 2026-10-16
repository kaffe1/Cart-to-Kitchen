"""Regex-based profanity filter for review text (course grading item:
"Use Regex to filter information"). One pattern, word-boundary anchored, so
"class" survives while the listed words do not."""

from __future__ import annotations

import html
import re

from .errors import RuleValidation

WORDS = ("damn", "shit", "crap", "hell")
PATTERN = re.compile(r"\b(?:" + "|".join(WORDS) + r")\b", re.IGNORECASE)

_BLOCK_BREAKS = re.compile(r"</p>|<br\s*/?>", re.IGNORECASE)
_TAGS = re.compile(r"<[^>]+>")


def user_text(raw: str) -> str:
    return html.unescape(_TAGS.sub("", _BLOCK_BREAKS.sub(" ", raw)))


def check_review(text: str) -> None:
    if PATTERN.search(user_text(text)):
        raise RuleValidation(
            "The review contains words that are not allowed.",
            details={"code": "PROFANITY_REJECTED"},
        )
