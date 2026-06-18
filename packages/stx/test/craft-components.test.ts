import { describe, expect, it } from 'bun:test'
import { generateCraftBridgeScript } from '../src/craft-bridge'
import { processCraftComponents } from '../src/craft-components'

describe('Craft components', () => {
  it('renders a Tahoe sidebar fallback with native Craft sidebar config', () => {
    const html = processCraftComponents(`
      <html>
        <head><title>Native Sidebar</title></head>
        <body>
          <@craft-sidebar id="main-sidebar" selectedItem="inbox" searchPlaceholder="Search">
            <@craft-sidebar-section id="favorites" title="Favorites">
              <@craft-sidebar-item id="inbox" label="Inbox" icon="tray.fill" badge="12" />
              <@craft-sidebar-item id="today" label="Today" icon="calendar" />
            </@craft-sidebar-section>
            <@craft-sidebar-section id="tags" title="Tags">
              <@craft-sidebar-item id="urgent" label="Urgent" icon="circle.fill" tintColor="#ef4444" />
            </@craft-sidebar-section>
          </@craft-sidebar>
        </body>
      </html>
    `)

    expect(html).toContain('id="craft-component-styles"')
    expect(html).toContain('id="craft-component-runtime"')
    expect(html).toContain('data-craft-native-sidebar')
    expect(html).toContain('data-craft-sidebar-id="main-sidebar"')
    expect(html).toContain('hasNativeHost')
    expect(html).toContain('--craft-sidebar-width:286px')
    expect(html).toContain('"variant":"desktop"')
    expect(html).toContain('"backgroundEffect":"shimmer"')
    expect(html).toContain('"material":"sidebar"')
    expect(html).toContain('"selectedItem":"inbox"')
    expect(html).toContain('"id":"favorites"')
    expect(html).toContain('"label":"Inbox"')
    expect(html).toContain('"badge":"12"')
    expect(html).toContain('"tintColor":"#ef4444"')
    expect(html).toContain('data-icon="tray.fill"')
    expect(html).toContain('--craft-sidebar-icon-color:#ef4444')
    expect(html).not.toContain('@craft-sidebar-item')
  })

  it('keeps native sidebar opt-out as a web fallback', () => {
    const html = processCraftComponents(`
      <@craft-sidebar id="web-sidebar" native="false">
        <@craft-sidebar-section id="nav" title="Nav">
          <@craft-sidebar-item id="home" label="Home" icon="house" />
        </@craft-sidebar-section>
      </@craft-sidebar>
    `)

    expect(html).toContain('data-native="false"')
    expect(html).toContain('Home')
  })

  it('does not leak internal fallback metadata onto regular components', () => {
    const html = processCraftComponents(`<@craft-button class="extra">Save</@craft-button>`)

    expect(html).toContain('class="craft-button extra"')
    expect(html).not.toContain('__fallbackClasses')
  })

  it('exposes nativeUI in the injected Craft bridge', () => {
    const script = generateCraftBridgeScript()

    expect(script).toContain('const nativeUI = existingCraft.nativeUI || createNativeUIFacade()')
    expect(script).toContain('window.craft = Object.assign({}, existingCraft')
    expect(script).toContain('nativeUI,')
    expect(script).toContain("sendNativeUI('createSidebar'")
  })
})
