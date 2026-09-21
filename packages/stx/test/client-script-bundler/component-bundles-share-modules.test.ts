/**
 * Components share ONE instance of each module they import (stacksjs/stx#1957).
 *
 * Every `<script client>` used to be bundled with its imports inlined, so two
 * components importing one module each carried a private copy: module state
 * existed once per component and the page shipped the code once per importer.
 * A component's direct imports are now served by a page-level registry that is
 * bundled and evaluated once per page.
 *
 * These render real pages and then EXECUTE their scripts in document order, as
 * a browser would. Asserting on the HTML alone would only show the code moved,
 * not that the instance is shared.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { bundleClientScript, rewriteRegistryImports } from '../../src/client-script-bundler'
import { buildModuleRegistryScript, registeredModuleIdsIn } from '../../src/client-module-registry'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
const g = globalThis as any

// The suite preloads a DOM, so `window` already exists and is NOT globalThis.
// Page scripts write their probes to it. Never reassign it: the first version
// of this file set window = globalThis to run scripts, and because Bun runs
// every test file in one process, 41 unrelated tests later in the suite failed
// while passing on their own.
const win = g.window

afterEach(() => {
  delete g.__stxModules
  delete g.__stxModuleBundles
  delete win.__probe
  delete win.__evaluations
})

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'stx-1957-'))
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  return dir
}

async function render(dir: string, page = 'page.stx'): Promise<string> {
  const source = await Bun.file(path.join(dir, page)).text()
  return processDirectives(
    source,
    {},
    path.join(dir, page),
    { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' },
    new Set<string>(),
  )
}

/** Run every inline script in document order, the way a browser would. */
function execute(html: string): void {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(match[1]))
      continue
    // eslint-disable-next-line no-eval
    ;(0, eval)(match[2])
  }
}

const COUNTER = `let count = 0
export function bump() { return ++count }
export const MARKER = 'counter-module-body'
`

function counterComponent(name: string): string {
  return `<div>${name}</div>
<script client>
import { bump } from '../functions/counter'
window.__probe = window.__probe || []
window.__probe.push(['${name}', bump()])
</script>
`
}

describe('components share one module instance per page (#1957)', () => {
  it('evaluates a module imported by two components exactly once', async () => {
    const dir = project({
      'functions/counter.ts': COUNTER,
      'components/CounterAlpha.stx': counterComponent('alpha'),
      'components/CounterBeta.stx': counterComponent('beta'),
      'page.stx': '<CounterAlpha />\n<CounterBeta />\n',
    })
    const html = await render(dir)

    // Shipped once, in the page registry, not once per component.
    expect(html.match(/counter-module-body/g)).toHaveLength(1)
    execute(html)
    // One instance: the second component sees the first one's increment.
    expect(win.__probe).toEqual([['alpha', 1], ['beta', 2]])
  })

  it('shares the instance with a module-level registry of hooks, the reported case', async () => {
    // The real app's sign-out hook, registered through one copy, was invisible
    // to the copy that performed sign-out.
    const dir = project({
      'functions/auth.ts': `const hooks = []
export function onSignOut(fn) { hooks.push(fn) }
export function signOut() { hooks.forEach(fn => fn()) }
`,
      'components/NavBar.stx': `<nav>nav</nav>
<script client>
import { onSignOut } from '../functions/auth'
onSignOut(() => { window.__probe = 'hook ran' })
</script>
`,
      'components/SignOutButton.stx': `<button>out</button>
<script client>
import { signOut } from '../functions/auth'
signOut()
</script>
`,
      'page.stx': '<NavBar />\n<SignOutButton />\n',
    })
    execute(await render(dir))
    expect(win.__probe).toBe('hook ran')
  })

  it('does not re-evaluate modules when the page scripts run again, as on SPA navigation', async () => {
    // SPA navigation re-executes page scripts. The per-module registration
    // already keeps the first INSTANCE, so state alone cannot show a
    // re-evaluation: count the module's top-level side effect instead. Without
    // the bundle guard it runs on every navigation.
    const dir = project({
      'functions/boot.ts': `window.__evaluations = (window.__evaluations || 0) + 1
export function ping() { return 'pong' }
`,
      'components/Pinger.stx': `<p>ping</p>
<script client>
import { ping } from '../functions/boot'
window.__probe = ping()
</script>
`,
      'page.stx': '<Pinger />\n',
    })
    const html = await render(dir)
    execute(html)
    execute(html)
    execute(html)
    expect(win.__probe).toBe('pong')
    expect(win.__evaluations).toBe(1)
  })

  it('serves a module that declares signals, with the real runtime loaded', async () => {
    // The common shape in practice: a session module holding state(). Its
    // stx import is resolved inside the registry bundle, not the component's.
    const dir = project({
      'functions/session.ts': `import { state } from 'stx'
export const user = state('nobody')
export function signIn(name) { user.set(name) }
`,
      'components/SignInBadge.stx': `<span>badge</span>
<script client>
import { signIn } from '../functions/session'
signIn('ada')
</script>
`,
      'components/UserBadge.stx': `<span>who</span>
<script client>
import { user } from '../functions/session'
window.__probe = user()
</script>
`,
      'page.stx': '<SignInBadge />\n<UserBadge />\n',
    })
    const html = await render(dir)
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
    execute(html)
    // One signal instance: the second component reads the first one's write.
    expect(win.__probe).toBe('ada')
  })

  it('escapes a closing script tag inside a module so the page stays intact', async () => {
    const dir = project({
      'functions/markup.ts': `export const TAG = '</script><b>injected</b>'\n`,
      'components/TagEcho.stx': `<p>echo</p>
<script client>
import { TAG } from '../functions/markup'
window.__probe = TAG
</script>
`,
      'page.stx': '<TagEcho />\n',
    })
    const html = await render(dir)
    expect(html).not.toContain('</script><b>injected</b>')
    execute(html)
    expect(win.__probe).toBe('</script><b>injected</b>')
  })
})

