from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from ..database import get_db
from ..models import FoodItem, FoodLog, User
from ..auth import get_current_user
from pydantic import BaseModel
from datetime import date

router = APIRouter(prefix="/log", tags=["log"])

class FoodLogCreate(BaseModel):
    food_item_id: int | None = None
    food_data: dict | None = None
    date: str
    meal_type: str = "snack"
    servings: float = 1.0

class FoodLogResponse(BaseModel):
    id: int
    food_item_id: int
    date: str
    meal_type: str
    servings: float
    food: dict

    class Config:
        from_attributes = True

@router.post("/", status_code=201)
async def log_food(
    entry: FoodLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # if food_data is passed instead of food_item_id, save it first
    if entry.food_data and not entry.food_item_id:
        food_item = FoodItem(**entry.food_data, created_by=current_user.id)
        db.add(food_item)
        await db.commit()
        await db.refresh(food_item)
        food_item_id = food_item.id
    else:
        food_item_id = entry.food_item_id

    log = FoodLog(
        user_id=current_user.id,
        food_item_id=food_item_id,
        date=entry.date,
        meal_type=entry.meal_type,
        servings=entry.servings,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

@router.get("/{date}")
async def get_log(
    date: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(FoodLog, FoodItem)
        .join(FoodItem, FoodLog.food_item_id == FoodItem.id)
        .where(FoodLog.user_id == current_user.id, FoodLog.date == date)
    )
    rows = result.all()

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
        entry = {
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
        }
        entries.append(entry)

        for key in totals:
            totals[key] += (getattr(food, key, 0) or 0) * s

    return {
        "date": date,
        "entries": entries,
        "totals": {k: round(v, 1) for k, v in totals.items()}
    }

@router.delete("/{log_id}", status_code=204)
async def delete_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(FoodLog).where(FoodLog.id == log_id, FoodLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    await db.delete(log)
    await db.commit()