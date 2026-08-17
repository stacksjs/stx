/**
 * A component passes props to a component (stacksjs/stx#1937).
 *
 * A wrapper whose `<script server>` wrote the documented
 * `import { defineProps } from 'stx'` delivered NOTHING to the components
 * inside it — arrays, booleans and plain static string attributes alike. The
 * child rendered every default, no warning, no console output, HTTP 200. Page
 * to component worked, so the pattern that broke was specifically the shared
 * wrapper: put the chrome in one component, use it everywhere, and every use
 * silently loses its props.
 *
 * The mechanism is two correct-looking steps meeting:
 *
 *  1. An `import` of an engine-provided name is turned into a re-export
 *     (`module.exports.defineProps = defineProps`), which puts it in the
 *     component's CONTEXT.
 *  2. A child inherits its parent's context, and context keys are appended to
 *     the script's parameter list AFTER the engine bindings — so the later
 *     parameter wins and the child's `defineProps` was the PARENT's, reading
 *     the parent's props and finding none of its own.
 *
 * Static attributes going missing is what makes this worth pinning precisely:
 * a static attribute cannot depend on any context, so its loss says the props
 * were dropped wholesale rather than mis-evaluated. `text` below is the
 * assertion that distinguishes those two failures, and it is the one that was
 * hardest to explain from the symptom.
 *
 * Every case gets its own directory: components are cached by resolved path, so
 * reusing one file across cases silently tests the first case's version. That
 * cost real time while narrowing this bug — the first bisection run reported
 * every variant as passing.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { processDirectives } from '../src/process'
import type { StxOptions } from '../src/types'

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-nested-props-'))
let caseId = 0

afterAll(() => fs.rmSync(ROOT, { recursive: true, force: true }))

/** Reports what it actually received, so a failure names the lost prop. */
const PROBE = `<script server>
const { items, flag, text } = withDefaults(defineProps<{ items?: any[], flag?: boolean, text?: string }>(), { items: [], flag: false, text: '' })
const count = Array.isArray(items) ? items.length : -1
</script>
<p data-probe="items={{ count }} flag={{ flag }} text={{ text }}"></p>`

/**
 * @param wrapperImport - the line under test, prepended to the wrapper's script.
 */
async function renderThroughWrapper(wrapperImport: string): Promise<string[]> {
  const dir = path.join(ROOT, `case-${caseId++}`)
  const components = path.join(dir, 'components')
  fs.mkdirSync(components, { recursive: true })

  fs.writeFileSync(path.join(components, 'PropProbe.stx'), PROBE)
  fs.writeFileSync(
    path.join(components, 'PropWrapper.stx'),
    `<script server>
${wrapperImport}const { seed } = withDefaults(defineProps<{ seed?: number }>(), { seed: 0 })
const built = [{ a: seed }, { a: seed + 1 }]
</script>
<section data-wrapper="seed={{ seed }}">
<PropProbe :items="built" :flag="true" text="from-wrapper" />
</section>`,
  )

  const out = await processDirectives(
    `<div><PropWrapper :seed="5" /></div>`,
    {},
    path.join(dir, 'page.stx'),
    { componentsDir: components, root: dir } as StxOptions,
    new Set<string>(),
  )

  return [
    out.match(/data-wrapper="([^"]*)"/)?.[1] ?? '(wrapper missing)',
    out.match(/data-probe="([^"]*)"/)?.[1] ?? '(probe missing)',
  ]
}

const DELIVERED = 'items=2 flag=true text=from-wrapper'

describe('a component passes its props to a nested component', () => {
  it('delivers them when the wrapper imports defineProps from stx', async () => {
    const [wrapper, probe] = await renderThroughWrapper(`import { defineProps, withDefaults } from 'stx'\n`)

    // The wrapper's own prop always arrived; only what it passed on was lost.
    // Asserting it here keeps a future failure honest about which half broke.
    expect(wrapper).toBe('seed=5')
    expect(probe).toBe(DELIVERED)
  })

  it('delivers them under the published package name too', async () => {
    const [, probe] = await renderThroughWrapper(`import { defineProps } from '@stacksjs/stx'\n`)

    expect(probe).toBe(DELIVERED)
  })

  it('delivers them when the import is aliased', async () => {
    // Verified against the unfixed code: this one already passed, because the
    // leaked export was named `dp` and only a leak named `defineProps` shadows
    // the child's binding. Kept as the boundary of the bug rather than as a
    // second reproduction of it — the alias is still no longer exported, and
    // this says that change did not break the aliased form.
    const [, probe] = await renderThroughWrapper(`import { defineProps as dp } from 'stx'\n`)

    expect(probe).toBe(DELIVERED)
  })

  it('delivers them with no import at all', async () => {
    // The path that always worked. Present so a regression here is not read as
    // this bug returning.
    const [, probe] = await renderThroughWrapper('')

    expect(probe).toBe(DELIVERED)
  })

  it('delivers them when the wrapper imports a name the engine does not inject', async () => {
    // `defineStore` is a real export rather than an engine binding, so it stays
    // in the import. This is the case the fix must NOT change.
    const [, probe] = await renderThroughWrapper(`import { defineStore } from 'stx'\n`)

    expect(probe).toBe(DELIVERED)
  })
})

describe('the static attribute specifically', () => {
  it('survives, because losing it means the props were dropped wholesale', async () => {
    const [, probe] = await renderThroughWrapper(`import { defineProps } from 'stx'\n`)

    // A static string cannot be a context-evaluation failure. If only this one
    // regresses, the tag was parsed wrong; if it regresses with the others,
    // the child was handed the wrong props object.
    expect(probe).toContain('text=from-wrapper')
  })
})
