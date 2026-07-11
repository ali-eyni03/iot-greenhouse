import { useState, useEffect, useCallback } from 'react';
import { fetchSensorHistory } from '../utils/api';

/**
 * این hook تاریخچه‌ی ۲۴ ساعته را از REST API می‌گیرد، و یک تابع
 * `appendLivePoint` برمی‌گرداند که کامپوننت می‌تواند با هر پیام جدید
 * WebSocket صدا بزند تا نمودار بدون رفرش صفحه آپدیت شود.
 */
export function useSensorHistory(plantId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!plantId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchSensorHistory(plantId, 24);
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [plantId]);

  const appendLivePoint = useCallback((point) => {
    setHistory((prev) => {
      const next = [...prev, point];
      // فقط ۲۴ ساعت اخیر را نگه می‌داریم تا نمودار رشد بی‌پایان نکند
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      return next.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
    });
  }, []);

  return { history, loading, error, appendLivePoint };
}
