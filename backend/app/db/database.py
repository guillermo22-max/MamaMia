from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from ..core.config import settings

database_url = settings.database_url
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def ensure_database_schema():
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "recipes" not in inspector.get_table_names():
        return

    recipe_columns = {column["name"] for column in inspector.get_columns("recipes")}
    with engine.begin() as connection:
        if "calories_per_serving" not in recipe_columns:
            connection.execute(text("ALTER TABLE recipes ADD COLUMN calories_per_serving INTEGER"))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
