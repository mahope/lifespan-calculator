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
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-3 min-w-[48px] min-h-[48px] rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 z-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={theme === 'light' ? 'Skift til mørk tilstand' : 'Skift til lys tilstand'}
    >
      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
};

export default ThemeToggle;
