# Theme System

A comprehensive theming system for customizing colors, typography, spacing, and component styles across the entire component library.

## Quick Start

```ts
import { createTheme, applyTheme } from '@stacksjs/components'

// Create a custom theme
const myTheme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6'
  }
})

// Apply the theme
applyTheme(myTheme)
```

## Table of Contents

- [Core Concepts](#core-concepts)
- [Theme Structure](#theme-structure)
- [Creating Themes](#creating-themes)
- [Applying Themes](#applying-themes)
- [Using Themes](#using-themes)
- [Theme Presets](#theme-presets)
- [CSS Custom Properties](#css-custom-properties)
- [Advanced Usage](#advanced-usage)

## Core Concepts

The theme system uses CSS custom properties (CSS variables) to provide real-time theming without recompiling styles. All theme values are converted to CSS variables and applied to the `:root` element (or a specific container).

### Benefits

- **No compilation required** - Changes apply immediately
- **Runtime switching** - Switch themes dynamically
- **Scoped themes** - Apply different themes to different sections
- **Type-safe** - Full TypeScript support
- **Extendable** - Easy to add custom properties

## Theme Structure

A complete theme object has the following structure:

```ts
interface Theme {
  colors: ColorPalette
  typography: Typography
  spacing: Spacing
  borderRadius: BorderRadius
  shadows: Shadows
  components?: ComponentOverrides
}
```

### Colors

```ts
colors: {
  primary: '#3b82f6',      // Primary brand color
  secondary: '#8b5cf6',    // Secondary brand color
  success: '#10b981',      // Success states
  warning: '#f59e0b',      // Warning states
  danger: '#ef4444',       // Error/danger states
  info: '#06b6d4',         // Informational states
  gray: '#6b7280',         // Neutral color
  white: '#ffffff',        // White
  black: '#000000',        // Black
}
```

### Typography

```ts
typography: {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    serif: 'Georgia, serif',
    mono: 'Monaco, monospace'
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
}
```

### Spacing

```ts
spacing: {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '6rem'
}
```

### Border Radius

```ts
borderRadius: {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  full: '9999px'
}
```

### Shadows

```ts
shadows: {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  none: 'none'
}
```

### Component Overrides

```ts
components: {
  button: {
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  input: {
    borderRadius: '0.375rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    borderWidth: '1px'
  },
  card: {
    borderRadius: '0.5rem',
    padding: '1.5rem',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  }
}
```

## Creating Themes

### Basic Theme

```ts
import { createTheme } from '@stacksjs/components'

const myTheme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6'
  }
})
```

### Complete Custom Theme

```ts
const customTheme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4'
  },
  typography: {
    fontFamily: {
      sans: 'Inter, sans-serif',
      mono: 'Fira Code, monospace'
    },
    fontSize: {
      base: '1rem',
      lg: '1.25rem'
    }
  },
  spacing: {
    md: '1rem',
    lg: '2rem'
  },
  borderRadius: {
    md: '0.5rem',
    lg: '1rem'
  },
  components: {
    button: {
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem'
    }
  }
})
```

### Brand Theme

```ts
const brandTheme = createTheme({
  colors: {
    primary: '#ff6b6b',      // Your brand color
    secondary: '#4ecdc4',
    success: '#95e1d3',
    danger: '#ff6b6b'
  },
  typography: {
    fontFamily: {
      sans: 'Montserrat, sans-serif'
    },
    fontWeight: {
      normal: '400',
      bold: '700'
    }
  },
  borderRadius: {
    md: '1rem',
    lg: '2rem'
  }
})
```

## Applying Themes

### Apply to Entire Application

```ts
import { applyTheme, createTheme } from '@stacksjs/components'

const theme = createTheme({
  colors: { primary: '#3b82f6' }
})

applyTheme(theme)
```

### Apply to Specific Container

```ts
const container = document.getElementById('my-container')
applyTheme(theme, container)
```

### Dynamic Theme Switching

```ts
const themes = {
  light: createTheme({
    colors: {
      primary: '#3b82f6',
      white: '#ffffff',
      black: '#000000'
    }
  }),
  dark: createTheme({
    colors: {
      primary: '#60a5fa',
      white: '#1f2937',
      black: '#f9fafb'
    }
  })
}

function switchTheme(themeName: 'light' | 'dark') {
  applyTheme(themes[themeName])
}
```

## Using Themes

### In JavaScript/TypeScript

```ts
import { useTheme, getThemeValue } from '@stacksjs/components'

// Get entire theme object
const theme = useTheme()
console.log(theme.colors.primary)

// Get specific value by path
const primaryColor = getThemeValue('colors.primary')
const baseFontSize = getThemeValue('typography.fontSize.base')
```

### In CSS

After applying a theme, use CSS custom properties:

```css
.my-component {
  color: var(--color-primary);
  font-family: var(--font-sans);
  font-size: var(--text-base);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.my-button {
  border-radius: var(--button-border-radius);
  padding: var(--button-padding);
  font-size: var(--button-font-size);
}
```

### In Inline Styles

```html
<div style="color: var(--color-primary); padding: var(--spacing-lg)">
  Themed content
</div>
```

## Theme Presets

The library includes several predefined theme presets:

### Default (Blue)

```ts
import { themePresets, applyTheme } from '@stacksjs/components'

applyTheme(themePresets.default)
```

### Purple

```ts
applyTheme(themePresets.purple)
```

### Green

```ts
applyTheme(themePresets.green)
```

### Orange

```ts
applyTheme(themePresets.orange)
```

### Dark

```ts
applyTheme(themePresets.dark)
```

### Minimal

Reduced shadows and border radius for a cleaner look:

```ts
applyTheme(themePresets.minimal)
```

## CSS Custom Properties

All theme values are exposed as CSS custom properties:

### Color Variables

```css
--color-primary
--color-secondary
--color-success
--color-warning
--color-danger
--color-info
--color-gray
--color-white
--color-black
```

### Typography Variables

```css
--font-sans
--font-serif
--font-mono
--text-xs
--text-sm
--text-base
--text-lg
--text-xl
--text-2xl
--text-3xl
--text-4xl
--font-weight-light
--font-weight-normal
--font-weight-medium
--font-weight-semibold
--font-weight-bold
--leading-tight
--leading-normal
--leading-relaxed
```

### Spacing Variables

```css
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--spacing-xl
--spacing-2xl
--spacing-3xl
--spacing-4xl
```

### Border Radius Variables

```css
--radius-none
--radius-sm
--radius-md
--radius-lg
--radius-full
```

### Shadow Variables

```css
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
--shadow-2xl
--shadow-none
```

### Component Variables

```css
--button-border-radius
--button-padding
--button-font-size
--button-font-weight

--input-border-radius
--input-padding
--input-font-size
--input-border-width

--card-border-radius
--card-padding
--card-shadow
```

## Advanced Usage

### Generate CSS File

```ts
import { generateThemeCSS, createTheme } from '@stacksjs/components'

const theme = createTheme({
  colors: { primary: '#3b82f6' }
})

const cssContent = generateThemeCSS(theme)
// Write to file or inject into page
```

### Extend Existing Theme

```ts
import { getTheme, createTheme } from '@stacksjs/components'

const currentTheme = getTheme()
const extendedTheme = createTheme({
  ...currentTheme,
  colors: {
    ...currentTheme.colors,
    primary: '#ff6b6b'  // Override just primary color
  }
})
```

### Theme with CSS-in-JS

```ts
import { useTheme } from '@stacksjs/components'

function MyComponent() {
  const theme = useTheme()

  const styles = {
    container: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md
    }
  }

  return <div style={styles.container}>Themed content</div>
}
```

### Scoped Theme Sections

```ts
const headerTheme = createTheme({
  colors: { primary: '#3b82f6' }
})

const footerTheme = createTheme({
  colors: { primary: '#8b5cf6' }
})

applyTheme(headerTheme, document.getElementById('header'))
applyTheme(footerTheme, document.getElementById('footer'))
```

### Responsive Themes

```ts
function applyResponsiveTheme() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches

  const theme = createTheme({
    typography: {
      fontSize: {
        base: isMobile ? '0.875rem' : '1rem',
        lg: isMobile ? '1rem' : '1.125rem'
      }
    },
    spacing: {
      md: isMobile ? '0.75rem' : '1rem',
      lg: isMobile ? '1rem' : '1.5rem'
    }
  })

  applyTheme(theme)
}

window.addEventListener('resize', applyResponsiveTheme)
```

### Theme Persistence

```ts
import { createTheme, applyTheme } from '@stacksjs/components'

function saveTheme(theme: Theme) {
  localStorage.setItem('app-theme', JSON.stringify(theme))
}

function loadTheme(): Theme | null {
  const saved = localStorage.getItem('app-theme')
  return saved ? JSON.parse(saved) : null
}

// On app init
const savedTheme = loadTheme()
if (savedTheme) {
  applyTheme(savedTheme)
}

// When user changes theme
const newTheme = createTheme({ colors: { primary: '#3b82f6' } })
applyTheme(newTheme)
saveTheme(newTheme)
```

## Examples

### E-commerce Theme

```ts
const ecommerceTheme = createTheme({
  colors: {
    primary: '#f97316',      // Orange for CTAs
    secondary: '#0ea5e9',    // Blue for links
    success: '#10b981',      // Green for success
    danger: '#ef4444'        // Red for errors
  },
  typography: {
    fontFamily: {
      sans: 'Poppins, sans-serif'
    }
  },
  borderRadius: {
    md: '0.5rem',
    lg: '1rem'
  },
  components: {
    button: {
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: '600'
    }
  }
})
```

### SaaS Dashboard Theme

```ts
const dashboardTheme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    gray: '#6b7280'
  },
  typography: {
    fontFamily: {
      sans: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace'
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '0.875rem'  // Smaller base for dashboards
    }
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem'
  },
  shadows: {
    md: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
})
```

### Marketing Site Theme

```ts
const marketingTheme = createTheme({
  colors: {
    primary: '#8b5cf6',
    secondary: '#ec4899'
  },
  typography: {
    fontFamily: {
      sans: 'Montserrat, sans-serif',
      serif: 'Playfair Display, serif'
    },
    fontSize: {
      '2xl': '2rem',
      '3xl': '2.5rem',
      '4xl': '3.5rem'
    }
  },
  borderRadius: {
    lg: '1rem',
    full: '9999px'
  },
  shadows: {
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  }
})
```

## Best Practices

1. **Start with presets** - Use theme presets as a starting point
2. **Override selectively** - Only customize what you need
3. **Use semantic colors** - Stick to primary, secondary, success, etc.
4. **Maintain contrast** - Ensure text is readable on backgrounds
5. **Test responsiveness** - Check themes on different screen sizes
6. **Document custom themes** - Keep track of your theme decisions
7. **Use CSS variables** - Leverage the generated CSS custom properties
8. **Type safety** - Use TypeScript for theme definitions
