from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from .models import Plant, Sensor, SensorReading, IrrigationLog
from . import schemas


# Plant CRUD
async def create_plant(db: AsyncSession, plant: schemas.PlantCreate) -> Plant:
    db_plant = Plant(**plant.model_dump())
    db.add(db_plant)
    await db.commit()
    await db.refresh(db_plant)  # برای گرفتن id که دیتابیس تازه ساخته
    return db_plant


async def get_plant(db: AsyncSession, plant_id: int) -> Plant | None:
    result = await db.execute(select(Plant).where(Plant.id == plant_id))
    return result.scalar_one_or_none()


async def get_plants(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Plant]:
    result = await db.execute(select(Plant).offset(skip).limit(limit))
    return list(result.scalars().all())


async def update_plant(db: AsyncSession, plant_id: int, plant_update: schemas.PlantUpdate) -> Plant | None:
    db_plant = await get_plant(db, plant_id)
    if db_plant is None:
        return None

    # just update the fields that are provided in the update request (exclude_unset=True)
    update_data = plant_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plant, key, value)

    await db.commit()
    await db.refresh(db_plant)
    return db_plant


async def delete_plant(db: AsyncSession, plant_id: int) -> bool:
    db_plant = await get_plant(db, plant_id)
    if db_plant is None:
        return False
    await db.delete(db_plant)
    await db.commit()
    return True


# Sensor CRUD

async def create_sensor(db: AsyncSession, sensor: schemas.SensorCreate) -> Sensor:
    db_sensor = Sensor(**sensor.model_dump())
    db.add(db_sensor)
    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor


async def get_sensor(db: AsyncSession, sensor_id: int) -> Sensor | None:
    result = await db.execute(select(Sensor).where(Sensor.id == sensor_id))
    return result.scalar_one_or_none()


async def get_sensors(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Sensor]:
    result = await db.execute(select(Sensor).offset(skip).limit(limit))
    return list(result.scalars().all())


async def update_sensor(db: AsyncSession, sensor_id: int, sensor_update: schemas.SensorUpdate) -> Sensor | None:
    db_sensor = await get_sensor(db, sensor_id)
    if db_sensor is None:
        return None

    update_data = sensor_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_sensor, key, value)

    await db.commit()
    await db.refresh(db_sensor)
    return db_sensor


async def delete_sensor(db: AsyncSession, sensor_id: int) -> bool:
    db_sensor = await get_sensor(db, sensor_id)
    if db_sensor is None:
        return False
    await db.delete(db_sensor)
    await db.commit()
    return True


async def get_plant_with_sensor(db: AsyncSession, plant_id: int):
    """find a plant and its associated sensor by plant_id"""
    result = await db.execute(
        select(Plant, Sensor)
        .join(Sensor, Plant.sensor_id == Sensor.id)
        .where(Plant.id == plant_id)
    )
    return result.first()  # tuple: (Plant, Sensor) or None


def calculate_moisture_percent(raw_value: int, dry_value: int, wet_value: int) -> float:
    """Convert raw value to percentage, clamped between 0 and 100"""
    percent = (dry_value - raw_value) / (dry_value - wet_value) * 100
    return max(0.0, min(100.0, percent))


async def save_sensor_reading(
    db: AsyncSession,
    plant_id: int,
    soil_raw: int,
    soil_percent: float,
    air_temp: float,
    air_humidity: float,
):
    reading = SensorReading(
        plant_id=plant_id,
        soil_moisture_raw=soil_raw,
        soil_moisture_percent=soil_percent,
        air_temperature=air_temp,
        air_humidity=air_humidity,
    )
    db.add(reading)
    await db.commit()
    return reading


# History queries (for  Recharts diagram in frontend)

async def get_sensor_history(db: AsyncSession, plant_id: int, hours: int = 24) -> list[SensorReading]:
    """
    Returns a plant's reading history for the past N hours.
    This query is exactly what the hypertable was designed for:
    filtering by plant_id + time range, using the composite index
    (plant_id, timestamp) created in phase 1.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(SensorReading)
        .where(SensorReading.plant_id == plant_id)
        .where(SensorReading.timestamp >= cutoff)
        .order_by(SensorReading.timestamp.asc())
    )
    return list(result.scalars().all())


# Irrigation logs 

async def get_irrigation_logs(db: AsyncSession, plant_id: int, limit: int = 50) -> list[IrrigationLog]:
    result = await db.execute(
        select(IrrigationLog)
        .where(IrrigationLog.plant_id == plant_id)
        .order_by(IrrigationLog.started_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_irrigation_log(
    db: AsyncSession, plant_id: int, user_triggered: bool = True
) -> IrrigationLog:
    """
    Creates a new irrigation record with started_at populated; ended_at will
    be filled later (when the ESP returns a 'pump turned off' message) by
    update_irrigation_log_end. This is the same 'option 2' pattern designed in phase 1.
    """
    log = IrrigationLog(
        plant_id=plant_id,
        started_at=datetime.now(timezone.utc),
        user_triggered=user_triggered,
    )
    db.add(log)
    await db.commit()
    return log