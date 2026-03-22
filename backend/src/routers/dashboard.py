from datetime import date as date_type, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from ..database import get_db
from ..models import User, FoodLog, FoodItem, Workout, WorkoutSet, PersonalRecord, UserProfile, Exercise
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
    # ── food log + totals ────────────────────────────────────────────────────
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

    # ── profile ──────────────────────────────────────────────────────────────
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()

    # ── last workout (across all dates, not just today) ──────────────────────
    last_workout_result = await db.execute(
        select(Workout)
        .where(Workout.user_id == current_user.id)
        .order_by(Workout.date.desc(), Workout.logged_at.desc())
        .limit(1)
    )
    last_workout = last_workout_result.scalar_one_or_none()

    last_workout_summary = None
    if last_workout:
        sets_result = await db.execute(
            select(func.count(WorkoutSet.id))
            .where(WorkoutSet.workout_id == last_workout.id)
        )
        set_count = sets_result.scalar() or 0

        today = date_type.fromisoformat(date)
        workout_date = date_type.fromisoformat(last_workout.date)
        days_ago = (today - workout_date).days

        last_workout_summary = {
            "id": last_workout.id,
            "date": last_workout.date,
            "notes": last_workout.notes,
            "duration_minutes": last_workout.duration_minutes,
            "set_count": set_count,
            "days_ago": days_ago,
        }

    # ── workouts this week (Mon–Sun) ─────────────────────────────────────────
    today_date = date_type.fromisoformat(date)
    week_start = today_date - timedelta(days=today_date.weekday())  # Monday
    week_end   = week_start + timedelta(days=6)

    week_result = await db.execute(
        select(Workout.date)
        .where(
            Workout.user_id == current_user.id,
            Workout.date >= week_start.isoformat(),
            Workout.date <= week_end.isoformat(),
        )
    )
    week_workout_dates = [r[0] for r in week_result.all()]
    # convert to day-of-week index 0=Mon
    workouts_this_week = list({
        (date_type.fromisoformat(d).weekday()) for d in week_workout_dates
    })

    # ── today's workouts (for cutscenes) ────────────────────────────────────
    today_workouts_result = await db.execute(
        select(Workout).where(
            Workout.user_id == current_user.id,
            Workout.date == date
        )
    )
    today_workouts = today_workouts_result.scalars().all()

    prs_today = []
    for workout in today_workouts:
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
        for ws, pr in sets_result.all():
            if pr and pr.achieved_at == date:
                prs_today.append(pr)

    # ── latest PR with exercise name ─────────────────────────────────────────
    latest_pr_result = await db.execute(
        select(PersonalRecord, Exercise)
        .join(Exercise, PersonalRecord.exercise_id == Exercise.id)
        .where(PersonalRecord.user_id == current_user.id)
        .order_by(PersonalRecord.achieved_at.desc())
        .limit(1)
    )
    latest_pr_row = latest_pr_result.first()

    latest_pr = None
    if latest_pr_row:
        pr, ex = latest_pr_row
        # flag as new if achieved within last 7 days
        pr_date   = date_type.fromisoformat(pr.achieved_at)
        is_new    = (today_date - pr_date).days <= 7
        latest_pr = {
            "exercise_id":   pr.exercise_id,
            "exercise_name": ex.name,
            "muscle_group":  ex.muscle_group,
            "weight_kg":     pr.weight_kg,
            "reps":          pr.reps,
            "achieved_at":   pr.achieved_at,
            "is_new":        is_new,
        }

    # ── cutscenes ────────────────────────────────────────────────────────────
    cutscenes = await evaluate_cutscenes(
        current_user.id, date, totals, prs_today, db
    )

    # ── recommendations ──────────────────────────────────────────────────────
    try:
        recommendations = await get_recommendations(db, current_user)
    except Exception:
        recommendations = None

    return {
        "date": date,
        "profile": profile,
        "food": {
            "entries": entries,
            "totals": totals,
        },
        "last_workout": last_workout_summary,
        "workouts_this_week": workouts_this_week,
        "latest_pr": latest_pr,
        "prs_today": [{"exercise_id": pr.exercise_id, "weight_kg": pr.weight_kg} for pr in prs_today],
        "cutscenes": cutscenes,
        "recommendations": recommendations,
    }
