import json
from datetime import date, timedelta
from sqlalchemy.orm import Session
from .models import ShoppingList

def tags_to_text(tags: list[str] | None) -> str:
    return json.dumps(tags or [], ensure_ascii=False)

def text_to_tags(value: str | None) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []

def get_or_create_active_list(db: Session, user_id: int) -> ShoppingList:
    shopping_list = db.query(ShoppingList).filter_by(user_id=user_id, is_active=True).first()
    if shopping_list:
        return shopping_list
    shopping_list = ShoppingList(name="Mi Lista de Compras", user_id=user_id, is_active=True)
    db.add(shopping_list)
    db.commit()
    db.refresh(shopping_list)
    return shopping_list

def week_range(day: date) -> tuple[date, date]:
    start = day - timedelta(days=day.weekday())
    end = start + timedelta(days=6)
    return start, end
