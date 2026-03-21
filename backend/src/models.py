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

    # micros
    sodium = Column(Float, default=0)
    potassium = Column(Float, default=0)
    calcium = Column(Float, default=0)
    iron = Column(Float, default=0)
    magnesium = Column(Float, default=0)
    zinc = Column(Float, default=0)
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