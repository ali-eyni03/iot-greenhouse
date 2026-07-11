import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchPlants, fetchSensors } from '../utils/api';
import { useWebSocket } from '../hooks/useWebSocket';

const PlantsContext = createContext(null);

/**
 * این Context منبع واحد داده‌ی گیاهان است:
 * - در ابتدا با REST API لیست گیاهان را می‌گیرد
 * - بعد با WebSocket روی reading های real-time گوش می‌دهد و state را آپدیت می‌کند
 *
 * چرا Context و نه prop-drilling؟ چون هم صفحه‌ی اصلی (لیست کارت‌ها) و هم
 * صفحه‌ی پنل هرگیاه، به همین داده نیاز دارند - بدون Context باید این داده
 * را از بالا به پایین در چند سطح پاس بدهیم.
 */
export function PlantsProvider({ children }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // بارگذاری اولیه‌ی لیست گیاهان از REST API
  useEffect(() => {
    let cancelled = false;

    async function loadPlants() {
      try {
        const data = await fetchPlants();
        if (!cancelled) {
          // هر گیاه را با فیلدهای real-time (که فقط از WebSocket می‌آیند) تکمیل می‌کنیم
          setPlants(
            data.map((p) => ({
              ...p,
              soil_moisture_percent: null,
              air_temperature: null,
              air_humidity: null,
              last_updated: null,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlants();
    return () => {
      cancelled = true;
    };
  }, []);

  // وقتی پیام جدید از WebSocket می‌رسد، فقط همان گیاه مربوطه را آپدیت می‌کنیم
  const handleMessage = useCallback((data) => {
    if (data.type !== 'sensor_reading') return;

    setPlants((prev) =>
      prev.map((p) =>
        p.id === data.plant_id
          ? {
              ...p,
              soil_moisture_percent: data.soil_moisture_percent,
              air_temperature: data.air_temperature,
              air_humidity: data.air_humidity,
              last_updated: new Date().toISOString(),
            }
          : p
      )
    );
  }, []);

  const { connected } = useWebSocket(handleMessage);

  const updatePlant = useCallback((plantId, updates) => {
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, ...updates } : p))
    );
  }, []);

  return (
    <PlantsContext.Provider
      value={{ plants, loading, error, connected, updatePlant, setPlants }}
    >
      {children}
    </PlantsContext.Provider>
  );
}

export function usePlants() {
  const ctx = useContext(PlantsContext);
  if (!ctx) {
    throw new Error('usePlants باید داخل PlantsProvider استفاده شود');
  }
  return ctx;
}
