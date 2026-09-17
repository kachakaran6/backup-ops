# UI Theme System

## Overview

BackupOps uses a comprehensive theming system based on Tailwind CSS and shadcn/ui to provide consistent, professional styling across the application. The theme system supports both light and dark modes, customization, and extensibility for enterprise deployments.

## Theme Architecture

### Core Principles

1. **Accessibility First**: Themes must meet WCAG AA standards
2. **Performance**: Minimal runtime overhead for theme switching
3. **Consistency**: Unified design language across all components
4. **Extensibility**: Support for custom brand theming
5. **User Control**: Allow users to override system themes

### Theme Structure

```text
themes/
├── base/                    # Core design tokens and styles
├── components/              # Component-specific styles
├── layouts/                 # Page and layout styles
├── utilities/               # Helper classes and patterns
├── dark/                    # Dark mode variants
├── high-contrast/           # Enhanced accessibility variants
├── custom/                  # User-defined themes
└── theme-definitions/       # Theme configuration
```

## Design Tokens

### Color System

```css
:root {
  /* Primary brand colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
  
  /* Semantic colors */
  --success-500: #10b981;
  --warning-500: #f59e0b;
  --error-500: #ef4444;
  --info-500: #3b82f6;
  
  /* Surface colors */
  --surface-50: #f9fafb;
  --surface-100: #f3f4f6;
  --surface-200: #e5e7eb;
  --surface-300: #d1d5db;
  --surface-900: #111827;
  
  /* State colors */
  --border: var(--surface-200);
  --background: var(--surface-50);
  --foreground: var(--surface-900);
  --ring: var(--primary-500);
}
```

### Typography

```css
:root {
  /* Font families */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  
  /* Font sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* Font weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Spacing System

```css
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  --spacing-20: 5rem;     /* 80px */
  --spacing-24: 6rem;     /* 96px */
  --spacing-32: 8rem;     /* 128px */
}
```

## Component Theme Patterns

### Button Component

```css
.button {
  /* Base styles */
  background-color: var(--primary-500);
  color: var(--surface-50);
  border-radius: var(--radius-md);
  padding: var(--spacing-2) var(--spacing-4);
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
  
  /* Hover state */
  &:hover {
    background-color: var(--primary-600);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  /* Active state */
  &:active {
    background-color: var(--primary-700);
    transform: translateY(0);
  }
  
  /* Disabled state */
  &:disabled {
    background-color: var(--surface-200);
    color: var(--surface-400);
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  /* Variants */
  &--variant-secondary {
    background-color: var(--surface-100);
    color: var(--foreground);
    border: 1px solid var(--border);
  }
  
  &--variant-danger {
    background-color: var(--error-500);
    &:hover { background-color: #dc2626; }
    &:active { background-color: #b91c1c; }
  }
}
```

### Card Component

```css
.card {
  background-color: var(--surface-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: var(--shadow-md);
  }
  
  &--variant-dark {
    background-color: var(--surface-900);
    border-color: var(--surface-700);
    color: var(--surface-50);
  }
  
  &__header {
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-4);
    border-bottom: 1px solid var(--border);
  }
  
  &__title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--foreground);
  }
  
  &__description {
    font-size: var(--text-sm);
    color: var(--surface-600);
    margin-top: var(--spacing-1);
  }
}
```

### Status Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  
  &--status-pending {
    background-color: var(--surface-100);
    color: var(--surface-700);
  }
  
  &--status-running {
    background-color: var(--info-100);
    color: var(--info-700);
  }
  
  &--status-completed {
    background-color: var(--success-100);
    color: var(--success-700);
  }
  
  &--status-failed {
    background-color: var(--error-100);
    color: var(--error-700);
  }
  
  &--status-cancelled {
    background-color: var(--warning-100);
    color: var(--warning-700);
  }
}
```

## Theme Switching

### Client-Side Theme Management

```typescript
import { useTheme } from '../hooks/use-theme';

const { theme, setTheme, availableThemes } = useTheme();

const ThemeSwitcher = () => {
  return (
    <div className="flex gap-2">
      {(['light', 'dark', 'high-contrast'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
            ${theme === t 
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
              : 'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-300'
            }
          `}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
};
```

### Theme Provider

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'high-contrast'].includes(savedTheme)) {
      setTheme(savedTheme as Theme);
    }
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const availableThemes: Theme[] = ['light', 'dark', 'high-contrast'];
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### High Contrast Mode

High contrast mode ensures:

- Minimum contrast ratio of 4.5:1 for normal text
- Minimum contrast ratio of 3:1 for large text (18pt+ or 14pt+ bold)
- Clear focus indicators with visible outlines
- Sufficient color differentiation for status indicators
- High contrast version of all component variants

```css
[data-theme='high-contrast'] {
  /* Override all colors with high contrast variants */
  --primary-500: #0066ff;
  --primary-700: #0044cc;
  --background: #ffffff;
  --foreground: #000000;
  --border: #000000;
  
  /* High contrast status colors */
  --success-500: #008000;
  --error-500: #ff0000;
  --warning-500: #ff8800;
  --info-500: #0066ff;
}
```

## Custom Theme Development

### Theme Customization API

```typescript
interface CustomTheme {
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    border: string;
    [key: string]: string;
  };
  fonts?: {
    sans: string;
    mono: string;
  };
  spacing?: Record<string, string>;
}

