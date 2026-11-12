/**
 * The native primitives resolve on the web, as components of last resort, so a
 * view written once with `<View>` and `<Text>` is a web page too. Before this
 * the web server answered `<!-- stx: component "view" could not be resolved -->`
 * for them, which forced every app to write its web and native views twice.
 */
import { expect, it } from 'bun:test'
import { realpath, rm } from 'node:fs/promises'
import path from 'node:path'
import { loadStxConfig } from '../src/config'
import { processDirectives } from '../src/process'
import { createTempDir } from '../src/temp-dir'
import { clearComponentCache } from '../src/utils'

async function render(root: string, source: string, config: Awaited<ReturnType<typeof loadStxConfig>>): Promise<string> {
  const page = path.join(root, 'pages/index.stx')
  return processDirectives(source, {}, page, config, new Set())
}

it('renders primitives as the HTML their web side is', async () => {
  const root = await realpath(createTempDir('stx-web-primitives-'))
  try {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    clearComponentCache()
    const config = await loadStxConfig(root)
    const html = await render(root, '<View class="p-4"><Text class="font-bold">Inbox</Text></View>', config)
    expect(html).not.toContain('could not be resolved')
    expect(html).toContain('data-native="View"')
    expect(html).toContain('class="p-4"')
    expect(html).toContain('>Inbox</span>')
  }
  finally { clearComponentCache(); await rm(root, { recursive: true, force: true }) }
})

it('an app component of the same name wins over the primitive', async () => {
  const root = await realpath(createTempDir('stx-web-primitives-win-'))
  try {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'components/View.stx'), '<section class="mine"><slot /></section>')
    clearComponentCache()
    const config = await loadStxConfig(root)
    const html = await render(root, '<View>hello</View>', config)
    expect(html).toContain('<section class="mine">')
    expect(html).not.toContain('data-native="View"')
  }
  finally { clearComponentCache(); await rm(root, { recursive: true, force: true }) }
})

it('leaves ordinary HTML elements of the same spelling alone', async () => {
  const root = await realpath(createTempDir('stx-web-primitives-html-'))
  try {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    clearComponentCache()
    const config = await loadStxConfig(root)
    const html = await render(root, '<link rel="stylesheet" href="/a.css"><svg><text x="1" y="2">t</text></svg>', config)
    expect(html).toContain('<link rel="stylesheet" href="/a.css">')
    expect(html).toContain('<text x="1" y="2">t</text>')
    expect(html).not.toContain('data-native')
  }
  finally { clearComponentCache(); await rm(root, { recursive: true, force: true }) }
})

it('can be turned off', async () => {
  const root = await realpath(createTempDir('stx-web-primitives-off-'))
  try {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default { nativePrimitives: false }')
    clearComponentCache()
    const config = await loadStxConfig(root)
    const html = await render(root, '<View>hello</View>', config)
    expect(html).not.toContain('data-native="View"')
  }
  finally { clearComponentCache(); await rm(root, { recursive: true, force: true }) }
})

it('<FloatingActions> takes no room on a web page and carries what draws it there', async () => {
  const root = await realpath(createTempDir('stx-web-floating-actions-'))
  try {
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    clearComponentCache()
    const config = await loadStxConfig(root)
    const html = await render(root, `<script client>const list = state([{ path: '/map', label: 'Map', symbol: 'map.fill' }])</script><main><FloatingActions :actions="list" /></main>`, config)
    expect(html).not.toContain('could not be resolved')
    expect(html).toContain('<div data-native="View" class="hidden" aria-hidden="true" data-floating-actions></div>')
    // The component imports its rules; the page has to carry that module, or
    // its script stops at "module is not registered on this page".
    // The key is the module's path from wherever the build runs.
    expect(html).toMatch(/__stxModules\["[^"]*src\/native\/floating-actions\.ts"\] =/)
    expect(html).toMatch(/__stxModules\["[^"]*src\/native\/floating-actions-web\.ts"\] =/)
    // A host with chrome is asked to draw them; a page without one draws them itself.
    expect(html).toContain('typeof craft !== "undefined"')
    expect(html).toContain('mountFloatingActionsWeb(document)')
  }
  finally { clearComponentCache(); await rm(root, { recursive: true, force: true }) }
})
