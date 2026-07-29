/**
 * Menu Bar Apps
 *
 * A native macOS menu bar app is an stx template, a handful of JSON routes and
 * a tray menu. `createMenuBarApp` wires those three things to a Craft window so
 * an app is a single declarative call instead of a hand-rolled HTTP server.
 *
 * @example
 * ```typescript
 * import { createMenuBarApp } from '@stacksjs/stx/menubar'
 *
 * const app = createMenuBarApp({
 *   name: 'Barista',
 *   template: new URL('./app.stx', import.meta.url).pathname,
 *   preferences: { theme: 'dark' },
 *   context: prefs => ({ theme: prefs.get('theme') }),
 *   routes: {
 *     'POST /api/theme': async (request, prefs) => {
 *       const { theme } = await request.json()
 *       prefs.set('theme', theme)
 *       return prefs.getAll()
 *     },
 *   },
 *   menu: () => [{ label: 'Quit', action: 'quit' }],
 * })
 *
 * await app.start()
 * ```
 */
import type { Preferences, WindowInstance, WindowOptions } from '@stacksjs/desktop'
import { createPreferences, createWindow, setAutoLaunch } from '@stacksjs/desktop'
import { renderTemplate } from './render'

/** Anything JSON-serializable a route may hand back, or a `Response` to take over entirely. */
export type RouteResult = Response | Record<string, unknown> | unknown[] | string | number | boolean | null | void

/** A route handler receives the request and the app's preference store. */
export type RouteHandler<T extends Record<string, unknown>> = (
  request: Request,
  preferences: Preferences<T>,
) => RouteResult | Promise<RouteResult>

/**
 * Routes keyed by `"<METHOD> <path>"`, e.g. `'POST /api/caffeinate/toggle'`.
 * The method may be omitted, in which case `GET` is assumed.
 */
export type Routes<T extends Record<string, unknown>> = Record<string, RouteHandler<T>>

/** A tray menu entry. Actions are plain strings the app interprets itself. */
export interface MenuBarMenuItem {
  label?: string
  type?: 'normal' | 'separator' | 'checkbox' | 'radio' | 'submenu'
  checked?: boolean
  enabled?: boolean
  icon?: string
  shortcut?: string
  action?: string
  submenu?: MenuBarMenuItem[]
}

export interface MenuBarAppOptions<T extends Record<string, unknown>> {
  /** App name. Also names the preferences file and the login item. */
  name: string
  /** Path to the `.stx` template rendered into the popup window. */
  template: string
  /** Default preference values. The store is created and persisted for you. */
  preferences?: T
  /**
   * Values handed to the template on every render. Called per request, so the
   * popup always opens against current state rather than boot-time state.
   */
  context?: (preferences: Preferences<T>) => Record<string, unknown> | Promise<Record<string, unknown>>
  /** JSON API routes, on top of the built-in preference and menu endpoints. */
  routes?: Routes<T>
  /** Tray menu, rebuilt each time it is requested. */
  menu?: (preferences: Preferences<T>) => MenuBarMenuItem[]
  /**
   * Preference key holding the launch-at-login setting. The login item is kept
   * in sync with it, including when the user changes it at runtime.
   */
  launchAtLogin?: keyof T
  /** Window overrides. Menu bar defaults are applied first. */
  window?: WindowOptions
  /** Port for the local server. Defaults to 0 — an arbitrary free port. */
  port?: number
}

export interface MenuBarApp<T extends Record<string, unknown>> {
  /** The persisted preference store. */
  readonly preferences: Preferences<T>
  /** Local server URL. Only set once the app has started. */
  readonly url: string | null
  /** Start the server and open the menu bar window. */
  start: () => Promise<MenuBarApp<T>>
  /** Close the window and stop the server. */
  stop: () => void
}

/** Menu bar popups are small, borderless and float above other windows. */
const MENU_BAR_WINDOW: WindowOptions = {
  width: 320,
  height: 640,
  systemTray: true,
  hideDockIcon: true,
  titlebarHidden: true,
  resizable: false,
  alwaysOnTop: true,
  darkMode: true,
}

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' }

