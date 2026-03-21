from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models import User, FoodLog, FoodItem, UserProfile
from ..auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/alerts", tags=["alerts"])

# recommended daily values — female defaults, adjusted for male below
RDV_FEMALE = {
    "vitamin_a": 700,       # mcg
    "vitamin_c": 75,        # mg
    "vitamin_d": 15,        # mcg
    "vitamin_e": 15,        # mg
    "vitamin_k": 90,        # mcg
    "vitamin_b6": 1.3,      # mg
    "vitamin_b12": 2.4,     # mcg
    "folate": 400,          # mcg
    "thiamin": 1.1,         # mg
    "riboflavin": 1.1,      # mg
    "niacin": 14,           # mg
    "pantothenic_acid": 5,  # mg
    "biotin": 30,           # mcg
    "choline": 425,         # mg
    "calcium": 1000,        # mg
    "iron": 18,             # mg
    "magnesium": 310,       # mg
    "zinc": 8,              # mg
    "potassium": 2600,      # mg
    "sodium": 2300,         # mg (upper limit)
    "selenium": 55,         # mcg
    "iodine": 150,          # mcg
    "phosphorus": 700,      # mg
    "omega_3": 1100,        # mg
    "fiber": 25,            # g
}

RDV_MALE = {
    **RDV_FEMALE,
    "vitamin_a": 900,
    "vitamin_c": 90,
    "vitamin_k": 120,
    "thiamin": 1.2,
    "riboflavin": 1.3,
    "niacin": 16,
    "choline": 550,
    "iron": 8,
    "magnesium": 400,
    "zinc": 11,
    "potassium": 3400,
    "omega_3": 1600,
    "fiber": 38,
}

ALERT_MESSAGES = {
    "vitamin_d": "Low vitamin D — consider getting outside or a supplement",
    "vitamin_b12": "Low B12 — common if you eat less meat or dairy",
    "iron": "Low iron — try adding more leafy greens, legumes, or red meat",
    "magnesium": "Low magnesium — nuts, seeds, and dark chocolate are great sources",
    "calcium": "Low calcium — dairy, fortified foods, or leafy greens can help",
    "omega_3": "Low omega-3 — fatty fish, flaxseed, or walnuts are good sources",
    "fiber": "Consistently low fiber — whole grains, legumes, and vegetables can help",
    "zinc": "Low zinc — meat, shellfish, and legumes are good sources",
    "potassium": "Low potassium — bananas, potatoes, and leafy greens can help",
    "folate": "Low folate — leafy greens, legumes, and fortified foods are good sources",
    "choline": "Low choline — eggs are one of the best sources",
    "vitamin_c": "Low vitamin C — citrus fruits, bell peppers, and broccoli can help",
    "iodine": "Low iodine — iodized salt, dairy, and seafood are good sources",
}

@router.get("/")
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # get profile for sex-based RDVs
    profile_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    )
    profile = profile_result.scalar_one_or_none()
    rdv = RDV_MALE if profile and profile.sex and profile.sex.lower() == "male" else RDV_FEMALE

    # get last 7 days of food logs
    today = datetime.now().date()
    seven_days_ago = (today - timedelta(days=7)).isoformat()

    food_result = await db.execute(
        select(FoodLog, FoodItem)
        .join(FoodItem, FoodLog.food_item_id == FoodItem.id)
        .where(
            FoodLog.user_id == current_user.id,
            FoodLog.date >= seven_days_ago
        )
    )
    rows = food_result.all()

    if not rows:
        return {"alerts": [], "note": "No food logged in the last 7 days"}

    # sum per day
    daily_totals = {}
    for log, food in rows:
        if log.date not in daily_totals:
            daily_totals[log.date] = {k: 0 for k in rdv}
        for key in rdv:
            daily_totals[log.date][key] += (getattr(food, key, 0) or 0) * log.servings

    days_logged = len(daily_totals)

    # average across logged days
    avg_totals = {}
    for key in rdv:
        avg_totals[key] = sum(d[key] for d in daily_totals.values()) / days_logged

    # flag anything below 75% of RDV
    alerts = []
    for key, rdv_value in rdv.items():
        if key == "sodium":
            continue  # sodium is an upper limit not a minimum
        avg = avg_totals.get(key, 0)
        if avg < rdv_value * 0.75:
            pct = round((avg / rdv_value) * 100) if rdv_value > 0 else 0
            alerts.append({
                "nutrient": key,
                "average_daily": round(avg, 1),
                "recommended": rdv_value,
                "percent_of_rdv": pct,
                "message": ALERT_MESSAGES.get(key, f"Low {key.replace('_', ' ')}"),
            })

    alerts.sort(key=lambda x: x["percent_of_rdv"])

    return {
        "alerts": alerts,
        "days_analyzed": days_logged,
        "note": f"Based on {days_logged} days of logged food in the last 7 days"
    }