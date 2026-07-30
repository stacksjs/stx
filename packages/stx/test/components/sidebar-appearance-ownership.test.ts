import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

/**
 * Who owns the document's color scheme.
 *
 * The Sidebar mirrors `prefers-color-scheme` onto the root element's `dark`
 * class, because a native sidebar follows the system appearance and Crosswind's
 * `dark:` variants are class-based. That is defensible only while nothing else
 * wants the job — and an app with its own light/dark control very much does.
 *
 * Before `follow-system-appearance`, the only way to stop it was a `data-theme`
 * attribute on the root, which appears nowhere in the component's API. An app
 * that set `.dark` itself watched the sidebar undo it on mount with nothing to
 * suggest why; the fix was findable only by reading the component's source.
 */

const componentsDir = path.resolve(__dirname, '../../../components/src/ui/sidebar')
const pagePath = path.resolve(__dirname, '../../../components/examples/__test__.stx')

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, pagePath, { componentsDir } as any, new Set<string>())
}

const SECTIONS = `[{ id: 's', items: [{ id: 'a', label: 'A' }] }]`

/** The controller script, without its <script> tags. */
function controller(html: string): string {
  const blocks = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  return (blocks.find(block => block.includes('followSystemAppearanceProp')) || '')
    .replace(/<\/?script[^>]*>/gi, '')
}

describe('sidebar appearance ownership', () => {
  it('mirrors the OS appearance by default', async () => {
    const result = await render(`<body><Sidebar placement="static" :sections="${SECTIONS}" /></body>`)
    const script = controller(result)

    expect(script).toContain('followSystemAppearanceProp = true')
    // The class write is still there — a sidebar with no theme controller
    // around it has to keep working.
    expect(script).toMatch(/classList\.toggle\(["']dark["']/)
  })

  it('stands down when the app owns its own light/dark control', async () => {
    const result = await render(
      `<body><Sidebar placement="static" :follow-system-appearance="false" :sections="${SECTIONS}" /></body>`,
    )
    const script = controller(result)

    expect(script).toContain('followSystemAppearanceProp = false')
    // Guarded before the listener is installed, so it neither writes on mount
    // nor reacts to a later OS change.
    expect(script).toMatch(/if\s*\(!followSystemAppearanceProp\)\s*\n?\s*return/)
  })

  it('keeps the data-theme escape hatch as well', async () => {
    // The runtime signal, for apps that decide at load time rather than by
    // prop. Re-checked on every sync, so claiming it later also works.
    const result = await render(`<body><Sidebar placement="static" :sections="${SECTIONS}" /></body>`)
    expect(controller(result)).toContain('documentElement.dataset.theme')
  })
})
