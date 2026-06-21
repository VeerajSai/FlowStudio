import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeContext = createContext('light');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('flowstudio-theme') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('flowstudio-theme', theme);
    } catch {}
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-hairline hover:bg-canvas dark:hover:bg-white/10 transition-colors duration-140 outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon size={15} className="text-ink-muted" />
      ) : (
        <Sun size={15} className="text-ink-muted" />
      )}
    </button>
  );
}
