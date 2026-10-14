import { describe, expect, it } from 'bun:test'
import { BROWSER_CORE_IMPORTS, generateBrowserAutoImportsDts } from '../src/browser-core-imports'

const declarationFile = await Bun.file(new URL('../browser-auto-imports.d.ts', import.meta.url)).text()

describe('browser auto-import declarations', () => {
  it('is generated from the injector manifest', () => {
    expect(declarationFile).toBe(generateBrowserAutoImportsDts())
  })

  it('declares every injected browser helper exactly once', () => {
    const names = [...declarationFile.matchAll(/^declare const (\w+): any$/gm)].map(match => match[1])
    expect(names).toEqual([...BROWSER_CORE_IMPORTS])
  })
})
