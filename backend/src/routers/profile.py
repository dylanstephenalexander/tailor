from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import UserProfile, User, WeightLog
from ..auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/profile", tags=["profile"])

class ProfileCreate(BaseModel):
    height_cm: float | None = None
    weight_kg: float | None = None
    age: int | None = None
    sex: str | None = None
    goal: str = "maintain"
    target_weekly_change_kg: float = 0.0
    birthday: str | None = None
    oura_token: str | None = None

class ProfileResponse(ProfileCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

@router.post("/", status_code=201)
async def create_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists, use PUT to update")

    profile = UserProfile(**data.model_dump(), user_id=current_user.id)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/")
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/")
async def update_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for key, value in data.model_dump().items():
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)
    return profile

@router.delete("/weight/{entry_id}", status_code=204)
async def delete_weight(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(WeightLog).where(WeightLog.id == entry_id, WeightLog.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()