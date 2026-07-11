from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..database import get_db
from ..mqtt_publisher import publish_irrigate_command
from ..models import AnomalyLog

router = APIRouter(prefix="/plants", tags=["plants"])


@router.post("/", response_model=schemas.PlantOut, status_code=201)
async def create_plant(plant: schemas.PlantCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_plant(db, plant)


@router.get("/", response_model=list[schemas.PlantOut])
async def list_plants(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_plants(db, skip=skip, limit=limit)


@router.get("/{plant_id}", response_model=schemas.PlantOut)
async def get_plant(plant_id: int, db: AsyncSession = Depends(get_db)):
    plant = await crud.get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.patch("/{plant_id}", response_model=schemas.PlantOut)
async def update_plant(plant_id: int, plant_update: schemas.PlantUpdate, db: AsyncSession = Depends(get_db)):
    plant = await crud.update_plant(db, plant_id, plant_update)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant


@router.delete("/{plant_id}", status_code=204)
async def delete_plant(plant_id: int, db: AsyncSession = Depends(get_db)):
    deleted = await crud.delete_plant(db, plant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Plant not found")


@router.get("/{plant_id}/history", response_model=list[schemas.SensorReadingOut])
async def get_plant_history(plant_id: int, hours: int = 24, db: AsyncSession = Depends(get_db)):
    plant = await crud.get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return await crud.get_sensor_history(db, plant_id, hours=hours)


@router.get("/{plant_id}/irrigation-logs", response_model=list[schemas.IrrigationLogOut])
async def get_plant_irrigation_logs(plant_id: int, db: AsyncSession = Depends(get_db)):
    plant = await crud.get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")
    return await crud.get_irrigation_logs(db, plant_id)


@router.get("/{plant_id}/anomaly-logs")
async def get_plant_anomaly_logs(plant_id: int, db: AsyncSession = Depends(get_db)):
    plant = await crud.get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")

    result = await db.execute(
        select(AnomalyLog)
        .where(AnomalyLog.plant_id == plant_id)
        .order_by(AnomalyLog.timestamp.desc())
        .limit(50)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "score": round(log.score, 4),
            "probable_cause": log.probable_cause,
        }
        for log in logs
    ]


@router.post("/{plant_id}/irrigate", response_model=schemas.IrrigateResponse)
async def irrigate_plant(plant_id: int, db: AsyncSession = Depends(get_db)):
    plant = await crud.get_plant(db, plant_id)
    if plant is None:
        raise HTTPException(status_code=404, detail="Plant not found")

    await crud.create_irrigation_log(db, plant_id, user_triggered=True)
    await publish_irrigate_command(plant_id)

    return schemas.IrrigateResponse(status="ok", plant_id=plant_id)