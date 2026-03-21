from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import engine, Base
from . import models
from .routers import auth, nutrition, food_log, profile, workouts, cutscenes, recommendations, dashboard, alerts

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)
app.include_router(nutrition.router)
app.include_router(food_log.router)
app.include_router(profile.router)
app.include_router(workouts.router)
app.include_router(cutscenes.router)
app.include_router(recommendations.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)

@app.get("/")
def root():
    return {"message": "Tailor API is running"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created")
    yield