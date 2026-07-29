import { describe, expect, it } from 'bun:test'
import { extractServerScriptsFromTemplate } from '../src/serve'

describe('server script extraction', () => {
  it('keeps tag examples inside client script comments inert', () => {
    const source = `<script server>
export const initial = 1
</script>
<script client>
const count = state(initial)
// This data moved out of a former <script server> block.
const active = derived(() => count() > 0)
</script>
<main>{{ count }}</main>`

    const result = extractServerScriptsFromTemplate(source)

    expect(result.serverScripts).toEqual(['\nexport const initial = 1\n'])
    expect(result.templateContent).toContain('<script client>')
    expect(result.templateContent).toContain('former <script server> block')
    expect(result.templateContent).toContain('const active = derived')
    expect(result.templateContent).not.toContain('export const initial = 1')
  })

  it('ignores script examples inside HTML comments', () => {
    const source = `<!-- <script server>fake()</script> -->
<script client>const value = state(1)</script>`

    const result = extractServerScriptsFromTemplate(source)

    expect(result.serverScripts).toEqual([])
    expect(result.templateContent).toBe(source)
  })
})
