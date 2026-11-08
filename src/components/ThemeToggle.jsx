import React from 'react';
import { Moon, Sun } from 'lucide-react';

// Rendered as plain HTML on every page; the inline script at the end of src/layouts/Base.astro does the
// switching and sets the label. Both icons are in the markup and the `dark` class on <html> picks one, so
// the right icon shows before any script runs.
const ThemeToggle = () => (
  <button
    type="button"
    data-theme-toggle
    className="-mr-2 inline-grid min-h-11 min-w-11 place-items-center text-muted-foreground hover:text-foreground"
    aria-label="Skift til mørk tilstand"
  >
    <Moon className="h-5 w-5 dark:hidden" aria-hidden="true" />
    <Sun className="hidden h-5 w-5 dark:block" aria-hidden="true" />
  </button>
);

export default ThemeToggle;
