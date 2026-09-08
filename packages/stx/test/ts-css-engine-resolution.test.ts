import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

/**
 * The utility-CSS engine has shipped under three package names: it now lives
 * at the `engine` subpath of `@stacksjs/ts-css`, which absorbed it, and before
 * that it was standalone as `@stacksjs/ts-css` and `@stacksjs/ts-css`.
 *
 * The loader probes a fixed table of paths, so a wrong entry fails the way a
 * missing engine does — silently, with every utility class compiling to
 * nothing — rather than by throwing. These tests plant a real package layout
 * on disk and check the loader actually finds it.
 */

const LOADER = path.join(import.meta.dir, '..', 'src', 'dev-server', 'ts-css.ts')

const cwd = process.cwd()
const created: string[] = []

afterEach(async () => {
  process.chdir(cwd)
  for (const dir of created.splice(0))
    await rm(dir, { recursive: true, force: true })
})

/** A project whose store holds an engine at `relPath`, marked with `marker`. */
async function projectWithEngine(relPath: string[], marker: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'stx-engine-'))
  created.push(dir)
  const file = path.join(dir, 'node_modules', ...relPath)
  mkdirSync(path.dirname(file), { recursive: true })
  await writeFile(
    file,
    `export class CSSGenerator { marker = ${JSON.stringify(marker)}; generate() {} toCSS() { return '' } }\n`
    + `export const config = { marker: ${JSON.stringify(marker)} }\n`,
  )
  return dir
}

/** Fresh module instance — the loader memoises its result per module. */
async function freshLoader(): Promise<any> {
  return import(`${LOADER}?resolution-test=${Math.random()}`)
}

describe('engine resolution', () => {
  test('finds the engine at the @stacksjs/ts-css subpath', async () => {
    const dir = await projectWithEngine(['@stacksjs', 'ts-css', 'dist', 'engine', 'index.js'], 'ts-css-engine')
    process.chdir(dir)

    const { loadCssEngine } = await freshLoader()
    const mod = await loadCssEngine()

    expect(mod).not.toBeNull()
    expect(new mod.CSSGenerator({}).marker).toBe('ts-css-engine')
  })

  test('finds the engine from a source checkout layout', async () => {
    const dir = await projectWithEngine(['@stacksjs', 'ts-css', 'src', 'engine', 'index.ts'], 'from-src')
    process.chdir(dir)

    const { loadCssEngine } = await freshLoader()
    const mod = await loadCssEngine()

    expect(mod).not.toBeNull()
    expect(new mod.CSSGenerator({}).marker).toBe('from-src')
  })

  test('prefers the built engine over a source checkout', async () => {
    const dir = await projectWithEngine(['@stacksjs', 'ts-css', 'dist', 'engine', 'index.js'], 'from-dist')
    const src = path.join(dir, 'node_modules', '@stacksjs', 'ts-css', 'src', 'engine', 'index.ts')
    mkdirSync(path.dirname(src), { recursive: true })
    await writeFile(src, 'export class CSSGenerator { marker = \'from-src\' }\nexport const config = {}\n')
    process.chdir(dir)

    const { loadCssEngine } = await freshLoader()
    const mod = await loadCssEngine()

    expect(new mod.CSSGenerator({}).marker).toBe('from-dist')
  })
})
