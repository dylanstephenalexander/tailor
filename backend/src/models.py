from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    goal = Column(String, default="maintain")
    target_weekly_change_kg = Column(Float, default=0.0)
    birthday = Column(String, nullable=True)
    oura_token = Column(String, nullable=True)


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    barcode = Column(String, nullable=True, index=True)

    # macros
    calories = Column(Float, default=0)
    protein = Column(Float, default=0)
    carbs = Column(Float, default=0)
    fat = Column(Float, default=0)
    fiber = Column(Float, default=0)
    sugar = Column(Float, default=0)
    saturated_fat = Column(Float, default=0)
    trans_fat = Column(Float, default=0)
    cholesterol = Column(Float, default=0)
    polyunsaturated_fat = Column(Float, default=0)
    monounsaturated_fat = Column(Float, default=0)

    # omegas
    omega_3 = Column(Float, default=0)
    omega_6 = Column(Float, default=0)
    omega_9 = Column(Float, default=0)

    # micros
    sodium = Column(Float, default=0)
    potassium = Column(Float, default=0)
    calcium = Column(Float, default=0)
    iron = Column(Float, default=0)
    magnesium = Column(Float, default=0)
    zinc = Column(Float, default=0)
    phosphorus = Column(Float, default=0)
    selenium = Column(Float, default=0)
    copper = Column(Float, default=0)
    manganese = Column(Float, default=0)
    chromium = Column(Float, default=0)
    iodine = Column(Float, default=0)
    vitamin_a = Column(Float, default=0)
    vitamin_c = Column(Float, default=0)
    vitamin_d = Column(Float, default=0)
    vitamin_e = Column(Float, default=0)
    vitamin_k = Column(Float, default=0)
    vitamin_b6 = Column(Float, default=0)
    vitamin_b12 = Column(Float, default=0)
    folate = Column(Float, default=0)
    thiamin = Column(Float, default=0)
    riboflavin = Column(Float, default=0)
    niacin = Column(Float, default=0)
    pantothenic_acid = Column(Float, default=0)
    biotin = Column(Float, default=0)
    choline = Column(Float, default=0)

    is_custom = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class FoodLog(Base):
    __tablename__ = "food_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    date = Column(String, nullable=False)
    meal_type = Column(String, default="snack")
    servings = Column(Float, default=1.0)
    logged_at = Column(DateTime, server_default=func.now())


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    muscle_group = Column(String, nullable=True)
    is_custom = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    logged_at = Column(DateTime, server_default=func.now())


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=False)
    rpe = Column(Float, nullable=True)


class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)
    achieved_at = Column(String, nullable=False)

class WeightLog(Base):
    __tablename__ = "weight_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    weight_kg = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    logged_at = Column(DateTime, server_default=func.now())