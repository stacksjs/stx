import type { HeadwindConfig } from '@stacksjs/headwind'

export default {
  // Scan for classes in these files
  content: [
    './src/**/*.{stx,ts,js}',
    './examples/**/*.{stx,ts,js}',
  ],

  // Theme configuration
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Courier New', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
      },
    },
  },

  // Dark mode configuration
  darkMode: 'class',

  // Preflight (CSS reset)
  preflight: true,

  // Variants
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['active', 'disabled'],
      textColor: ['active', 'disabled'],
    },
  },
} satisfies HeadwindConfig
