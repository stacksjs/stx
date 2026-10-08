/**
 * The `:for` warning names the cause instead of guessing at signals
 * (stacksjs/stx#2051).
 *
 * It used to end with "If this is a signal call, try the bare reference
 * (signal instead of signal())" on every failure. In the most common one the
 * identifier is not a signal at all: it is a name the client scope has never
 * heard of, usually a `<script server>` declaration, which `:for` cannot see
 * because it is expanded on the client.
 *
 * That hint cost a real app its architecture. It was iterating monitors
 * fetched in a `<script server>` block, read the advice, concluded the
 * signals-and-`:for` pattern was unreliable, and was rebuilt on server-rendered
 * plain scripts with hand-written `getElementById` wiring instead.
 *
 * The diagnostic already had the answer -- `inScope=false` sat immediately
 * before the guess -- so the fix is to lead with it and keep the signal
 * advice for the one case where it applies.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))
let booted = 0

/** Boot a page and collect everything the runtime warned about. */
async function warningsFor(markup: string, scope: Record<string, unknown>): Promise<string[]> {
  const name = `forwarn_${++booted}`
  const warnings: string[] = []
  const original = console.warn
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
  try {
    window[`__stx_setup_${name}`] = () => scope
    document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await settle()
  }
  finally {
    console.warn = original
  }
  return warnings.filter(line => line.includes(':for expected an array'))
}

describe('a name the client scope does not have', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    delete window.__stx_host
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('says so, instead of talking about signals', async () => {
    const [warning] = await warningsFor('<ul><li :for="row in serverRows">x</li></ul>', {})
    expect(warning).toBeTruthy()
    expect(warning).toContain('Nothing named serverRows is in the client scope')
    expect(warning).not.toContain('If this is a signal call')
  })

  it('names the two things that actually work', async () => {
    // Both remedies, because which one is right depends on whether the list
    // needs to react -- and neither is discoverable from the old message.
    const [warning] = await warningsFor('<ul><li :for="row in serverRows">x</li></ul>', {})
    expect(warning).toContain('state()')
    expect(warning).toContain('@foreach(serverRows as item)')
  })

  it('explains why, in terms of where :for runs', async () => {
    const [warning] = await warningsFor('<ul><li :for="row in serverRows">x</li></ul>', {})
    expect(warning).toContain('expanded on the client')
  })

  it('still reports the scope dump that answered the question first', async () => {
    const [warning] = await warningsFor('<ul><li :for="row in serverRows">x</li></ul>', {})
    expect(warning).toContain('inScope=false')
    expect(warning).toContain('root=serverRows')
  })
})

describe('a name that is in scope', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    delete window.__stx_host
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('keeps the signal advice when the value really is a signal', async () => {
    // The one case the old hint was written for. A signal holding a non-array
    // is a genuine "call it or do not" question.
    const notAList = window.stx.state('nope')
    const [warning] = await warningsFor('<ul><li :for="row in notAList">x</li></ul>', { notAList })
    expect(warning).toBeTruthy()
    expect(warning).toContain('notAList is a signal')
    expect(warning).toContain('bare reference')
  })

  it('reports the type when the value is simply not an array', async () => {
    const [warning] = await warningsFor('<ul><li :for="row in count">x</li></ul>', { count: 7 })
    expect(warning).toBeTruthy()
    expect(warning).toContain('count resolved to a number, not an array')
    expect(warning).not.toContain('is a signal')
    expect(warning).not.toContain('not in the client scope')
  })

  it('does not warn at all when the list is fine', async () => {
    const rows = window.stx.state([{ id: 1 }, { id: 2 }])
    expect(await warningsFor('<ul><li :for="row in rows" :key="row.id">x</li></ul>', { rows })).toEqual([])
  })
})
