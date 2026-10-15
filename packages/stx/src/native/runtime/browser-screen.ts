import type { NativeBridgeInterface, NativeMutationPayload } from '../bridge/protocol'
import type { STXNode } from '../compiler/ir'
import { BrowserScreenRenderer, type BrowserRendererOptions } from './browser-renderer'

export interface BrowserPlatform {
  /** Browser implementations of synchronous storage and snapshot operations. */
  craft: Record<string, unknown>
  capabilities: string[]
  call: (module: string, method: string, args: unknown[], signal: AbortSignal) => Promise<unknown>
  navigate: (path: string, replace?: boolean) => void
  emit?: (listener: (type: string, payload: unknown) => void) => () => void
  resolveMedia?: (url: string) => Promise<string>
  resolveFile?: (value: unknown) => unknown
  dispose: () => void
}

export interface BrowserScreenOptions {
  container: string
  routes: Record<string, string>
  screen: string
  params?: Record<string, unknown>
  appURL: string
  title?: string
  tabs?: Array<{ id: string, title: string, symbol?: string }>
  icons?: BrowserRendererOptions['icons']
}

/** The browser renderer is a peer host of UIKit and Android, on the same protocol. */
export function createBrowserScreenBridge(platform: BrowserPlatform, options: BrowserScreenOptions): NativeBridgeInterface & { dispose: () => void } {
  const rootPath = new URL(options.appURL, location.href).pathname.replace(/\/$/, '') || '/'
  const container = document.querySelector<HTMLElement>(options.container)
  if (!container) throw new Error(`Screen container ${options.container} does not exist`)
  let listener: ((message: string) => void) | null = null
  let disposed = false
  const chromeRenderers: BrowserScreenRenderer[] = []
  let serial = 0
  const pending = new Map<string, AbortController>()
  const send = (type: string, payload: unknown, correlationId?: string): void => {
    if (!disposed) listener?.(JSON.stringify({ id: `browser_${++serial}`, type, payload, correlationId, source: 'native', timestamp: Date.now() }))
  }
  const renderer = new BrowserScreenRenderer(container, { icons: options.icons, resolveMedia: platform.resolveMedia, event: (handlerId, nativeEvent) => send('EVENT', { handlerId, nativeEvent }) })
  const g = globalThis as typeof globalThis & { craft?: unknown, __stxNativeParams?: unknown }
  g.craft = platform.craft
  const matched = matchBrowserRoute(location.pathname, options.routes)
  g.__stxNativeParams = { ...Object.fromEntries(new URLSearchParams(location.search)), ...matched?.params, ...options.params }
  const nav = document.createElement('header')
  const content = document.createElement('div')
  const tabs = document.createElement('nav')
  const shell = document.createElement('div')
  shell.setAttribute('data-stx-screen-shell', '')
  shell.style.cssText = 'display:flex;flex-direction:column;height:100dvh;max-width:512px;margin:auto;color:#1c1c1e;background:#f2f2f7;font:17px system-ui,-apple-system,sans-serif;overflow:hidden'
  content.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden'
  container.before(shell)
  shell.append(nav, content, tabs)
  content.append(container)
  container.style.cssText = 'display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden'
  nav.style.cssText = 'display:flex;align-items:center;gap:12px;min-height:52px;padding:env(safe-area-inset-top) 16px 0;flex-shrink:0'
  tabs.style.cssText = 'display:flex;justify-content:space-around;gap:4px;padding:8px 8px max(8px,env(safe-area-inset-bottom));flex-shrink:0;border-top:1px solid #8884'
  tabs.setAttribute('aria-label', 'Main navigation')
  const theme = (): void => {
    const dark = document.documentElement.classList.contains('dark')
    shell.style.background = dark ? '#000000' : '#f2f2f7'
    shell.style.color = dark ? '#ffffff' : '#1c1c1e'
    bridge.colorScheme = dark ? 'dark' : 'light'
    send('APPEARANCE', { colorScheme: bridge.colorScheme })
  }
  const navigation = (settings: Record<string, unknown>): void => {
    const title = typeof settings.title === 'string' ? settings.title : options.title ?? ''
    if (title) document.title = title
    if (typeof settings.tabBarHidden === 'boolean') { tabs.hidden = settings.tabBarHidden; tabs.style.display = settings.tabBarHidden ? 'none' : 'flex' }
    nav.hidden = settings.hidden === true
    nav.style.display = nav.hidden ? 'none' : 'flex'
    const heading = document.createElement('h1')
    heading.textContent = title
    heading.style.cssText = `font-size:${settings.largeTitle ? 28 : 20}px;font-weight:700;flex:1;margin:8px 0`
    for (const icon of chromeRenderers.splice((options.tabs ?? []).filter(tab => tab.symbol).length)) icon.dispose()
    nav.replaceChildren()
    if (location.pathname.replace(/\/$/, '') !== rootPath && !(options.tabs ?? []).some(tab => tab.id === location.pathname.replace(/\/$/, ''))) {
      const back = document.createElement('button')
      back.type = 'button'; back.textContent = String(settings.backTitle || 'Back'); back.setAttribute('aria-label', back.textContent)
      back.style.cssText = 'font:inherit;color:#007aff;border:0;background:none;min-width:44px;min-height:44px'
      back.onclick = () => history.length > 1 ? history.back() : platform.navigate(rootPath)
      nav.append(back)
    }
    nav.append(heading)
    if (Array.isArray(settings.rightButtons)) for (const item of settings.rightButtons as Array<Record<string, unknown>>) {
      const button = document.createElement('button')
      button.type = 'button'
      button.style.cssText = 'display:flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;border:0;border-radius:50%;background:transparent;color:inherit;font:inherit;position:relative'
      button.setAttribute('aria-label', String(item.accessibilityLabel ?? item.title ?? item.id))
      if (item.image) { const image = document.createElement('img'); image.src = String(item.image); image.alt = ''; image.style.cssText = 'width:32px;height:32px;border-radius:50%;object-fit:cover'; button.append(image) }
      else if (item.title) button.textContent = String(item.title)
      else {
        const holder = document.createElement('span')
        button.append(holder)
        const icon = new BrowserScreenRenderer(holder, { icons: options.icons, event() {} })
        chromeRenderers.push(icon)
        icon.render({ id: `nav_${item.id}`, type: 'Icon', props: { symbol: item.symbol }, style: { width: 24, height: 24 }, events: {}, children: [] })
      }
      if (Number(item.badge) > 0) { const badge = document.createElement('span'); badge.textContent = item.badgeStyle === 'dot' ? '' : String(item.badge); badge.style.cssText = 'position:absolute;top:0;right:0;background:#ff3b30;color:white;border-radius:10px;padding:1px 4px;font-size:10px'; if (item.badgeStyle === 'dot') badge.style.cssText += ';width:8px;height:8px;padding:0'; button.append(badge) }
      button.onclick = () => send('NAV_BUTTON', { id: String(item.id) })
      nav.append(button)
    }
  }
  for (const tab of options.tabs ?? []) {
    const link = document.createElement('a')
    link.href = tab.id
    link.style.cssText = 'display:flex;flex:1;flex-direction:column;align-items:center;gap:3px;min-height:44px;text-decoration:none;color:inherit;font-size:11px'
    const iconRoot = document.createElement('span')
    link.append(iconRoot)
    if (tab.symbol) {
      const icon = new BrowserScreenRenderer(iconRoot, { icons: options.icons, event() {} })
      chromeRenderers.push(icon)
      icon.render({ id: `tab_${tab.id}`, type: 'Icon', props: { symbol: tab.symbol }, style: { width: 23, height: 23 }, events: {}, children: [] })
    }
    const label = document.createElement('span'); label.textContent = tab.title; link.append(label)
    if (location.pathname.replace(/\/$/, '') === tab.id || (tab.id !== rootPath && location.pathname.startsWith(`${tab.id}/`))) { link.setAttribute('aria-current', 'page'); link.style.color = '#007aff' }
    tabs.append(link)
  }
  tabs.hidden = !options.tabs?.length
  const navigateScreen = (screen: unknown, params: unknown, replace = false): void => {
    const route = Object.entries(options.routes).find(([, name]) => name === screen)?.[0]
    if (!route) throw new Error(`No browser route for screen ${screen}`)
    const values = params && typeof params === 'object' ? { ...params } as Record<string, unknown> : {}
    const path = route.replace(/:([a-z\d_]+)/gi, (_, key: string) => { const value = values[key]; if (value == null) throw new Error(`Missing route parameter ${key}`); delete values[key]; return encodeURIComponent(String(value)) })
    const query = new URLSearchParams(Object.entries(values).map(([key, value]) => [key, String(value)]))
    platform.navigate(path + (query.size ? `?${query}` : ''), replace)
  }
  const bridge: NativeBridgeInterface & { dispose: () => void } = {
    resolveFile: platform.resolveFile,
    routeURL: location.pathname + location.search,
    platform: 'web', capabilityProtocolVersion: 1, capabilities: platform.capabilities, appURL: new URL(options.appURL, location.href).href,
    initialAppState: document.hidden ? 'background' : 'active',
    colorScheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    onMessage(callback) { listener = callback },
    postMessage(raw) {
      if (disposed) return
      const message = JSON.parse(raw) as { id: string, type: string, payload: Record<string, unknown> }
      const { type, payload } = message
      if (type === 'RENDER') {
        try { renderer.render(payload.document as unknown as STXNode) }
        catch (error) {
          container.textContent = 'This screen could not render. Reload to try again.'
          container.setAttribute('role', 'alert')
          throw error
        }
      }
      else if (type === 'MUTATE') {
        try { renderer.mutate(payload as unknown as NativeMutationPayload); send('MUTATION_ACK', { batchId: payload.batchId, revision: payload.revision, version: 1 }) }
        catch (error) { send('MUTATION_ERROR', { batchId: payload.batchId, version: 1, code: error instanceof Error && error.message === 'REVISION_MISMATCH' ? 'REVISION_MISMATCH' : 'INVALID_MUTATION', message: String(error) }) }
      }
      else if (type === 'NAVIGATION_SET_OPTIONS') navigation(payload)
      else if (type === 'NAVIGATE_OPEN') platform.navigate(String(payload.path))
      else if (type === 'NAVIGATE_BACK') history.length > 1 ? history.back() : platform.navigate(rootPath)
      else if (type === 'NAVIGATE_POP_TO_ROOT') platform.navigate(options.tabs?.find(tab => location.pathname.startsWith(tab.id) && tab.id !== rootPath)?.id ?? options.tabs?.[0]?.id ?? rootPath)
      else if (type === 'NAVIGATE' || type === 'NAVIGATE_REPLACE') navigateScreen(payload.screen, payload.params, type === 'NAVIGATE_REPLACE')
      else if (type === 'API_CANCEL') { pending.get(String(payload.requestId))?.abort(); pending.delete(String(payload.requestId)) }
      else if (type === 'API_REQUEST') {
        const controller = new AbortController()
        pending.set(message.id, controller)
        void platform.call(String(payload.module), String(payload.method), Array.isArray(payload.args) ? payload.args : [], controller.signal).then(
          data => send('API_RESPONSE', { data }, message.id),
          (error: unknown) => send('API_ERROR', { code: error && typeof error === 'object' && 'code' in error ? error.code : 'BROWSER_ERROR', message: error instanceof Error ? error.message : String(error) }, message.id),
        ).finally(() => pending.delete(message.id))
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const controller of pending.values()) controller.abort()
      pending.clear()
      observer.disconnect()
      media.removeEventListener('change', theme)
      document.removeEventListener('visibilitychange', visibility)
      stopEvents?.()
      renderer.dispose()
      for (const icon of chromeRenderers) icon.dispose()
      platform.dispose()
      shell.before(container)
      shell.remove()
      listener = null
    },
  }
  const visibility = (): void => send('APP_STATE', { state: document.hidden ? 'background' : 'active' })
  document.addEventListener('visibilitychange', visibility)
  const media = matchMedia('(prefers-color-scheme: dark)')
  media.addEventListener('change', theme)
  const observer = new MutationObserver(theme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  const stopEvents = platform.emit?.(send)
  navigation({ title: options.title })
  theme()
  return bridge
}

/** Fixed route segments win over parameters, consistently with the Craft hosts. */
export function matchBrowserRoute(path: string, routes: Record<string, string>): { screen: string, params: Record<string, string> } | null {
  const pieces = path.replace(/\/$/, '').split('/')
  const matches = Object.entries(routes).flatMap(([route, screen]) => {
    const segments = route.replace(/\/$/, '').split('/')
    if (segments.length !== pieces.length) return []
    const params: Record<string, string> = {}
    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index]!
      if (segment.startsWith(':')) { try { params[segment.slice(1)] = decodeURIComponent(pieces[index]!) } catch { return [] } }
      else if (segment !== pieces[index]) return []
    }
    return [{ screen, params, score: segments.filter(segment => !segment.startsWith(':')).length }]
  })
  return matches.sort((a, b) => b.score - a.score)[0] ?? null
}
