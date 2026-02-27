/**
 * useMeta - Reactive meta tag management composable
 *
 * Provides clean APIs for managing `<meta>` tags without raw `document.querySelector`.
 */

export interface UseMetaOptions {
  /** Page title */
  title?: string
  /** Meta description */
  description?: string
  /** Additional meta tags as name/content pairs */
  meta?: Record<string, string>
  /** Open Graph meta tags as property/content pairs */
  og?: Record<string, string>
}

export interface MetaRef {
  /** Set a meta tag by name */
  setMeta: (name: string, content: string) => void
  /** Set an Open Graph meta tag */
  setOgMeta: (property: string, content: string) => void
  /** Remove a meta tag by name */
  removeMeta: (name: string) => void
  /** Set the page title */
  setTitle: (title: string) => void
}

/**
 * Reactive meta tag management.
 *
 * @example
 * ```ts
 * const meta = useMeta({
 *   title: 'My Page',
 *   description: 'A page description',
 *   og: { image: 'https://example.com/og.png' }
 * })
 *
 * // Dynamic updates
 * meta.setTitle('New Title')
 * meta.setMeta('description', 'Updated description')
 * meta.setOgMeta('image', 'https://example.com/new.png')
 * ```
 */
export function useMeta(options?: UseMetaOptions): MetaRef {
  if (typeof document === 'undefined') {
    return {
      setMeta: () => {},
      setOgMeta: () => {},
      removeMeta: () => {},
      setTitle: () => {},
    }
  }

  function findOrCreateMeta(attr: string, key: string): HTMLMetaElement {
    let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attr, key)
      document.head.appendChild(el)
    }
    return el
  }

  const ref: MetaRef = {
    setMeta(name: string, content: string) {
      findOrCreateMeta('name', name).setAttribute('content', content)
    },
    setOgMeta(property: string, content: string) {
      const key = property.startsWith('og:') ? property : `og:${property}`
      findOrCreateMeta('property', key).setAttribute('content', content)
    },
    removeMeta(name: string) {
      const el = document.querySelector(`meta[name="${name}"]`)
      if (el) el.remove()
    },
    setTitle(title: string) {
      document.title = title
    },
  }

  // Apply initial options
  if (options) {
    if (options.title) ref.setTitle(options.title)
    if (options.description) ref.setMeta('description', options.description)
    if (options.meta) {
      for (const [name, content] of Object.entries(options.meta)) {
        ref.setMeta(name, content)
      }
    }
    if (options.og) {
      for (const [property, content] of Object.entries(options.og)) {
        ref.setOgMeta(property, content)
      }
    }
  }

  return ref
}
