import { formatRelativeTime } from '../utils/plantStatus';

export function IrrigationHistory({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-ink-soft dark:text-ink-soft-dark py-4">
        هنوز سابقه‌ی آبیاری ثبت نشده است.
      </p>
    );
  }

  return (
    <ul className="max-h-64 overflow-y-scroll scrollbar-hide divide-y divide-border/40 dark:divide-border-dark/40">
      {logs.map((log) => {
        const durationSec = log.ended_at
          ? Math.round((new Date(log.ended_at) - new Date(log.started_at)) / 1000)
          : null;

        return (
          <li key={log.id} className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  log.user_triggered ? 'bg-amber dark:bg-amber-dark' : 'bg-leaf dark:bg-leaf-dark'
                }`}
              />
              <span className="text-ink dark:text-ink-dark">
                {log.user_triggered ? 'آبیاری دستی' : 'آبیاری خودکار'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-ink-soft dark:text-ink-soft-dark font-mono text-xs">
              {durationSec != null && <span>{durationSec} ثانیه</span>}
              <span>{formatRelativeTime(log.started_at)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
