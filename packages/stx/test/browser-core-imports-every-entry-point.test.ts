/**
 * Every client-script entry point injects browser core imports.
 *
 * A called browser helper becomes a real `import { … } from '@stacksjs/browser'`
 * before the bundler runs, so the helper is inlined into the script. Without
 * that import the later destructure pass binds the name off
 * `window.StacksBrowser` — a global nothing in the pipeline populates — and the
 * helper is undefined for the life of the page, reported on every navigation by
 * the auto-import guard.
 *
 * There are three entry points, and includes.ts was the one without it:
 *
 *   processClientScript (client-script.ts)  page-level <script client>
 *   the component path  (utils.ts)          .stx components
 *   the include path    (includes.ts)       @include'd components
 *
 * Dashboard/UI/Table.stx reaches a page through the third, and calls
 * useObjectUrl for its export link — so every dashboard table shipped a
 * reference to a helper nothing supplied.
 *
 * Asserted against the source rather than by driving a render: the failure is a
 * missing call in one branch, and this states exactly that in a way that reads
 * as the requirement rather than as a fixture.
 */
import { describe, expect, it } from 'bun:test'
import { injectBrowserCoreAutoImports } from '../src/client-script'

const ENTRY_POINTS = [
  'src/client-script.ts',
  'src/utils.ts',
  'src/includes.ts',
]

describe('browser core imports reach every client-script entry point', () => {
  for (const file of ENTRY_POINTS) {
    it(`${file} injects before deciding whether to bundle`, async () => {
      const source = await Bun.file(new URL(`../${file}`, import.meta.url).pathname).text()

      const injectAt = source.indexOf('injectBrowserCoreAutoImports(')
      expect(injectAt).toBeGreaterThan(-1)

      // Order matters as much as presence: the injected import is what gives
      // hasUserImports something to find, so injecting after the check would
      // leave the script unbundled with an import statement in it.
      const checkAt = source.indexOf('hasUserImports(')
      if (checkAt > -1)
        expect(injectAt).toBeLessThan(checkAt)
    })
  }

  it('converts the call Table.stx actually makes', () => {
    const code = [
      '// useObjectUrl owns URL revocation while the link owns the click',
      'const exportBlob = ref(null)',
      'const exportUrl = useObjectUrl(exportBlob)',
    ].join('\n')

    const result = injectBrowserCoreAutoImports(code)
    expect(result.imports).toContain('useObjectUrl')
    expect(result.code).toContain("import { useObjectUrl } from '@stacksjs/browser'")
  })

  it('leaves a script that only mentions a helper untouched', () => {
    // The guard against injecting off prose, which would put an unresolvable
    // import into a compiled binary.
    const result = injectBrowserCoreAutoImports('// useObjectUrl is documented here\nconst a = 1')
    expect(result.imports).toEqual([])
    expect(result.code).not.toContain('@stacksjs/browser')
  })
})
