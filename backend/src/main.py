from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .database import engine, Base
from . import models
from .routers import auth, nutrition, food_log, profile, workouts, cutscenes, recommendations, dashboard, alerts

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",  "http://localhost:5174", "https://tailor-seven-kappa.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/health")
def health():
    return {"status": "ok"}