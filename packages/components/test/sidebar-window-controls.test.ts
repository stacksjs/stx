/**
 * Who draws the window controls.
 *
 * `showWindowControls` was a boolean, which could only say "draw them" or
 * "don't". Inside a real window the platform draws its own regardless, so
 * "draw them" there put SIX circles in the corner -- three live buttons from
 * the window server and three HTML replicas beneath.
 *
 * A fixed choice cannot be right in both places the same markup renders: mock
 * lights are the point on a docs page and a bug in an app. So the default is
 * `auto`, which asks the host -- Craft publishes
 * `--craft-window-controls-replicas` and `--craft-window-controls-width`
 * before the document is parsed, and a browser publishes neither.
 *
 * `native` reserves the room the host says its buttons need and renders nothing
 * into it. It asks rather than assuming for a reason: this file used to record
 * a measurement -- 12pt discs 20pt apart, the block ending 62pt in -- and every
 * number in it was wrong. Craft measures its own window now and publishes the
 * answer, which on macOS 27 is a 60x14 block at (9, 9), ending 69pt in. It also
 * differs by window style, moves when a sidebar is installed under it, and goes
 * away entirely in fullscreen.
 *
 * Rendered, including the client script, rather than reimplemented. The
 * resolution used to be duplicated in TypeScript here and asserted against the
 * copy, which is why `showWindowControls="false"` could draw replica lights
 * for as long as it did: the copy returned 'none' for it, and the component
 * read the string "false" as truthy and returned 'auto'.
 */
import { describe, expect, it } from 'bun:test'
import { markup, renderSidebar } from './utils/render-sidebar'

interface Chrome {
  /** Replica traffic lights the component drew itself. */
  replicas: number
  /** Room left for buttons the component did not draw. */
  reserved: boolean
  /** Whether a replica yields to the host's own answer. */
  hostDecides: boolean
}

async function chrome(attrs: string): Promise<Chrome> {
  const html = markup(await renderSidebar(`<body><SidebarHeader ${attrs} /></body>`))
  return {
    replicas: (html.match(/aria-label="Close window"/g) ?? []).length,
    reserved: html.includes('--stx-native-controls-width'),
    hostDecides: html.includes('--craft-window-controls-replicas'),
  }
}

/** The component's own client script, as it will reach the browser. */
async function controller(attrs: string): Promise<string> {
  const html = await renderSidebar(`<body><SidebarHeader ${attrs} /></body>`)
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1])
  return blocks.find(body => body.includes('onChromePress')) ?? ''
}

describe('the mode a header resolves to', () => {
  it('leaves it to the host by default', async () => {
    // Replicas AND reserved room, with the replica's display deferred to the
    // host: whichever it wanted takes up space and the other collapses, so
    // the two do not collide.
    expect(await chrome('theme="macos"')).toEqual({ replicas: 1, reserved: true, hostDecides: true })
  })

  it('draws replicas when asked to', async () => {
    // `draw` is for a page that must look the same everywhere, so it does not
    // ask the host and reserves nothing.
    expect(await chrome('theme="arc" windowControls="draw"')).toEqual({ replicas: 1, reserved: false, hostDecides: false })
  })

  it('renders nothing into the room it reserves', async () => {
    // Anything drawn here would sit underneath live buttons.
    expect(await chrome('theme="arc" windowControls="native"')).toEqual({ replicas: 0, reserved: true, hostDecides: false })
  })

  it('takes neither when told none', async () => {
    expect(await chrome('theme="arc" windowControls="none"')).toEqual({ replicas: 0, reserved: false, hostDecides: false })
  })
})

