/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // با افزودن کلاس .dark به <html> فعال می‌شود (نه بر اساس تنظیمات سیستم به‌تنهایی)
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // پس‌زمینه‌ها و سطوح - در هر دو تم با dark: قابل override هستند
        base: '#F3F7F3',
        surface: '#FFFFFF',
        'base-dark': '#0A0F0C',
        'surface-dark': '#141F19',

        ink: '#0F1B14',
        'ink-soft': '#5C6B60',
        'ink-dark': '#F0FAF4',
        'ink-soft-dark': '#8FA398',

        leaf: {
          DEFAULT: '#16A34A',
          bright: '#22C55E',
          dark: '#4ADE80', // نسخه‌ی روشن‌تر برای کنتراست کافی روی تم تاریک
          glow: '#34D399',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dark: '#FBBF24',
        },
        brick: {
          DEFAULT: '#DC2626',
          dark: '#F87171',
        },

        border: '#E1E9E0',
        'border-dark': '#233229',
      },
      fontFamily: {
        display: ['Vazirmatn', 'sans-serif'],
        body: ['Vazirmatn', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'glow-light':
          'radial-gradient(60% 50% at 15% 0%, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(16,185,129,0.14) 0%, rgba(16,185,129,0) 60%)',
        'glow-dark':
          'radial-gradient(60% 50% at 15% 0%, rgba(74,222,128,0.14) 0%, rgba(74,222,128,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0) 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(15, 27, 20, 0.08)',
        'glass-dark': '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
        glow: '0 0 0 1px rgba(34,197,94,0.15), 0 8px 24px -8px rgba(34,197,94,0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        rise: 'rise 0.6s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        rise: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
