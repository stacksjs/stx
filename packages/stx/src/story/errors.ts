/**
 * STX Story - Error Handling
 * Graceful error display and recovery suggestions
 */

/**
 * Story error types
 */
export type StoryErrorType =
  | 'parse_error'
  | 'component_error'
  | 'render_error'
  | 'config_error'
  | 'file_not_found'
  | 'circular_dependency'
  | 'prop_type_error'
  | 'unknown'

/**
 * Story error
 */
export interface StoryError {
  /** Error type */
  type: StoryErrorType
  /** Error message */
  message: string
  /** File path (if applicable) */
  file?: string
  /** Line number (if applicable) */
  line?: number
  /** Column number (if applicable) */
  column?: number
  /** Stack trace */
  stack?: string
  /** Recovery suggestions */
  suggestions?: string[]
}

/**
 * Create a story error
 */
export function createStoryError(
  type: StoryErrorType,
  message: string,
  details?: Partial<StoryError>,
): StoryError {
  const suggestions = getRecoverySuggestions(type, message)

  return {
    type,
    message,
    suggestions,
    ...details,
  }
}

/**
 * Get recovery suggestions for an error type
 */
function getRecoverySuggestions(type: StoryErrorType, message: string): string[] {
  const suggestions: string[] = []

  switch (type) {
    case 'parse_error':
      suggestions.push('Check for syntax errors in your .story.stx file')
      suggestions.push('Ensure all tags are properly closed')
      suggestions.push('Verify that <Story> and <Variant> components are used correctly')
      break

    case 'component_error':
      suggestions.push('Check that the component file exists')
      suggestions.push('Verify the import path is correct')
      suggestions.push('Ensure all required props are provided')
      break

    case 'render_error':
      suggestions.push('Check the browser console for more details')
      suggestions.push('Verify that all dependencies are available')
      suggestions.push('Try simplifying the component to isolate the issue')
      break

    case 'config_error':
      suggestions.push('Check your stx.config.ts file for syntax errors')
      suggestions.push('Verify that all required config options are set')
      suggestions.push('Try using the default configuration')
      break

    case 'file_not_found':
      suggestions.push('Check that the file path is correct')
      suggestions.push('Verify the file exists in the specified location')
      suggestions.push('Check for case sensitivity in the file path')
      break

    case 'circular_dependency':
      suggestions.push('Review your component imports for circular references')
      suggestions.push('Consider restructuring your components')
      suggestions.push('Use lazy loading for problematic dependencies')
      break

    case 'prop_type_error':
      suggestions.push('Check that the prop value matches the expected type')
      suggestions.push('Review the component\'s prop definitions')
      if (message.includes('required')) {
        suggestions.push('Ensure all required props are provided')
      }
      break

    default:
      suggestions.push('Check the console for more details')
      suggestions.push('Try restarting the story server')
      suggestions.push('Report this issue if it persists')
  }

  return suggestions
}

/**
 * Format error for display
 */
export function formatError(error: StoryError): string {
  const lines: string[] = []

  // Header
  lines.push(`❌ ${getErrorTitle(error.type)}`)
  lines.push('')

  // Message
  lines.push(error.message)
  lines.push('')

  // Location
  if (error.file) {
    let location = `📁 ${error.file}`
    if (error.line) {
      location += `:${error.line}`
      if (error.column) {
        location += `:${error.column}`
      }
    }
    lines.push(location)
    lines.push('')
  }

  // Suggestions
  if (error.suggestions && error.suggestions.length > 0) {
    lines.push('💡 Suggestions:')
    for (const suggestion of error.suggestions) {
      lines.push(`   • ${suggestion}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Get error title
 */
function getErrorTitle(type: StoryErrorType): string {
  const titles: Record<StoryErrorType, string> = {
    parse_error: 'Parse Error',
    component_error: 'Component Error',
    render_error: 'Render Error',
    config_error: 'Configuration Error',
    file_not_found: 'File Not Found',
    circular_dependency: 'Circular Dependency',
    prop_type_error: 'Prop Type Error',
    unknown: 'Unknown Error',
  }
  return titles[type]
}

/**
 * Generate error display HTML
 */
export function generateErrorHTML(error: StoryError): string {
  const suggestionsHtml = error.suggestions
    ? error.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')
    : ''

  return `
    <div class="stx-error">
      <div class="stx-error-header">
        <span class="stx-error-icon">❌</span>
        <span class="stx-error-title">${getErrorTitle(error.type)}</span>
      </div>
      <div class="stx-error-message">${escapeHtml(error.message)}</div>
      ${error.file ? `
        <div class="stx-error-location">
          📁 ${escapeHtml(error.file)}${error.line ? `:${error.line}` : ''}${error.column ? `:${error.column}` : ''}
        </div>
      ` : ''}
      ${suggestionsHtml ? `
        <div class="stx-error-suggestions">
          <div class="stx-error-suggestions-title">💡 Suggestions:</div>
          <ul>${suggestionsHtml}</ul>
        </div>
      ` : ''}
      <div class="stx-error-actions">
        <button onclick="window.__stxStory.dismissError()">Dismiss</button>
        <button onclick="window.__stxStory.retryRender()">Retry</button>
      </div>
    </div>
  `
}

/**
 * Get error styles
 */
export function getErrorStyles(): string {
  return `
    .stx-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      margin: 16px;
      font-family: var(--font-family);
    }
    .dark .stx-error {
      background: #450a0a;
      border-color: #7f1d1d;
    }
    .stx-error-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .stx-error-icon {
      font-size: 20px;
    }
    .stx-error-title {
      font-weight: 600;
      font-size: 16px;
      color: #dc2626;
    }
    .dark .stx-error-title {
      color: #f87171;
    }
    .stx-error-message {
      color: #991b1b;
      margin-bottom: 12px;
      font-family: var(--code-font-family);
      font-size: 13px;
      white-space: pre-wrap;
    }
    .dark .stx-error-message {
      color: #fca5a5;
    }
    .stx-error-location {
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 12px;
    }
    .stx-error-suggestions {
      margin-bottom: 12px;
    }
    .stx-error-suggestions-title {
      font-weight: 500;
      margin-bottom: 8px;
      color: #374151;
    }
    .dark .stx-error-suggestions-title {
      color: #d1d5db;
    }
    .stx-error-suggestions ul {
      margin: 0;
      padding-left: 20px;
      color: #4b5563;
      font-size: 13px;
    }
    .dark .stx-error-suggestions ul {
      color: #9ca3af;
    }
    .stx-error-suggestions li {
      margin-bottom: 4px;
    }
    .stx-error-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .stx-error-actions button {
      padding: 8px 16px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      color: #374151;
      cursor: pointer;
      font-size: 13px;
    }
    .stx-error-actions button:hover {
      background: #f3f4f6;
    }
    .dark .stx-error-actions button {
      background: #374151;
      border-color: #4b5563;
      color: #f3f4f6;
    }
    .dark .stx-error-actions button:hover {
      background: #4b5563;
    }
  `
}

/**
 * Create error boundary wrapper
 */
export function createErrorBoundary(content: string, componentName: string): string {
  return `
    <div class="stx-error-boundary" data-component="${escapeHtml(componentName)}">
      ${content}
    </div>
    <script>
      (function() {
        const boundary = document.currentScript.previousElementSibling;
        window.addEventListener('error', function(e) {
          if (boundary.contains(e.target)) {
            boundary.innerHTML = window.__stxStory.renderError({
              type: 'render_error',
              message: e.message,
              file: '${escapeHtml(componentName)}'
            });
          }
        });
      })();
    </script>
  `
}

/**
 * Escape HTML
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
