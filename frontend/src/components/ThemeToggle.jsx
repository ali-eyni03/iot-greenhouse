import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
      className="relative h-10 w-20 rounded-full bg-zinc-800/90 border border-zinc-700/50 p-1 transition-colors duration-300 focus:outline-none"
    >
      {/* آیکون‌های پس‌زمینه دکمه */}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
        <Moon size={16} className="stroke-[2.5]" />
      </span>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
        <Sun size={16} className="stroke-[2.5]" />
      </span>

      {/* دایره متحرک (Knob) */}
      <span
        className={`absolute top-1 left-1 h-8 w-8 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isDark ? 'translate-x-10' : 'translate-x-0'}`}
      >
        {isDark ? (
          <Moon size={16} className="text-white stroke-[2.5]" />
        ) : (
          <Sun size={16} className="text-white stroke-[2.5]" />
        )}
      </span>
    </button>
  );
}
