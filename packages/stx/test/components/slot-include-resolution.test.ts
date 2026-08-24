/**
 * Regression test: an `@include` written inside a component's slot resolves
 * against the CALLER's file, not the component's.
 *
 * `processComponents` runs ahead of `processIncludes` in the directive
 * pipeline, so a layout that writes
 *
 *     <AppShell>
 *       @include('../components/nav')
 *     </AppShell>
 *
 * handed the raw directive to the component. The component then resolved
 * `../components/nav` relative to ITS OWN directory and failed with an ENOENT
 * naming a path the author never wrote. Because include failures render in
 * place, the page came back as a wall of error banners where the navigation,
 * header, and footer should have been — every layout built on a shell
 * component lost its chrome at once.
 *
 * The fix expands caller-authored includes in `renderComponentWithSlot`,
 * against `parentFilePath`, before the slot reaches the component.
 */
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processComponents } from '../../src/component-renderer'
import { defaultConfig } from '../../src/config'

let root = ''
let layoutPath = ''
let componentsDir = ''

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'stx-slot-include-'))
  componentsDir = path.join(root, 'components')
  const layoutsDir = path.join(root, 'layouts')
  const shellDir = path.join(root, 'vendor', 'components')

  await mkdir(componentsDir, { recursive: true })
  await mkdir(layoutsDir, { recursive: true })
  await mkdir(shellDir, { recursive: true })

  // The partial the layout wants. It lives next to the LAYOUT, one directory
  // up from it — nowhere near the shell component.
  await writeFile(path.join(componentsDir, 'nav.stx'), '<nav data-nav>Trails</nav>\n')

  // A shell component in a completely different tree, the way a framework's
  // default components sit outside an application's own resources.
  await writeFile(
    path.join(shellDir, 'AppShell.stx'),
    '<div data-shell>\n  <slot />\n</div>\n',
  )

  layoutPath = path.join(layoutsDir, 'default.stx')
})

afterAll(async () => {
  if (root)
    await rm(root, { recursive: true, force: true })
})

async function renderLayout(template: string): Promise<string> {
  const dependencies = new Set<string>()
  return processComponents(
    template,
    {},
    layoutPath,
    { ...defaultConfig, debug: false, componentsDir: path.join(root, 'vendor', 'components') },
    dependencies,
  )
}

describe('@include inside a slot resolves against the caller', () => {
  it('renders the caller\'s partial rather than failing on the component\'s directory', async () => {
    const output = await renderLayout(`<AppShell>\n  @include('../components/nav')\n</AppShell>\n`)

    expect(output).toContain('data-nav')
    expect(output).toContain('Trails')
    // The failure mode this test exists for: the ENOENT banner rendered in
    // place of the markup.
    expect(output).not.toContain('include error')
    expect(output).not.toContain('Error loading include file')
  })

  it('still wraps the resolved partial in the component', async () => {
    const output = await renderLayout(`<AppShell>\n  @include('../components/nav')\n</AppShell>\n`)

    expect(output).toContain('data-shell')
    // The partial has to land INSIDE the shell, not beside it.
    expect(output.indexOf('data-shell')).toBeLessThan(output.indexOf('data-nav'))
  })

  it('reports a genuinely missing partial against the caller\'s path', async () => {
    const output = await renderLayout(`<AppShell>\n  @include('../components/nope')\n</AppShell>\n`)

    // An include that really is missing must still fail — and name the
    // directory the author wrote it in, so the message is actionable.
    expect(output).toContain('Include')
    expect(output).not.toContain(path.join('vendor', 'components', 'nope.stx'))
  })

  it('leaves slot content without includes untouched', async () => {
    const output = await renderLayout(`<AppShell>\n  <p>plain</p>\n</AppShell>\n`)

    expect(output).toContain('plain')
    expect(output).toContain('data-shell')
  })
})
