export interface SiteSeo {
  /** Default <title> when a page doesn't override it */
  title?: string
  /** Default meta description and og:description */
  description?: string
  /** Site name used for og:site_name */
  siteName?: string
  /** Default og:image / twitter:image (absolute URL preferred) */
  image?: string
  /** Twitter handle without @, used for twitter:site / twitter:creator */
  twitter?: string
  /** og:locale (e.g. "en_US") */
  locale?: string
  /** og:type (e.g. "website", "profile") */
  type?: string
  /**
   * Favicon path (relative to site root, e.g. "/favicon.svg") — auto-injected
   * into every page's <head>. Type is inferred from extension (.svg, .ico, .png).
   */
  favicon?: string
}

export interface SiteSocial {
  twitter?: string
  instagram?: string
  youtube?: string
  github?: string
  linkedin?: string
  [k: string]: string | undefined
}

export interface SiteConfig {
  /** Display name (used for sitemap, structured data, etc.) */
  name: string
  /** Canonical URL with no trailing slash, e.g. "https://paweldregan.com" */
  url: string
  /** Description for SEO defaults */
  description?: string
  /** Optional social links */
  social?: SiteSocial
  /** SEO defaults applied to every built page */
  seo?: SiteSeo
  /** Pages directory (default: "pages") */
  pagesDir?: string
  /** Public assets directory copied verbatim into outDir (default: "public") */
  publicDir?: string
  /** Output directory (default: "dist") */
  outDir?: string
  /** Don't generate sitemap.xml when false (default: true) */
  sitemap?: boolean
  /**
   * robots.txt mode:
   *   - true / "allow": Allow all (default)
   *   - "disallow": Disallow all (use for staging)
   *   - false: Don't generate one
   *   - string: Use the provided robots.txt content verbatim
   */
  robots?: boolean | 'allow' | 'disallow' | string
  /** Page-specific overrides keyed by output path (e.g. "/about") */
  pages?: Record<string, PageMeta>
  /**
   * Inject the stx SPA router into every page so client-side navigation
   * skips the full reload. Pages are still pre-rendered to static HTML
   * (so SEO crawlers and the initial load see real content); the router
   * just upgrades subsequent navigation. Default: true.
   */
  spa?: boolean
  /** SPA router options (color, prefetch, cache, etc.) */
  router?: SiteRouterOptions
  /**
   * Light / dark theme bootstrap. Defaults to enabled with `default:
   * "dark"`; pass `false` to opt out, or an options object to tune the
   * starting theme and localStorage key. Pages need a `id="theme-toggle"`
   * element somewhere — the framework wires the click handler.
   */
  theme?: false | SiteThemeOptions
}

export interface SiteThemeOptions {
  /** Default theme on first visit. "auto" picks from prefers-color-scheme. */
  default?: 'dark' | 'light' | 'auto'
  /** localStorage key. Default: "theme". */
  storageKey?: string
}

export interface PageMeta {
  title?: string
  description?: string
  image?: string
  /** When false, this page is excluded from sitemap.xml */
  sitemap?: boolean
  /** Sitemap priority (0–1) */
  priority?: number
  /** Sitemap change frequency */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
}

export interface BuildOptions extends SiteConfig {
  /** Skip cleaning outDir before build (default: false) */
  noClean?: boolean
}

/**
 * SPA router options (subset — see RouterOptions in router.ts).
 * Inlined to avoid a circular import in this types file.
 */
export interface SiteRouterOptions {
  color?: string
  progress?: boolean
  prefetch?: boolean
  cache?: boolean
}
