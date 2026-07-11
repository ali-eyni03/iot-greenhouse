import { useState } from 'react';
import { updatePlantThresholds } from '../utils/api';

function NumberField({ label, value, onChange, unit }) {
  return (
    <label className="flex items-center justify-between py-2.5">
      <span className="text-sm text-ink-soft dark:text-ink-soft-dark">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 bg-base dark:bg-base-dark border border-border dark:border-border-dark
                     rounded-lg px-2 py-1 text-sm font-mono text-ink dark:text-ink-dark text-center
                     focus:border-leaf dark:focus:border-leaf-dark focus:outline-none"
        />
        <span className="text-xs text-ink-soft dark:text-ink-soft-dark w-6">{unit}</span>
      </div>
    </label>
  );
}

export function ThresholdSettings({ plant, onUpdated }) {
  const [values, setValues] = useState({
    min_moisture_percent: plant.min_moisture_percent,
    max_moisture_percent: plant.max_moisture_percent,
    min_temp: plant.min_temp,
    max_temp: plant.max_temp,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = Object.keys(values).some((key) => values[key] !== plant[key]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updatePlantThresholds(plant.id, values);
      onUpdated?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('ذخیره‌ی تنظیمات ناموفق بود:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="divide-y divide-border dark:divide-border-dark">
      <NumberField
        label="حداقل رطوبت مجاز"
        value={values.min_moisture_percent}
        unit="٪"
        onChange={(v) => setValues((s) => ({ ...s, min_moisture_percent: v }))}
      />
      <NumberField
        label="حداکثر رطوبت مجاز"
        value={values.max_moisture_percent}
        unit="٪"
        onChange={(v) => setValues((s) => ({ ...s, max_moisture_percent: v }))}
      />
      <NumberField
        label="حداقل دمای مناسب"
        value={values.min_temp}
        unit="°"
        onChange={(v) => setValues((s) => ({ ...s, min_temp: v }))}
      />
      <NumberField
        label="حداکثر دمای مناسب"
        value={values.max_temp}
        unit="°"
        onChange={(v) => setValues((s) => ({ ...s, max_temp: v }))}
      />

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full rounded-lg py-2.5 text-sm font-medium transition-colors
                     bg-leaf/10 text-leaf hover:bg-leaf/20
                     dark:bg-leaf-dark/15 dark:text-leaf-dark dark:hover:bg-leaf-dark/25
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saved ? '✓ ذخیره شد' : saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
      </div>
    </div>
  );
}
