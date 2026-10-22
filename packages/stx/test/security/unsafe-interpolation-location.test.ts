/**
 * An unsafe-interpolation error says where it happened.
 *
 * HQ's coach store page carried a malformed tag for two weeks:
 *   <div class="grid" x-class="…" data-add-video bg-slate-50/70 dark:bg-slate-900/60">
 * Its stray quote held the tag open until the next quote, so a later text
 * interpolation sat "inside" it. When the data-boundary checks began refusing
 * interpolation into tag structure, the page served 500s, and production's log
 * said only that the route failed: the error carried no location, and a
 * production render logged no reason at all.
 */
import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { escapeInterpolatedHtmlValue } from '../../src/expressions'
import { UnsafeInterpolationContextError } from '../../src/interpolation-context'
import { processDirectives } from '../../src/process'

// Reduced from the page that failed: its first two lines, as stx composed them.
const MALFORMED = `<div :if="stCanAddVideo" class="grid gap-3 px-5 py-4" x-class="stIsCourse ? 'sm:grid-cols-[1fr_1fr_6rem_5rem_auto]' : 'sm:grid-cols-[1fr_1fr_6rem_auto]'" data-add-video bg-slate-50/70 dark:bg-slate-900/60 border-slate-100 border-t dark:border-slate-800">
          <p class="panel-subtitle">{{ intro }}</p>`

describe('an unsafe interpolation', () => {
  it('quotes the markup before it, which names the malformed tag', () => {
    const offset = MALFORMED.indexOf('{{')
    let thrown: unknown
    try {
      escapeInterpolatedHtmlValue(MALFORMED, offset, 'What someone buying now would get. Each week goes onto the calendar.', false, '{{ intro }}'.length)
    }
    catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(UnsafeInterpolationContextError)
    const error = thrown as UnsafeInterpolationContextError
    expect(error.message).toStartWith('Unsafe interpolation in tag structure')
    expect(error.near).toContain('dark:border-slate-800"> <p class="panel-subtitle">')
    expect(error.message).toContain('(after: ')
  })
})

describe('a failed render in production', () => {
  const env = process.env.NODE_ENV
  afterEach(() => {
    process.env.NODE_ENV = env
  })

  it('logs why on the server, and still keeps it out of the page', async () => {
    process.env.NODE_ENV = 'production'
    const logged: string[] = []
    const spy = spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '))
    })
    try {
      // A value that is not a bare boolean attribute, interpolated into a tag.
      const html = await processDirectives('<section><img {{ attrs }}></section>', { attrs: 'src=x onerror=alert(1)' }, '/srv/app/pages/store.stx', {} as any, new Set())
      expect(html).not.toContain('Unsafe interpolation')
      expect(html).not.toContain('onerror')
      expect(logged.some(line => line.includes('Unsafe interpolation in tag structure') && line.includes('<section><img'))).toBe(true)
    }
    finally {
      spy.mockRestore()
    }
  })
})
