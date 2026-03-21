import asyncio
import httpx
from src.database import engine, Base
from src.models import Exercise
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

MUSCLE_GROUP_MAP = {
    1: "biceps",
    2: "anterior deltoid",
    3: "serratus anterior",
    4: "chest",
    5: "triceps",
    6: "biceps",
    7: "lats",
    8: "core",
    9: "glutes",
    10: "hamstrings",
    11: "calves",
    12: "quads",
    13: "traps",
    14: "shoulders",
    15: "forearms",
}

async def fetch_exercises():
    exercises = []
    url = "https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=100&offset=0"

    async with httpx.AsyncClient(timeout=30.0) as client:
        while url:
            print(f"Fetching {url}")
            resp = await client.get(url)
            data = resp.json()
            for ex in data.get("results", []):
                # get english translation
                name = None
                for translation in ex.get("translations", []):
                    if translation.get("language") == 2:
                        name = translation.get("name", "").strip()
                        break
                if not name:
                    continue
                muscles = ex.get("muscles", [])
                muscle_group = MUSCLE_GROUP_MAP.get(
                    muscles[0].get("id") if muscles else None, "other"
                ) if muscles else "other"
                exercises.append({
                    "name": name,
                    "muscle_group": muscle_group,
                })
            url = data.get("next")

    return exercises

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with SessionLocal() as db:
        exercises = await fetch_exercises()
        added = 0
        for ex in exercises:
            result = await db.execute(select(Exercise).where(Exercise.name == ex["name"]))
            if not result.scalar_one_or_none():
                db.add(Exercise(
                    name=ex["name"],
                    muscle_group=ex["muscle_group"],
                    is_custom=False,
                    created_by=None,
                ))
                added += 1
        await db.commit()
        print(f"✓ Seeded {added} exercises")

if __name__ == "__main__":
    asyncio.run(seed())