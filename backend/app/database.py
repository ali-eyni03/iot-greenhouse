import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@timescaledb:5432/greenhouse_db",
)

# engine: the main database connection (created once and kept for the app's lifetime)
engine = create_async_engine(DATABASE_URL, echo=False)

# session factory: used whenever we need a session (for example, per request or per MQTT message)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

# Base: the base class that all of our models (Plant, Sensor, ...) inherit from
Base = declarative_base()


async def get_db():
    """FastAPI endpoint dependency - each request gets a new session"""
    async with AsyncSessionLocal() as session:
        yield session