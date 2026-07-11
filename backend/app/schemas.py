from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


# Sensor schemas

class SensorCreate(BaseModel):
    pin_number: int
    dry_raw_value: int
    wet_raw_value: int
    description: Optional[str] = None


class SensorUpdate(BaseModel):
    pin_number: Optional[int] = None
    dry_raw_value: Optional[int] = None
    wet_raw_value: Optional[int] = None
    description: Optional[str] = None


class SensorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # Allows direct creation from a SQLAlchemy object

    id: int
    pin_number: int
    dry_raw_value: int
    wet_raw_value: int
    description: Optional[str] = None


# Plant schemas

class PlantCreate(BaseModel):
    name: str
    min_moisture_percent: float
    max_moisture_percent: float
    min_temp: float
    max_temp: float
    sensor_id: int
    relay_channel: int
    is_active: bool = True
    description: Optional[str] = None


class PlantUpdate(BaseModel):
    # All fields are optional because an update may change only one or two fields
    name: Optional[str] = None
    min_moisture_percent: Optional[float] = None
    max_moisture_percent: Optional[float] = None
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    sensor_id: Optional[int] = None
    relay_channel: Optional[int] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class PlantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    min_moisture_percent: float
    max_moisture_percent: float
    min_temp: float
    max_temp: float
    sensor_id: Optional[int] = None
    relay_channel: int
    is_active: bool
    description: Optional[str] = None


# Sensor history (for the Recharts chart)

class SensorReadingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    timestamp: datetime
    soil_moisture_percent: float
    air_temperature: float
    air_humidity: float


#Irrigation logs

class IrrigationLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    user_triggered: bool


# Irrigate command response

class IrrigateResponse(BaseModel):
    status: str
    plant_id: int