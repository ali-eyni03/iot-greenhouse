import { MOCK_PLANTS, MOCK_IRRIGATION_LOGS, generateMockHistory } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// === سوییچ اصلی mock/واقعی ===
// وقتی سخت‌افزار و بک‌اند آماده شد، فقط این مقدار را در فایل .env به
// false تغییر بده (VITE_USE_MOCK_DATA=false) - هیچ کامپوننتی نیاز به
// تغییر ندارد چون همه از همین توابع (fetchPlants, fetchSensorHistory, ...)
// استفاده می‌کنند، نه مستقیم از fetch.
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

// تأخیر مصنوعی کوچک تا حس یک درخواست واقعی شبکه را داشته باشد
// (مفید برای تست حالت‌های loading در رابط کاربری)
const mockDelay = (data, ms = 300) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* بدنه JSON نبود */
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function fetchPlants() {
  if (USE_MOCK) return mockDelay(MOCK_PLANTS);
  return request('/plants/');
}

export function fetchPlant(plantId) {
  if (USE_MOCK) return mockDelay(MOCK_PLANTS.find((p) => p.id === Number(plantId)));
  return request(`/plants/${plantId}`);
}

export function updatePlantThresholds(plantId, updates) {
  if (USE_MOCK) {
    const plant = MOCK_PLANTS.find((p) => p.id === Number(plantId));
    return mockDelay({ ...plant, ...updates });
  }
  return request(`/plants/${plantId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function fetchSensors() {
  if (USE_MOCK) return mockDelay([]);
  return request('/sensors/');
}

export function triggerIrrigation(plantId) {
  if (USE_MOCK) {
    console.log(`[mock] دستور آبیاری برای گیاه ${plantId} ارسال شد`);
    return mockDelay({ status: 'ok' }, 500);
  }
  return request(`/plants/${plantId}/irrigate`, { method: 'POST' });
}

export function fetchSensorHistory(plantId, hours = 24) {
  if (USE_MOCK) {
    const plant = MOCK_PLANTS.find((p) => p.id === Number(plantId));
    if (!plant) return mockDelay([]);
    return mockDelay(
      generateMockHistory(plant.soil_moisture_percent, plant.air_temperature, plant.air_humidity)
    );
  }
  return request(`/plants/${plantId}/history?hours=${hours}`);
}

export function fetchIrrigationHistory(plantId) {
  if (USE_MOCK) return mockDelay(MOCK_IRRIGATION_LOGS);
  return request(`/plants/${plantId}/irrigation-logs`);
}

// این تابع رو به utils/api.js اضافه کن (در کنار fetchIrrigationHistory):

export function fetchAnomalyHistory(plantId) {
  if (USE_MOCK) return mockDelay([
    { id: 1, timestamp: new Date(Date.now() - 1000*60*90).toISOString(), score: -0.142, probable_cause: 'soil' },
    { id: 2, timestamp: new Date(Date.now() - 1000*60*60*5).toISOString(), score: -0.089, probable_cause: 'temperature' },
  ]);
  return request(`/plants/${plantId}/anomaly-logs`);
}