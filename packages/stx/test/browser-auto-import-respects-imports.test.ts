/**
 * A name the author already imported is not also destructured off the runtime
 * global.
 *
 * transformAutoImports recognises imports from `stx`, `@stacksjs/stx` and
 * `@stacksjs/browser`, and several of these helpers are re-exported by more
 * than one package. An import from anywhere else was invisible to it, so
 *
 *   import { useObjectUrl } from '@stacksjs/composables'
 *   const url = useObjectUrl(blob)
 *
 * kept its import AND picked up `var { useObjectUrl } = window.StacksBrowser || {}`
 * from the auto-import wrapper. The var shadows the imported binding with
 * undefined for the life of the page, and the auto-import guard then reports a
 * helper the author had imported correctly.
 *
 * An import from `@stacksjs/browser` still routes through auto-import: that one
 * IS the contract, and the wrapper strips the statement and rebinds the name off
 * the global on purpose.
 */
import { describe, expect, it } from 'bun:test'
import { transformAutoImports } from '../src/client-script'

const browserImportsFor = (code: string): string[] => transformAutoImports(code).browserImports

describe('auto-import defers to an existing import', () => {
  it('does not re-bind a helper imported from another package', () => {
    const code = "import { useObjectUrl } from '@stacksjs/composables'\nconst url = useObjectUrl(blob)"
    expect(browserImportsFor(code)).not.toContain('useObjectUrl')
  })

  it('does not re-bind one imported from an unrelated package', () => {
    const code = "import { debounce } from 'lodash-es'\nconst run = debounce(fn, 100)"
    expect(browserImportsFor(code)).not.toContain('debounce')
  })

  it('honours an aliased import', () => {
    const code = "import { useTimeoutFn as timeout } from '@stacksjs/composables'\nconst t = timeout(fn, 5)"
    expect(browserImportsFor(code)).not.toContain('useTimeoutFn')
  })

  it('still auto-imports a bare call with no import at all', () => {
    expect(browserImportsFor('const url = useObjectUrl(blob)')).toContain('useObjectUrl')
  })

  it('still routes an @stacksjs/browser import through auto-import', () => {
    // That package is the auto-import contract: the wrapper strips the
    // statement and rebinds off window.StacksBrowser deliberately.
    const code = "import { useObjectUrl } from '@stacksjs/browser'\nconst url = useObjectUrl(blob)"
    expect(browserImportsFor(code)).toContain('useObjectUrl')
  })
})
