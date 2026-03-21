from contextlib import asynccontextmanager
from fastapi import FastAPI
from .database import engine, Base
from . import models
from .routers import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Tailor API is running"}

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Tables created")
    yield