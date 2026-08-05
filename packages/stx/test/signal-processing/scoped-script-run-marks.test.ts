/**
 * Every scoped script the pipeline emits declares whether it may re-run
 * (stacksjs/stx#1828).
 *
 * On an SPA navigation the router deduplicates already-executed scripts by
 * content hash, EXCEPT scoped ones — those must run again, because
 * cleanupContainer deleted the scope they registered on the way out. Which
 * group a script is in is stated by `data-stx-run` (#1773), and only guessed
 * when that is missing.
 *
 * The guess was a first-character test, so a scoped script opening with a
 * comment was read as run-once and deduped. The x-data reactive bridge does
 * exactly that — its body starts `// STX Reactive Runtime` — and it carries the
 * `initScope` calls that register every x-data scope. Second navigation onward,
 * the scope was never put back and the component silently stopped hydrating.
 *
 * These tests assert the marks at the source, so the router's fallback is never
 * what decides. The direction of each mark matters as much as its presence:
 * marking the animation scripts "always" would leak a matchMedia listener and
 * an IntersectionObserver on every navigation.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: true,
} as never

function render(template: string): Promise<string> {
  return processDirectives(template, {}, '/app/page.stx', base, new Set<string>())
}

/** Every scoped script in the output, excluding the signals runtime itself. */
function scopedScripts(html: string): { attrs: string, body: string }[] {
  const found: { attrs: string, body: string }[] = []
  const re = /<script\b([^>]*\bdata-stx-scoped\b[^>]*)>([\s\S]*?)<\/script>/gi
  for (let m = re.exec(html); m !== null; m = re.exec(html)) {
    if (/\bdata-stx-runtime\b/.test(m[1]))
      continue
    found.push({ attrs: m[1], body: m[2] })
  }
  return found
}

function declarationOf(attrs: string): string {
  return (/data-stx-run\s*=\s*["']?(always|once)["']?/i.exec(attrs) || [])[1]?.toLowerCase() ?? ''
}

describe('the x-data reactive bridge', () => {
  it('declares always, because its initScope calls register scopes', async () => {
    const out = await render(`<main x-data="{ open: false }">
  <button @click="open = !open">t</button>
  <div x-show="open">hi</div>
</main>`)

    const bridge = scopedScripts(out).find(s => /data-stx-reactive/.test(s.attrs))
    expect(bridge).toBeDefined()
    expect(declarationOf(bridge!.attrs)).toBe('always')
  })

  it('is exactly the script the first-character guess got wrong', async () => {
    // Pins WHY the mark is needed. Its body opens with a comment, so the
    // fallback's charAt(0) test reads 'S' and would dedupe it — while the body
    // demonstrably registers a scope.
    const out = await render('<main x-data="{ open: false }"><div x-show="open">hi</div></main>')

    const bridge = scopedScripts(out).find(s => /data-stx-reactive/.test(s.attrs))!
    expect(bridge.body.trimStart().charAt(0)).not.toBe('(')
    expect(bridge.body).toContain('initScope')
  })
})

describe('a component used more than once', () => {
  let dir = ''

  beforeAll(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'stx-run-marks-'))
  })

  afterAll(async () => {
    if (dir)
      await rm(dir, { recursive: true, force: true })
  })

  async function renderTwoCounters(): Promise<string> {
    await Bun.write(`${dir}/components/Counter.stx`, `<script client>
const count = state(0)
function inc() { count.set(count() + 1) }
</script>
<div class="counter"><button @click="inc()">+</button><span :text="count"></span></div>
`)
    return processDirectives(
      '<main><Counter /><Counter /></main>',
      {},
      `${dir}/page.stx`,
      { ...defaultConfig, componentsDir: `${dir}/components`, partialsDir: '/tmp', layoutsDir: '/tmp', autoShell: true } as never,
      new Set<string>(),
    )
  }

  it('declares always on every per-instance factory call', async () => {
    // THE reported bug. Two instances take the shared-factory path: one
    // prelude that registers the factory, then one CALL per instance that
    // registers that instance's scope. The prelude was already marked always
    // — but nothing invokes it, so marking it was not enough. The calls begin
    // `window.__stxComponentFactories[...]`, which the router's fallback sniff
    // rejects, so each was hash-deduped from the first SPA return onward and
    // its scope was never put back.
    const calls = scopedScripts(await renderTwoCounters())
      .filter(s => s.body.includes('__stxComponentFactories[') && !s.body.includes('const factories'))

    expect(calls.length).toBeGreaterThanOrEqual(2)
    for (const call of calls)
      expect(declarationOf(call.attrs)).toBe('always')
  })

  it('registers a scope per instance, which is why they must re-run', async () => {
    // Pins the premise rather than assuming it: each call names a scope id
    // that a root element carries, and cleanupContainer deletes exactly those.
    const out = await renderTwoCounters()
    const roots = out.match(/data-stx-scope="([^"]+)"/g) ?? []

    expect(roots.length).toBeGreaterThanOrEqual(2)
    for (const call of scopedScripts(out).filter(s => /__stxComponentFactories\[[^\]]+\]\(/.test(s.body))) {
      const scopeId = /__stxComponentFactories\[[^\]]+\]\("([^"]+)"\)/.exec(call.body)?.[1]
      if (scopeId)
        expect(out).toContain(`data-stx-scope="${scopeId}"`)
    }
  })
})

describe('run-once scripts say so', () => {
  it('marks the STX lifecycle runtime once', async () => {
    // It defines window.STX and the Map of live component instances behind it.
    // Re-running would replace both and orphan everything registered so far.
    const out = await render(`<script client>
STX.useRefs()
</script>
<main><h1>Hi</h1></main>`)

    const lifecycle = scopedScripts(out).find(s => s.body.includes('STX Lifecycle Runtime'))
    if (lifecycle)
      expect(declarationOf(lifecycle.attrs)).toBe('once')
  })
})

describe('nothing is left to the guess', () => {
  it('declares a run mark on every scoped script it emits', async () => {
    // The durable half. A new emitter that forgets the mark falls back to a
    // sniff that cannot see what its script registers, and the failure is
    // silent — a component that stops hydrating on the second navigation.
    const pages = [
      '<main x-data="{ open: false }"><div x-show="open">hi</div></main>',
      '<script client>\nconst n = state(0)\n</script>\n<main><span :text="n"></span></main>',
      '@appearanceBootstrap\n<main><h1>Hi</h1></main>',
    ]

    const undeclared: string[] = []
    for (const page of pages) {
      for (const script of scopedScripts(await render(page))) {
        // Setup functions are exempt by name: the router re-runs anything
        // containing __stx_setup_ regardless of its mark.
        if (script.body.includes('__stx_setup_'))
          continue
        if (!declarationOf(script.attrs))
          undeclared.push(script.body.trimStart().slice(0, 70).replace(/\n/g, '\\n'))
      }
    }

    expect(undeclared).toEqual([])
  })
})
