/**
 * `/assets/*` resolves in built output, not only under `stx dev`
 * (stacksjs/stx#1876).
 *
 * `serve()` resolves `/assets/x` from `resources/assets/x` as well as from
 * `publicDir` — the Stacks/Laravel layout that `buddy make:*` produces. No
 * build path had ever heard of it: all three copy `publicDir` and nothing else.
 *
 * So `<script src="/assets/scripts/site-mode.js">` worked in dev and 404'd in
 * `dist/`, with nothing in the build reporting it. The reporter found it by
 * diffing build output against the served tree, which is the only way it was
 * findable — and on a static deploy it silently disabled a feature on 27 pages.
 *
 * There are three builders with three different copy mechanisms, which is why
 * the convention itself lives in one module rather than being restated in each:
 * a rule written three times gets fixed in one place and left behind in the
 * other two.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  CONVENTIONAL_ASSET_OUTPUT,
  CONVENTIONAL_ASSET_ROOT,
  resolveConventionalAssetRoot,
} from '../../src/asset-roots'

let dir = ''
const originalCwd = process.cwd()

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'stx-asset-root-'))
  await Bun.write(path.join(dir, 'pages', 'index.stx'), '<main><h1>Home</h1></main>\n')
  await Bun.write(path.join(dir, 'public', 'img', 'logo.txt'), 'x\n')
  await Bun.write(path.join(dir, CONVENTIONAL_ASSET_ROOT, 'scripts', 'site-mode.js'), 'console.log(1)\n')
})

afterEach(async () => {
  process.chdir(originalCwd)
  if (dir)
    await rm(dir, { recursive: true, force: true })
})

describe('resolveConventionalAssetRoot', () => {
  it('finds the directory when the project uses that layout', () => {
    expect(resolveConventionalAssetRoot(dir)).toBe(path.resolve(dir, CONVENTIONAL_ASSET_ROOT))
  })

  it('returns null when it does not', async () => {
    const bare = await mkdtemp(path.join(tmpdir(), 'stx-no-assets-'))
    try {
      expect(resolveConventionalAssetRoot(bare)).toBeNull()
    }
    finally {
      await rm(bare, { recursive: true, force: true })
    }
  })

  it('mirrors the path serve() rewrites to', () => {
    // If these drift, the build copies from somewhere the server never reads.
    expect(CONVENTIONAL_ASSET_ROOT).toBe('resources/assets')
    expect(CONVENTIONAL_ASSET_OUTPUT).toBe('assets')
  })
})

describe('the static build', () => {
  it('emits the file the reported page asked for', async () => {
    process.chdir(dir)
    const { generateStaticSite } = await import('../../src/ssg')
    await generateStaticSite({ pagesDir: 'pages', outputDir: 'dist', publicDir: 'public' })

    expect(existsSync(path.join(dir, 'dist', 'assets', 'scripts', 'site-mode.js'))).toBe(true)
  })

  it('still copies publicDir', async () => {
    // The conventional root is additive; it must not displace what already
    // worked.
    process.chdir(dir)
    const { generateStaticSite } = await import('../../src/ssg')
    await generateStaticSite({ pagesDir: 'pages', outputDir: 'dist', publicDir: 'public' })

    expect(existsSync(path.join(dir, 'dist', 'img', 'logo.txt'))).toBe(true)
  })

  it('does not fail a project that has no such directory', async () => {
    await rm(path.join(dir, 'resources'), { recursive: true, force: true })
    process.chdir(dir)
    const { generateStaticSite } = await import('../../src/ssg')

    expect(async () => generateStaticSite({ pagesDir: 'pages', outputDir: 'dist', publicDir: 'public' })).not.toThrow()
  })
})

describe('the production build', () => {
  it('emits it under public/, where the server looks', async () => {
    const { buildForProduction } = await import('../../src/production-builder')
    await buildForProduction({ root: dir, outputDir: '.output', publicDir: 'public' })

    expect(existsSync(path.join(dir, '.output', 'public', 'assets', 'scripts', 'site-mode.js'))).toBe(true)
    expect(existsSync(path.join(dir, '.output', 'public', 'img', 'logo.txt'))).toBe(true)
  })
})
