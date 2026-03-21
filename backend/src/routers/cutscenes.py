from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import User, UserProfile
from ..auth import get_current_user
from datetime import date as date_type

router = APIRouter(prefix="/cutscenes", tags=["cutscenes"])

ANNIVERSARY = "2026-01-01"

async def evaluate_cutscenes(user_id: int, log_date: str, totals: dict, prs_earned: list, db: AsyncSession) -> list[str]:
    triggered = []
    today = log_date

    # food based triggers
    if totals.get("saturated_fat", 0) > 30:
        triggered.append("holy_saturated_fat")

    if totals.get("cholesterol", 0) >= 1250:
        triggered.append("omg_cholesterol")

    if totals.get("fiber", 0) < 10:
        triggered.append("low_fiber")

    # date based triggers
    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    if profile and profile.birthday:
        bday = profile.birthday[5:]  # MM-DD
        if today[5:] == bday:
            triggered.append("happy_birthday")

    if today[5:] == ANNIVERSARY[5:]:
        triggered.append("happy_anniversary")

    # PR trigger
    if prs_earned:
        triggered.append("pr_earned")

    return triggered

@router.get("/evaluate")
async def get_cutscenes(
    log_date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..routers.food_log import get_log
    log_data = await get_log(log_date, db, current_user)
    totals = log_data["totals"]

    triggered = await evaluate_cutscenes(current_user.id, log_date, totals, [], db)

    return {"triggered": triggered}