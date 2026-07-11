import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

/**
 * مدیریت تم روشن/تاریک.
 *
 * نکته‌ی مهم درباره‌ی ذخیره‌سازی: در این محیط (پیش‌نمایش Artifact) از
 * localStorage استفاده نمی‌کنیم چون در iframe های sandbox پشتیبانی نمی‌شود.
 * در پروژه‌ی واقعی خودت (که با Vite بیرون از این محیط اجرا می‌شود)،
 * localStorage کاملاً کار می‌کند - خط مربوطه را در کامنت پایین می‌بینی.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // اول ترجیح سیستم کاربر را چک می‌کنیم؛ اگر بعداً localStorage فعال کردی،
    // اینجا باید اول localStorage.getItem('theme') را بررسی کنی
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // در پروژه‌ی واقعی خودت، این خط را از کامنت خارج کن تا تم بین رفرش‌ها بماند:
    // localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme باید داخل ThemeProvider استفاده شود');
  return ctx;
}
