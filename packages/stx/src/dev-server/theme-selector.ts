/**
 * Theme Selector Module
 * Provides UI components for syntax highlighting theme selection
 */

/**
 * Generate theme selector CSS styles
 * Used in markdown preview pages for syntax highlighting theme selection
 */
export function getThemeSelectorStyles(): string {
  return `
    /* Theme selector for code blocks */
    .theme-selector {
      margin: 1rem 0;
      padding: 0.5rem;
      background: #f8f8f8;
      border-radius: 4px;
      text-align: right;
    }
    select {
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      border: 1px solid #ddd;
    }

    /* Dark mode body styles */
    body.dark-mode {
      background-color: #121212;
      color: #e1e4e8;
    }

    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3 {
      color: #e1e4e8;
      border-color: #2f363d;
    }

    body.dark-mode .theme-selector {
      background: #2f363d;
      color: #e1e4e8;
    }

    body.dark-mode select {
      background: #24292e;
      color: #e1e4e8;
      border-color: #444;
    }

    body.dark-mode blockquote {
      background: #24292e;
      color: #e1e4e8;
    }

    body.dark-mode .frontmatter {
      background: #24292e;
    }

    body.dark-mode a {
      color: #58a6ff;
    }`
}

/**
 * Generate theme selector HTML with dropdown
 * @param themeOptions - HTML string of option elements
 */
export function getThemeSelectorHtml(themeOptions: string): string {
  return `
  <div class="theme-selector">
    Theme:
    <select id="themeSelector" onchange="changeTheme()">
      ${themeOptions}
    </select>
  </div>`
}

/**
 * Generate theme change JavaScript
 * Handles toggling dark mode based on theme selection
 */
export function getThemeSelectorScript(): string {
  return `
    function changeTheme() {
      const theme = document.getElementById('themeSelector').value;

      // Toggle dark mode class based on theme
      // Dark themes typically include these keywords in their names
      if (theme.includes('dark') || theme.includes('night') || theme.includes('monokai') ||
          theme.includes('dracula') || theme.includes('nord') || theme.includes('material')) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', changeTheme);`
}

/**
 * Generate frontmatter display HTML
 * @param data - Frontmatter key-value pairs
 */
export function getFrontmatterHtml(data: Record<string, unknown>): string {
  if (Object.keys(data).length === 0) {
    return ''
  }

  return `
  <div class="frontmatter">
    <h3>Frontmatter</h3>
    ${Object.entries(data).map(([key, value]) => `
    <div class="frontmatter-item">
      <span class="frontmatter-label">${key}:</span>
      <span>${Array.isArray(value) ? value.join(', ') : String(value)}</span>
    </div>`).join('')}
  </div>`
}

/**
 * List of dark theme keywords for theme detection
 */
export const DARK_THEME_KEYWORDS = [
  'dark',
  'night',
  'monokai',
  'dracula',
  'nord',
  'material',
  'ayu',
  'one-dark',
  'tokyo',
  'gruvbox',
  'solarized-dark',
] as const

/**
 * Check if a theme name indicates a dark theme
 */
export function isDarkTheme(themeName: string): boolean {
  const lowerName = themeName.toLowerCase()
  return DARK_THEME_KEYWORDS.some(keyword => lowerName.includes(keyword))
}
