/**
 * STX Story - Theme Support
 * Light/dark mode and custom theme configuration
 */

import type { StoryContext } from './types'

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Color scheme */
  colorScheme: 'light' | 'dark' | 'auto'
  /** Primary color */
  primaryColor: string
  /** Background color */
  backgroundColor: string
  /** Text color */
  textColor: string
  /** Border color */
  borderColor: string
  /** Secondary background */
  secondaryBackground: string
  /** Secondary text */
  secondaryText: string
  /** Font family */
  fontFamily: string
  /** Code font family */
  codeFontFamily: string
  /** Border radius */
  borderRadius: string
}

/**
 * Default light theme
 */
export const lightTheme: ThemeConfig = {
  colorScheme: 'light',
  primaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  borderColor: '#e0e0e0',
  secondaryBackground: '#f5f5f5',
  secondaryText: '#666666',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
  borderRadius: '4px',
}

/**
 * Default dark theme
 */
export const darkTheme: ThemeConfig = {
  colorScheme: 'dark',
  primaryColor: '#60a5fa',
  backgroundColor: '#1a1a1a',
  textColor: '#ffffff',
  borderColor: '#404040',
  secondaryBackground: '#2a2a2a',
  secondaryText: '#a0a0a0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  codeFontFamily: '"SF Mono", Monaco, Consolas, monospace',
  borderRadius: '4px',
}

/**
 * Current theme state
 */
let currentTheme: ThemeConfig = lightTheme
let isDarkMode = false

/**
 * Get current theme
 */
export function getCurrentTheme(): ThemeConfig {
  return currentTheme
}

/**
 * Check if dark mode is active
 */
export function isDark(): boolean {
  return isDarkMode
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode(): void {
  isDarkMode = !isDarkMode
  currentTheme = isDarkMode ? darkTheme : lightTheme
}

/**
 * Set theme
 */
export function setTheme(theme: Partial<ThemeConfig>): void {
  currentTheme = { ...currentTheme, ...theme }
}

/**
 * Initialize theme from context
 */
export function initializeTheme(ctx: StoryContext): void {
  const { theme } = ctx.config

  if (theme.defaultColorScheme === 'dark') {
    isDarkMode = true
    currentTheme = darkTheme
  }
  else if (theme.defaultColorScheme === 'auto') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      currentTheme = isDarkMode ? darkTheme : lightTheme
    }
  }
}

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSS(theme: ThemeConfig = currentTheme): string {
  return `
    :root {
      --primary: ${theme.primaryColor};
      --bg: ${theme.backgroundColor};
      --text: ${theme.textColor};
      --border: ${theme.borderColor};
      --bg-secondary: ${theme.secondaryBackground};
      --text-secondary: ${theme.secondaryText};
      --font-family: ${theme.fontFamily};
      --code-font-family: ${theme.codeFontFamily};
      --border-radius: ${theme.borderRadius};
    }
  `
}

/**
 * Generate theme toggle button HTML
 */
export function generateThemeToggle(): string {
  return `
    <button
      class="stx-theme-toggle"
      onclick="window.__stxStory.toggleTheme()"
      title="Toggle dark mode"
    >
      ${isDarkMode ? '☀️' : '🌙'}
    </button>
  `
}

/**
 * Get theme toggle script
 */
export function getThemeToggleScript(): string {
  return `
    window.__stxStory.toggleTheme = function() {
      document.documentElement.classList.toggle('dark');
      const btn = document.querySelector('.stx-theme-toggle');
      if (btn) {
        const isDark = document.documentElement.classList.contains('dark');
        btn.textContent = isDark ? '☀️' : '🌙';
      }
    };

    // Initialize from system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  `
}

/**
 * Export theme tokens to JSON
 */
export function exportThemeTokensJSON(theme: ThemeConfig = currentTheme): string {
  return JSON.stringify({
    colors: {
      primary: theme.primaryColor,
      background: theme.backgroundColor,
      text: theme.textColor,
      border: theme.borderColor,
      secondaryBackground: theme.secondaryBackground,
      secondaryText: theme.secondaryText,
    },
    typography: {
      fontFamily: theme.fontFamily,
      codeFontFamily: theme.codeFontFamily,
    },
    spacing: {
      borderRadius: theme.borderRadius,
    },
  }, null, 2)
}

/**
 * Export theme tokens to CSS custom properties
 */
export function exportThemeTokensCSS(theme: ThemeConfig = currentTheme): string {
  return `/* STX Story Theme Tokens */
:root {
  /* Colors */
  --stx-color-primary: ${theme.primaryColor};
  --stx-color-background: ${theme.backgroundColor};
  --stx-color-text: ${theme.textColor};
  --stx-color-border: ${theme.borderColor};
  --stx-color-background-secondary: ${theme.secondaryBackground};
  --stx-color-text-secondary: ${theme.secondaryText};

  /* Typography */
  --stx-font-family: ${theme.fontFamily};
  --stx-font-family-code: ${theme.codeFontFamily};

  /* Spacing */
  --stx-border-radius: ${theme.borderRadius};
}
`
}

/**
 * Get theme styles
 */
export function getThemeStyles(): string {
  return `
    .stx-theme-toggle {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border);
      border-radius: var(--border-radius);
      background: var(--bg);
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stx-theme-toggle:hover {
      background: var(--bg-secondary);
    }

    /* Dark mode overrides */
    .dark {
      --bg: ${darkTheme.backgroundColor};
      --bg-secondary: ${darkTheme.secondaryBackground};
      --text: ${darkTheme.textColor};
      --text-secondary: ${darkTheme.secondaryText};
      --border: ${darkTheme.borderColor};
      --primary: ${darkTheme.primaryColor};
    }
  `
}
