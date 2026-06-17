import type { CrosswindConfig } from '@cwcss/crosswind'

/**
 * Crosswind config for Drivly.
 * Only scans drivly's own files so we don't pick up stx's other examples.
 */
const config: Partial<CrosswindConfig> = {
  content: [
    './pages/**/*.stx',
    './layouts/**/*.stx',
    './components/**/*.stx',
    './partials/**/*.stx',
  ],
  theme: {
    extend: {
      colors: {
        // Drivly brand palette — coral/red primary, violet/emerald accents.
        brand: {
          DEFAULT: '#FF3E54',
          hover: '#e63349',
          soft: 'rgba(255, 62, 84, 0.10)',
          border: 'rgba(255, 62, 84, 0.25)',
        },
        accent: '#10B981',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-lg': '0 24px 48px -12px rgba(0,0,0,0.18)',
      },
    },
  },
}

export default config
