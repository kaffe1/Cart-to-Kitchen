"""Regex-based profanity filter for review text (course grading item:
"Use Regex to filter information"). One pattern, word-boundary anchored, so
"class" survives while the listed words do not."""

from __future__ import annotations

import html
import re

from .errors import RuleValidation

WORDS = ("damn", "shit", "crap", "hell")
PATTERN = re.compile(r"\b(?:" + "|".join(WORDS) + r")\b", re.IGNORECASE)
MAX_REVIEW_TEXT_LENGTH = 1500
MAX_REVIEW_HTML_LENGTH = 10000

_BLOCK_BREAKS = re.compile(r"</p>|<br\s*/?>", re.IGNORECASE)
_TAGS = re.compile(r"<[^>]+>")


def user_text(raw: str) -> str:
    return html.unescape(_TAGS.sub("", _BLOCK_BREAKS.sub(" ", raw)))


def check_review(text: str) -> None:
    visible_text = user_text(text).strip()
    if not visible_text:
        raise RuleValidation(
            "A review must contain some text.",
            details={"code": "REVIEW_EMPTY"},
        )
    if len(visible_text) > MAX_REVIEW_TEXT_LENGTH:
        raise RuleValidation(
            f"The review must be {MAX_REVIEW_TEXT_LENGTH} characters or fewer.",
            details={"code": "REVIEW_TOO_LONG"},
        )
    if PATTERN.search(visible_text):
        raise RuleValidation(
            "The review contains words that are not allowed.",
            details={"code": "PROFANITY_REJECTED"},
        )
