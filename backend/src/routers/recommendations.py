import numpy as np
from sklearn.linear_model import LinearRegression
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import User, UserProfile, WeightLog, FoodLog, FoodItem
from ..auth import get_current_user
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

def calculate_bmr(profile) -> float:
    if not all([profile.weight_kg, profile.height_cm, profile.age, profile.sex]):
        return None
    if profile.sex.lower() == "female":
        return (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161
    else:
        return (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5

def round_to_nearest(value, increment=12.5):
    return round(value / increment) * increment

class WeightLogCreate(BaseModel):
    weight_kg: float
    date: str

@router.post("/weight", status_code=201)
async def log_weight(
    data: WeightLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = WeightLog(
        user_id=current_user.id,
        weight_kg=data.weight_kg,
        date=data.date,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

@router.get("/")
async def get_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    bmr = calculate_bmr(profile)
    if not bmr:
        raise HTTPException(status_code=400, detail="Profile incomplete — need height, weight, age, sex")

    # get last 28 days of weight logs
    weight_result = await db.execute(
        select(WeightLog)
        .where(WeightLog.user_id == current_user.id)
        .order_by(WeightLog.date.asc())
    )
    weight_logs = weight_result.scalars().all()

    # get last 14 days of calorie intake
    today = datetime.now().date()
    two_weeks_ago = (today - timedelta(days=14)).isoformat()
    food_result = await db.execute(
        select(FoodLog, FoodItem)
        .join(FoodItem, FoodLog.food_item_id == FoodItem.id)
        .where(
            FoodLog.user_id == current_user.id,
            FoodLog.date >= two_weeks_ago
        )
    )
    food_rows = food_result.all()

    # average daily calories over last 14 days
    daily_calories = {}
    for log, food in food_rows:
        daily_calories[log.date] = daily_calories.get(log.date, 0) + (food.calories or 0) * log.servings
    avg_calories = sum(daily_calories.values()) / len(daily_calories) if daily_calories else None

    # use linear regression on weight logs if enough data
    weight_trend_kg_per_week = None
    if len(weight_logs) >= 4:
        dates = np.array([(datetime.strptime(w.date, "%Y-%m-%d") - datetime(2024, 1, 1)).days for w in weight_logs]).reshape(-1, 1)
        weights = np.array([w.weight_kg for w in weight_logs])
        model = LinearRegression().fit(dates, weights)
        weight_trend_kg_per_week = model.coef_[0] * 7

    # calculate calorie target
    goal = profile.goal or "maintain"
    target_weekly_change = profile.target_weekly_change_kg or 0.0
    required_daily_deficit = target_weekly_change * 1000 / 7

    # estimate tdee
    if avg_calories and weight_trend_kg_per_week is not None:
        actual_deficit = (weight_trend_kg_per_week * 1000) / 7
        estimated_tdee = avg_calories - actual_deficit
    else:
        estimated_tdee = bmr * 1.4

    calorie_target = estimated_tdee - required_daily_deficit

    # adjust based on trend vs goal
    adjustment = 0
    if weight_trend_kg_per_week is not None:
        trend_error = weight_trend_kg_per_week - target_weekly_change
        raw_adjustment = -(trend_error * 1000 / 7)
        adjustment = round_to_nearest(raw_adjustment, 12.5)
        calorie_target += adjustment

    calorie_target = round_to_nearest(calorie_target, 12.5)

    # protein target
    protein_target = round(profile.weight_kg * 1.6) if goal == "gain" else round(profile.weight_kg * 1.2)

    return {
        "calorie_target": calorie_target,
        "protein_target_g": protein_target,
        "fiber_target_g": 25 if profile.sex and profile.sex.lower() == "female" else 38,
        "estimated_tdee": round(estimated_tdee),
        "bmr": round(bmr),
        "weight_trend_kg_per_week": round(weight_trend_kg_per_week, 3) if weight_trend_kg_per_week is not None else None,
        "avg_daily_calories": round(avg_calories) if avg_calories else None,
        "adjustment_applied": adjustment,
        "data_points": len(weight_logs),
        "note": "Need at least 4 weight entries for trend analysis" if len(weight_logs) < 4 else None
    }