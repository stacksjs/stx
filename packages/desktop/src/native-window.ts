/**
 * Controlling the window from inside it.
 *
 * `window-events.ts` is the other half of this — what the window tells the
 * page. This is what the page tells the window: close it, move it, pin its
 * appearance, or open a second one.
 *
 * Craft routes every one of these to *the window the call came from*, read off
 * the `WKScriptMessage` rather than asserted by the page, so a Settings window
 * closing itself closes itself and not the window behind it. That is what
 * makes `open` safe to hand to an app: the second window is a real window with
 * its own controls, not a page that has to be careful.
 *
 * Everything degrades in a browser, where the same page usually also renders:
 * the window controls resolve to no-ops, and `open` falls back to
 * `window.open`, which is the honest equivalent of a second window there.
 */
import { hasBridge } from './_bridge'

/** Which appearance the *window* resolves its native chrome against. */
export type WindowAppearance = 'light' | 'dark' | 'system'

/**
 * A second window, described the way Craft's CLI describes the first.
 *
 * `name` is the one that matters. It is the window's identity: opening the
 * same name twice brings the first window forward rather than stacking a
 * second one behind it, which is what Cmd+, does in every Mac app. Without it
 * an app has no way to say "the Settings window" — only "a window".
 */
export interface NativeWindowOptions {
  /** Stable identity, up to 64 bytes. Required. */
  name: string
  /** One of these two is required. */
  url?: string
  html?: string
  /** Window title. Defaults to `name`. */
  title?: string
  width?: number
  height?: number
  /** Screen position. Omitted, the window is centred. */
  x?: number
  y?: number
  /** A floor on the size a resize drag can reach. */
  minWidth?: number
  minHeight?: number
  resizable?: boolean
  closable?: boolean
  minimizable?: boolean
  alwaysOnTop?: boolean
  /** Full-size content view: the window buttons sit over the page. */
  titlebarHidden?: boolean
  /** Native sidebar material behind a leading strip of the web view. */
  webSidebarMaterial?: boolean
  /** How wide that strip is. */
  webSidebarWidth?: number
  /** Tint over that material, 0–1. */
  webSidebarMaterialOpacity?: number
  /** That material behind the whole web view instead. */
  webWindowMaterial?: boolean
  /**
   * Whether Craft draws its own sidebar toggle and history arrows beside the
   * window buttons. On by default for a window with a material behind it,
   * which otherwise has nothing up there at all; off for a page that draws its
   * own history row, so there is only one pair of arrows in the window.
   */
  chromeControls?: boolean
  /**
   * Whether the page's storage — `localStorage`, IndexedDB, cookies — survives
   * a quit and is shared with the app's other windows.
   *
   * Off by default, because the ephemeral store costs no disk I/O at startup.
   * A second window that keeps a preference must set it, or it writes where
   * the window that opened it cannot read — and both forget on quit.
   */
  persistentStorage?: boolean
  /** Web Inspector in this window. Off by default. */
  devTools?: boolean
}

interface CraftWindowNamespace {
  open?: (options: NativeWindowOptions) => Promise<{ name?: string }>
  close?: () => Promise<void>
  focus?: () => Promise<void>
  minimize?: () => Promise<void>
  maximize?: () => Promise<void>
  center?: () => Promise<void>
  startDrag?: () => Promise<void>
  setTitle?: (title: string) => Promise<void>
  setSize?: (width: number, height: number) => Promise<void>
  setAppearance?: (appearance: WindowAppearance) => Promise<void>
}

function api(): CraftWindowNamespace | null {
  if (!hasBridge('window')) return null
  return (window.craft as unknown as { window: CraftWindowNamespace }).window
}

/**
 * Call a window action, and let a host that does not have it be a no-op.
 *
 * Optional chaining on every method rather than a version check: these arrive
 * one at a time across Craft releases, and an app that is only *mostly* able
 * to control its window should keep working rather than throw on load.
 */
function call(action: (ns: CraftWindowNamespace) => Promise<unknown> | undefined): Promise<void> {
  const ns = api()
  if (!ns) return Promise.resolve()
  try {
    return Promise.resolve(action(ns)).then(() => undefined, () => undefined)
  }
  catch {
    return Promise.resolve()
  }
}

export interface NativeWindow {
  /** True when this page is running inside a Craft window. */
  readonly available: boolean
  /**
   * Open a second window, or bring forward the one already open under this
   * name. Resolves with the name it settled on.
   *
   * Outside a Craft window this opens a browser window instead, keyed by the
   * same name so a second call reuses it — the same shape of promise, so call
   * sites do not branch.
   */
  open: (options: NativeWindowOptions) => Promise<{ name: string }>
  /** Close the window this page is in. */
  close: () => Promise<void>
  /** Bring the window this page is in to the front. */
  focus: () => Promise<void>
  minimize: () => Promise<void>
  /** Zoom, which is what a double-click on a titlebar does. */
  maximize: () => Promise<void>
  center: () => Promise<void>
  /**
   * Hand the current mouse press to AppKit and let it drag the window.
   *
   * The only way to move a window with a hidden titlebar: WebKit has never
   * implemented `-webkit-app-region: drag` and a WKWebView discards the
   * declaration, so a page that relies on it produces a window that cannot be
   * moved at all. Call this from a `mousedown` on whatever band is standing in
   * for the titlebar.
   */
  startDrag: () => Promise<void>
  setTitle: (title: string) => Promise<void>
  setSize: (width: number, height: number) => Promise<void>
  /**
   * Pin this window to light or dark, or hand it back to the system.
   *
   * Anything native around the page — a material backdrop, a vibrancy view,
   * the window buttons — resolves against the *window's* appearance, not the
   * page's. An app with its own light/dark control is the only thing that
   * knows which it picked, so it has to say, or the page and its window
   * disagree: a dark page washed over a light material, with light buttons.
   *
   * Per window. Two windows are told separately, because they can be told
   * separately.
   */
  setAppearance: (appearance: WindowAppearance) => Promise<void>
}

export const nativeWindow: NativeWindow = {
  get available(): boolean {
    return api() !== null
  },

  open(options: NativeWindowOptions): Promise<{ name: string }> {
    const ns = api()
    if (!ns?.open) {
      if (typeof window !== 'undefined' && options.url)
        window.open(options.url, options.name)
      return Promise.resolve({ name: options.name })
    }

    return ns.open(options)
      .then(result => ({ name: result?.name || options.name }))
      .catch(() => {
        // A Craft older than `window.open`. A tab is still better than the
        // gesture doing nothing at all.
        if (typeof window !== 'undefined' && options.url)
          window.open(options.url, options.name)
        return { name: options.name }
      })
  },

  close: () => call(ns => ns.close?.()),
  focus: () => call(ns => ns.focus?.()),
  minimize: () => call(ns => ns.minimize?.()),
  maximize: () => call(ns => ns.maximize?.()),
  center: () => call(ns => ns.center?.()),
  startDrag: () => call(ns => ns.startDrag?.()),
  setTitle: (title: string) => call(ns => ns.setTitle?.(title)),
  setSize: (width: number, height: number) => call(ns => ns.setSize?.(width, height)),
  setAppearance: (appearance: WindowAppearance) => call(ns => ns.setAppearance?.(appearance)),
}
