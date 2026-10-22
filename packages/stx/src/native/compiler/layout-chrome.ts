/**
 * A layout's chrome, which a native screen does not draw.
 *
 * A web view extends a layout that draws the site around it: the nav across
 * the top, a tab strip, the footer. On a phone that chrome is the app's own
 * (the tab bar, the navigation bar), so drawn again as views it would sit
 * inside the screen, twice over. The layout says which of its elements are
 * chrome, and the native compile leaves them out:
 *
 * ```html
 * <nav data-native-chrome="tabs">                <!-- the app's tab bar -->
 *   <a href="/today" data-native-icon="i-lucide-house">Today</a>
 *   <a href="/plans"><i class="i-lucide-calendar"></i> Plans</a>
 * </nav>
 * <header data-native-chrome="bar">              <!-- the navigation bar -->
 *   <a href="/settings" aria-label="Settings"><i class="i-lucide-settings"></i></a>
 * </header>
 * <main>@yield('content')</main>
 * <footer data-native-chrome>…</footer>          <!-- not drawn at all -->
 * ```
 *
 * Its links are kept, in order, as the screen's `chrome`: `tabs` for the
 * host's tab bar (an app builds its tab configuration from them), `bar` for
 * the navigation bar, whose buttons open their paths (the runtime sends them
 * through `craft.navigation.setChrome`). A link's title is its text, else its
 * `aria-label` or `title`; its icon is `data-native-icon` (an Iconify name, or
 * an SF Symbol), else the first Iconify class on it or inside it. Only links
 * to a path of the app (`/plans`) are items: the host opens paths.
 *
 * Everything else the layout renders stays, the content and the overlays
 * beside it (a toast, a video player) alike. On the web the attributes are
 * inert.
 */
import type { NativeChromeItem, NativeLayoutChrome } from './ir'
import { iconClassIn, resolveIconName } from './icons'

const CHROME = '[data-native-chrome]'

interface OpenItem extends NativeChromeItem {
  region: string
  label: string
}

function regionKind(value: string | null): string {
  const kind = (value ?? '').trim().toLowerCase()
  return kind === 'tabs' || kind === 'bar' ? kind : ''
}

/**
 * The SF Symbol for an icon a link names: an Iconify name (`i-lucide-house`,
 * or a bare lucide name the table knows), else the symbol as written (`tray`).
 */
function chromeSymbol(icon: string): string {
  const resolved = resolveIconName(icon)
  return resolved.known || /^i-|:/.test(icon) ? resolved.symbol : icon
}

/** A path of the app, or null for a link the host cannot open. */
function appPath(href: string | null): string | null {
  const value = (href ?? '').trim()
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}

/** The text a link reads as, whitespace collapsed. */
function readable(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '\'')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Take the chrome out of a rendered page: the page without it, and its links.
 * `chrome` is null when the page marks none.
 */
export async function extractLayoutChrome(html: string): Promise<{ html: string, chrome: NativeLayoutChrome | null }> {
  if (!/\bdata-native-chrome\b/i.test(html)) return { html, chrome: null }

  const regions: string[] = []
  const items: OpenItem[] = []
  let open: OpenItem | null = null
  let marked = false
  await new HTMLRewriter()
    .on(CHROME, {
      element(element) {
        marked = true
        regions.push(regionKind(element.getAttribute('data-native-chrome')))
        element.onEndTag(() => { regions.pop() })
      },
    })
    .on(`${CHROME} a`, {
      element(element) {
        const path = appPath(element.getAttribute('href'))
        const region = regions[regions.length - 1] ?? ''
        if (!path || !region) return
        const icon = element.getAttribute('data-native-icon') || iconClassIn(element.getAttribute('class') ?? '')
        const item: OpenItem = {
          path,
          title: '',
          region,
          label: element.getAttribute('aria-label') || element.getAttribute('title') || '',
          ...(icon ? { symbol: chromeSymbol(icon) } : {}),
        }
        open = item
        element.onEndTag(() => {
          item.title = readable(item.title) || readable(item.label)
          items.push(item)
          if (open === item) open = null
        })
      },
      text(chunk) {
        if (open) open.title += chunk.text
      },
    })
    .on(`${CHROME} a *`, {
      element(element) {
        if (!open || open.symbol) return
        const icon = element.getAttribute('data-native-icon') || iconClassIn(element.getAttribute('class') ?? '')
        if (icon) open.symbol = chromeSymbol(icon)
      },
    })
    .transform(new Response(html))
    .text()
  if (!marked) return { html, chrome: null }

  const stripped = await new HTMLRewriter()
    .on(CHROME, { element(element) { element.remove() } })
    .transform(new Response(html))
    .text()
  const of = (region: string): NativeChromeItem[] => items
    .filter(item => item.region === region)
    .map(({ path, title, symbol }) => ({ path, title, ...(symbol ? { symbol } : {}) }))
  return { html: stripped, chrome: { tabs: of('tabs'), bar: of('bar') } }
}
