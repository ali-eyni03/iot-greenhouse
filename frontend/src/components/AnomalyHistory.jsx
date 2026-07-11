import { formatRelativeTime } from '../utils/plantStatus';

const causeLabels = {
  soil: 'رطوبت خاک',
  temperature: 'دما',
  humidity: 'رطوبت هوا',
  combined: 'ترکیبی',
};

export function AnomalyHistory({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-ink-soft dark:text-ink-soft-dark py-4">
        هیچ ناهنجاری ثبت نشده — وضعیت گیاه نرمال است.
      </p>
    );
  }

  return (
    <ul className="max-h-64 overflow-y-scroll scrollbar-hide divide-y divide-border/40 dark:divide-border-dark/40">
      
      {logs.map((log, i) => (
        <li key={i} className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brick dark:bg-brick-dark" />
            <span className="text-ink dark:text-ink-dark">
              {causeLabels[log.probable_cause] ?? log.probable_cause}
            </span>
            <span className="font-mono text-xs text-ink-soft dark:text-ink-soft-dark">
              score: {log.score}
            </span>
          </div>
          <span className="text-xs text-ink-soft dark:text-ink-soft-dark">
            {formatRelativeTime(log.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}