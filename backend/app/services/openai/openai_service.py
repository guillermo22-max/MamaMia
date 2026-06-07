import base64
import json
import random
from typing import Any

import httpx
from openai import OpenAI, OpenAIError
from ...core.config import settings


def normalize_recipe(recipe: dict[str, Any], fallback_title: str) -> dict[str, Any]:
    return {
        "title": str(recipe.get("title") or fallback_title)[:180],
        "description": str(recipe.get("description") or "Una receta deliciosa generada para tu cocina.")[:255],
        "ingredients": str(recipe.get("ingredients") or "Ingredientes al gusto"),
        "instructions": str(recipe.get("instructions") or "Preparar, cocinar y servir."),
        "image_url": recipe.get("image_url") or None,
        "image_data": recipe.get("image_data") or None,
        "prep_time": recipe.get("prep_time") or 10,
        "cook_time": recipe.get("cook_time") or 20,
        "servings": recipe.get("servings") or 2,
        "calories_per_serving": recipe.get("calories_per_serving") or recipe.get("calories") or None,
        "difficulty": recipe.get("difficulty") or "Facil",
        "category": recipe.get("category") or "Cena",
        "tags": recipe.get("tags") if isinstance(recipe.get("tags"), list) else [],
        "is_public": False,
    }


def image_prompt_for_recipe(recipe: dict[str, Any]) -> str:
    return (
        "Fotografia gastronomica realista, apetitosa y bien iluminada de este plato terminado. "
        "Muestra solo comida real en un plato o bowl, sin texto, sin manos, sin logos, sin marcas. "
        f"Plato: {recipe['title']}. "
        f"Descripcion: {recipe.get('description') or ''}. "
        f"Ingredientes principales: {str(recipe.get('ingredients') or '')[:600]}."
    )


def generate_recipe_image(client: OpenAI, recipe: dict[str, Any], user_id: int) -> dict[str, str | None]:
    requested_model = settings.openai_image_model
    model_candidates = [requested_model, "gpt-image-1-mini", "gpt-image-1", "dall-e-2"]
    seen_models = set()
    last_error: Exception | None = None

    for model in model_candidates:
        if model in seen_models:
            continue
        seen_models.add(model)

        try:
            image_kwargs = {
                "model": model,
                "prompt": image_prompt_for_recipe(recipe),
                "n": 1,
                "size": "1024x1024",
                "user": str(user_id),
            }
            image_kwargs["quality"] = "low" if model.startswith("gpt-image") else "standard"
            image = client.images.generate(**image_kwargs)
            break
        except OpenAIError as exc:
            last_error = exc
    else:
        if last_error:
            raise last_error
        return {"image_data": None, "image_url": None}

    if not image.data:
        return {"image_data": None, "image_url": None}

    generated = image.data[0]
    image_data = getattr(generated, "b64_json", None)
    image_url = getattr(generated, "url", None)
    if image_url and not image_data:
        image_response = httpx.get(image_url, timeout=30)
        image_response.raise_for_status()
        image_data = base64.b64encode(image_response.content).decode("utf-8")

    return {"image_data": image_data, "image_url": image_url}


def parse_json_object(content: str) -> dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(content[start:end + 1])


def generate_recipe_suggestions(query: str) -> list[dict[str, Any]]:
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.openai_recipe_model,
        messages=[
            {
                "role": "system",
                "content": "Eres un chef experto. Responde unicamente JSON valido y sin texto adicional.",
            },
            {
                "role": "user",
                "content": f'''Genera 4 recetas basadas en esta consulta: "{query}".
Cada receta debe ser practica, clara y en espanol.
Responde unicamente un objeto JSON valido con esta estructura:
{{"recipes":[{{"title":"Nombre","description":"Descripcion breve","ingredients":"Lista con saltos de linea","instructions":"Pasos con saltos de linea","prep_time":10,"cook_time":15,"servings":2,"calories_per_serving":450,"difficulty":"Facil","category":"Cena","tags":["rapida","casera"]}}]}}'''
            },
        ],
    )
    content = response.choices[0].message.content or "{}"
    parsed = parse_json_object(content)
    raw_recipes = parsed.get("recipes", [])
    if not isinstance(raw_recipes, list):
        raise ValueError("La respuesta no contiene una lista de recetas")

    return [
        normalize_recipe(recipe, f"{query.capitalize()} casero #{index + 1}")
        for index, recipe in enumerate(raw_recipes[:4])
        if isinstance(recipe, dict)
    ]


def generate_local_recipe_suggestions(query: str) -> list[dict[str, Any]]:
    base = query.capitalize()
    recipes = []
    for index in range(1, 5):
        recipes.append({
            "title": f"{base} casero #{index}",
            "description": "Receta generada en modo local sin API key.",
            "ingredients": "Ingrediente principal\nSal\nAceite de oliva\nEspecias al gusto",
            "instructions": "Preparar los ingredientes.\nCocinar a fuego medio.\nServir caliente y decorar al gusto.",
            "prep_time": 10,
            "cook_time": 20 + random.randint(0, 10),
            "servings": 2,
            "calories_per_serving": 420 + random.randint(0, 180),
            "difficulty": "Facil",
            "category": "Cena",
            "tags": ["local", "casera"],
        })
    return recipes