describe('registry import rewriting', () => {
  it('binds every import form Bun emits', () => {
    const reads: string[] = []
    const rest = rewriteRegistryImports([
      'import { a, b as c } from "stx-module:mod/one.ts";',
      'import * as ns from "stx-module:mod/two.ts";',
      'import def from "stx-module:mod/three.ts";',
      'import def2, { x } from "stx-module:mod/four.ts";',
      'import "stx-module:mod/five.ts";',
      'keep();',
    ].join('\n'), reads)

    expect(rest.trim()).toBe('keep();')
    const scope: Record<string, unknown> = {}
    g.__stxModules = {
      'mod/one.ts': { a: 1, b: 2 },
      'mod/two.ts': { n: 3 },
      'mod/three.ts': { default: 4 },
      'mod/four.ts': { default: 5, x: 6 },
      'mod/five.ts': {},
    }
    // eslint-disable-next-line no-new-func
    new Function('scope', `${reads.join('\n')}\nObject.assign(scope, { a, c, ns, def, def2, x })`)(scope)
    expect(scope).toEqual({ a: 1, c: 2, ns: { n: 3 }, def: 4, def2: 5, x: 6 })
  })

  it('throws naming the module when the page never registered it', () => {
    const reads: string[] = []
    rewriteRegistryImports('import { a } from "stx-module:functions/gone.ts";', reads)
    g.__stxModules = {}
    // eslint-disable-next-line no-new-func
    expect(() => new Function(reads.join('\n'))()).toThrow('functions/gone.ts')
  })

  it('collects the ids a page reads, once each and sorted', () => {
    const reads: string[] = []
    rewriteRegistryImports('import { a } from "stx-module:b/two.ts";\nimport { c } from "stx-module:a/one.ts";', reads)
    const more: string[] = []
    rewriteRegistryImports('import { d } from "stx-module:a/one.ts";', more)
    expect(registeredModuleIdsIn(reads.join('\n'), more.join('\n'))).toEqual(['a/one.ts', 'b/two.ts'])
  })
})

describe('what a component bundle resolves to', () => {
  it('names the file a relative import actually resolves to', async () => {
    const dir = project({
      'layouts/local.ts': `export const WHO = 'layout'\n`,
      'pages/local.ts': `export const WHO = 'page'\n`,
    })
    const out = await bundleClientScript(
      `import { WHO } from './local'\nconst who = WHO`,
      path.join(dir, 'pages', 'index.stx'),
      { projectRoot: dir },
    )
    const [id] = registeredModuleIdsIn(out)
    // Rebased onto the page's directory, not the temp entry's.
    expect(path.resolve(process.cwd(), id)).toBe(path.join(dir, 'pages', 'local.ts'))
  })

  it('builds a registry whose module resolves from the id alone', async () => {
    const dir = project({ 'functions/counter.ts': COUNTER })
    const id = path.relative(process.cwd(), path.join(dir, 'functions', 'counter.ts')).split(path.sep).join('/')
    const script = await buildModuleRegistryScript([id])
    expect(script).toContain('counter-module-body')
    // eslint-disable-next-line no-eval
    ;(0, eval)(script!)
    expect(g.__stxModules[id].bump()).toBe(1)
    expect(g.__stxModules[id].bump()).toBe(2)
  })
})
