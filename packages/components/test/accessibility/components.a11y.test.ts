/**
 * WCAG 2.1 AA checks against what the BROWSER receives.
 *
 * This suite used to read each component's `.stx` file as text and grep it.
 * Two things were wrong with that, and the second is the worse one.
 *
 * A grep cannot tell an attribute that renders from one that does not. It
 * passes on an `aria-expanded` sitting in a branch that never runs, in a
 * commented-out block, or on an element the engine strips -- and it cannot see
 * a regression in the engine at all, because the component's source is byte
 * identical either way. Accessibility is a property of the document, so the
 * document is the only place the question can be asked.
 *
 * And several of the assertions could not fail:
 *
 *     expect(Array.isArray(issues)).toBe(true)
 *     expect(typeof check.hasFocusStyles).toBe('boolean')
 *
 * Five of them, spread across keyboard, focus and screen-reader support --
 * which is to say the suite reported those three areas as covered while
 * asserting nothing whatsoever about them. They are real assertions now.
 *
 * A reactive `:aria-checked` counts as present: the signals runtime applies it
 * on hydration, and `ariaAttributes()` normalises the two spellings. What is
 * NOT accepted is a role with no accompanying state in either spelling.
 */

import { describe, expect, it } from 'bun:test'
import {
  ariaAttributes,
  markup,
  render,
  roles,
} from '../utils/render-component'
import {
  auditMarkup,
  checkAccessibleLabels,
  checkKeyboardAccessibility,
  checkRequiredAriaForRoles,
  checkScreenReaderSupport,
  quickA11yCheck,
} from './a11y-test-utils'

/**
 * One realistic usage per component, rendered once and shared.
 *
 * The usage matters: `<Dropdown>` with no children renders a bare wrapper, and
 * a test written against that would report a menu with no `role="menu"` as a
 * component defect rather than as a probe that passed no menu.
 */
const USAGE: Record<string, string> = {
  button: '<Button loading>Save</Button>',
  switch: '<Switch label="Wifi" />',
  checkbox: '<Checkbox label="Agree" />',
  radio: '<Radio label="One" value="1" />',
  textInput: '<TextInput label="Name" />',
  textarea: '<Textarea label="Bio" />',
  select: '<Select label="Pick" />',
  dialog: '<Dialog open title="Hi"><p>body</p></Dialog>',
  drawer: '<Drawer open title="Hi"><p>body</p></Drawer>',
  dropdown: '<Dropdown label="Menu"><span>item</span></Dropdown>',
  tabs: '<Tabs><div>one</div></Tabs>',
  tooltip: '<Tooltip content="Help">hover</Tooltip>',
  notification: '<Notification title="Saved" />',
  progress: '<Progress value="40" />',
  spinner: '<Spinner />',
  avatar: '<Avatar alt="Ann" />',
  badge: '<Badge>New</Badge>',
  card: '<Card><p>body</p></Card>',
  pagination: '<Pagination total="50" />',
  stepper: '<Stepper><div>one</div></Stepper>',
}

const rendered = new Map<string, string>()

/** Render a component once; every test for it reads the same document. */
async function html(name: keyof typeof USAGE): Promise<string> {
  const cached = rendered.get(name)
  if (cached !== undefined)
    return cached
  const out = markup(await render(USAGE[name]))
  rendered.set(name, out)
  return out
}

/** The tag names the component actually emitted. */
function tags(source: string): string[] {
  return [...new Set([...source.matchAll(/<([a-z]+)[\s/>]/g)].map(m => m[1]))]
}

