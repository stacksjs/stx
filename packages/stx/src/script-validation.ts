/**
 * Script validation module for STX templates.
 *
 * Validates client-side script content against prohibited DOM API patterns,
 * enforcing the use of STX composables and Vue-style alternatives instead
 * of raw browser APIs.
 */
import type { StrictModeConfig } from './types'

/**
 * Prohibited DOM API patterns in client scripts.
 * STX provides Vue-style alternatives via the STX global object.
 */
export const PROHIBITED_DOM_PATTERNS: Array<{
  pattern: RegExp
  message: string
  suggestion: string
}> = [
  // document.* patterns
  {
    pattern: /document\.getElementById\s*\(/g,
    message: 'document.getElementById() is prohibited',
    suggestion: 'Use useRef("name") instead',
  },
  {
    pattern: /document\.querySelector\s*\(/g,
    message: 'document.querySelector() is prohibited',
    suggestion: 'Use useRef("name") instead',
  },
  {
    pattern: /document\.querySelectorAll\s*\(/g,
    message: 'document.querySelectorAll() is prohibited',
    suggestion: 'Use useRef("name") and access children instead',
  },
  {
    pattern: /document\.getElementsBy\w+\s*\(/g,
    message: 'document.getElementsBy*() is prohibited',
    suggestion: 'Use useRef("name") instead',
  },
  {
    pattern: /document\.createElement\s*\(/g,
    message: 'document.createElement() is prohibited',
    suggestion: 'Use template directives or component composition instead',
  },
  {
    pattern: /document\.activeElement(?![A-Za-z])/g,
    message: 'document.activeElement is prohibited',
    suggestion: 'Use useRef() to track focused elements',
  },
  {
    pattern: /document\.title\s*=/g,
    message: 'document.title assignment is prohibited',
    suggestion: 'Use useTitle() from composables',
  },
  {
    pattern: /document\.cookie(?![A-Za-z])/g,
    message: 'document.cookie is prohibited',
    suggestion: 'Use useCookie() from composables',
  },
  {
    pattern: /document\.addEventListener\s*\(/g,
    message: 'document.addEventListener() is prohibited',
    suggestion: 'Use useEventListener() or template @event directives',
  },
  // window.* patterns
  {
    pattern: /window\.location(?![A-Za-z])/g,
    message: 'window.location is prohibited',
    suggestion: 'Use navigate() or useRoute()',
  },
  {
    pattern: /window\.history(?![A-Za-z])/g,
    message: 'window.history is prohibited',
    suggestion: 'Use navigate(), goBack(), goForward()',
  },
  {
    pattern: /window\.addEventListener\s*\(/g,
    message: 'window.addEventListener() is prohibited',
    suggestion: 'Use useEventListener() or @click directives',
  },
  {
    pattern: /window\.localStorage(?![A-Za-z])/g,
    message: 'window.localStorage is prohibited',
    suggestion: 'Use useLocalStorage() from composables',
  },
  {
    pattern: /window\.sessionStorage(?![A-Za-z])/g,
    message: 'window.sessionStorage is prohibited',
    suggestion: 'Use useSessionStorage() from composables',
  },
  {
    pattern: /window\.scrollTo\s*\(/g,
    message: 'window.scrollTo() is prohibited',
    suggestion: 'Use useScroll().scrollTo() from composables',
  },
  {
    pattern: /window\.alert\s*\(/g,
    message: 'window.alert() is prohibited',
    suggestion: 'Use stx modal/dialog APIs instead',
  },
  {
    pattern: /window\.confirm\s*\(/g,
    message: 'window.confirm() is prohibited',
    suggestion: 'Use stx modal/dialog APIs instead',
  },
  {
    pattern: /window\.prompt\s*\(/g,
    message: 'window.prompt() is prohibited',
    suggestion: 'Use stx modal/dialog APIs instead',
  },
  // Timer patterns
  {
    pattern: /(?<!\w)setTimeout\s*\(/g,
    message: 'setTimeout() is prohibited',
    suggestion: 'Use useTimeout() or useDebounce() from composables',
  },
  {
    pattern: /(?<!\w)setInterval\s*\(/g,
    message: 'setInterval() is prohibited',
    suggestion: 'Use useInterval() from composables',
  },
  {
    pattern: /(?<!\w)clearTimeout\s*\(/g,
    message: 'clearTimeout() is prohibited',
    suggestion: 'Use useTimeout().stop() or useDebounce().cancel()',
  },
  {
    pattern: /(?<!\w)clearInterval\s*\(/g,
    message: 'clearInterval() is prohibited',
    suggestion: 'Use useInterval().pause()',
  },
  // Bare location patterns
  {
    pattern: /(?<!\w)location\.href\s*=/g,
    message: 'location.href assignment is prohibited',
    suggestion: 'Use navigate() instead',
  },
  {
    pattern: /(?<!\w)location\.assign\s*\(/g,
    message: 'location.assign() is prohibited',
    suggestion: 'Use navigate() instead',
  },
  {
    pattern: /(?<!\w)location\.replace\s*\(/g,
    message: 'location.replace() is prohibited',
    suggestion: 'Use navigate() instead',
  },
]

/**
 * Validate client script content for prohibited DOM API patterns.
 * When strict mode is enabled with `failOnViolation`, throws an error.
 * Otherwise, emits warnings.
 *
 * @param content - The script content to validate
 * @param filePath - The file path for error reporting
 * @param strict - Strict mode configuration
 */
export function validateClientScript(
  content: string,
  filePath: string,
  strict?: boolean | StrictModeConfig,
): void {
  const strictConfig = typeof strict === 'boolean'
    ? { enabled: strict, failOnViolation: strict }
    : (strict ?? { enabled: false })

  const allowPatterns = strictConfig.allowPatterns ?? []
  const errors: string[] = []

  for (const { pattern, message, suggestion } of PROHIBITED_DOM_PATTERNS) {
    // Skip patterns that are explicitly allowed
    if (allowPatterns.some(allowed => message.includes(allowed) || pattern.source.includes(allowed))) {
      continue
    }

    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
    const matches = content.match(pattern)

    if (matches && matches.length > 0) {
      // Find line numbers for better error messages
      const lines = content.split('\n')
      const lineNumbers: number[] = []

      lines.forEach((line, index) => {
        pattern.lastIndex = 0
        if (pattern.test(line)) {
          lineNumbers.push(index + 1)
        }
      })

      const locationInfo = lineNumbers.length > 0
        ? ` (line${lineNumbers.length > 1 ? 's' : ''}: ${lineNumbers.join(', ')})`
        : ''

      errors.push(`  ✗ ${message}${locationInfo}\n    → ${suggestion}`)
    }
  }

  if (errors.length > 0 && strictConfig.enabled) {
    const fileName = filePath.split('/').pop() || filePath
    const baseMessage = `[STX] DOM API violation in ${fileName}:\n${errors.join('\n')}\n  Tip: prefer useRef(), navigate(), and composables for component code`

    if (strictConfig.failOnViolation) {
      throw new Error(baseMessage)
    }
    else {
      console.warn(baseMessage)
    }
  }
}
