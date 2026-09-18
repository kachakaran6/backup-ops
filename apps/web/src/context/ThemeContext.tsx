import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type ActualTheme = 'dark' | 'light';
export type PaletteMode = 'amber' | 'indigo' | 'emerald' | 'violet' | 'neon';

interface ThemeContextType {
  theme: ThemeMode;
  actualTheme: ActualTheme;
  resolvedTheme: ActualTheme;
  palette: PaletteMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setPalette: (palette: PaletteMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('backupops_theme') as ThemeMode;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark';
  });

  const [palette, setPaletteState] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('backupops_palette') as PaletteMode;
    return ['amber', 'indigo', 'emerald', 'violet', 'neon'].includes(saved) ? saved : 'amber';
  });

  const [actualTheme, setActualTheme] = useState<ActualTheme>('dark');

  useEffect(() => {
    const applyTheme = () => {
      let resolved: ActualTheme = 'dark';

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolved = prefersDark ? 'dark' : 'light';
      } else {
        resolved = theme;
      }

      setActualTheme(resolved);

      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(resolved);
    };

    applyTheme();
    localStorage.setItem('backupops_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Apply palette attribute to root
  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette);
    localStorage.setItem('backupops_palette', palette);
  }, [palette]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setPalette = (newPalette: PaletteMode) => {
    setPaletteState(newPalette);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        actualTheme,
        resolvedTheme: actualTheme,
        palette,
        setTheme,
        toggleTheme,
        setPalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

