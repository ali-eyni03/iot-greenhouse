"""
Synthetic data is only for testing the ML code before enough real data has
been collected from the ESP.

⚠️ Critical note: this data is never inserted into the sensor_readings table.
This function is only meant to be called directly during development/testing
(for example, from a script or unit test) so we can verify that
train/predict/save work without errors. A model trained on this function's
output is marked with is_synthetic=True (in model_store.py) so it is never
mistaken for a real model.
"""

import numpy as np


def generate_synthetic_readings(n_samples: int = 500, seed: int = 42) -> np.ndarray:
    """
    Simulates normal plant behavior: soil moisture fluctuates gently around a
    mean (with gradual drops between irrigations), and air temperature and
    humidity also follow daily fluctuations.
    """
    rng = np.random.default_rng(seed)

    soil = 55 + 10 * np.sin(np.linspace(0, 20, n_samples)) + rng.normal(0, 2, n_samples)
    temp = 24 + 3 * np.sin(np.linspace(0, 10, n_samples)) + rng.normal(0, 0.5, n_samples)
    humidity = 60 + 5 * np.cos(np.linspace(0, 8, n_samples)) + rng.normal(0, 1.5, n_samples)

    return np.column_stack([soil, temp, humidity])
