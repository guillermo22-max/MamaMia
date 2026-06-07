from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from .... import schemas
from ....core.auth import get_current_user
from ....db.database import get_db
from ....models import MealPlan, Recipe, User
from ....utils import week_range
from ..recipe.recipe_routes import recipe_to_schema

router = APIRouter(prefix="/api/meal-plan", tags=["meal-plan"])


def ensure_recipe_access(recipe_id: int | None, db: Session, current_user: User) -> None:
    if recipe_id is None:
        return
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id,
        (Recipe.user_id == current_user.id) | (Recipe.is_public == True),
    ).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")

def meal_to_schema(meal: MealPlan) -> dict:
    return {
        "id": meal.id,
        "date": meal.date,
        "meal_type": meal.meal_type,
        "recipe_id": meal.recipe_id,
        "custom_meal": meal.custom_meal,
        "notes": meal.notes,
        "recipe": recipe_to_schema(meal.recipe) if meal.recipe else None,
    }

@router.get("")
def get_week_plan(week: date | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = week or date.today()
    start, end = week_range(target)
    meals = (
        db.query(MealPlan)
        .options(joinedload(MealPlan.recipe))
        .filter(MealPlan.user_id == current_user.id, MealPlan.date >= start, MealPlan.date <= end)
        .order_by(MealPlan.date.asc(), MealPlan.meal_type.asc())
        .all()
    )
    return {"week_start": start.isoformat(), "week_end": end.isoformat(), "meal_plans": [meal_to_schema(m) for m in meals]}

@router.post("", response_model=schemas.MealPlanOut, status_code=201)
def upsert_meal(payload: schemas.MealPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_recipe_access(payload.recipe_id, db, current_user)
    meal = db.query(MealPlan).filter_by(user_id=current_user.id, date=payload.date, meal_type=payload.meal_type).first()
    if not meal:
        meal = MealPlan(user_id=current_user.id, date=payload.date, meal_type=payload.meal_type)
        db.add(meal)
    meal.recipe_id = payload.recipe_id
    meal.custom_meal = payload.custom_meal
    meal.notes = payload.notes
    db.commit()
    db.refresh(meal)
    return meal_to_schema(meal)

@router.get("/{meal_id}", response_model=schemas.MealPlanOut)
def get_meal(meal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meal = db.query(MealPlan).options(joinedload(MealPlan.recipe)).filter_by(id=meal_id, user_id=current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return meal_to_schema(meal)

@router.put("/{meal_id}", response_model=schemas.MealPlanOut)
def update_meal(meal_id: int, payload: schemas.MealPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ensure_recipe_access(payload.recipe_id, db, current_user)
    meal = db.query(MealPlan).filter_by(id=meal_id, user_id=current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    existing_target = (
        db.query(MealPlan)
        .filter(
            MealPlan.id != meal.id,
            MealPlan.user_id == current_user.id,
            MealPlan.date == payload.date,
            MealPlan.meal_type == payload.meal_type,
        )
        .first()
    )
    if existing_target:
        db.delete(existing_target)
        db.flush()
    meal.date = payload.date
    meal.meal_type = payload.meal_type
    meal.recipe_id = payload.recipe_id
    meal.custom_meal = payload.custom_meal
    meal.notes = payload.notes
    db.commit()
    db.refresh(meal)
    return meal_to_schema(meal)

@router.delete("/{meal_id}")
def delete_meal(meal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meal = db.query(MealPlan).filter_by(id=meal_id, user_id=current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    db.delete(meal)
    db.commit()
    return {"success": True}
