// Headwind configuration
// Using a more flexible type since HeadwindConfig expects full Theme and VariantConfig

const headwindConfig = {
  // Scan for classes in these files
  content: [
    './src/**/*.{stx,ts,js}',
    './examples/**/*.{stx,ts,js}',
  ] as const,

  // Theme configuration (partial theme with custom values)
  theme: {
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
      sans: ['Inter', 'system-ui', 'sans-serif'] as const,
      mono: ['Fira Code', 'Monaco', 'Courier New', 'monospace'] as const,
    },
    spacing: {
      18: '4.5rem',
      88: '22rem',
      100: '25rem',
    },
  },

  // Dark mode configuration
  darkMode: 'class' as const,

  // Preflight (CSS reset)
  preflight: true,
}

export default headwindConfig
