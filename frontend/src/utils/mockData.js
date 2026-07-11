/**
 * داده‌ی ساختگی (mock) برای دیدن کامل داشبورد بدون نیاز به بک‌اند یا
 * سخت‌افزار واقعی. وقتی سخت‌افزار/بک‌اند آماده شد، فقط کافیست در
 * فایل .env مقدار VITE_USE_MOCK_DATA را به false تغییر دهید -
 * هیچ کامپوننتی نیاز به تغییر ندارد.
 */

export const MOCK_PLANTS = [
  {
    id: 1,
    name: 'خیار',
    description: 'گیاه ۱ - پمپ D1 - سنسور D5',
    min_moisture_percent: 40,
    max_moisture_percent: 70,
    min_temp: 18,
    max_temp: 28,
    sensor_id: 3,
    relay_channel: 1,
    is_active: true,
    soil_moisture_percent: 58,
    air_temperature: 24.5,
    air_humidity: 61,
    last_irrigation: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 2,
    name: 'گوجه فرنگی',
    description: 'گیاه ۲ - پمپ D2 - سنسور D6',
    min_moisture_percent: 40,
    max_moisture_percent: 70,
    min_temp: 18,
    max_temp: 28,
    sensor_id: 4,
    relay_channel: 2,
    is_active: true,
    soil_moisture_percent: 37,
    air_temperature: 25.1,
    air_humidity: 58,
    last_irrigation: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 3,
    name: 'فلفل دلمه‌ای',
    description: 'گیاه ۳ - پمپ D3 - سنسور D7',
    min_moisture_percent: 40,
    max_moisture_percent: 70,
    min_temp: 18,
    max_temp: 28,
    sensor_id: 5,
    relay_channel: 3,
    is_active: true,
    soil_moisture_percent: 82,
    air_temperature: 24.8,
    air_humidity: 63,
    last_irrigation: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
];

/**
 * یک سری زمانی ۲۴ ساعته‌ی ساختگی برای نمودارها می‌سازد، با کمی نوسان
 * تصادفی طبیعی به‌جای یک خط کاملاً صاف.
 */
export function generateMockHistory(basePercent, baseTemp, baseHumidity) {
  const points = [];
  const now = Date.now();
  const intervalMs = 30 * 60 * 1000; // هر نیم ساعت یک نقطه - شبیه fetch واقعی هر ۱۰ ثانیه نیست، چون ۲۴ ساعت داده‌ی واقعی زیاد است

  for (let i = 48; i >= 0; i--) {
    const t = now - i * intervalMs;
    const wave = Math.sin(i / 6) * 8; // نوسان آرام شبیه افت رطوبت طی روز
    const noise = (Math.random() - 0.5) * 3;

    points.push({
      timestamp: new Date(t).toISOString(),
      soil_moisture_percent: Math.round(Math.max(10, Math.min(95, basePercent + wave + noise))),
      air_temperature: Math.round((baseTemp + Math.sin(i / 8) * 2 + noise * 0.3) * 10) / 10,
      air_humidity: Math.round(baseHumidity + Math.cos(i / 7) * 5 + noise),
    });
  }

  return points;
}

export const MOCK_IRRIGATION_LOGS = [
  {
    id: 1,
    started_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
    user_triggered: false,
  },
  {
    id: 2,
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 50).toISOString(),
    user_triggered: true,
  },
  {
    id: 3,
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    ended_at: new Date(Date.now() - 1000 * 60 * 60 * 26 + 1000 * 38).toISOString(),
    user_triggered: false,
  },
];
