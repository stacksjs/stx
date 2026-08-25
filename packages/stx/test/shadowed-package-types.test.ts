/**
 * A hand-written `declare module 'pkg'` overrides that package's real types.
 *
 * `packages/stx/src/cwcss-crosswind.d.ts` declared `@cwcss/crosswind` with a
 * three-member `CSSGenerator` that had no `toCSS` and a `generate` returning
 * string. The installed engine has had `toCSS` and a void `generate` for
 * releases. Because an ambient module declaration wins over the resolved
 * package for a bare specifier, every call in `serve.ts` was checked against
 * the fiction — so the compiler could not see that `new cw.CSSGenerator(...)`
 * had been widened to `unknown`, and main went red on a change that merely
 * exposed it.
 *
 * That is the whole failure mode: the stub does not collide with the real
 * types, it replaces them, silently, for the entire program. There is no
 * diagnostic, and the wrongness scales with how stale the stub is.
 *
 * Declaring a module for a package that ships NO types is the legitimate use
 * (`sharp` and `ts-videos` below are optional and not installed). Declaring one
 * for a package that ships its own is always a bug in waiting.
 */

import { describe, expect, it } from 'bun:test'
import { Glob } from 'bun'
import fs from 'node:fs'
import path from 'node:path'

const REPO = path.resolve(import.meta.dir, '../../..')

/**
 * Packages already shadowed when this guard was written. Each ships its own
 * types, so each carries the same latent drift as the crosswind stub did — none
 * has been checked against its real declarations yet. The list exists to stop
 * NEW ones, and it should only ever shrink.
 *
 * `craft-native` was listed here at first and does not belong. Its
 * `declare module` lives in `_bridge.ts`, which has top-level exports, so it is
 * a module AUGMENTATION that merges with the published types rather than an
 * ambient declaration that replaces them — deliberately so, per the comment
 * there about hitting TS2717. That distinction is the whole difference between
 * this bug and a normal widening, so the `observed` test below now fails on any
 * entry the scan cannot actually find.
 */
const KNOWN_SHADOWED = new Set([
  '@stacksjs/ts-i18n',
  'ts-images',
])

/** A bare package specifier — not a wildcard (`*.stx`) and not relative. */
function isPackageSpecifier(spec: string): boolean {
  return /^(?:@[\w.-]+\/)?[\w.-]+$/.test(spec)
}

/** True when the installed package ships type declarations of its own. */
function shipsOwnTypes(pkg: string): boolean {
  const dir = path.join(REPO, 'node_modules', pkg)
  const manifest = path.join(dir, 'package.json')
  if (!fs.existsSync(manifest))
    return false
  try {
    const json = JSON.parse(fs.readFileSync(manifest, 'utf-8'))
    if (json.types || json.typings)
      return true
    return fs.existsSync(path.join(dir, 'dist', 'index.d.ts')) || fs.existsSync(path.join(dir, 'index.d.ts'))
  }
  catch {
    return false
  }
}

/**
 * Every first-party `declare module '<bare specifier>'`, as {file, specifier}.
 *
 * Throws when the scan matches no files at all. A guard that reads nothing
 * reports success for a surface it never looked at, which is the same class of
 * defect it is meant to catch.
 */
function ambientModuleDeclarations(): Array<{ file: string, specifier: string }> {
  const found: Array<{ file: string, specifier: string }> = []
  let filesScanned = 0

  for (const rel of new Glob('packages/*/src/**/*.d.ts').scanSync(REPO)) {
    filesScanned++
    const text = fs.readFileSync(path.join(REPO, rel), 'utf-8')
    for (const m of text.matchAll(/^declare module ['"]([^'"]+)['"]/gm)) {
      const specifier = m[1]
      if (isPackageSpecifier(specifier))
        found.push({ file: rel, specifier })
    }
  }

  if (filesScanned === 0)
    throw new Error('scanned no .d.ts files under packages/*/src — the glob is wrong, not the tree')

  return found
}

describe('hand-written ambient module declarations', () => {
  it('finds the .d.ts files it is meant to read', () => {
    // The sabotage check for the assertions below: if the glob silently matched
    // nothing, "no package is shadowed" would pass for the wrong reason.
    const all = ambientModuleDeclarations()
    expect(all.length).toBeGreaterThan(0)
  })

  it('does not shadow a package that ships its own types', () => {
    const offenders = ambientModuleDeclarations()
      .filter(d => !KNOWN_SHADOWED.has(d.specifier))
      .filter(d => shipsOwnTypes(d.specifier))
      .map(d => `${d.file} declares '${d.specifier}', which ships its own types`)

    expect(offenders).toEqual([])
  })

  it('no longer declares @cwcss/crosswind, which shipped types all along', () => {
    // The specific regression. Deleting the stub is what let `serve.ts` be
    // typed from `typeof import('@cwcss/crosswind')` instead of a stale copy.
    const specifiers = ambientModuleDeclarations().map(d => d.specifier)
    expect(specifiers).not.toContain('@cwcss/crosswind')
    expect(shipsOwnTypes('@cwcss/crosswind')).toBe(true)
  })

  it('keeps the allowlist honest — every entry is one the scan actually finds', () => {
    // An entry the glob can never produce is worse than no entry: it records
    // debt that does not exist and quietly widens the rule for a name nothing
    // checks. `craft-native` was exactly that — its declaration is in a .ts
    // module, not a .d.ts, and it augments rather than replaces.
    const seen = new Set(ambientModuleDeclarations().map(d => d.specifier))
    const phantom = [...KNOWN_SHADOWED].filter(pkg => !seen.has(pkg))

    expect(phantom).toEqual([])
  })

  it('keeps the allowlist honest — every entry still ships its own types', () => {
    // If one of these stops shipping types, or stops being installed, its
    // declaration becomes legitimate and the entry should be dropped rather
    // than left to imply debt that no longer exists.
    const stale = [...KNOWN_SHADOWED].filter(pkg => !shipsOwnTypes(pkg))
    expect(stale).toEqual([])
  })
})
