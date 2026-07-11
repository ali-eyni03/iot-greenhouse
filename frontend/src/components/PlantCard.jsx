import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoistureLevel } from './MoistureLevel';
import { getPlantStatus, statusStyles, formatRelativeTime } from '../utils/plantStatus';
import { triggerIrrigation } from '../utils/api';

export function PlantCard({ plant }) {
  const navigate = useNavigate();
  const [irrigating, setIrrigating] = useState(false);
  const [justTriggered, setJustTriggered] = useState(false);

  const status = getPlantStatus(plant);
  const style = statusStyles[status.level];

  async function handleIrrigate(e) {
    e.stopPropagation();
    setIrrigating(true);
    try {
      await triggerIrrigation(plant.id);
      setJustTriggered(true);
      setTimeout(() => setJustTriggered(false), 4000);
    } catch (err) {
      console.error('آبیاری دستی ناموفق بود:', err);
    } finally {
      setIrrigating(false);
    }
  }

  return (
    <div
      onClick={() => navigate(`/plant/${plant.id}`)}
      className="group cursor-pointer rounded-2xl bg-surface dark:bg-surface-dark
                 border border-border dark:border-border-dark
                 p-5 shadow-sm transition-all hover:shadow-md hover:border-leaf/40 dark:hover:border-leaf-dark/40
                 animate-rise"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-xl text-ink dark:text-ink-dark">{plant.name}</h3>
          <p className="text-xs text-ink-soft dark:text-ink-soft-dark mt-0.5">{plant.description}</p>
        </div>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <MoistureLevel percent={plant.soil_moisture_percent} status={status} />

        <div className="text-right text-xs text-ink-soft dark:text-ink-soft-dark space-y-1 font-mono">
          <div>دما: {plant.air_temperature != null ? `${plant.air_temperature}°` : '—'}</div>
          <div>رطوبت هوا: {plant.air_humidity != null ? `${plant.air_humidity}٪` : '—'}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border dark:border-border-dark">
        <span className="text-xs text-ink-soft dark:text-ink-soft-dark">
          آخرین آبیاری: {formatRelativeTime(plant.last_irrigation)}
        </span>

        <button
          onClick={handleIrrigate}
          disabled={irrigating}
          className="text-xs font-medium rounded-lg px-3 py-1.5
                     bg-leaf/10 text-leaf hover:bg-leaf/20
                     dark:bg-leaf-dark/15 dark:text-leaf-dark dark:hover:bg-leaf-dark/25
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {justTriggered ? '✓ ارسال شد' : irrigating ? 'در حال ارسال...' : 'آبیاری دستی'}
        </button>
      </div>
    </div>
  );
}
