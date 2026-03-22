import httpx
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import FoodItem, FoodLog
from ..auth import get_current_user
from ..models import User
from pydantic import BaseModel

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

class FoodItemCreate(BaseModel):
    name: str
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    serving_label: str | None = None
    unit_size_g: float | None = None
    # micros — all optional
    fiber: float = 0
    sugar: float = 0
    saturated_fat: float = 0
    trans_fat: float = 0
    cholesterol: float = 0
    polyunsaturated_fat: float = 0
    monounsaturated_fat: float = 0
    omega_3: float = 0
    omega_6: float = 0
    omega_9: float = 0
    sodium: float = 0
    potassium: float = 0
    calcium: float = 0
    iron: float = 0
    magnesium: float = 0
    zinc: float = 0
    phosphorus: float = 0
    selenium: float = 0
    copper: float = 0
    manganese: float = 0
    chromium: float = 0
    iodine: float = 0
    vitamin_a: float = 0
    vitamin_c: float = 0
    vitamin_d: float = 0
    vitamin_e: float = 0
    vitamin_k: float = 0
    vitamin_b6: float = 0
    vitamin_b12: float = 0
    folate: float = 0
    thiamin: float = 0
    riboflavin: float = 0
    niacin: float = 0
    pantothenic_acid: float = 0
    biotin: float = 0
    choline: float = 0

class FoodItemMicros(BaseModel):
    fiber: float = 0
    sugar: float = 0
    saturated_fat: float = 0
    trans_fat: float = 0
    cholesterol: float = 0
    polyunsaturated_fat: float = 0
    monounsaturated_fat: float = 0
    omega_3: float = 0
    omega_6: float = 0
    omega_9: float = 0
    sodium: float = 0
    potassium: float = 0
    calcium: float = 0
    iron: float = 0
    magnesium: float = 0
    zinc: float = 0
    phosphorus: float = 0
    selenium: float = 0
    copper: float = 0
    manganese: float = 0
    chromium: float = 0
    iodine: float = 0
    vitamin_a: float = 0
    vitamin_c: float = 0
    vitamin_d: float = 0
    vitamin_e: float = 0
    vitamin_k: float = 0
    vitamin_b6: float = 0
    vitamin_b12: float = 0
    folate: float = 0
    thiamin: float = 0
    riboflavin: float = 0
    niacin: float = 0
    pantothenic_acid: float = 0
    biotin: float = 0
    choline: float = 0

def map_off_product(product: dict) -> dict:
    n = product.get("nutriments", {})
    return {
        "name": product.get("product_name", "Unknown"),
        "barcode": product.get("code"),
        "calories": n.get("energy-kcal_100g", 0),
        "protein": n.get("proteins_100g", 0),
        "carbs": n.get("carbohydrates_100g", 0),
        "fat": n.get("fat_100g", 0),
        "fiber": n.get("fiber_100g", 0),
        "sugar": n.get("sugars_100g", 0),
        "saturated_fat": n.get("saturated-fat_100g", 0),
        "trans_fat": n.get("trans-fat_100g", 0),
        "cholesterol": n.get("cholesterol_100g", 0),
        "polyunsaturated_fat": n.get("polyunsaturated-fat_100g", 0),
        "monounsaturated_fat": n.get("monounsaturated-fat_100g", 0),
        "omega_3": n.get("omega-3-fat_100g", 0),
        "omega_6": n.get("omega-6-fat_100g", 0),
        "omega_9": n.get("omega-9-fat_100g", 0),
        "sodium": n.get("sodium_100g", 0),
        "potassium": n.get("potassium_100g", 0),
        "calcium": n.get("calcium_100g", 0),
        "iron": n.get("iron_100g", 0),
        "magnesium": n.get("magnesium_100g", 0),
        "zinc": n.get("zinc_100g", 0),
        "phosphorus": n.get("phosphorus_100g", 0),
        "selenium": n.get("selenium_100g", 0),
        "copper": n.get("copper_100g", 0),
        "manganese": n.get("manganese_100g", 0),
        "chromium": n.get("chromium_100g", 0),
        "iodine": n.get("iodine_100g", 0),
        "vitamin_a": n.get("vitamin-a_100g", 0),
        "vitamin_c": n.get("vitamin-c_100g", 0),
        "vitamin_d": n.get("vitamin-d_100g", 0),
        "vitamin_e": n.get("vitamin-e_100g", 0),
        "vitamin_k": n.get("vitamin-k_100g", 0),
        "vitamin_b6": n.get("vitamin-b6_100g", 0),
        "vitamin_b12": n.get("vitamin-b12_100g", 0),
        "folate": n.get("folate_100g", 0),
        "thiamin": n.get("thiamin_100g", 0),
        "riboflavin": n.get("riboflavin_100g", 0),
        "niacin": n.get("niacin_100g", 0),
        "pantothenic_acid": n.get("pantothenic-acid_100g", 0),
        "biotin": n.get("biotin_100g", 0),
        "choline": n.get("choline_100g", 0),
        "is_custom": False,
    }

