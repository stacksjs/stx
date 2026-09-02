/**
 * Script validation module for STX templates.
 *
 * Validates client-side script content against prohibited DOM API patterns,
 * enforcing the use of STX composables and Vue-style alternatives instead
 * of raw browser APIs.
 */
import { contentKey, renderMemo } from './render-memo'
import { stripCommentsAndLiterals } from './strip-literals'
import type { StrictModeConfig } from './types'

/**
 * Verdicts by script, file and rules: the message that was reported, or '' for
 * a clean script. Under failOnViolation a remembered violation is thrown again
 * on every render — that render fails — but it is warned about once.
 */
const verdicts = renderMemo<string>(256)

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
    pattern: /(?:\bwindow\.)?localStorage(?![A-Za-z])/g,
    message: 'window.localStorage is prohibited',
    // The pre-paint case is named because it is the one place the composable
    // cannot be the answer: a script that must run before first paint runs
    // before the signals runtime exists, so useLocalStorage() is not defined
    // yet. Advice that cannot be taken reads as the rule not understanding the
    // code (#1836) — and a theme bootstrap is the overwhelmingly common reason
    // to reach for localStorage in a bare <script>, which @appearanceBootstrap
    // already does properly.
    suggestion: 'Use useLocalStorage() from composables — or @appearanceBootstrap if this must run before first paint, where the runtime does not exist yet',
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
  /**
   * The view this script was authored in, when `filePath` is a layout that view
   * was composed into. Reported alongside, because naming only the layout sends
   * the reader to a file that does not contain the offending code (#1836).
   */
  originFilePath?: string,
): void {
  const strictConfig = typeof strict === 'boolean'
    ? { enabled: strict, failOnViolation: strict }
    : (strict ?? { enabled: false })

  // Nothing below can be observed with strict mode off: the scan only ever fed
  // a warning or a throw, and both sit behind this flag. It ran anyway, on
  // every client script of every render (#1945).
  if (!strictConfig.enabled)
    return

  // Same script, same file, same rules: same verdict. Each rule makes its own
  // pass over the script, and a warning repeated on every render of an
  // unchanged view is not more information than the first one.
  const memoKey = contentKey(content, filePath, originFilePath, JSON.stringify(strictConfig))
  const remembered = verdicts.get(memoKey)
  if (remembered !== undefined) {
    if (remembered && strictConfig.failOnViolation)
      throw new Error(remembered)
    return
  }

  const allowPatterns = strictConfig.allowPatterns ?? []
  const errors: string[] = []

  /*
   * Scanned with comments and string literals blanked (stacksjs/stx#1911).
   *
   * A prohibited API NAMED in a comment is not a use of it. Measured on a real
   * app with strict mode on: 11 violations reported, 9 of them pointing at a
   * comment. And every one of those comments documented that the file uses the
   * stx primitive INSTEAD — they exist because someone did the migration and
   * explained it. So the rule fired hardest on the code that had already
   * complied, and `failOnViolation` could not be turned on at all.
   *
   * Positions are preserved, so the line numbers and the quoted line below
   * still come from the real source. `{{-- … --}}` is blanked too: an stx
   * template comment is equally prose, and was equally matched.
   */
  const scannable = stripCommentsAndLiterals(
    content.replace(/\{\{--[\s\S]*?--\}\}/g, match => match.replace(/[^\n]/g, ' ')),
  )

  for (const { pattern, message, suggestion } of PROHIBITED_DOM_PATTERNS) {
    // Skip patterns that are explicitly allowed.
    //
    // Matched against the human MESSAGE only. It used to also test the regex
    // SOURCE, which fails open and catastrophically so: `allowPatterns: ['(']`
    // disabled almost every rule, because '(' is a substring of nearly every
    // regex source (#1792 P3). Nobody writes that deliberately — but a value
    // like `['\\.']` or `['\\s']`, which reads as escaping something in a
    // filename, silently disables the validator wholesale.
    //
    // Matching the message keeps the documented ergonomic (`['querySelector']`
    // allows the querySelector rule) while making the effect knowable from the
    // rule list rather than from the regexes. An entry with no word character
    // is rejected outright: it can only be punctuation, which names no rule and
    // can only ever disable rules by accident.
    if (allowPatterns.some(allowed => /\w/.test(allowed) && message.includes(allowed))) {
      continue
    }

    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
    const matches = scannable.match(pattern)

    if (matches && matches.length > 0) {
      // Line numbers come from the blanked copy, which is line-for-line with
      // the source.
      const lines = scannable.split('\n')
      // The QUOTE comes from the source. Taking it from the blanked copy prints
      // `document.querySelector(      )` with the string literal replaced by
      // spaces, which defeats the point of quoting it: #1836 added this so the
      // line is findable by search rather than by counting. Its test caught it.
      const sourceLines = content.split('\n')
      const lineNumbers: number[] = []

      lines.forEach((line, index) => {
        pattern.lastIndex = 0
        if (pattern.test(line)) {
          lineNumbers.push(index + 1)
        }
      })

      // Line numbers are relative to the <script> BODY, not to any file: the
      // content handed here has already been extracted from a template that may
      // itself be a composition of a view and a layout. Reporting a bare
      // `line: 8` invited reading it as a file line, and it indexed neither
      // file (#1836). Say what it counts, and quote the line so the reader can
      // find it by searching rather than by counting.
      const locationInfo = lineNumbers.length > 0
        ? ` (script line${lineNumbers.length > 1 ? 's' : ''} ${lineNumbers.join(', ')})`
        : ''

      const quoted = lineNumbers
        .slice(0, 3)
        .map(n => `        ${n} | ${(sourceLines[n - 1] ?? '').trim().slice(0, 100)}`)
        .join('\n')
      const snippet = quoted ? `\n${quoted}` : ''

      errors.push(`  ✗ ${message}${locationInfo}\n    → ${suggestion}${snippet}`)
    }
  }

  if (errors.length === 0) {
    verdicts.set(memoKey, '')
    return
  }

  // Report a path the reader can act on, not a bare basename. `default.stx`
  // matched nine files in the project that surfaced this, and none of them
  // contained the offending code — the script was authored in a view and
  // `filePath` was the layout that view is composed into (#1836).
  const rel = (p: string): string => {
    const cwd = `${process.cwd()}/`
    return p.startsWith(cwd) ? p.slice(cwd.length) : p
  }
  const where = originFilePath && originFilePath !== filePath
    ? `${rel(originFilePath)} (composed into ${rel(filePath)})`
    : rel(filePath)
  const baseMessage = `[STX] DOM API violation in ${where}:\n${errors.join('\n')}\n  Tip: prefer useRef(), navigate(), and composables for component code`
  verdicts.set(memoKey, baseMessage)

  if (strictConfig.failOnViolation) {
    throw new Error(baseMessage)
  }
  else {
    console.warn(baseMessage)
  }
}
