import { statusStyles } from '../utils/plantStatus';

export function MoistureLevel({ percent, status, size = 'md' }) {
  const style = statusStyles[status.level];
  const fillHeight = percent != null ? Math.min(100, Math.max(0, percent)) : 0;
  const dims = size === 'lg' ? 'h-32 w-10' : 'h-20 w-7';

  const fillColor =
    status.level === 'critical'
      ? 'linear-gradient(180deg, #DC2626 0%, #b91c1c 100%)'
      : status.level === 'warning'
      ? 'linear-gradient(180deg, #F59E0B 0%, #d97706 100%)'
      : 'linear-gradient(180deg, #22C55E 0%, #16A34A 100%)';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative ${dims} rounded-full bg-border/60 dark:bg-border-dark/60
                    overflow-hidden ring-1 ${style.ring}`}
        role="img"
        aria-label={`رطوبت خاک ${percent ?? 'نامشخص'} درصد`}
      >
        <div className="absolute inset-0 flex flex-col justify-between py-1 px-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-px w-full bg-ink/10 dark:bg-ink-dark/10" />
          ))}
        </div>

        <div
          className="absolute bottom-0 inset-x-0 transition-all duration-700 ease-out"
          style={{ height: `${fillHeight}%`, background: fillColor }}
        />
      </div>

      <div className="flex flex-col">
        <span className="font-mono text-2xl leading-none text-ink dark:text-ink-dark">
          {percent != null ? `${Math.round(percent)}` : '—'}
          <span className="text-sm text-ink-soft dark:text-ink-soft-dark">٪</span>
        </span>
        <span className={`text-xs font-medium mt-1 ${style.text}`}>{status.label}</span>
      </div>
    </div>
  );
}
