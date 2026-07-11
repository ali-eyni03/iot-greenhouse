from sqlalchemy import (
    Column, Integer, String, Float, Boolean, ForeignKey, TIMESTAMP, Text, Enum
)
from sqlalchemy.sql import func
from .database import Base
import enum


class ProbableCause(str, enum.Enum):
    soil = "soil"
    temperature = "temperature"
    humidity = "humidity"
    combined = "combined"


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True)
    pin_number = Column(Integer, nullable=False)
    dry_raw_value = Column(Integer, nullable=False)
    wet_raw_value = Column(Integer, nullable=False)
    description = Column(Text)


class Plant(Base):
    __tablename__ = "plants"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    min_moisture_percent = Column(Float, nullable=False)
    max_moisture_percent = Column(Float, nullable=False)
    min_temp = Column(Float, nullable=False)
    max_temp = Column(Float, nullable=False)
    sensor_id = Column(Integer, ForeignKey("sensors.id"))
    relay_channel = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    description = Column(Text)


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    # Note: per the previous decision, this table intentionally has no id/primary key (append-only hypertable)
    # SQLAlchemy still needs a logical "identifier" to work with, so we use the existing columns
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="SET NULL"))
    soil_moisture_raw = Column(Integer, nullable=False)
    soil_moisture_percent = Column(Float, nullable=False)
    air_temperature = Column(Float, nullable=False)
    air_humidity = Column(Float, nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), primary_key=True)


class IrrigationLog(Base):
    __tablename__ = "irrigation_logs"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="SET NULL"))
    started_at = Column(TIMESTAMP(timezone=True), nullable=False, primary_key=True)
    ended_at = Column(TIMESTAMP(timezone=True))
    user_triggered = Column(Boolean, nullable=False, default=False)


class AnomalyLog(Base):
    __tablename__ = "anomaly_logs"

    id = Column(Integer, primary_key=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="SET NULL"))
    score = Column(Float, nullable=False)
    probable_cause = Column(Enum(ProbableCause, name="probable_cause_enum"), nullable=False)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), primary_key=True)