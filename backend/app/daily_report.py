"""
Automatic daily report for the Bale bot - every night at 22:00.
Per-plant stats: irrigation count, average moisture, anomaly count.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .database import AsyncSessionLocal
from .models import Plant, SensorReading, IrrigationLog, AnomalyLog
from .notifier import send_bale_alert

REPORT_HOUR_UTC = 19  # 22:00 Iran = 19 UTC (18:30 in winter)


async def _build_daily_report() -> str:
    """Reads the last 24 hours of stats from the database and builds a report."""
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    async with AsyncSessionLocal() as db:
        plants_result = await db.execute(
            select(Plant).where(Plant.is_active == True)
        )
        plants = plants_result.scalars().all()

        if not plants:
            return "📊 گزارش روزانه\nهیچ گیاه فعالی ثبت نشده."

        lines = [f"📊 گزارش روزانه — {datetime.now().strftime('%Y/%m/%d')}"]
        lines.append("─" * 28)

        for plant in plants:
            # Average moisture over the last 24 hours
            avg_result = await db.execute(
                select(func.avg(SensorReading.soil_moisture_percent))
                .where(SensorReading.plant_id == plant.id)
                .where(SensorReading.timestamp >= since)
            )
            avg_moisture = avg_result.scalar()

            # Irrigation count
            irr_result = await db.execute(
                select(func.count(IrrigationLog.id))
                .where(IrrigationLog.plant_id == plant.id)
                .where(IrrigationLog.started_at >= since)
            )
            irr_count = irr_result.scalar() or 0

            # Anomaly count
            anom_result = await db.execute(
                select(func.count(AnomalyLog.id))
                .where(AnomalyLog.plant_id == plant.id)
                .where(AnomalyLog.timestamp >= since)
            )
            anom_count = anom_result.scalar() or 0

            moisture_str = f"{avg_moisture:.1f}%" if avg_moisture else "بدون داده"
            status = "✅" if anom_count == 0 else "⚠️"

            lines.append(
                f"{status} {plant.name}\n"
                f"   💧 میانگین رطوبت: {moisture_str}\n"
                f"   🚿 آبیاری: {irr_count} بار\n"
                f"   🔔 ناهنجاری: {anom_count} مورد"
            )

        return "\n".join(lines)


async def daily_report_loop():
    """
    Checks once per hour whether it is time to send the report.
    This is simpler than a full scheduler (such as APScheduler) and
    is completely sufficient for this project.
    """
    last_sent_day = None

    while True:
        await asyncio.sleep(60 * 60)  # Check once per hour

        now = datetime.now(timezone.utc)
        if now.hour == REPORT_HOUR_UTC and now.day != last_sent_day:
            try:
                report = await _build_daily_report()
                await send_bale_alert(report)
                last_sent_day = now.day
                print(f"Daily report sent at {now}")
            except Exception as e:
                print(f"Daily report error: {e}")