def map_usda_product(food: dict) -> dict:
    nutrients = {n["nutrientId"]: n.get("value", 0) for n in food.get("foodNutrients", [])}
    return {
        "name": food.get("description", "Unknown"),
        "barcode": None,
        "calories": nutrients.get(1008, 0),
        "protein": nutrients.get(1003, 0),
        "carbs": nutrients.get(1005, 0),
        "fat": nutrients.get(1004, 0),
        "fiber": nutrients.get(1079, 0),
        "sugar": nutrients.get(2000, 0),
        "saturated_fat": nutrients.get(1258, 0),
        "trans_fat": nutrients.get(1257, 0),
        "cholesterol": nutrients.get(1253, 0),
        "polyunsaturated_fat": nutrients.get(1293, 0),
        "monounsaturated_fat": nutrients.get(1292, 0),
        "omega_3": nutrients.get(1404, 0),
        "omega_6": nutrients.get(1269, 0),
        "omega_9": nutrients.get(1268, 0),
        "sodium": nutrients.get(1093, 0),
        "potassium": nutrients.get(1092, 0),
        "calcium": nutrients.get(1087, 0),
        "iron": nutrients.get(1089, 0),
        "magnesium": nutrients.get(1090, 0),
        "zinc": nutrients.get(1095, 0),
        "phosphorus": nutrients.get(1091, 0),
        "selenium": nutrients.get(1103, 0),
        "copper": nutrients.get(1098, 0),
        "manganese": nutrients.get(1101, 0),
        "chromium": nutrients.get(1096, 0),
        "iodine": nutrients.get(1100, 0),
        "vitamin_a": nutrients.get(1106, 0),
        "vitamin_c": nutrients.get(1162, 0),
        "vitamin_d": nutrients.get(1114, 0),
        "vitamin_e": nutrients.get(1109, 0),
        "vitamin_k": nutrients.get(1185, 0),
        "vitamin_b6": nutrients.get(1175, 0),
        "vitamin_b12": nutrients.get(1178, 0),
        "folate": nutrients.get(1177, 0),
        "thiamin": nutrients.get(1165, 0),
        "riboflavin": nutrients.get(1166, 0),
        "niacin": nutrients.get(1167, 0),
        "pantothenic_acid": nutrients.get(1170, 0),
        "biotin": nutrients.get(1176, 0),
        "choline": nutrients.get(1180, 0),
        "is_custom": False,
    }

@router.post("/food", status_code=201)
async def create_food_item(
    data: FoodItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    food = FoodItem(**data.model_dump(), is_custom=True, created_by=current_user.id)
    db.add(food)
    await db.commit()
    await db.refresh(food)
    return food

@router.patch("/food/{food_id}/micros", status_code=200)
async def update_food_micros(
    food_id: int,
    data: FoodItemMicros,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(FoodItem).where(
            FoodItem.id == food_id,
            FoodItem.created_by == current_user.id
        )
    )
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found or not yours to edit")
    for key, value in data.model_dump().items():
        setattr(food, key, value)
    await db.commit()
    await db.refresh(food)
    return food

@router.get("/search")
async def search_food(
    q: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(FoodItem).where(
            FoodItem.name.ilike(f"%{q}%"),
            (FoodItem.created_by == current_user.id) | (FoodItem.is_custom == False)
        )
    )
    personal = result.scalars().all()

    usda_key = os.getenv("USDA_API_KEY")

    async with httpx.AsyncClient(timeout=10.0) as client:
        usda_resp = await client.get(
            "https://api.nal.usda.gov/fdc/v1/foods/search",
            params={
                "query": q,
                "api_key": usda_key,
                "pageSize": 5,
                "dataType": "SR Legacy,Foundation",
            }
        )

    usda_results = []
    if usda_resp.status_code == 200:
        foods = usda_resp.json().get("foods", [])
        for f in foods:
            mapped = map_usda_product(f)
            existing = await db.execute(
                select(FoodItem).where(FoodItem.name == mapped["name"])
            )
            if not existing.scalar_one_or_none():
                food_item = FoodItem(**mapped, created_by=None)
                db.add(food_item)
            usda_results.append(mapped)
        await db.commit()

    return {
        "personal": personal,
        "usda": usda_results,
    }

@router.get("/barcode/{barcode}")
async def lookup_barcode(
    barcode: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(FoodItem).where(FoodItem.barcode == barcode))
    existing = result.scalar_one_or_none()
    if existing:
        return {"source": "personal", "food": existing}

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json")

    if resp.status_code != 200 or resp.json().get("status") != 1:
        raise HTTPException(status_code=404, detail="Product not found")

    product = resp.json().get("product", {})
    return {"source": "open_food_facts", "food": map_off_product(product)}

@router.delete("/food/{food_id}", status_code=204)
async def delete_food_item(
    food_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(FoodItem).where(
            FoodItem.id == food_id,
            FoodItem.created_by == current_user.id
        )
    )
    food = result.scalar_one_or_none()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found or not yours to delete")
    await db.delete(food)
    await db.commit()
