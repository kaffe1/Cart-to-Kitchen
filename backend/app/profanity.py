"""Regex-based profanity filter for review text (course grading item:
"Use Regex to filter information"). One pattern, word-boundary anchored, so
"class" survives while the listed words do not."""

from __future__ import annotations

import re

from .errors import RuleValidation

WORDS = ("damn", "shit", "crap", "hell")
PATTERN = re.compile(r"\b(?:" + "|".join(WORDS) + r")\b", re.IGNORECASE)


def check_review(text: str) -> None:
    if PATTERN.search(text):
        raise RuleValidation(
            "The review contains words that are not allowed.",
            details={"code": "PROFANITY_REJECTED"},
        )
