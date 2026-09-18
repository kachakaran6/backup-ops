/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-base)',
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
          elevated: 'var(--surface-elevated)',
          card: 'var(--card)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        foreground: 'var(--text-primary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        
        // Brand Warm Orange Palette
        brand: {
          DEFAULT: 'var(--brand-primary)',
          foreground: 'var(--brand-primary-foreground)',
          hover: 'var(--brand-primary-hover)',
          muted: 'var(--brand-primary-muted)',
          border: 'var(--brand-primary-border)',
        },
        accent: {
          DEFAULT: 'var(--brand-primary)',
          foreground: 'var(--brand-primary-foreground)',
          hover: 'var(--brand-primary-hover)',
          muted: 'var(--brand-primary-muted)',
          strong: 'var(--brand-primary-hover)',
        },

        // Semantic Operational State Colors
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
          muted: 'var(--success-muted)',
          border: 'var(--success-border)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
          muted: 'var(--warning-muted)',
          border: 'var(--warning-border)',
        },
        error: {
          DEFAULT: 'var(--error)',
          foreground: 'var(--error-foreground)',
          muted: 'var(--error-muted)',
          border: 'var(--error-border)',
        },
        destructive: {
          DEFAULT: 'var(--error)',
          foreground: 'var(--error-foreground)',
          muted: 'var(--error-muted)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
          muted: 'var(--info-muted)',
          border: 'var(--info-border)',
        },

        // Sidebar semantic tokens
        sidebar: {
          DEFAULT: 'var(--sidebar-bg)',
          surface: 'var(--sidebar-surface)',
          border: 'var(--sidebar-border)',
          text: 'var(--sidebar-text)',
          muted: 'var(--sidebar-muted)',
          active: 'var(--sidebar-active-bg)',
          'active-text': 'var(--sidebar-active-text)',
        },
      },
      borderRadius: {
        none: '0',
        xs: '2px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        full: '9999px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs: ['11px', '16px'],
        sm: ['12.5px', '18px'],
        base: ['13.5px', '20px'],
        md: ['14.5px', '22px'],
        lg: ['16px', '24px'],
        xl: ['18px', '26px'],
        '2xl': ['22px', '28px'],
        '3xl': ['26px', '32px'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
