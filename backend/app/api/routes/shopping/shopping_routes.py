from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .... import schemas
from ....core.auth import get_current_user
from ....db.database import get_db
from ....models import ShoppingListItem, User
from ....utils import get_or_create_active_list

router = APIRouter(prefix="/api/shopping-list", tags=["shopping-list"])

@router.get("", response_model=schemas.ShoppingListOut)
def get_shopping_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_or_create_active_list(db, current_user.id)

@router.post("/items", response_model=schemas.ShoppingItemOut, status_code=201)
def create_item(payload: schemas.ShoppingItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="El nombre del artículo es requerido")
    shopping_list = get_or_create_active_list(db, current_user.id)
    item = ShoppingListItem(
        name=payload.name.strip(),
        quantity=payload.quantity,
        category=payload.category,
        user_id=current_user.id,
        shopping_list_id=shopping_list.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.patch("/items/{item_id}", response_model=schemas.ShoppingItemOut)
def update_item(item_id: int, payload: schemas.ShoppingItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    item.is_completed = payload.is_completed
    db.commit()
    db.refresh(item)
    return item

@router.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter_by(id=item_id, user_id=current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    db.delete(item)
    db.commit()
    return {"success": True}
