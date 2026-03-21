from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import User, FoodLog, FoodItem, Workout, WorkoutSet, PersonalRecord, UserProfile
from ..auth import get_current_user
from ..routers.cutscenes import evaluate_cutscenes
from ..routers.recommendations import get_recommendations

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/{date}")
async def get_dashboard(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # food log + totals
    food_result = await db.execute(
        select(FoodLog, FoodItem)
        .join(FoodItem, FoodLog.food_item_id == FoodItem.id)
        .where(FoodLog.user_id == current_user.id, FoodLog.date == date)
    )
    rows = food_result.all()

    entries = []
    totals = {
        "calories": 0, "protein": 0, "carbs": 0, "fat": 0,
        "fiber": 0, "sugar": 0, "saturated_fat": 0, "cholesterol": 0,
        "sodium": 0, "vitamin_a": 0, "vitamin_c": 0, "vitamin_d": 0,
        "calcium": 0, "iron": 0, "potassium": 0, "magnesium": 0,
        "zinc": 0, "omega_3": 0, "omega_6": 0, "choline": 0,
    }

    for log, food in rows:
        s = log.servings
        entries.append({
            "id": log.id,
            "meal_type": log.meal_type,
            "servings": s,
            "food": {
                "id": food.id,
                "name": food.name,
                "calories": food.calories,
                "protein": food.protein,
                "carbs": food.carbs,
                "fat": food.fat,
            }
        })
        for key in totals:
            totals[key] += (getattr(food, key, 0) or 0) * s

    totals = {k: round(v, 1) for k, v in totals.items()}

    # workouts
    workout_result = await db.execute(
        select(Workout).where(
            Workout.user_id == current_user.id,
            Workout.date == date
        )
    )
    workouts = workout_result.scalars().all()

    workout_summaries = []
    prs_today = []
    for workout in workouts:
        sets_result = await db.execute(
            select(WorkoutSet, PersonalRecord)
            .join(PersonalRecord, 
                (PersonalRecord.exercise_id == WorkoutSet.exercise_id) &
                (PersonalRecord.user_id == current_user.id) &
                (PersonalRecord.achieved_at == date),
                isouter=True
            )
            .where(WorkoutSet.workout_id == workout.id)
        )
        sets = sets_result.all()
        for ws, pr in sets:
            if pr and pr.achieved_at == date:
                prs_today.append(pr)

        workout_summaries.append({
            "id": workout.id,
            "duration_minutes": workout.duration_minutes,
            "notes": workout.notes,
            "set_count": len(sets),
        })

    # cutscenes
    cutscenes = await evaluate_cutscenes(
        current_user.id, date, totals, prs_today, db
    )

    # recommendations
    try:
        recommendations = await get_recommendations(db, current_user)
    except Exception:
        recommendations = None

    # profile
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()

    return {
        "date": date,
        "profile": profile,
        "food": {
            "entries": entries,
            "totals": totals,
        },
        "workouts": workout_summaries,
        "prs_today": [{"exercise_id": pr.exercise_id, "weight_kg": pr.weight_kg} for pr in prs_today],
        "cutscenes": cutscenes,
        "recommendations": recommendations,
    }