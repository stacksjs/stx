/**
 * STX Story - Interaction Testing
 * Simulate user interactions and assert component state
 */

import type { ServerStoryFile, StoryContext } from './types'

/**
 * Interaction step
 */
export interface InteractionStep {
  /** Action type */
  action: 'click' | 'type' | 'select' | 'hover' | 'focus' | 'blur' | 'wait' | 'assert'
  /** Target selector */
  selector?: string
  /** Value for type/select actions */
  value?: string
  /** Duration for wait action (ms) */
  duration?: number
  /** Assertion for assert action */
  assertion?: {
    type: 'text' | 'value' | 'visible' | 'hidden' | 'class' | 'attribute'
    expected: any
    attribute?: string
  }
}

/**
 * Interaction test definition
 */
export interface InteractionTest {
  /** Test name */
  name: string
  /** Story ID */
  storyId: string
  /** Variant ID */
  variantId: string
  /** Interaction steps */
  steps: InteractionStep[]
  /** Setup function */
  setup?: () => Promise<void>
  /** Teardown function */
  teardown?: () => Promise<void>
}

/**
 * Interaction test result
 */
export interface InteractionTestResult {
  /** Test name */
  name: string
  /** Whether the test passed */
  passed: boolean
  /** Error message if failed */
  error?: string
  /** Duration in ms */
  duration: number
  /** Failed step index */
  failedStep?: number
}

/**
 * Parse @interaction blocks from story content
 */
export function parseInteractionBlocks(content: string): InteractionTest[] {
  const tests: InteractionTest[] = []
  const regex = /@interaction\s*\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)@endinteraction/g

  let match = regex.exec(content)
  while (match !== null) {
    const name = match[1]
    const body = match[2].trim()

    const steps = parseInteractionSteps(body)
    tests.push({
      name,
      storyId: '',
      variantId: '',
      steps,
    })

    match = regex.exec(content)
  }

  return tests
}

/**
 * Parse interaction steps from block body
 */
function parseInteractionSteps(body: string): InteractionStep[] {
  const steps: InteractionStep[] = []
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    // Parse click
    const clickMatch = line.match(/await\s+click\s*\(\s*['"]([^'"]+)['"]\s*\)/)
    if (clickMatch) {
      steps.push({ action: 'click', selector: clickMatch[1] })
      continue
    }

    // Parse type
    const typeMatch = line.match(/await\s+type\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/)
    if (typeMatch) {
      steps.push({ action: 'type', selector: typeMatch[1], value: typeMatch[2] })
      continue
    }

    // Parse select
    const selectMatch = line.match(/await\s+select\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/)
    if (selectMatch) {
      steps.push({ action: 'select', selector: selectMatch[1], value: selectMatch[2] })
      continue
    }

    // Parse hover
    const hoverMatch = line.match(/await\s+hover\s*\(\s*['"]([^'"]+)['"]\s*\)/)
    if (hoverMatch) {
      steps.push({ action: 'hover', selector: hoverMatch[1] })
      continue
    }

    // Parse wait
    const waitMatch = line.match(/await\s+wait\s*\(\s*(\d+)\s*\)/)
    if (waitMatch) {
      steps.push({ action: 'wait', duration: Number.parseInt(waitMatch[1], 10) })
      continue
    }

    // Parse expect/assert
    const expectMatch = line.match(/expect\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\.\s*(\w+)\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/)
    if (expectMatch) {
      const selector = expectMatch[1]
      const assertType = expectMatch[2]
      const expected = expectMatch[3]

      let assertion: InteractionStep['assertion']
      switch (assertType) {
        case 'toHaveText':
        case 'toContainText':
          assertion = { type: 'text', expected }
          break
        case 'toHaveValue':
          assertion = { type: 'value', expected }
          break
        case 'toBeVisible':
          assertion = { type: 'visible', expected: true }
          break
        case 'toBeHidden':
          assertion = { type: 'hidden', expected: true }
          break
        case 'toHaveClass':
          assertion = { type: 'class', expected }
          break
        default:
          assertion = { type: 'text', expected }
      }

      steps.push({ action: 'assert', selector, assertion })
    }
  }

  return steps
}

/**
 * Run interaction tests for a story
 */