describe('the old boolean keeps working', () => {
  it('true now means auto, not replicas', async () => {
    // It only ever meant "there should be controls here". Who draws them is
    // the platform's business, and inside a window the platform already did.
    expect(await chrome('theme="arc" showWindowControls="true"')).toEqual(await chrome('theme="arc" windowControls="auto"'))
  })

  it('false still means none', async () => {
    // Read with $bool. As a plain attribute it arrives as the string "false",
    // which is truthy, and for a while this drew the replicas it was asked to
    // suppress -- six circles in any real window.
    expect(await chrome('theme="arc" showWindowControls="false"')).toEqual({ replicas: 0, reserved: false, hostDecides: false })
  })

  it('is overridden by the explicit mode', async () => {
    // An app migrating should not have to remove the old prop first.
    expect(await chrome('theme="arc" showWindowControls="true" windowControls="native"'))
      .toEqual({ replicas: 0, reserved: true, hostDecides: false })
  })

  it('still leaves arc bare and macOS not', async () => {
    // A macOS sidebar owns its top-left corner; arc's is opt-in.
    expect(await chrome('theme="arc"')).toEqual({ replicas: 0, reserved: false, hostDecides: false })
    expect((await chrome('theme="macos"')).replicas).toBe(1)
  })
})

describe('the room comes from the host in every mode', () => {
  it('measures it from the window and nets off this header own padding', async () => {
    // Not even under `native` is a width assumed: a browser has no window
    // buttons, and a Craft window with a titlebar keeps them above the page.
    const arc = markup(await renderSidebar(`<body><SidebarHeader theme="arc" windowControls="native" /></body>`))
    const macos = markup(await renderSidebar(`<body><SidebarHeader theme="macos" windowControls="native" /></body>`))

    expect(arc).toContain('max(0px, calc(var(--craft-window-controls-width, 0px) - 12px))')
    expect(macos).toContain('max(0px, calc(var(--craft-window-controls-width, 0px) - 21px))')
  })

  it('keeps a manual override for a host that publishes nothing', async () => {
    const html = markup(await renderSidebar(`<body><SidebarHeader theme="arc" windowControls="native" /></body>`))

    expect(html).toContain('var(--stx-native-controls-width, max(0px,')
  })

  it('aligns the arc row with where the platform puts its buttons', async () => {
    // The chrome row is 28pt tall -- its action buttons set that, not the text
    // -- so its contents centre 14pt down, which is exactly where the platform
    // puts the middle of its controls (they span 8..19pt). Any padding above
    // pushes the name below buttons it is meant to sit beside.
    //
    // Arithmetic rather than a branch, because only the host knows: a window
    // that keeps its buttons in a titlebar of their own publishes a width of
    // 0, does not overlay this row, and keeps its padding.
    const reserved = markup(await renderSidebar(`<body><SidebarHeader theme="arc" windowControls="native" /></body>`))
    const bare = markup(await renderSidebar(`<body><SidebarHeader theme="arc" windowControls="none" /></body>`))

    expect(reserved).toContain('padding-top: max(0px, calc(12px - var(--craft-window-controls-width, 0px)))')
    expect(bare).toContain('padding-top: 12px')
  })
})

describe('the strip that moves the window', () => {
  /*
   * `-webkit-app-region: drag` is Chromium's, and the class stays for the hosts
   * that implement it. WebKit is not one: a WKWebView discards the declaration,
   * so inside a Craft window that class alone left a header that looked
   * draggable on a window that could not be moved.
   */
  it('asks the host to drag, rather than relying on the CSS alone', async () => {
    expect(await controller('theme="arc" windowControls="auto"')).toContain('window.craft?.window?.startDrag?.()')
  })

  it('leaves a press on anything clickable alone', async () => {
    // Dragging a window by its own close button is not a gesture anyone makes
    // on purpose, and the strip carries replica lights, a search field and
    // action buttons.
    expect(await controller('theme="arc" windowControls="auto"'))
      .toContain(`closest?.('button, a, input, select, textarea, [role="button"]')`)
  })

  it('ignores anything that is not a left press', async () => {
    expect(await controller('theme="arc" windowControls="auto"')).toContain('event.button !== 0')
  })

  it('wires the press on both themes chrome rows, not just the macOS one', async () => {
    for (const theme of ['macos', 'arc']) {
      const html = await renderSidebar(`<body><SidebarHeader theme="${theme}" windowControls="auto" /></body>`)
      const row = html.match(/<div[^>]*app-region:drag[^>]*>/)

      expect(row?.[0], theme).toContain('@mousedown="onChromePress($event)"')
    }
  })
})
