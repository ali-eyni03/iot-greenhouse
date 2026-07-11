"""
Storage and loading of Isolation Forest models for each plant.

Each plant has a separate model file (.joblib) and metadata file (.json).
The metadata contains information that the model itself does not store but is
needed to decide when retraining is required: how many samples it was trained
on, and when it was trained.

Why keep metadata separate from the model? Because opening a .joblib file just
to read "when was it trained" is wasteful (you would have to deserialize the
entire model); the .json file is small and fast to read.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib

MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)


def _model_path(plant_id: int) -> Path:
    return MODELS_DIR / f"model_plant_{plant_id}.joblib"


def _meta_path(plant_id: int) -> Path:
    return MODELS_DIR / f"model_plant_{plant_id}_meta.json"


def save_model(plant_id: int, model, sample_count: int, is_synthetic: bool = False):
    """Saves the model and its metadata."""
    joblib.dump(model, _model_path(plant_id))

    meta = {
        "plant_id": plant_id,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": sample_count,
        "is_synthetic": is_synthetic,  # Important: indicates whether the model was built from real or test data
    }
    with open(_meta_path(plant_id), "w") as f:
        json.dump(meta, f, indent=2)


def load_model(plant_id: int):
    """Returns a plant's saved model, or None if it has not been trained yet."""
    path = _model_path(plant_id)
    if not path.exists():
        return None
    return joblib.load(path)


def load_meta(plant_id: int) -> dict | None:
    path = _meta_path(plant_id)
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def model_exists(plant_id: int) -> bool:
    return _model_path(plant_id).exists()


def delete_model(plant_id: int):
    """Deletes a synthetic model before replacing it with a real one."""
    _model_path(plant_id).unlink(missing_ok=True)
    _meta_path(plant_id).unlink(missing_ok=True)
