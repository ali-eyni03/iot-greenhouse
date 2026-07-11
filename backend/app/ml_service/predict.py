"""
Prediction using a saved model for a plant.

Isolation Forest output:
- model.predict() -> 1 means normal, -1 means anomaly
- model.decision_function() -> a float score; the more negative it is,
    the more unusual the point looks to the model. We store this score in
    anomaly_logs so we can later analyze anomaly severity, not just a simple
    yes/no result.
"""

import numpy as np

from . import model_store


def predict_anomaly(plant_id: int, soil_percent: float, air_temp: float, air_humidity: float):
    """
    Returns: (is_anomaly: bool, score: float) or (None, None) if this plant
    does not have a trained model yet.
    """
    model = model_store.load_model(plant_id)
    if model is None:
        return None, None

    point = np.array([[soil_percent, air_temp, air_humidity]])

    prediction = model.predict(point)[0]  # 1 or -1
    score = model.decision_function(point)[0]

    is_anomaly = prediction == -1
    return is_anomaly, float(score)


def determine_probable_cause(
    soil_percent: float,
    air_temp: float,
    air_humidity: float,
    min_moisture: float,
    max_moisture: float,
    min_temp: float,
    max_temp: float,
) -> str:
    """
    Simple logic (not ML) for estimating which factor caused the anomaly.
    This is exactly the approach we decided on in phase 1: Isolation Forest
    only says "this is unusual", but not "which factor caused it" - we add
    that interpretation ourselves with a simple if/else rule.
    The enum values must exactly match probable_cause_enum in the database
    (phase 1):
    'soil', 'temperature', 'humidity', 'combined'
    """
    soil_off = soil_percent < min_moisture or soil_percent > max_moisture
    temp_off = air_temp < min_temp or air_temp > max_temp

    if soil_off and temp_off:
        return "combined"
    if soil_off:
        return "soil"
    if temp_off:
        return "temperature"
    # If none of the values is outside the configured range but the model still
    # detected an anomaly, the combination must be unusual (not just one factor);
    # we treat humidity as the remaining likely cause
    return "humidity"
