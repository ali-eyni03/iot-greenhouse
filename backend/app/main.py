import asyncio
import json
import time
from contextlib import asynccontextmanager

import aiomqtt
from app.daily_report import daily_report_loop, _build_daily_report
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .database import AsyncSessionLocal
from .crud import (
    get_plant_with_sensor,
    calculate_moisture_percent,
    save_sensor_reading,
    create_irrigation_log,
    get_plants,
)
from .routers import plants, sensors
from .connection_manager import manager
from .notifier import send_bale_alert
from .mqtt_publisher import publish_irrigate_command
from .irrigation_logic import should_irrigate, calculate_irrigation_duration
from .models import AnomalyLog
from .ml_service.predict import predict_anomaly, determine_probable_cause
from .ml_service.auto_trainer import maybe_train_plant_model

AUTO_TRAIN_CHECK_INTERVAL_SECONDS = 5 * 60  # Every 5 minutes

# Bale alert cooldown: minimum time between two alerts for a plant (seconds)
# Without this, if an anomaly lasts for hours, a message would be sent every 10 seconds
ALERT_COOLDOWN_SECONDS = 30 * 60  # At most one alert every 30 minutes per plant
_last_alert_time: dict[int, float] = {}  # plant_id -> timestamp of the last alert


async def mqtt_listener():
    # Note: the topic is fixed as "plant/data", not "plant/+/data" because
    # plant_id is no longer in the topic; it is inside the payload (readings array)
    async with aiomqtt.Client("mqtt5") as client:
        await client.subscribe("plant/data")
        async for message in client.messages:
            await save_reading(message)


async def save_reading(message):
    data = json.loads(message.payload)

    air_temp = data["air_temp"]
    air_humidity = data["air_humidity"]
    readings = data["readings"]

    async with AsyncSessionLocal() as db:
        for reading in readings:
            plant_id = reading["plant_id"]
            soil_raw = reading["soil_raw"]

            row = await get_plant_with_sensor(db, plant_id)
            if row is None:
                print(f"Plant {plant_id} not found or has no sensor, skipping")
                continue

            plant, sensor = row
            soil_percent = calculate_moisture_percent(
                soil_raw, sensor.dry_raw_value, sensor.wet_raw_value
            )

            await save_sensor_reading(
                db, plant_id, soil_raw, soil_percent, air_temp, air_humidity
            )
            print(f"Saved reading for plant {plant_id}: soil={soil_percent:.1f}%")

            await manager.broadcast({
                "type": "sensor_reading",
                "plant_id": plant_id,
                "soil_moisture_percent": round(soil_percent, 1),
                "air_temperature": air_temp,
                "air_humidity": air_humidity,
            })

            # ---------- 1. Rule-based: irrigation decision only ----------
            if should_irrigate(soil_percent, plant.min_moisture_percent, plant.max_moisture_percent):
                duration = calculate_irrigation_duration(soil_percent, plant.min_moisture_percent)
                await create_irrigation_log(db, plant_id, user_triggered=False)
                await publish_irrigate_command(plant_id, duration_seconds=duration)
                print(f"Rule-based irrigation triggered for plant {plant_id}: {duration}s")

            # ---------- 2. ML: anomaly detection + alert only ----------
            is_anomaly, score = predict_anomaly(plant_id, soil_percent, air_temp, air_humidity)

            if is_anomaly:
                now = time.time()
                last = _last_alert_time.get(plant_id, 0)

                if now - last >= ALERT_COOLDOWN_SECONDS:
                    _last_alert_time[plant_id] = now
                    cause = determine_probable_cause(
                        soil_percent, air_temp, air_humidity,
                        plant.min_moisture_percent, plant.max_moisture_percent,
                        plant.min_temp, plant.max_temp,
                    )
                    anomaly_log = AnomalyLog(
                        plant_id=plant_id, score=score, probable_cause=cause
                    )
                    db.add(anomaly_log)
                    await db.commit()

                    await send_bale_alert(
                        f"⚠️ ناهنجاری در «{plant.name}» تشخیص داده شد\n"
                        f"رطوبت: {soil_percent:.1f}% | دما: {air_temp}° | رطوبت هوا: {air_humidity}%\n"
                        f"علت احتمالی: {cause}"
                    )
                    print(f"Anomaly detected for plant {plant_id}: score={score:.3f}, cause={cause}")
                else:
                    remaining = int((ALERT_COOLDOWN_SECONDS - (now - last)) / 60)
                    print(f"Anomaly for plant {plant_id} (cooldown: {remaining}min remaining)")


async def auto_train_loop():
    """
    Every few minutes (AUTO_TRAIN_CHECK_INTERVAL_SECONDS), checks each active
    plant to see whether enough data has been collected for training/retraining.
    This is kept separate from the main save_reading path because the check
    requires reading the full history of a plant from the database - something
    that would be unnecessary and expensive to repeat for every reading
    (every few seconds).
    """
    while True:
        await asyncio.sleep(AUTO_TRAIN_CHECK_INTERVAL_SECONDS)
        try:
            async with AsyncSessionLocal() as db:
                active_plants = await get_plants(db, limit=1000)
                for plant in active_plants:
                    if not plant.is_active:
                        continue
                    status = await maybe_train_plant_model(db, plant.id)
                    if status in ("trained", "retrained"):
                        print(f"ML model {status} for plant {plant.id}")
        except Exception as e:
            print(f"auto_train_loop error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_task = asyncio.create_task(mqtt_listener())
    train_task = asyncio.create_task(auto_train_loop())
    report_task = asyncio.create_task(daily_report_loop())
    yield
    for task in (mqtt_task, train_task,report_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)

# Allow the frontend (which runs on a different origin/port, such as Vite on
# port 5173) to send requests to this backend. Without this middleware, the
# browser rejects OPTIONS (preflight) requests with a 405 error and the main
# request (GET/POST/...) is never sent.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; in production, specify the exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plants.router)
app.include_router(sensors.router)


@app.get("/")
async def root():
    return {"status": "ok"}


@app.post("/daily-report")
async def trigger_daily_report():
    report = await _build_daily_report()
    sent = await send_bale_alert(report)
    return {"report": report, "sent": sent}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Wait until the client disconnects (for now we do not receive anything
        # from the client; we only keep the connection alive so we can broadcast)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)