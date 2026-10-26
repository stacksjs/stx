import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

/**
 * A regex literal does not hide the declarations after it.
 *
 * Scope registration found top-level names by scanning the script for
 * strings, template literals and comments, with no notion of a regex
 * literal. A quote inside one (`/['"]/g`, a common slug cleaner) read as
 * the start of a string, the scan skipped to the next quote, and every
 * top-level function after it went unregistered. A template handler naming
 * one of them then resolved to nothing: in a Stacks dashboard dialog the
 * form's `@submit.prevent="submit"` never ran, and the parent received the
 * native submit event instead of the emitted draft.
 */
describe('scope registration across regex literals', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('registers the functions declared after a regex holding quotes, slashes and brackets', async () => {
    const componentFile = path.join(TEMP_DIR, 'components', 'SlugForm.stx')
    await Bun.write(componentFile, `
      <form @submit.prevent="submit"><input x-model="name" /></form>

      <script client>
        const { state } = window.stx
        const name = state('')

        function slugify(value) {
          return value.replace(/['"]/g, '').replace(/[^a-z0-9/]+/g, '-').replace(/\\/+$/, '')
        }

        const ratio = 10 / 2 / 5

        function submit() {
          return slugify(name()) + ratio
        }

        function reset() {
          name.set('')
        }
      </script>
    `)

    const testFile = await createTestFile('scope-regex-literals.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Scope Regex Literals</title></head>
      <body>
        <SlugForm />
      </body>
      </html>
    `)

    const result = await Bun.build({ entrypoints: [testFile], outdir: OUTPUT_DIR, plugins: [stxPlugin()] })
    const html = await getHtmlOutput(result)

    const registered = (declared: string) => html.includes(`__localVars['${declared}']`) || html.includes(`__localVars, '${declared}'`)
    expect(['name', 'slugify', 'ratio', 'submit', 'reset'].filter(declared => !registered(declared))).toEqual([])
  })
})
