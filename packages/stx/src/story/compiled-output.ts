/**
 * STX Story - Compiled Output
 * Show compiled HTML output for components
 */

import type { ServerStoryFile, StoryContext } from './types'

/**
 * Compiled output options
 */
export interface CompiledOutputOptions {
  /** Include styles */
  includeStyles?: boolean
  /** Include scripts */
  includeScripts?: boolean
  /** Minify output */
  minify?: boolean
  /** Format output */
  format?: boolean
}

/**
 * Get compiled HTML output for a story variant
 */
export async function getCompiledOutput(
  ctx: StoryContext,
  story: ServerStoryFile,
  variantId: string,
  options: CompiledOutputOptions = {},
): Promise<string> {
  const variant = story.story?.variants.find(v => v.id === variantId)
  if (!variant)
    return '<!-- Variant not found -->'

  let html = variant.source || ''

  // In a real implementation, this would:
  // 1. Process the STX template
  // 2. Resolve all directives (@if, @foreach, etc.)
  // 3. Compile to final HTML

  // For now, we'll do basic processing
  html = processDirectives(html)
  html = processInterpolation(html, variant.state || {})

  if (options.format) {
    html = formatHTML(html)
  }

  if (options.minify) {
    html = minifyHTML(html)
  }

  return html
}

/**
 * Process STX directives (basic implementation)
 */
function processDirectives(html: string): string {
  let result = html

  // Remove directive tags for display
  // @if/@endif
  result = result.replace(/@if\s*\([^)]+\)/g, '<!-- @if -->')
  result = result.replace(/@endif/g, '<!-- @endif -->')

  // @foreach/@endforeach
  result = result.replace(/@foreach\s*\([^)]+\)/g, '<!-- @foreach -->')
  result = result.replace(/@endforeach/g, '<!-- @endforeach -->')

  // @unless/@endunless
  result = result.replace(/@unless\s*\([^)]+\)/g, '<!-- @unless -->')
  result = result.replace(/@endunless/g, '<!-- @endunless -->')

  // @component/@endcomponent
  result = result.replace(/@component\s*\([^)]+\)/g, '<!-- @component -->')
  result = result.replace(/@endcomponent/g, '<!-- @endcomponent -->')

  return result
}

/**
 * Process interpolation {{ }} (basic implementation)
 */
function processInterpolation(html: string, state: Record<string, any>): string {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (key in state) {
      const value = state[key]
      if (typeof value === 'string')
        return escapeHtml(value)
      if (typeof value === 'number' || typeof value === 'boolean')
        return String(value)
      return JSON.stringify(value)
    }
    return `{{ ${key} }}`
  })
}

/**
 * Format HTML with indentation
 */
function formatHTML(html: string): string {
  let result = ''
  let indent = 0
  const lines = html.split(/>\s*</).map((line, i, arr) => {
    let result = line
    if (i > 0)
      result = `<${result}`
    if (i < arr.length - 1)
      result = `${result}>`
    return result
  })

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed)
      continue

    // Decrease indent for closing tags
    if (trimmed.startsWith('</') || trimmed.startsWith('-->')) {
      indent = Math.max(0, indent - 1)
    }

    result += `${'  '.repeat(indent)}${trimmed}\n`

    // Increase indent for opening tags (not self-closing)
    if (
      trimmed.startsWith('<')
      && !trimmed.startsWith('</')
      && !trimmed.startsWith('<!')
      && !trimmed.endsWith('/>')
      && !trimmed.includes('</') // Not inline closing
    ) {
      indent++
    }
  }

  return result.trim()
}

/**
 * Minify HTML
 */
function minifyHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim()
}

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Generate compiled output panel HTML
 */
export function generateCompiledOutputPanel(compiledHtml: string): string {
  return `
    <div class="stx-compiled-output">
      <div class="stx-compiled-header">
        <span>Compiled HTML</span>
        <div class="stx-compiled-actions">
          <button onclick="window.__stxStory.copyCompiledOutput()" title="Copy">📋</button>
          <button onclick="window.__stxStory.toggleMinify()" title="Toggle minify">🗜️</button>
        </div>
      </div>
      <pre class="stx-compiled-code"><code>${escapeHtml(compiledHtml)}</code></pre>
    </div>
  `
}

/**
 * Get compiled output styles
 */
export function getCompiledOutputStyles(): string {
  return `
    .stx-compiled-output {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .stx-compiled-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      font-weight: 500;
    }
    .stx-compiled-actions {
      display: flex;
      gap: 4px;
    }
    .stx-compiled-actions button {
      padding: 4px 8px;
      border: 1px solid var(--border);
      border-radius: 4px;
      background: var(--bg);
      cursor: pointer;
    }
    .stx-compiled-actions button:hover {
      background: var(--bg-secondary);
    }
    .stx-compiled-code {
      flex: 1;
      margin: 0;
      padding: 12px;
      overflow: auto;
      font-family: var(--code-font-family);
      font-size: 12px;
      line-height: 1.5;
      background: var(--bg);
      white-space: pre-wrap;
      word-break: break-word;
    }
    .stx-compiled-code code {
      font-family: inherit;
    }
  `
}

/**
 * Get compiled output toggle script
 */
export function getCompiledOutputScript(): string {
  return `
    window.__stxStory = window.__stxStory || {};

    window.__stxStory.showCompiledOutput = false;

    window.__stxStory.toggleCompiledOutput = function() {
      this.showCompiledOutput = !this.showCompiledOutput;
      const panel = document.querySelector('.stx-compiled-output');
      if (panel) {
        panel.style.display = this.showCompiledOutput ? 'flex' : 'none';
      }
    };

    window.__stxStory.copyCompiledOutput = function() {
      const code = document.querySelector('.stx-compiled-code code');
      if (code) {
        navigator.clipboard.writeText(code.textContent || '');
      }
    };
  `
}
