import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI, OpenAIError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .... import schemas
from ....core.auth import get_current_user
from ....core.config import settings
from ....db.database import get_db
from ....models import Recipe, User
from ....services.openai.openai_service import (
    generate_local_recipe_suggestions,
    generate_recipe_image,
    generate_recipe_suggestions,
)
from ....utils import tags_to_text, text_to_tags

router = APIRouter(prefix="/api/recipes", tags=["recipes"])
logger = logging.getLogger(__name__)


def recipe_to_schema(recipe: Recipe) -> dict:
    return {
        "id": recipe.id,
        "title": recipe.title,
        "description": recipe.description,
        "ingredients": recipe.ingredients,
        "instructions": recipe.instructions,
        "image_url": recipe.image_url,
        "image_data": recipe.image_data,
        "prep_time": recipe.prep_time,
        "cook_time": recipe.cook_time,
        "servings": recipe.servings,
        "calories_per_serving": recipe.calories_per_serving,
        "difficulty": recipe.difficulty,
        "category": recipe.category,
        "tags": text_to_tags(recipe.tags),
        "is_public": recipe.is_public,
        "user_id": recipe.user_id,
        "created_at": recipe.created_at,
    }


@router.get("", response_model=list[schemas.RecipeOut])
def list_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipes = (
        db.query(Recipe)
        .filter(or_(Recipe.user_id == current_user.id, Recipe.is_public == True))
        .order_by(Recipe.created_at.desc())
        .all()
    )
    return [recipe_to_schema(recipe) for recipe in recipes]


@router.post("", response_model=schemas.RecipeOut, status_code=201)
def create_recipe(payload: schemas.RecipeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = Recipe(
        title=payload.title,
        description=payload.description,
        ingredients=payload.ingredients,
        instructions=payload.instructions,
        image_url=payload.image_url,
        image_data=payload.image_data,
        prep_time=payload.prep_time,
        cook_time=payload.cook_time,
        servings=payload.servings,
        calories_per_serving=payload.calories_per_serving,
        difficulty=payload.difficulty,
        category=payload.category,
        tags=tags_to_text(payload.tags),
        is_public=payload.is_public,
        user_id=current_user.id,
    )
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe_to_schema(recipe)


@router.get("/{recipe_id}", response_model=schemas.RecipeOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter(
        Recipe.id == recipe_id,
        or_(Recipe.user_id == current_user.id, Recipe.is_public == True),
    ).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada")
    return recipe_to_schema(recipe)


@router.delete("/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter_by(id=recipe_id, user_id=current_user.id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Receta no encontrada o no autorizada")
    db.delete(recipe)
    db.commit()
    return {"message": "Receta eliminada"}


@router.post("/generate-image")
def generate_image(payload: schemas.RecipeImageRequest, current_user: User = Depends(get_current_user)):
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="El servicio de generacion de imagenes no esta disponible en este momento.")

    client = OpenAI(api_key=settings.openai_api_key)
    recipe = {
        "title": payload.title,
        "description": payload.description or "",
        "ingredients": payload.ingredients or "",
    }
    try:
        return generate_recipe_image(client, recipe, current_user.id)
    except (OpenAIError, httpx.HTTPError) as exc:
        logger.exception("Error generating recipe image")
        raise HTTPException(status_code=502, detail="No se pudo generar la imagen en este momento. Intentalo de nuevo mas tarde.") from exc


@router.post("/generate")
def generate_recipes(payload: schemas.GenerateRequest, current_user: User = Depends(get_current_user)):
    query = payload.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="La consulta es requerida")

    if settings.openai_api_key:
        try:
            return {"recipes": generate_recipe_suggestions(query)}
        except (OpenAIError, httpx.HTTPError, ValueError) as exc:
            logger.exception("Error generating recipe suggestions")
            raise HTTPException(status_code=502, detail="No se pudieron generar las recetas en este momento. Intentalo de nuevo mas tarde.") from exc

    return {"recipes": generate_local_recipe_suggestions(query)}
