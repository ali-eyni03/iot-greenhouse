"""
Training an Isolation Forest model for a specific plant.

Important note about contamination:
This parameter tells the model "what proportion of the data should be expected
to be anomalies by default?" Because our data is intentionally composed (as
much as possible) only of normal behavior, we keep contamination low (0.05,
meaning 5%) - in other words, we tell the model "most of this data is normal;
only mark the truly outlying cases." If contamination is too high, the model
becomes more sensitive and starts labeling normal cases as anomalies (more
false positives).
"""

import numpy as np
from sklearn.ensemble import IsolationForest

from . import model_store

MIN_SAMPLES_FOR_TRAINING = 200  # Minimum number of readings needed for a meaningful training run
CONTAMINATION = 0.05


def train_model(readings: np.ndarray) -> IsolationForest:
    """
    readings: a numpy array with shape (n_samples, 3) containing the columns
    [soil_moisture_percent, air_temperature, air_humidity]
    """
    model = IsolationForest(
        contamination=CONTAMINATION,
        random_state=42,  # For reproducible results across different runs
        n_estimators=100,
    )
    model.fit(readings)
    return model


def train_and_save_for_plant(plant_id: int, readings: np.ndarray, is_synthetic: bool = False):
    """Trains the model and saves the result for this plant."""
    model = train_model(readings)
    model_store.save_model(
        plant_id, model, sample_count=len(readings), is_synthetic=is_synthetic
    )
    return model
