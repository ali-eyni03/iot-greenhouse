from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/sensors", tags=["sensors"])


@router.post("/", response_model=schemas.SensorOut, status_code=201)
async def create_sensor(sensor: schemas.SensorCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_sensor(db, sensor)


@router.get("/", response_model=list[schemas.SensorOut])
async def list_sensors(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_sensors(db, skip=skip, limit=limit)


@router.get("/{sensor_id}", response_model=schemas.SensorOut)
async def get_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    sensor = await crud.get_sensor(db, sensor_id)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@router.patch("/{sensor_id}", response_model=schemas.SensorOut)
async def update_sensor(sensor_id: int, sensor_update: schemas.SensorUpdate, db: AsyncSession = Depends(get_db)):
    sensor = await crud.update_sensor(db, sensor_id, sensor_update)
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor not found")
    return sensor


@router.delete("/{sensor_id}", status_code=204)
async def delete_sensor(sensor_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await crud.delete_sensor(db, sensor_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sensor not found")