class CustomThemeManager {
  static async createCustomTheme(theme: CustomTheme): Promise<void> {
    // Validate theme structure
    // Generate CSS variables
    // Save to user configuration
    // Apply theme immediately
  }
  
  static async updateCustomTheme(name: string, updates: Partial<CustomTheme>): Promise<void> {
    // Merge updates
    // Validate
    // Regenerate styles
  }
  
  static async deleteCustomTheme(name: string): Promise<void> {
    // Remove theme
    // Restore default if active
  }
}
```

### Enterprise Theme Configuration

For enterprise deployments, themes can be managed through:

1. **Admin Portal**: Allow organization admins to define brand themes
2. **Environment Variables**: Configure themes via deployment configuration
3. **Configuration File**: JSON-based theme configuration
4. **Git Repository**: Store theme definitions in version control

```json
{
  "theme": "dark",
  "customThemes": {
    "company-brand": {
      "colors": {
        "primary": "#1e40af",
        "secondary": "#64748b",
        "error": "#dc2626"
      },
      "fonts": {
        "sans": "Roboto, sans-serif"
      }
    }
  },
  "highContrastEnabled": false,
  "automaticThemeSwitch": false
}
```

## Theme Performance Optimization

### Critical CSS

Generate critical CSS for above-the-fold content:

```bash
npx critical @backup-ops/apps/web/index.html --inline './**/*.css' --cdn ''
```

### CSS-in-JS Elimination

Ensure all styles are in CSS files rather than JavaScript objects for better caching.

### Theme Switching Optimization

- Use CSS custom properties for minimal DOM manipulation
- Avoid full page reloads for theme changes
- Implement smooth transitions where appropriate
- Cache rendered themes in memory

## Theme Testing

### Automated Testing

```typescript
import { render } from '@testing-library/react';
import { ThemeProvider } from '../components/theme-provider';
import { Button } from '../components/ui/button';

test('button renders with correct theme styles', () => {
  const { rerender } = render(
    <ThemeProvider>
      <Button>Click me</Button>
    </ThemeProvider>
  );
  
  const button = screen.getByText('Click me');
  expect(button).toHaveClass('bg-primary-500', 'text-surface-50');
  
  // Test theme switching
  rerender(
    <ThemeProvider theme="dark">
      <Button>Click me</Button>
    </ThemeProvider>
  );
  
  expect(button).toHaveClass('bg-primary-500'); // CSS variables handle theme
});
test('high contrast theme applies accessibility features', () => {
  const { rerender } = render(
    <ThemeProvider theme="high-contrast">
      <div data-testid="test-element">Test</div>
    </ThemeProvider>
  );
  
  const element = screen.getByTestId('test-element');
  expect(element).toHaveAttribute('data-theme', 'high-contrast');
  
  // Check high contrast specific styles
  expect(element).toHaveStyle({
    '--primary-500': '#0066ff',
    '--background': '#ffffff',
    '--foreground': '#000000'
  });
});
```

## Theme Migration Guide

### From Previous Theme System

1. **Check Current Theme Configuration**: Look for theme-related files in `config/themes.json`
2. **Migrate Custom Themes**: Convert existing theme definitions to new token system
3. **Update Component Classes**: Replace hardcoded theme classes with CSS variables
4. **Test Theme Switching**: Verify all themes work correctly
5. **Performance Testing**: Ensure theme switching doesn't cause layout shifts

### Migration Steps

```bash
# 1. Backup current themes
cp -r themes/ themes-backup/

# 2. Generate new design tokens
npx @design-system/tokens generate

# 3. Update component styles
find src/components -name "*.css" -exec sed -i 's/theme-[a-z]*/var(--theme-*)/g' {} \;

# 4. Test all themes
npm run test:themes

# 5. Build for production
npm run build
```

## Future Theme Enhancements

1. **Dynamic Theme Generation**: AI-powered theme recommendations
2. **Theme Analytics**: Track theme usage and performance metrics
3. **Theme Templates**: Shareable theme packages for organizations
4. **Real-time Theme Collaboration**: Multiple users co-editing themes
5. **Context-Aware Theming**: Themes that adapt to content type and user preferences

## Conclusion

The theme system provides a robust, flexible foundation for UI consistency across BackupOps. By using CSS custom properties, careful design token management, and accessible defaults, we ensure a professional, maintainable, and user-friendly interface that can be easily customized for different organizations and use cases.