from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator

def validate_bcrypt_password(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("La contraseña no puede superar 72 bytes")
    return value

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)

    _validate_password = field_validator("password")(validate_bcrypt_password)

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime
    class Config:
        from_attributes = True

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

    _validate_password = field_validator("password")(validate_bcrypt_password)

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str = Field(min_length=20, max_length=160)
    password: str = Field(min_length=6)

    _validate_password = field_validator("password")(validate_bcrypt_password)

class MessageOut(BaseModel):
    message: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class RecipeBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=255)
    ingredients: str = Field(min_length=1, max_length=8000)
    instructions: str = Field(min_length=1, max_length=12000)
    image_url: str | None = Field(default=None, max_length=2000)
    image_data: str | None = Field(default=None, max_length=8_000_000)
    prep_time: int | None = Field(default=None, ge=0, le=1440)
    cook_time: int | None = Field(default=None, ge=0, le=1440)
    servings: int | None = Field(default=None, ge=1, le=100)
    calories_per_serving: int | None = Field(default=None, ge=0, le=10000)
    difficulty: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, max_length=80)
    tags: list[str] = Field(default_factory=list, max_length=20)
    is_public: bool = False

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str]) -> list[str]:
        return [tag.strip()[:40] for tag in value if tag and tag.strip()][:20]

class RecipeCreate(RecipeBase):
    pass

class RecipeOut(RecipeBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class GenerateRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)

class RecipeImageRequest(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=255)
    ingredients: str | None = Field(default=None, max_length=2000)

class ShoppingItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    quantity: str | None = Field(default=None, max_length=80)
    category: str | None = Field(default=None, max_length=80)

class ShoppingItemUpdate(BaseModel):
    is_completed: bool

class ShoppingItemOut(BaseModel):
    id: int
    name: str
    quantity: str | None
    category: str | None
    is_completed: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ShoppingListOut(BaseModel):
    id: int
    name: str
    is_active: bool
    items: list[ShoppingItemOut]
    class Config:
        from_attributes = True

class MealPlanCreate(BaseModel):
    date: date
    meal_type: Literal["Desayuno", "Almuerzo", "Cena"]
    recipe_id: int | None = None
    custom_meal: str | None = Field(default=None, max_length=180)
    notes: str | None = Field(default=None, max_length=2000)

class MealPlanOut(BaseModel):
    id: int
    date: date
    meal_type: str
    recipe_id: int | None
    custom_meal: str | None
    notes: str | None
    recipe: RecipeOut | None = None
    class Config:
        from_attributes = True
