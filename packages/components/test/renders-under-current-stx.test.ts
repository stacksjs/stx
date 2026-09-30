/**
 * Every component renders under the CURRENT stx, and every script it emits is
 * JavaScript.
 *
 * The suite around this one is 45 files of which three ever rendered anything:
 * the rest read the .stx source as text and assert that a class name or an
 * attribute is present in it. That cannot catch a change in stx -- the source
 * is identical either way -- so the library could break against its own engine
 * with every test still green. It did: `<StepperStep />` with no stepNumber
 * emitted `const stepNumber = {{ stepNumber }}` into its client script, a
 * SyntaxError that took the scope down and left the step's click dead, and
 * `<Switch size="huge">` did the same through an unknown size key.
 *
 * Both are one failure mode: a server value that is undefined leaves its
 * mustache in the JavaScript. Nothing on the client re-reads a mustache inside
 * a script, so it is never anything but a syntax error -- which is why parsing
 * what is emitted, rather than pattern-matching it, is the assertion.
 *
 * Rendering with NO props on purpose: a component library is used by people who
 * pass the props they care about and leave the rest out, so every optional prop
 * is undefined in some real page.
 */
import { describe, expect, it } from 'bun:test'
import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
// `../../stx/src`, never the package entry: `@stacksjs/stx` resolves to
// packages/stx/dist, a build that lags the source, so a suite pointed there
// reports on the last build instead of on the engine as it stands right now --
// the one thing this file exists to check. (The CodeBlock failure that first
// showed up here was exactly that: stale dist, current source fine.)
import { processDirectives } from '../../stx/src/process'

const ROOT = path.resolve(import.meta.dir, '..')

function componentFiles(): string[] {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return entry.endsWith('.stx') ? [full] : []
  })
  return [...walk(path.join(ROOT, 'src/ui')), ...walk(path.join(ROOT, 'src/components'))]
}

async function render(tag: string, dir: string): Promise<string> {
  return processDirectives(
    tag,
    {},
    path.join(ROOT, 'render-audit.stx'),
    { componentsDir: dir, root: ROOT, buildMode: 'serve', cache: false } as any,
    new Set<string>(),
  )
}

/** Scripts the browser will parse: not external, not JSON, not a waiting island. */
function executableScripts(html: string): string[] {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !/\bsrc\s*=/.test(attrs) && !/application\/json/.test(attrs) && !/stx\/island/.test(attrs))
    .map(([, , body]) => body)
    .filter(body => body.trim() !== '')
}

const files = componentFiles()

describe('every component renders under the current stx', () => {
  it('finds the whole library, so a move cannot quietly shrink this suite', () => {
    expect(files.length).toBeGreaterThan(95)
  })

  for (const file of files) {
    const name = path.basename(file, '.stx')

    it(`${name} emits only parseable script`, async () => {
      const html = await render(`<${name} />`, path.dirname(file))
      for (const body of executableScripts(html)) {
        // The whole point: `new Function` fails on exactly what the browser
        // would fail on, and names the token.
        const parse = (): unknown => new Function(body)
        const leftover = body.match(/\{\{[\s\S]{0,40}?\}\}/)
        expect(leftover, `unresolved ${leftover?.[0]} survived into JavaScript`).toBeNull()
        expect(parse).not.toThrow()
      }
    })
  }
})

describe('a prop the caller got wrong does not kill the component', () => {
  // An unknown enum value is a typo, not a reason to ship broken JavaScript.
  const typos = [
    ['Switch', 'src/ui/switch', '<Switch size="huge" />'],
    ['Button', 'src/ui/button', '<Button variant="fancy" size="enormous" />'],
    ['Badge', 'src/ui/badge', '<Badge variant="nope" />'],
    ['Spinner', 'src/ui/spinner', '<Spinner size="gigantic" />'],
  ] as const

  for (const [name, dir, tag] of typos) {
    it(`${name} survives an unknown enum value`, async () => {
      const html = await render(tag, path.join(ROOT, dir))
      for (const body of executableScripts(html)) {
        expect(body.match(/\{\{[\s\S]{0,40}?\}\}/)).toBeNull()
        expect(() => new Function(body)).not.toThrow()
      }
      expect(html).not.toContain('[Error loading component')
    })
  }
})
