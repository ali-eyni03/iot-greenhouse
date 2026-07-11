import { useEffect, useRef, useState, useCallback } from 'react';
import { MOCK_PLANTS } from '../utils/mockData';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

/**
 * Custom hook برای اتصال WebSocket با reconnect خودکار.
 *
 * در حالت mock (بدون بک‌اند واقعی)، به‌جای اتصال واقعی، هر چند ثانیه
 * یک‌بار یک پیام "sensor_reading" ساختگی برای یکی از گیاهان شبیه‌سازی
 * می‌شود - این یعنی می‌توانی رفتار real-time (مثل آپدیت نمودار بدون
 * رفرش) را هم قبل از آمادگی سخت‌افزار کامل تست کنی.
 */
export function useWebSocket(onMessage) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mockIntervalRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch (err) {
        console.error('پیام WebSocket قابل پارس نبود:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    if (USE_MOCK) {
      // شبیه‌سازی اتصال موفق و سپس پیام‌های دوره‌ای
      setConnected(true);
      mockIntervalRef.current = setInterval(() => {
        const plant = MOCK_PLANTS[Math.floor(Math.random() * MOCK_PLANTS.length)];
        const drift = (Math.random() - 0.5) * 4;
        onMessageRef.current?.({
          type: 'sensor_reading',
          plant_id: plant.id,
          soil_moisture_percent: Math.round(
            Math.max(10, Math.min(95, plant.soil_moisture_percent + drift))
          ),
          air_temperature: Math.round((plant.air_temperature + (Math.random() - 0.5)) * 10) / 10,
          air_humidity: Math.round(plant.air_humidity + (Math.random() - 0.5) * 3),
        });
      }, 5000);

      return () => clearInterval(mockIntervalRef.current);
    }

    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
