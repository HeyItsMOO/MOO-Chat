import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── HeyItsMOO brand ──
        pasture: {
          DEFAULT: '#4ade80', // pasture green
          dark: '#22c55e',
          deep: '#16a34a',
          light: '#f0fdf4',
        },
        accent: {
          DEFAULT: '#facc15', // accent yellow
          dark: '#eab308',
        },
        cow: {
          black: '#1a1a1a',
          white: '#ffffff',
        },
        paper: '#f0fdf4',
        // Kept for existing components.
        brand: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#374151',
          mute: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['var(--font-fredoka)', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        moo: '4px 4px 0 #1a1a1a',
        'moo-lg': '8px 8px 0 #1a1a1a',
        'moo-green': '8px 8px 0 #4ade80',
        'moo-yellow': '8px 8px 0 #facc15',
      },
      borderRadius: {
        organic: '255px 15px 225px 15px/15px 225px 15px 255px',
      },
    },
  },
  plugins: [],
} satisfies Config;
