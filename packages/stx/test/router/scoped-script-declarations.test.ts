/**
 * A scoped block publishes the same names whether the browser parsed it or the
 * router re-ran it (stacksjs/stx#2041).
 *
 * `execScripts` wraps a re-executed script in a bare block, so that two pages
 * both declaring `const items` cannot collide across a navigation:
 *
 *     ns.textContent = (hasImport||alreadyScoped) ? text : '{'+text+'}'
 *
 * That wrap is invisible for a plain `function` declaration and NOT invisible
 * for anything else. Annex B.3.3 hoists a block-level FunctionDeclaration's
 * binding out to the enclosing var scope in sloppy mode, but that legacy rule
 * covers only plain functions -- async functions, generators and classes were
 * added after it and are purely block-scoped, as are const and let.
 *
 * Measured in a real browser, running exactly what the router emits:
 *
 *     function doEmptyTrash(){}             -> window.doEmptyTrash  function
 *     async function doCleanSelected(){}    -> window.doCleanSelected  UNDEFINED
 *     const scanCleanupSizes = async()=>{}  -> UNDEFINED
 *     class Scanner{}                       -> UNDEFINED
 *
 * So the same source published a global when a page was served whole and
 * published nothing when the router re-ran it -- a development-versus-built
 * divergence, since only a built SPA reaches a route the second way. An inline
 * `onclick` naming one of those worked all through development and threw
 * ReferenceError in the packaged app, where there is no console to see it in:
 * a button that does nothing, with no diagnostic anywhere. The reported app had
 * four dead handlers and every one of them was an `async function`.
 *
 * This asserts on the generated runtime rather than driving a navigation,
 * because the question is a property of the JavaScript engine and
 * `spa-harness` runs scripts through `new Function` -- under which a top-level
 * declaration is local whatever its kind, so the harness reports the same
 * answer before and after the fix and cannot tell them apart.
 */
import { describe, expect, it } from 'bun:test'
import { getRouterScript, getRouterScriptDev } from '../../../router/src/client'

/** Pull a function out of the generated runtime and make it callable here. */
function extractRepublish(runtime: string): (src: string) => string {
  const declRe = /var TLD=(\/.*?\/gm);/
  const decl = declRe.exec(runtime)
  if (!decl)
    throw new Error('TLD is not in the generated runtime')

  const start = runtime.indexOf('function republishTopLevel(src){')
  if (start === -1)
    throw new Error('republishTopLevel is not in the generated runtime')

  // Brace-match rather than guess at indentation: the production runtime is
  // minified and the dev one is not.
  let depth = 0
  let end = start
  for (let i = runtime.indexOf('{', start); i < runtime.length; i++) {
    if (runtime[i] === '{')
      depth++
    else if (runtime[i] === '}') {
      depth--
      if (depth === 0) { end = i + 1; break }
    }
  }
  const body = runtime.slice(start, end)

  // eslint-disable-next-line no-new-func
  return new Function(`var TLD=${decl[1]};${body};return republishTopLevel`)() as (src: string) => string
}

const SOURCE = `async function doCleanSelected() { return 'cleaned' }
function doEmptyTrash() { return 'emptied' }
function* walkItems() { yield 1 }
class Scanner {}
const scanCleanupSizes = async () => 42
const label = 'not a function'
  async function nested() { return 'indented, not top level' }
`

describe('the router re-publishes what its block wrap would hide', () => {
  for (const [name, runtime] of [['production', getRouterScript()], ['dev', getRouterScriptDev()]] as const) {
    describe(name, () => {
      it('wraps a re-executed script with the republish suffix', () => {
        // The exact expression in execScripts; if the wrap stops calling it the
        // fix is gone and nothing else here would notice.
        expect(runtime).toContain('republishTopLevel(text)')
      })

      it('names every top-level declaration the block would hide', () => {
        const suffix = extractRepublish(runtime)(SOURCE)

        for (const declared of ['doCleanSelected', 'doEmptyTrash', 'walkItems', 'Scanner', 'scanCleanupSizes'])
          expect(suffix).toContain(`window.${declared}=${declared}`)
      })

      it('guards each name separately, so one failure cannot take the rest down', () => {
        const suffix = extractRepublish(runtime)(SOURCE)
        const assignments = suffix.match(/try\{/g) ?? []
        // One try per name, not one around the lot.
        expect(assignments.length).toBeGreaterThanOrEqual(5)
        expect(suffix).toContain('typeof doCleanSelected=="function"')
      })

      it('actually publishes the hidden names when the block is run', () => {
        /*
         * The whole point, evaluated rather than matched: build the exact text
         * execScripts would put in the script element and run it, with a stand-in
         * for window. Verified against a real browser too -- without the suffix
         * only doEmptyTrash survives the block, because Annex B covers plain
         * function declarations and nothing else.
         */
        const published: Record<string, unknown> = {}
        const wrapped = `{${SOURCE}${extractRepublish(runtime)(SOURCE)}}`
        // eslint-disable-next-line no-new-func
        new Function('window', wrapped)(published)

        expect(typeof published.doCleanSelected).toBe('function')
        expect(typeof published.doEmptyTrash).toBe('function')
        expect(typeof published.walkItems).toBe('function')
        expect(typeof published.Scanner).toBe('function')
        expect(typeof published.scanCleanupSizes).toBe('function')

        // Writing every top-level const to window would overwrite window.name,
        // window.top and friends, which a lexical global shadows rather than
        // overwrites. A string declaration stays off it.
        expect(published.label).toBeUndefined()
      })



      it('ignores a declaration nested inside another function', () => {
        // Column-anchored: an indented declaration is not in scope at the end
        // of the block, so naming it would throw rather than publish anything.
        expect(extractRepublish(runtime)(SOURCE)).not.toContain('window.nested=nested')
      })

      it('adds nothing to a script that declares nothing', () => {
        expect(extractRepublish(runtime)('doSomething();')).toBe('')
      })
    })
  }
})

/**
 * The engine rule this all rests on, stated against the real global.
 *
 * Indirect eval runs in global scope, which is what a classic `<script>` gets,
 * so this is the same question the browser answers -- unlike `new Function`,
 * whose body is a function scope where nothing reaches the global object
 * whatever its declaration kind. That difference is why `spa-harness` cannot
 * be the instrument for this: it executes collected scripts through
 * `new Function`, and so reports the same answer before and after the fix.
 *
 * Measured identically in V8 and in JSC, which is what the packaged WebKit app
 * runs.
 */
describe('why the block wrap is not neutral', () => {
  const evalGlobal = eval

  it('lets a plain function out of the block, and nothing else', () => {
    const id = `stx2041_${Date.now()}`
    const g = globalThis as any

    evalGlobal(`{ function plain_${id}(){} }`)
    evalGlobal(`{ async function async_${id}(){} }`)
    evalGlobal(`{ function* gen_${id}(){} }`)
    evalGlobal(`{ class Cls_${id}{} }`)

    // Annex B.3.3 hoists this one's binding out of the block.
    expect(typeof g[`plain_${id}`]).toBe('function')

    // It was written before async functions, generators and classes existed,
    // and was never extended to them. This asymmetry is the whole bug.
    expect(g[`async_${id}`]).toBeUndefined()
    expect(g[`gen_${id}`]).toBeUndefined()
    expect(g[`Cls_${id}`]).toBeUndefined()
  })
})
