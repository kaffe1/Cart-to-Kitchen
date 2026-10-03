"""Wallet rules, kept in one place and mirrored from the frontend demo economy.

The player starts with 500 SEK and earns an hourly grant of 100 SEK for every
full hour passed inside the Stockholm working window 09:00–17:00, up to a cap
of 3000 SEK. Grants accrue lazily: they are applied whenever the wallet is
read, so no background scheduler is needed.

DB datetimes are naive UTC; anything timezone-aware is produced here at the
boundary (API output) only.
"""

from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from ..data.models import User, Wallet
from ..data.repositories import ShoppingRepository

STOCKHOLM = ZoneInfo("Europe/Stockholm")
STARTING_BALANCE_SEK = 500
HOURLY_GRANT_SEK = 100
CAP_SEK = 3000
WORK_DAY_START_HOUR = 9
WORK_DAY_END_HOUR = 17  # grants stop after 17:00


def utcnow_naive() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _local(naive_utc: datetime) -> datetime:
    return naive_utc.replace(tzinfo=UTC).astimezone(STOCKHOLM)


def next_grant_at(naive_utc: datetime) -> datetime | None:
    """When the next full grant lands (Stockholm tz), or None after 17:00."""
    local = _local(naive_utc)
    if local.hour < WORK_DAY_START_HOUR:
        return local.replace(
            hour=WORK_DAY_START_HOUR, minute=0, second=0, microsecond=0
        )
    if local.hour >= WORK_DAY_END_HOUR:
        return None
    return local.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


def grants_between(last_accrued_naive: datetime, now_naive: datetime) -> int:
    """Full hourly grants earned between two naive-UTC instants."""
    total = 0
    cursor = _local(last_accrued_naive)
    end = _local(now_naive)
    day = cursor.replace(hour=0, minute=0, second=0, microsecond=0)
    while day <= end:
        window_start = day.replace(hour=WORK_DAY_START_HOUR)
        window_end = day.replace(hour=WORK_DAY_END_HOUR)
        overlap_start = max(cursor, window_start)
        overlap_end = min(end, window_end)
        if overlap_end > overlap_start:
            hours = (overlap_end - overlap_start).total_seconds() / 3600
            total += int(hours)
        day += timedelta(days=1)
    return total


def create_wallet(db: Session, user: User) -> Wallet:
    """New wallets anchor at today's 09:00 Stockholm window (or now, if later),
    which reproduces the frontend demo rule "500 + earned today"."""
    now = utcnow_naive()
    local_today_open = _local(now).replace(
        hour=WORK_DAY_START_HOUR, minute=0, second=0, microsecond=0
    )
    anchor = min(now, local_today_open.astimezone(UTC).replace(tzinfo=None))
    return ShoppingRepository(db).create_wallet(
        user.id, balance_sek=STARTING_BALANCE_SEK, last_accrued_at=anchor
    )


def apply_grants(db: Session, user_id: int) -> Wallet:
    wallet = ShoppingRepository(db).wallet(user_id)
    now = utcnow_naive()
    earned = grants_between(wallet.last_accrued_at, now)
    if earned > 0:
        wallet.balance_sek = min(wallet.balance_sek + earned * HOURLY_GRANT_SEK, CAP_SEK)
    wallet.last_accrued_at = now
    db.flush()
    return wallet
