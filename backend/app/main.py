from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from .api.routes.meal_plan.meal_plan_routes import router as meal_plan_router
from .api.routes.recipe.recipe_routes import router as recipes_router
from .api.routes.shopping.shopping_routes import router as shopping_router
from .api.routes.user.auth_routes import router as auth_router
from .core.config import settings
from .db.database import Base, engine, ensure_database_schema

Base.metadata.create_all(bind=engine)
ensure_database_schema()

app = FastAPI(title=settings.app_name)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_host_list)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

@app.get("/")
def root():
    return {"message": "MamaMia API funcionando"}

app.include_router(auth_router)
app.include_router(recipes_router)
app.include_router(shopping_router)
app.include_router(meal_plan_router)
