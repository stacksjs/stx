import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'

const temporaryDirectories: string[] = []

async function workspace(): Promise<{ input: string, output: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'stx-component-library-'))
  temporaryDirectories.push(root)
  const input = path.join(root, 'components')
  const output = path.join(root, 'dist')
  await Bun.write(path.join(input, '.keep'), '')
  return { input, output }
}

async function fixture(input: string, name: string, source: string): Promise<string> {
  const target = path.join(input, name)
  await Bun.write(target, source)
  return target
}

const buttonSource = `
<script component type="application/json">
{
  "description": "An accessible action button.",
  "properties": {
    "label": { "type": "string", "default": "Save", "description": "Visible label." },
    "disabled": { "type": "boolean", "default": false },
    "options": { "type": "object", "attribute": "data-options" }
  },
  "events": {
    "activate": { "description": "Fires when activated.", "detailType": "{ label: string }" }
  }
}
</script>

<template>
  <button id="action" type="button" @click.prevent="activate" :disabled="disabled">{{ label }}</button>
  <slot name="icon"></slot>
</template>

<script client>
function activate($event) {
  this.emit('activate', { label: this.label, originalEvent: $event })
}
</script>

<style>
:host { --acme-button-color: royalblue; display: inline-block; }
button { color: var(--acme-button-color); }
</style>
`

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('component library compiler', () => {
  it('auto-discovers STX components and emits a complete library surface', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'Button.stx', buttonSource)
    await fixture(input, 'ignored.test.stx', '<p>not a component</p>')

    const result = await buildComponentLibrary({
      inputDir: input,
      outputDir: output,
      prefix: 'acme',
      minify: false,
    })

    expect(result.components).toHaveLength(1)
    expect(result.components[0].name).toBe('Button')
    expect(result.components[0].tag).toBe('acme-button')
    expect(result.totalBytes).toBeGreaterThan(0)

    const expectedFiles = [
      'runtime.js',
      'acme-button.js',
      'acme-button.d.ts',
      'acme-button.css',
      'index.js',
      'index.d.ts',
      'ssr.js',
      'ssr.d.ts',
      'custom-elements.d.ts',
      'custom-elements.json',
      'bundle.css',
      'bundle.js',
    ]
    for (const file of expectedFiles) expect(await Bun.file(path.join(output, file)).exists()).toBe(true)

    const moduleSource = await readFile(path.join(output, 'acme-button.js'), 'utf8')
    expect(moduleSource).toContain("from './runtime.js'")
    expect(moduleSource).toContain('class Button extends StxElement')
    expect(moduleSource).toContain('activate($event)')
    expect(moduleSource).not.toContain('<script')

    const css = await readFile(path.join(output, 'bundle.css'), 'utf8')
    expect(css).toContain('@scope (acme-button)')
    expect(css).toContain(':scope')
    expect(css).not.toContain(':host')
    expect(css).toContain('--acme-button-color')

    const declarations = await readFile(path.join(output, 'acme-button.d.ts'), 'utf8')
    expect(declarations).toContain('label?: string')
    expect(declarations).toContain('disabled?: boolean')
    expect(declarations).toContain('options?: Record<string, unknown>')
    expect(declarations).toContain('"activate": CustomEvent<{ label: string }>')

    const jsx = await readFile(path.join(output, 'custom-elements.d.ts'), 'utf8')
    expect(jsx).toContain('"acme-button"')
    expect(jsx).toContain('onActivate?:')
  })

  it('generates a standards-compliant custom elements manifest', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'Button.stx', buttonSource)
    await buildComponentLibrary({ inputDir: input, outputDir: output, prefix: 'acme', bundle: false })

    const manifest = JSON.parse(await readFile(path.join(output, 'custom-elements.json'), 'utf8'))
    expect(manifest.schemaVersion).toBe('1.0.0')
    expect(manifest.modules).toHaveLength(1)
    const declaration = manifest.modules[0].declarations[0]
    expect(declaration.customElement).toBe(true)
    expect(declaration.tagName).toBe('acme-button')
    expect(declaration.description).toBe('An accessible action button.')
    expect(declaration.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'label', attribute: 'label', type: { text: 'string' } }),
      expect.objectContaining({ name: 'options', attribute: 'data-options' }),
    ]))
    expect(declaration.events[0]).toEqual(expect.objectContaining({ name: 'activate' }))
    expect(declaration.slots).toEqual([{ name: 'icon' }])
    expect(declaration.cssProperties).toEqual([{ name: '--acme-button-color' }])
  })

  it('hydrates SSR markup, synchronizes typed props, batches updates, and delegates events', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'RuntimeButton.stx', buttonSource)
    await buildComponentLibrary({
      inputDir: input,
      outputDir: output,
      components: [{ file: 'RuntimeButton.stx', name: 'RuntimeButton', tag: 'runtime-button-a' }],
      bundle: false,
    })
    await import(`${path.join(output, 'runtime-button-a.js')}?test=${Date.now()}`)

    const element = document.createElement('runtime-button-a') as HTMLElement & {
      label: string
      disabled: boolean
      options: Record<string, unknown>
      updateComplete: Promise<void>
    }
    element.setAttribute('label', 'From attribute')
    element.setAttribute('disabled', '')
    element.setAttribute('data-options', '{"density":"compact"}')
    const serverButton = document.createElement('button')
    serverButton.setAttribute('type', 'button')
    serverButton.setAttribute('id', 'action')
    serverButton.setAttribute('@click.prevent', 'activate')
    serverButton.textContent = 'Server rendered'
    element.appendChild(serverButton)

    let updateCount = 0
    let activation: CustomEvent | undefined
    element.addEventListener('stx:updated', () => updateCount++)
    element.addEventListener('activate', event => activation = event as CustomEvent)
    document.body.appendChild(element)

    expect(element.textContent).toContain('Server rendered')
    expect(element.hasAttribute('hydrated')).toBe(true)
    expect(element.label).toBe('From attribute')
    expect(element.disabled).toBe(true)
    expect(element.options).toEqual({ density: 'compact' })

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    element.querySelector('button')!.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(true)
    expect(activation?.detail.label).toBe('From attribute')

    serverButton.focus()
    element.label = 'First'
    element.label = '<img src=x onerror=alert(1)>'
    await element.updateComplete
    expect(updateCount).toBe(1)
    expect(element.getAttribute('label')).toBe('<img src=x onerror=alert(1)>')
    expect(element.innerHTML).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(element.querySelector('img')).toBeNull()
    expect(element.querySelector('button')!.hasAttribute('disabled')).toBe(true)
    expect(document.activeElement).toBe(element.querySelector('button'))

    element.removeAttribute('disabled')
    await element.updateComplete
    expect(element.disabled).toBe(false)
    expect(element.querySelector('button')!.hasAttribute('disabled')).toBe(false)
    element.options = { density: 'comfortable' }
    expect(element.getAttribute('data-options')).toBe('{"density":"comfortable"}')
  })

  it('upgrades pre-defined instances, preserves imperative properties, and reconnects cleanly', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'UpgradeButton.stx', buttonSource)
    await buildComponentLibrary({
      inputDir: input,
      outputDir: output,
      components: [{ file: 'UpgradeButton.stx', name: 'UpgradeButton', tag: 'upgrade-button-a' }],
      bundle: false,
    })

    const element = document.createElement('upgrade-button-a') as HTMLElement & {
      label: string
      disabled: boolean
      options: Record<string, unknown>
      updateComplete: Promise<void>
    }
    // These assignments happen before the definition exists and therefore
    // exercise the platform's custom-element property upgrade path.
    element.label = 'Imperative value'
    Object.defineProperty(element, 'options', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: { density: 'spacious' },
    })
    element.setAttribute('label', 'Attribute value')
    element.setAttribute('disabled', '')
    const serverButton = document.createElement('button')
    serverButton.id = 'action'
    serverButton.setAttribute('@click.prevent', 'activate')
    serverButton.textContent = 'Server markup'
    element.appendChild(serverButton)

    let hydrationCount = 0
    let activationCount = 0
    element.addEventListener('stx:hydrated', () => hydrationCount++)
    element.addEventListener('activate', () => activationCount++)
    document.body.appendChild(element)

    await import(`${path.join(output, 'upgrade-button-a.js')}?test=${Date.now()}`)

    expect(document.querySelector('upgrade-button-a')).toBe(element)
    expect(element.textContent).toContain('Server markup')
    expect(element.label).toBe('Imperative value')
    expect(element.options).toEqual({ density: 'spacious' })
    expect(element.disabled).toBe(true)
    expect(hydrationCount).toBe(1)

    serverButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(activationCount).toBe(1)

    element.remove()
    element.label = 'Changed while disconnected'
    document.body.appendChild(element)
    expect(element.querySelector('button')!.textContent).toBe('Changed while disconnected')
    element.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(activationCount).toBe(2)
    expect(hydrationCount).toBe(1)

    element.remove()
    document.body.appendChild(element)
    element.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(activationCount).toBe(3)

    const another = document.createElement('upgrade-button-a') as typeof element
    document.body.appendChild(another)
    expect(another.options).toEqual({})
    expect(another.options).not.toBe(element.options)
  })

  it('produces SSR helpers including escaped props and declarative shadow DOM', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'Greeting.stx', `
<script component>{"tag":"ssr-greeting-a","properties":{"name":{"type":"string","default":"World"}},"shadowDOM":"open"}</script>
<template><p>Hello, {{ name }}!</p><slot></slot></template>
<style>p { color: rebeccapurple; }</style>`)
    await buildComponentLibrary({ inputDir: input, outputDir: output, bundle: false })

    const { renderGreeting, renderComponent } = await import(`${path.join(output, 'ssr.js')}?test=${Date.now()}`)
    const html = renderGreeting({ name: '<Admin>' }, { default: '<strong>slot</strong>' })
    expect(html).toContain('<ssr-greeting-a name="&lt;Admin&gt;">')
    expect(html).toContain('<template shadowrootmode="open">')
    expect(html).toContain('<style>p { color: rebeccapurple; }</style>')
    expect(html).toContain('Hello, &lt;Admin&gt;!')
    expect(html).toContain('<strong>slot</strong>')
    expect(() => renderComponent('unknown-element')).toThrow('Unknown STX component')
  })

  it('runs Shadow DOM components and keeps generated modules safe to import during SSR', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'ShadowCard.stx', `
<script component>{"tag":"shadow-card-a","properties":{"title":{"type":"string","default":"Initial"}},"shadowDOM":"open"}</script>
<template><article><h2>{{ title }}</h2><slot></slot></article></template>
<style>article { border: 1px solid; }</style>`)
    await buildComponentLibrary({ inputDir: input, outputDir: output, bundle: false })
    const modulePath = path.join(output, 'shadow-card-a.js')
    await import(`${modulePath}?test=${Date.now()}`)

    const card = document.createElement('shadow-card-a') as HTMLElement & { title: string, updateComplete: Promise<void> }
    document.body.appendChild(card)
    expect(card.shadowRoot).not.toBeNull()
    expect(card.shadowRoot!.textContent).toContain('Initial')
    expect(card.shadowRoot!.querySelector('style')!.textContent).toContain('border: 1px solid')
    card.title = 'Updated'
    await card.updateComplete
    expect(card.shadowRoot!.querySelector('h2')!.textContent).toBe('Updated')

    const child = Bun.spawn([process.execPath, '-e', `await import(${JSON.stringify(modulePath)}); console.log('ssr-import-ok')`], {
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    expect(stderr).toBe('')
    expect(exitCode).toBe(0)
    expect(stdout).toContain('ssr-import-ok')
  })

  it('renders and updates closed shadow roots through the public renderRoot', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'ClosedCard.stx', `
<script component>{"tag":"closed-card-a","properties":{"title":{"type":"string","default":"Private"}},"shadowDOM":"closed"}</script>
<template><article><h2>{{ title }}</h2><slot></slot></article></template>
<style>article { contain: content; }</style>`)
    await buildComponentLibrary({ inputDir: input, outputDir: output, bundle: false })
    await import(`${path.join(output, 'closed-card-a.js')}?test=${Date.now()}`)

    const card = document.createElement('closed-card-a') as HTMLElement & {
      title: string
      updateComplete: Promise<void>
      renderRoot: ShadowRoot
    }
    const slotted = document.createElement('span')
    slotted.textContent = 'Light child'
    card.appendChild(slotted)
    document.body.appendChild(card)

    expect(card.shadowRoot).toBeNull()
    expect(card.renderRoot.querySelector('h2')!.textContent).toBe('Private')
    expect(card.renderRoot.querySelector('slot')!.assignedNodes()).toEqual([slotted])
    card.title = 'Updated privately'
    await card.updateComplete
    expect(card.renderRoot.querySelector('h2')!.textContent).toBe('Updated privately')
  })

  it('uses explicit entries and supports lean output switches', async () => {
    const { input, output } = await workspace()
    await fixture(input, 'InternalName.stx', '<template><p>{{ value }}</p></template>')
    const result = await buildComponentLibrary({
      inputDir: input,
      outputDir: output,
      components: [{
        file: 'InternalName.stx',
        name: 'PublicMeter',
        tag: 'public-meter-a',
        properties: { value: { type: 'number', required: true, attribute: false } },
      }],
      manifest: false,
      declarations: false,
      css: false,
      bundle: false,
    })

    expect(result.components[0]).toEqual(expect.objectContaining({ name: 'PublicMeter', tag: 'public-meter-a' }))
    expect(result.manifest).toBeUndefined()
    expect(result.bundle).toBeUndefined()
    expect(result.cssBundle).toBeUndefined()
    expect(await Bun.file(path.join(output, 'custom-elements.json')).exists()).toBe(false)
    expect(await Bun.file(path.join(output, 'index.d.ts')).exists()).toBe(false)
  })

  it('fails early for malformed metadata, invalid tags, duplicate tags, and empty inputs', async () => {
    const malformed = await workspace()
    await fixture(malformed.input, 'Broken.stx', '<script component>{ nope }</script><p>broken</p>')
    expect(buildComponentLibrary({ inputDir: malformed.input, outputDir: malformed.output })).rejects.toThrow('<script component> must contain JSON')

    const invalid = await workspace()
    await fixture(invalid.input, 'Invalid.stx', '<p>invalid</p>')
    expect(buildComponentLibrary({
      inputDir: invalid.input,
      outputDir: invalid.output,
      components: [{ file: 'Invalid.stx', tag: 'InvalidTag' }],
    })).rejects.toThrow('invalid custom-element tag')

    const duplicate = await workspace()
    await fixture(duplicate.input, 'One.stx', '<p>one</p>')
    await fixture(duplicate.input, 'Two.stx', '<p>two</p>')
    expect(buildComponentLibrary({
      inputDir: duplicate.input,
      outputDir: duplicate.output,
      components: [{ file: 'One.stx', tag: 'same-tag-a' }, { file: 'Two.stx', tag: 'same-tag-a' }],
    })).rejects.toThrow('Duplicate custom-element tag')

    const empty = await workspace()
    expect(buildComponentLibrary({ inputDir: empty.input, outputDir: empty.output })).rejects.toThrow('No .stx components found')
  })
})
