CREATE TYPE probable_cause_enum AS ENUM (
    'soil',
    'temperature',
    'humidity',
    'combined'
);

CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    pin_number INTEGER NOT NULL,
    dry_raw_value INTEGER NOT NULL,
    wet_raw_value INTEGER NOT NULL,
    description TEXT
);

CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_moisture_percent FLOAT NOT NULL,
    max_moisture_percent FLOAT NOT NULL,
    min_temp FLOAT NOT NULL,
    max_temp FLOAT NOT NULL,
    sensor_id INTEGER REFERENCES sensors(id),
    relay_channel INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT
);

-- Time-series measurements
-- Intentionally no primary key (append-only data)
CREATE TABLE sensor_readings (
    plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
    soil_moisture_raw INTEGER NOT NULL,
    soil_moisture_percent FLOAT NOT NULL,
    air_temperature FLOAT NOT NULL,
    air_humidity FLOAT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Irrigation events
CREATE TABLE irrigation_logs (
    id SERIAL,
    plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    user_triggered BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (id, started_at)
);

-- Anomaly detection results
CREATE TABLE anomaly_logs (
    id SERIAL,
    plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
    score FLOAT NOT NULL,
    probable_cause probable_cause_enum NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (id, timestamp)
);

SELECT create_hypertable(
    'sensor_readings',
    by_range('timestamp'),
    if_not_exists => TRUE
);

SELECT create_hypertable(
    'irrigation_logs',
    by_range('started_at'),
    if_not_exists => TRUE
);

SELECT create_hypertable(
    'anomaly_logs',
    by_range('timestamp'),
    if_not_exists => TRUE
);

CREATE INDEX idx_sensor_readings_plant_time
ON sensor_readings (plant_id, timestamp DESC);

CREATE INDEX idx_irrigation_logs_plant_time
ON irrigation_logs (plant_id, started_at DESC);

CREATE INDEX idx_anomaly_logs_plant_time
ON anomaly_logs (plant_id, timestamp DESC);
