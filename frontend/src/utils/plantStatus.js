export function getPlantStatus(plant) {
  const { soil_moisture_percent, min_moisture_percent, max_moisture_percent } = plant;

  if (soil_moisture_percent == null) {
    return { level: 'unknown', label: 'در انتظار داده' };
  }

  if (
    soil_moisture_percent < min_moisture_percent ||
    soil_moisture_percent > max_moisture_percent
  ) {
    return { level: 'critical', label: 'بحرانی' };
  }

  const range = max_moisture_percent - min_moisture_percent;
  const margin = range * 0.15;
  if (
    soil_moisture_percent < min_moisture_percent + margin ||
    soil_moisture_percent > max_moisture_percent - margin
  ) {
    return { level: 'warning', label: 'هشدار' };
  }

  return { level: 'normal', label: 'نرمال' };
}

export const statusStyles = {
  normal: {
    text: 'text-leaf dark:text-leaf-dark',
    bg: 'bg-leaf/10 dark:bg-leaf-dark/15',
    ring: 'ring-leaf/30 dark:ring-leaf-dark/30',
    dot: 'bg-leaf dark:bg-leaf-dark',
  },
  warning: {
    text: 'text-amber dark:text-amber-dark',
    bg: 'bg-amber/10 dark:bg-amber-dark/15',
    ring: 'ring-amber/30 dark:ring-amber-dark/30',
    dot: 'bg-amber dark:bg-amber-dark',
  },
  critical: {
    text: 'text-brick dark:text-brick-dark',
    bg: 'bg-brick/10 dark:bg-brick-dark/15',
    ring: 'ring-brick/30 dark:ring-brick-dark/30',
    dot: 'bg-brick dark:bg-brick-dark',
  },
  unknown: {
    text: 'text-ink-soft dark:text-ink-soft-dark',
    bg: 'bg-ink-soft/5 dark:bg-ink-soft-dark/10',
    ring: 'ring-border dark:ring-border-dark',
    dot: 'bg-ink-soft/40 dark:bg-ink-soft-dark/40',
  },
};

export function formatRelativeTime(isoString) {
  if (!isoString) return 'بدون داده';

  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'همین الان';
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ساعت پیش`;

  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} روز پیش`;
}

export function formatClockTime(isoString) {
  return new Date(isoString).toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