/**
 * Normalize a route key to `"<METHOD> <path>"`. A key without a method is a
 * `GET`, so `'/api/status'` and `'GET /api/status'` are the same route.
 */
export function normalizeRouteKey(key: string): string {
  const [first, ...rest] = key.trim().split(/\s+/)
  return rest.length ? `${first.toUpperCase()} ${rest.join(' ')}` : `GET ${first}`
}

/**
 * Coerce a handler's return value into a `Response`. Handlers that return
 * nothing get `204 No Content`; a handler that built its own `Response` keeps it.
 */
export function toResponse(result: RouteResult): Response {
  if (result instanceof Response)
    return result
  if (result === undefined)
    return new Response(null, { status: 204 })
  return new Response(JSON.stringify(result), { headers: JSON_HEADERS })
}

/**
 * Apply an untrusted patch to a preference store, keeping only keys that exist
 * in the defaults so a stray request cannot write arbitrary fields into the
 * preferences file.
 */
export function applyPreferencePatch<T extends Record<string, unknown>>(
  preferences: Preferences<T>,
  patch: Record<string, unknown>,
): T {
  const known = preferences.getAll()
  for (const [key, value] of Object.entries(patch)) {
    if (key in known)
      preferences.set(key as keyof T, value as T[keyof T])
  }
  return preferences.getAll()
}

export function createMenuBarApp<T extends Record<string, unknown>>(
  options: MenuBarAppOptions<T>,
): MenuBarApp<T> {
  const preferences = createPreferences<T>({
    name: options.name.toLowerCase(),
    defaults: (options.preferences ?? {}) as T,
  })

  const routes = new Map<string, RouteHandler<T>>(
    Object.entries(options.routes ?? {}).map(([key, handler]) => [normalizeRouteKey(key), handler]),
  )

  // Built-in endpoints every menu bar app needs. Registered first so an app can
  // override any of them by declaring the same route.
  const builtins: Routes<T> = {
    'GET /api/preferences': () => preferences.getAll(),
    'POST /api/preferences': async request => applyPreferencePatch(preferences, await request.json()),
    'GET /api/menu': () => options.menu?.(preferences) ?? [],
  }
  for (const [key, handler] of Object.entries(builtins)) {
    if (!routes.has(key))
      routes.set(key, handler)
  }

  let server: ReturnType<typeof Bun.serve> | null = null
  let window: WindowInstance | null = null
  let url: string | null = null

  async function renderPopup(): Promise<Response> {
    const context = await options.context?.(preferences) ?? {}
    const html = await renderTemplate(options.template, {
      context,
      wrapInDocument: true,
      title: options.name,
    })
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  function serve(): void {
    server = Bun.serve({
      port: options.port ?? 0,
      // The window is the only client, so there is no reason to listen beyond
      // the loopback interface.
      hostname: '127.0.0.1',
      async fetch(request) {
        const { pathname } = new URL(request.url)

        if (request.method === 'GET' && (pathname === '/' || pathname === '/index.html'))
          return renderPopup()

        const handler = routes.get(`${request.method} ${pathname}`)
        if (!handler)
          return new Response('Not Found', { status: 404 })

        return toResponse(await handler(request, preferences))
      },
    })
    url = `http://127.0.0.1:${server.port}`
  }

  /** Keep the login item in sync with the preference that controls it. */
  function bindLaunchAtLogin(): void {
    const key = options.launchAtLogin
    if (!key)
      return

    const sync = (enabled: unknown) => {
      setAutoLaunch(Boolean(enabled), { appName: options.name, isHidden: true })
        .catch(() => {})
    }

    sync(preferences.get(key))
    preferences.onChange(key, sync)
  }

  return {
    preferences,

    get url() {
      return url
    },

    async start() {
      if (!server)
        serve()
      bindLaunchAtLogin()

      window = await createWindow(url!, {
        ...MENU_BAR_WINDOW,
        title: options.name,
        ...options.window,
      })

      return this
    },

    stop() {
      window?.close()
      window = null
      server?.stop()
      server = null
      url = null
      preferences.close()
    },
  }
}
