"""
Automatic logic: "Is it time to train (or retrain) a plant model now?"

This module reads directly from the real database (sensor_readings) - it never
uses synthetic data. If there is not enough data, training is skipped and the
system simply waits until more data is collected.

Retraining policy (can be changed later):
- First train: when there are at least MIN_SAMPLES_FOR_TRAINING real records
    for that plant
- Periodic retrain: once every RETRAIN_INTERVAL_DAYS days, using all new data
    (old data is never removed from the database - the model is simply rebuilt
    with a larger and more up-to-date dataset)
"""

from datetime import datetime, timezone
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import SensorReading
from . import model_store
from .train import train_and_save_for_plant, MIN_SAMPLES_FOR_TRAINING

RETRAIN_INTERVAL_DAYS = 4  # Matches the "after 3-4 days" requirement from the prompt


async def _fetch_readings_as_array(db: AsyncSession, plant_id: int) -> np.ndarray:
    result = await db.execute(
        select(
            SensorReading.soil_moisture_percent,
            SensorReading.air_temperature,
            SensorReading.air_humidity,
        ).where(SensorReading.plant_id == plant_id)
    )
    rows = result.all()
    if not rows:
        return np.empty((0, 3))
    return np.array(rows, dtype=float)


def _days_since(iso_timestamp: str) -> float:
    trained_at = datetime.fromisoformat(iso_timestamp)
    return (datetime.now(timezone.utc) - trained_at).total_seconds() / 86400


async def maybe_train_plant_model(db: AsyncSession, plant_id: int) -> str:
    """
    Checks whether this plant's model should be trained or retrained, and
    performs the action if needed.

    The return value is a status string (for logging, not decision logic):
    'trained', 'retrained', 'skipped_insufficient_data', 'skipped_not_due'
    """
    meta = model_store.load_meta(plant_id)

    readings = await _fetch_readings_as_array(db, plant_id)

    # Case 1: we do not have any model for this plant yet
    if meta is None or not model_store.model_exists(plant_id):
        if len(readings) < MIN_SAMPLES_FOR_TRAINING:
            return "skipped_insufficient_data"
        train_and_save_for_plant(plant_id, readings, is_synthetic=False)
        return "trained"

    # Case 2: the model was synthetic (from earlier tests) - as soon as
    # enough real data exists, replace it immediately instead of waiting
    if meta.get("is_synthetic") and len(readings) >= MIN_SAMPLES_FOR_TRAINING:
        train_and_save_for_plant(plant_id, readings, is_synthetic=False)
        return "trained"

    # Case 3: we have a real model - retrain only if RETRAIN_INTERVAL_DAYS have passed
    if _days_since(meta["trained_at"]) >= RETRAIN_INTERVAL_DAYS:
        if len(readings) < MIN_SAMPLES_FOR_TRAINING:
            return "skipped_insufficient_data"
        train_and_save_for_plant(plant_id, readings, is_synthetic=False)
        return "retrained"

    return "skipped_not_due"
