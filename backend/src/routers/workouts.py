from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import Workout, WorkoutSet, Exercise, PersonalRecord, User
from ..auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/workouts", tags=["workouts"])

class SetInput(BaseModel):
    exercise_id: int | None = None
    exercise_name: str | None = None
    muscle_group: str | None = None
    set_number: int
    reps: int
    weight_kg: float
    rpe: float | None = None

class WorkoutCreate(BaseModel):
    date: str
    notes: str | None = None
    duration_minutes: int | None = None
    sets: list[SetInput]

@router.post("/", status_code=201)
async def log_workout(
    data: WorkoutCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workout = Workout(
        user_id=current_user.id,
        date=data.date,
        notes=data.notes,
        duration_minutes=data.duration_minutes,
    )
    db.add(workout)
    await db.flush()

    prs_earned = []

    for s in data.sets:
        if s.exercise_id:
            exercise_id = s.exercise_id
        else:
            result = await db.execute(
                select(Exercise).where(Exercise.name == s.exercise_name)
            )
            exercise = result.scalar_one_or_none()
            if not exercise:
                exercise = Exercise(
                    name=s.exercise_name,
                    muscle_group=s.muscle_group,
                    is_custom=True,
                    created_by=current_user.id
                )
                db.add(exercise)
                await db.flush()
            exercise_id = exercise.id

        workout_set = WorkoutSet(
            workout_id=workout.id,
            exercise_id=exercise_id,
            set_number=s.set_number,
            reps=s.reps,
            weight_kg=s.weight_kg,
            rpe=s.rpe,
        )
        db.add(workout_set)

        pr_result = await db.execute(
            select(PersonalRecord).where(
                PersonalRecord.user_id == current_user.id,
                PersonalRecord.exercise_id == exercise_id,
            )
        )
        existing_pr = pr_result.scalar_one_or_none()

        if not existing_pr or s.weight_kg > existing_pr.weight_kg:
            if existing_pr:
                existing_pr.weight_kg = s.weight_kg
                existing_pr.reps = s.reps
                existing_pr.achieved_at = data.date
            else:
                new_pr = PersonalRecord(
                    user_id=current_user.id,
                    exercise_id=exercise_id,
                    weight_kg=s.weight_kg,
                    reps=s.reps,
                    achieved_at=data.date,
                )
                db.add(new_pr)
            exercise_label = s.exercise_name or f"exercise {exercise_id}"
            if exercise_label not in prs_earned:
                prs_earned.append(exercise_label)

    await db.commit()
    await db.refresh(workout)

    return {
        "workout_id": workout.id,
        "date": workout.date,
        "sets_logged": len(data.sets),
        "prs_earned": prs_earned,
    }

@router.get("/")
async def get_workouts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Workout).where(Workout.user_id == current_user.id)
        .order_by(Workout.date.desc())
    )
    return result.scalars().all()

@router.get("/prs")
async def get_prs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(PersonalRecord, Exercise)
        .join(Exercise, PersonalRecord.exercise_id == Exercise.id)
        .where(PersonalRecord.user_id == current_user.id)
    )
    rows = result.all()
    return [
        {
            "exercise": row.Exercise.name,
            "muscle_group": row.Exercise.muscle_group,
            "weight_kg": row.PersonalRecord.weight_kg,
            "reps": row.PersonalRecord.reps,
            "achieved_at": row.PersonalRecord.achieved_at,
        }
        for row in rows
    ]