/**
 * A template name declared where the template cannot see it (stacksjs/stx#2211).
 *
 * The page's template binds to the client setup's top-level names only. A
 * signal declared inside an IIFE, or a helper declared inside a function,
 * resolves to nothing, and `stx typecheck` could only say "Cannot find name".
 * It now says where the name was declared and why the template cannot reach it.
 */
import { afterAll, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { createTempDir } from '../../src/temp-dir'
import { nestedClientDeclarationLine, typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = createTempDir('stx-nested-decl-')

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

const PAGE = `<script client>
const top = state(1)
;(() => {
  // const hidden = 'a comment is not a declaration'
  const hidden = state('x')
  function inner() { return 1 }
})()
</script>
<main>
  <p :text="top()"></p>
  <p :text="hidden()"></p>
  <button @click="inner()">go</button>
  <p :text="nowhere()"></p>
</main>
`

describe('a name the template cannot see', () => {
  it('is reported with the line it was declared on', async () => {
    const file = join(dir, 'page.stx')
    await Bun.write(file, PAGE)
    const result = await typecheckStxFiles([file])
    const errors = (result.diagnostics ?? []).filter(d => d.category === 'error').map(d => [d.line, d.message])
    expect(errors).toHaveLength(3)
    expect(errors[0]![0]).toBe(11)
    expect(errors[0]![1]).toStartWith(`Cannot find name 'hidden'. 'hidden' is declared inside a function or block of the client script (line 5)`)
    expect(errors[1]![1]).toContain(`'inner' is declared inside a function or block of the client script (line 6)`)
    // A name declared nowhere keeps the plain message.
    expect(errors[2]![1]).toBe(`Cannot find name 'nowhere'.`)
  })
})

describe('finding the nested declaration', () => {
  it('ignores top-level declarations, comments and strings', () => {
    const source = `<script client>\nconst a = 1\nconst s = 'const b = 2'\n// let b = 3\nif (x) { let b = 4 }\n</script>`
    expect(nestedClientDeclarationLine(source, 'a')).toBeNull()
    expect(nestedClientDeclarationLine(source, 'b')).toBe(5)
  })

  it('does not look in a server script, which the template reads by another route', () => {
    expect(nestedClientDeclarationLine(`<script server>\nfunction f() { const t = 1 }\n</script>`, 't')).toBeNull()
  })

  it('treats a name that merely starts the same as a different name', () => {
    expect(nestedClientDeclarationLine(`<script client>\n{ const hiddener = 1 }\n</script>`, 'hidden')).toBeNull()
    expect(nestedClientDeclarationLine(`<script client>\n{ const $x = 1 }\n</script>`, '$x')).toBe(2)
  })
})
