export function ConnectionBadge({ connected }) {
  return (
    <div className="flex items-center gap-2 text-xs text-ink-soft dark:text-ink-soft-dark">
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? 'bg-leaf dark:bg-leaf-dark animate-pulse-slow' : 'bg-brick dark:bg-brick-dark'
        }`}
      />
      {connected ? 'اتصال زنده' : 'در حال اتصال مجدد...'}
    </div>
  );
}