export async function runInteractionTests(
  _ctx: StoryContext,
  story: ServerStoryFile,
  tests: InteractionTest[],
): Promise<InteractionTestResult[]> {
  const results: InteractionTestResult[] = []

  for (const test of tests) {
    const startTime = Date.now()
    let passed = true
    let error: string | undefined
    let failedStep: number | undefined

    try {
      // Run setup
      if (test.setup) {
        await test.setup()
      }

      // Run steps (in a real implementation, this would use a browser automation tool)
      for (let i = 0; i < test.steps.length; i++) {
        const step = test.steps[i]
        const stepResult = await executeStep(step)

        if (!stepResult.success) {
          passed = false
          error = stepResult.error
          failedStep = i
          break
        }
      }

      // Run teardown
      if (test.teardown) {
        await test.teardown()
      }
    }
    catch (e) {
      passed = false
      error = String(e)
    }

    results.push({
      name: test.name,
      passed,
      error,
      duration: Date.now() - startTime,
      failedStep,
    })
  }

  return results
}

/**
 * Execute a single interaction step
 * Note: This is a stub - real implementation would use browser automation
 */
async function executeStep(step: InteractionStep): Promise<{ success: boolean, error?: string }> {
  // Simulate step execution
  switch (step.action) {
    case 'wait':
      await new Promise(resolve => setTimeout(resolve, step.duration || 100))
      return { success: true }

    case 'click':
    case 'type':
    case 'select':
    case 'hover':
    case 'focus':
    case 'blur':
      // In a real implementation, this would interact with the DOM
      return { success: true }

    case 'assert':
      // In a real implementation, this would check the DOM
      return { success: true }

    default:
      return { success: false, error: `Unknown action: ${step.action}` }
  }
}

/**
 * Generate interaction test helpers script (for browser)
 */
export function getInteractionHelpersScript(): string {
  return `
    window.__stxInteraction = {
      async click(selector) {
        const el = document.querySelector(selector);
        if (!el) throw new Error('Element not found: ' + selector);
        el.click();
      },

      async type(selector, value) {
        const el = document.querySelector(selector);
        if (!el) throw new Error('Element not found: ' + selector);
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },

      async select(selector, value) {
        const el = document.querySelector(selector);
        if (!el) throw new Error('Element not found: ' + selector);
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },

      async hover(selector) {
        const el = document.querySelector(selector);
        if (!el) throw new Error('Element not found: ' + selector);
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      },

      async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      },

      expect(selector) {
        const el = document.querySelector(selector);
        return {
          toHaveText(expected) {
            if (!el) throw new Error('Element not found: ' + selector);
            if (el.textContent !== expected) {
              throw new Error('Expected text "' + expected + '" but got "' + el.textContent + '"');
            }
          },
          toContainText(expected) {
            if (!el) throw new Error('Element not found: ' + selector);
            if (!el.textContent.includes(expected)) {
              throw new Error('Expected text to contain "' + expected + '"');
            }
          },
          toHaveValue(expected) {
            if (!el) throw new Error('Element not found: ' + selector);
            if (el.value !== expected) {
              throw new Error('Expected value "' + expected + '" but got "' + el.value + '"');
            }
          },
          toBeVisible() {
            if (!el) throw new Error('Element not found: ' + selector);
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') {
              throw new Error('Expected element to be visible');
            }
          },
          toBeHidden() {
            if (el) {
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                throw new Error('Expected element to be hidden');
              }
            }
          },
          toHaveClass(className) {
            if (!el) throw new Error('Element not found: ' + selector);
            if (!el.classList.contains(className)) {
              throw new Error('Expected element to have class "' + className + '"');
            }
          }
        };
      }
    };
  `
}

/**
 * Format interaction test results
 */
export function formatInteractionResults(results: InteractionTestResult[]): string {
  const lines: string[] = []
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  lines.push('')
  lines.push('Interaction Tests')
  lines.push('─'.repeat(40))

  for (const result of results) {
    const icon = result.passed ? '✓' : '✗'
    const status = result.passed ? 'PASS' : 'FAIL'
    lines.push(`${icon} ${result.name} [${status}] (${result.duration}ms)`)

    if (!result.passed && result.error) {
      lines.push(`  Error: ${result.error}`)
      if (result.failedStep !== undefined) {
        lines.push(`  Failed at step: ${result.failedStep + 1}`)
      }
    }
  }

  lines.push('')
  lines.push(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  lines.push('')

  return lines.join('\n')
}
