import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
  // Initialize from the class the pre-paint script in index.html already applied,
  // so the toggle reflects the real theme and there is no flash.
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  useEffect(() => {
    // Keep in sync if another tab changed the saved preference.
    const onStorage = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
        document.documentElement.classList.toggle('dark', e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="-mr-2 inline-grid min-h-11 min-w-11 place-items-center text-muted-foreground hover:text-foreground"
      aria-label={theme === 'light' ? 'Skift til mørk tilstand' : 'Skift til lys tilstand'}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
};

export default ThemeToggle;
