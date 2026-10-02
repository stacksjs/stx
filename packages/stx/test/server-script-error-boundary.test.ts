/**
 * A component whose `<script server>` failed says so where it was
 * (stacksjs/stx#1991).
 *
 * `81f6dd8248` made the failure audible: the console now names the file and
 * the cause instead of staying silent behind STX_DEBUG. What it did not change
 * is that the component is still a hole. The markup skeleton survives, every
 * `{{ }}` that depended on the script resolves to nothing, and the page answers
 * 200 - so the symptom reads as a layout or styling bug, and nobody looks at a
 * terminal to diagnose a missing card.
 *
 * Development only. In production a page must not grow a diagnostic, and under
 * test it would rewrite the output of every suite that renders a deliberately
 * broken script.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../src/process'
import { extractVariables, isMissingBindingFailure, isModuleResolutionFailure } from '../src/variable-extractor'

let originalNodeEnv: string | undefined
let originalWarn: typeof console.warn

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV
  originalWarn = console.warn
  // The boundary is development-only and `bun test` sets NODE_ENV=test, so the
  // environment is part of the fixture. Restored exactly in afterEach: one
  // process runs every test file, and a leaked NODE_ENV would decide whether
  // an unrelated suite takes its production branch.
  process.env.NODE_ENV = 'development'
  console.warn = () => {}
})

afterEach(() => {
  if (originalNodeEnv === undefined)
    delete process.env.NODE_ENV
  else
    process.env.NODE_ENV = originalNodeEnv
  console.warn = originalWarn
})

async function render(script: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-server-script-boundary-'))
  const file = path.join(root, 'Widget.stx')
  const source = `<div class="wrapper">
  <script server>
  ${script}
  </script>
  <p id="out">{{ value }}</p>
</div>`
  await Bun.write(file, source)
  return processDirectives(source, {}, file, {} as never)
}

const BOUNDARY = 'data-stx-server-script-error'

describe('a failed server script renders a boundary in development', () => {
  it('shows a module that does not resolve, with the cause', async () => {
    // The reported case: a dependency importing a package it had not declared.
    const html = await render(`import { highlight } from 'ts-syntax-highlighter-missing'\nconst value = highlight('x')`)
    expect(html).toContain(BOUNDARY)
    expect(html).toContain('imports a module that does not resolve')
    expect(html).toContain('ts-syntax-highlighter-missing')
    expect(html).toContain('Widget.stx')
  })

  it('shows a script that does not parse', async () => {
    const html = await render(`const value = (((`)
    expect(html).toContain(BOUNDARY)
    expect(html).toContain('does not parse')
  })

  it('shows a script that names something that does not exist', async () => {
    const html = await render(`const value = thisFunctionDoesNotExist()`)
    expect(html).toContain(BOUNDARY)
    expect(html).toContain('names something that does not exist')
  })

  it('escapes the cause rather than splicing it into the page', async () => {
    const html = await render(`const value = thisFunctionDoesNotExist('<img src=x onerror=alert(1)>')`)
    expect(html).toContain(BOUNDARY)
    expect(html).not.toContain('<img src=x')
  })

  it('leaves a script reaching for a browser global alone', async () => {
    // The legitimate quiet case. A page that only uses client APIs fails here
    // on `window` or `document` by design, and a boundary on every one of those
    // would be wrong on pages that work.
    for (const global of ['window.location.href', 'document.title', 'navigator.userAgent']) {
      const html = await render(`const value = ${global}`)
      expect(html).not.toContain(BOUNDARY)
    }
  })

  it('leaves a working script alone', async () => {
    const html = await render(`const value = 'hello'`)
    expect(html).not.toContain(BOUNDARY)
    expect(html).toContain('hello')
  })

  it('renders nothing extra in production', async () => {
    process.env.NODE_ENV = 'production'
    const html = await render(`const value = thisFunctionDoesNotExist()`)
    expect(html).not.toContain(BOUNDARY)
  })
})

describe('extractVariables reports a failure to its caller', () => {
  async function kindOf(script: string): Promise<string | undefined> {
    const kinds: string[] = []
    await extractVariables(script, {}, `/tmp/stx-kind-${crypto.randomUUID()}/Widget.stx`, {
      onFailure: failure => kinds.push(failure.kind),
    })
    return kinds[0]
  }

  it('classifies the failure so a caller can decide what to show', async () => {
    expect(await kindOf(`import { x } from 'package-that-does-not-exist-xyz'`)).toBe('module-resolution')
    expect(await kindOf(`const value = (((`)).toBe('syntax')
    expect(await kindOf(`const value = thisFunctionDoesNotExist()`)).toBe('missing-binding')
  })

  it('leaves a browser global unclassified, which is what keeps it off the page', () => {
    // Asserted on the predicate rather than by running such a script: this
    // suite has a DOM, so `window.location.href` succeeds here and would prove
    // nothing about the classification that suppresses the boundary.
    expect(isMissingBindingFailure('thisFunctionDoesNotExist is not defined')).toBe(true)
    for (const global of ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'self'])
      expect(isMissingBindingFailure(`${global} is not defined`)).toBe(false)
  })

  it('says nothing when the script succeeds', async () => {
    expect(await kindOf(`const value = 'hello'`)).toBeUndefined()
  })
})

describe('isModuleResolutionFailure', () => {
  it('recognises the message an unresolved ESM import actually produces', () => {
    // Only `require()` says "module". An ESM import says "package", which is
    // the form the reported failure took, so it was classified as an unknown
    // failure and got the generic warning instead of the one naming the cause.
    expect(isModuleResolutionFailure(`Cannot find package 'bunfig' imported from /app/dist/index.js`)).toBe(true)
    expect(isModuleResolutionFailure(`Cannot find module 'bunfig'`)).toBe(true)
    expect(isModuleResolutionFailure('Could not resolve: "bunfig"')).toBe(true)
    expect(isModuleResolutionFailure('Failed to resolve module specifier')).toBe(true)
  })

  it('does not claim an unrelated failure', () => {
    expect(isModuleResolutionFailure('thisFunctionDoesNotExist is not defined')).toBe(false)
    expect(isModuleResolutionFailure('Unexpected end of input')).toBe(false)
  })
})
