"""
Rule-based irrigation decision logic

Irrigation duration is based on the moisture deficit rather than a fixed value:
the farther below the limit, the longer the irrigation lasts, with a ceiling to
prevent overwatering.
"""

MIN_IRRIGATION_SECONDS = 3
MAX_IRRIGATION_SECONDS = 12


def should_irrigate(soil_percent: float, min_moisture_percent: float, max_moisture_percent: float) -> bool:
    if soil_percent > max_moisture_percent:
        return False  # Soil is too wet, do not irrigate
    return soil_percent < min_moisture_percent


def calculate_irrigation_duration(soil_percent: float, min_moisture_percent: float) -> int:
    """
    The larger the moisture deficit, the longer the irrigation duration.
    Simple linear relationship: for each 1% deficit, half a second is added to
    the base duration.
    This factor (0.5) is only an initial estimate - it can later be calibrated
    by observing how the plants actually respond (how much irrigation is needed
    to compensate for each percent of deficit).
    """
    deficit = max(0.0, min_moisture_percent - soil_percent)
    duration = MIN_IRRIGATION_SECONDS + deficit * 0.5
    return int(min(MAX_IRRIGATION_SECONDS, duration))