describe('Component Accessibility Tests', () => {
  describe('Button Component', () => {
    it('renders a native button element', async () => {
      expect(tags(await html('button'))).toContain('button')
    })

    it('announces its loading state with aria-busy', async () => {
      expect(ariaAttributes(await html('button'))).toContain('aria-busy')
    })

    it('ships a visible focus indicator', async () => {
      expect(quickA11yCheck(await html('button')).hasFocusStyles).toBe(true)
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('button'), 'Button')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Switch Component', () => {
    it('renders role="switch"', async () => {
      expect(roles(await html('switch'))).toContain('switch')
    })

    it('carries aria-checked, so the role has a state', async () => {
      // Bound (`:aria-checked`), applied by the runtime. A role="switch" with
      // no checked state in either spelling is a WCAG 4.1.2 failure.
      expect(ariaAttributes(await html('switch'))).toContain('aria-checked')
    })

    it('renders screen-reader text for the control', async () => {
      expect(await html('switch')).toMatch(/class="sr-only"/)
    })

    it('is keyboard reachable without a key handler', async () => {
      // A <button> is focusable and Space/Enter-activated by the platform, so
      // there is deliberately no @keydown to assert on.
      expect(tags(await html('switch'))).toContain('button')
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('switch'), 'Switch')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Checkbox Component', () => {
    it('renders a native checkbox or role="checkbox"', async () => {
      const source = await html('checkbox')
      expect(/type="checkbox"/.test(source) || roles(source).includes('checkbox')).toBe(true)
    })

    it('associates a label with the control', async () => {
      expect(tags(await html('checkbox'))).toContain('label')
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('checkbox'), 'Checkbox')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Radio Component', () => {
    it('renders a native radio or role="radio"', async () => {
      const source = await html('radio')
      expect(/type="radio"/.test(source) || roles(source).includes('radio')).toBe(true)
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('radio'), 'Radio')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('TextInput Component', () => {
    it('renders an input element', async () => {
      expect(tags(await html('textInput'))).toContain('input')
    })

    it('gives the input an accessible name', async () => {
      // Was `expect(Array.isArray(issues)).toBe(true)` -- a tautology. The
      // question is whether the check finds a LABELLING error, so ask that.
      const source = await html('textInput')
      const labelErrors = checkAccessibleLabels(source).filter(i => i.severity === 'error')
      expect(labelErrors).toHaveLength(0)
      expect(/<label/.test(source) || ariaAttributes(source).includes('aria-label')).toBe(true)
    })

    it('ships a visible focus indicator', async () => {
      expect(quickA11yCheck(await html('textInput')).hasFocusStyles).toBe(true)
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('textInput'), 'TextInput')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Dialog Component', () => {
    it('renders role="dialog"', async () => {
      expect(roles(await html('dialog'))).toContain('dialog')
    })

    it('marks itself modal', async () => {
      expect(await html('dialog')).toMatch(/aria-modal="true"/i)
    })

    it('exposes ARIA state for keyboard dismissal', async () => {
      // Was `expect(check.hasAriaAttributes).toBe(true)` against the SOURCE.
      expect(quickA11yCheck(await html('dialog')).hasAriaAttributes).toBe(true)
    })

    it('scores well in the accessibility audit', async () => {
      // Children carry some of a dialog's ARIA, so warnings are expected here.
      expect(auditMarkup(await html('dialog'), 'Dialog').score).toBeGreaterThanOrEqual(60)
    })
  })

  describe('Dropdown Component', () => {
    it('renders its trigger and panel content', async () => {
      expect(await html('dropdown')).toContain('item')
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('dropdown'), 'Dropdown')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Tabs Component', () => {
    it('renders the tablist/tab roles', async () => {
      const present = roles(await html('tabs'))
      expect(present.some(r => r === 'tablist' || r === 'tab' || r === 'tabpanel')).toBe(true)
    })

    it('handles arrow-key navigation', async () => {
      // Tabs are a composite widget: the platform gives no roving focus, so a
      // key handler is required rather than optional.
      expect(quickA11yCheck(await html('tabs')).hasKeyboardHandlers).toBe(true)
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('tabs'), 'Tabs')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Tooltip Component', () => {
    it('renders role="tooltip"', async () => {
      expect(roles(await html('tooltip'))).toContain('tooltip')
    })

    it('shows on focus, not only on hover', async () => {
      // Pointer-only reveal fails WCAG 2.1.1; the focus pair is the fix.
      const source = await html('tooltip')
      expect(source).toContain('@focusin')
      expect(source).toContain('@focusout')
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('tooltip'), 'Tooltip')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Notification Component', () => {
    it('renders a live-region role', async () => {
      const present = roles(await html('notification'))
      expect(present.some(r => ['alert', 'status', 'log'].includes(r))).toBe(true)
    })

    it('is announced by a screen reader', async () => {
      const source = await html('notification')
      const present = roles(source)
      const live = ariaAttributes(source).includes('aria-live')
        || present.includes('alert')
        || present.includes('status')
      expect(live).toBe(true)
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('notification'), 'Notification')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Progress Component', () => {
    it('renders role="progressbar"', async () => {
      expect(roles(await html('progress'))).toContain('progressbar')
    })

    it('carries the full value triple, not just one of them', async () => {
      // The old test joined these with `||`, so aria-valuemin alone satisfied
      // it -- and aria-valuenow, the one a screen reader actually announces,
      // could have gone missing without the suite noticing.
      const present = ariaAttributes(await html('progress'))
      expect(present).toContain('aria-valuenow')
      expect(present).toContain('aria-valuemin')
      expect(present).toContain('aria-valuemax')
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('progress'), 'Progress')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Spinner Component', () => {
    it('is reachable by a screen reader', async () => {
      const source = await html('spinner')
      const present = roles(source)
      const accessible = present.includes('status')
        || present.includes('progressbar')
        || ariaAttributes(source).includes('aria-label')
        || source.includes('sr-only')
      expect(accessible).toBe(true)
    })

    it('announces politely while busy', async () => {
      const present = ariaAttributes(await html('spinner'))
      expect(present).toContain('aria-live')
      expect(present).toContain('aria-busy')
    })

    it('passes the accessibility audit', async () => {
      const result = auditMarkup(await html('spinner'), 'Spinner')
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })
  })

  describe('Keyboard Navigation', () => {
    it('Button raises no keyboard issues', async () => {
      // Was `expect(Array.isArray(issues)).toBe(true)`.
      const issues = checkKeyboardAccessibility(await html('button'))
      expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })

    it('Switch is a button, so the platform handles Space and Enter', async () => {
      expect(tags(await html('switch'))).toContain('button')
    })

    it('every interactive component is operable without a pointer', async () => {
      // A component is operable when it renders a natively focusable element
      // or wires its own key handling. Asserted across the library rather than
      // one component at a time, so a new one cannot quietly skip it.
      const interactive = ['button', 'switch', 'checkbox', 'radio', 'textInput', 'tabs', 'pagination'] as const
      for (const name of interactive) {
        const source = await html(name)
        const native = /<(?:button|input|select|textarea|a)[\s>]/.test(source)
        const operable = native || quickA11yCheck(source).hasKeyboardHandlers
        expect(`${name}:${operable}`).toBe(`${name}:true`)
      }
    })
  })

  describe('Focus Management', () => {
    it('Button has a visible focus state', async () => {
      expect(quickA11yCheck(await html('button')).hasFocusStyles).toBe(true)
    })

    it('Switch has a visible focus state', async () => {
      // The ring is on the generated stylesheet's class, not inline, so ask
      // the whole document rather than the markup alone.
      const full = await render(USAGE.switch)
      expect(/focus:|focus-visible:|focus-within:|:focus/.test(full)).toBe(true)
    })

    it('TextInput has a visible focus state', async () => {
      expect(quickA11yCheck(await html('textInput')).hasFocusStyles).toBe(true)
    })
  })

  describe('Screen Reader Support', () => {
    it('Button raises no screen-reader issues', async () => {
      // Was `expect(Array.isArray(issues)).toBe(true)`.
      const issues = checkScreenReaderSupport(await html('button'))
      expect(issues.filter(i => i.severity === 'error')).toHaveLength(0)
    })

    it('Switch renders screen-reader text', async () => {
      expect(await html('switch')).toMatch(/sr-only/i)
    })

    it('Progress announces its value', async () => {
      expect(roles(await html('progress'))).toContain('progressbar')
      expect(ariaAttributes(await html('progress'))).toContain('aria-valuenow')
    })
  })

  describe('ARIA Validation', () => {
    it('every rendered role carries the ARIA state it requires', async () => {
      // Was a 90% pass rate over the library, which let two components be
      // broken at any time without naming either. Every component, named.
      const offenders: string[] = []
      for (const name of Object.keys(USAGE)) {
        const errors = checkRequiredAriaForRoles(await html(name)).filter(i => i.severity === 'error')
        if (errors.length > 0)
          offenders.push(`${name}: ${errors.map(e => e.message).join('; ')}`)
      }
      expect(offenders).toEqual([])
    })
  })

  describe('Comprehensive Audit', () => {
    it('audits every component, naming any that fail', async () => {
      const failures: string[] = []
      let total = 0

      for (const name of Object.keys(USAGE)) {
        const result = auditMarkup(await html(name), name)
        total += result.score
        if (!result.passed)
          failures.push(`${name} (score ${result.score})`)
      }

      const average = total / Object.keys(USAGE).length
      expect(failures).toEqual([])
      expect(average).toBeGreaterThanOrEqual(70)
    })
  })
})
