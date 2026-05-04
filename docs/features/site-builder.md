# Static Site Builder

`buildStaticSite()` is the one-call build pipeline for static stx sites. It wraps `bun-plugin-stx` plus everything you need to ship a marketing site, docs, or landing page: SEO injection, sitemap/robots generation, theme bootstrap with FOUC guard, magic SPA view transitions, multi-locale builds, and 404 synthesis. Live in `@stacksjs/stx` since v0.2.28 (previously `@stacksjs/stx-site`).

```ts
// site.config.ts
import { defineSiteConfig } from '@stacksjs/stx'

export default defineSiteConfig({
  name: 'My Site',
  url: 'https://example.com',
  description: 'A fast static site built with stx',
})
```

```ts
// build.ts
import { buildStaticSite } from '@stacksjs/stx'
import siteConfig from './site.config'

await buildStaticSite(siteConfig)
```

```bash
bun run build.ts
```

## What It Does

1. **Bundle every page** under `pagesDir` (default `pages/`) via `Bun.build` + `bun-plugin-stx`.
2. **Inject Crosswind CSS** into each emitted `.html` file.
3. **Replace stx's default SEO tags** with values derived from `siteConfig.seo` and per-page `siteConfig.pages[path]`.
4. **Drop empty `chunk-*.js`** that `bun-plugin-stx` emits as 0-byte JS siblings for each `.stx` page.
5. **Copy `publicDir`** (default `public/`) verbatim into `outDir`.
6. **Synthesize `404.html`** — uses `pages/404.stx` if present, otherwise clones `index.html` and rewrites the `<title>`.
7. **Generate `sitemap.xml`** with per-page `priority` / `changefreq`.
8. **Generate `robots.txt`** (allow-all by default; configurable).
9. **Inject the SPA router** so every page is a single SPA shell — internal anchors swap client-side without a full reload.
10. **Inject the theme bootstrap** (FOUC guard + toggle handler + `theme-color` meta) for light/dark.
11. **Wrap body content in `<main>`** automatically when neither `<main>` nor `[data-stx-content]` is present, so the router can fade the right subtree on every nav.
12. **Build per-locale copies** of every page when `i18n` is configured.

Returns:

```ts
interface BuildResult {
  outDir: string
  pages: string[]
  durationMs: number
}
```

## SiteConfig

```ts
interface SiteConfig {
  /** Display name used in sitemap, structured data, etc. */
  name: string

  /** Canonical URL with no trailing slash, e.g. "https://example.com" */
  url: string

  /** SEO description used as default for og:description / meta description */
  description?: string

  /** Optional social handles */
  social?: {
    twitter?: string
    instagram?: string
    youtube?: string
    github?: string
    linkedin?: string
    [k: string]: string | undefined
  }

  /** SEO defaults applied to every built page */
  seo?: SiteSeo

  /** Pages directory (default: "pages") */
  pagesDir?: string

  /** Public assets directory copied verbatim (default: "public") */
  publicDir?: string

  /** Output directory (default: "dist") */
  outDir?: string

  /** Skip generating sitemap.xml when false (default: true) */
  sitemap?: boolean

  /** robots.txt: true / "allow" (default), "disallow", false, or raw string */
  robots?: boolean | 'allow' | 'disallow' | string

  /** Per-page overrides keyed by output path (e.g. "/about") */
  pages?: Record<string, PageMeta>

  /** Inject the stx SPA router (default: true) */
  spa?: boolean

  /** Router options — color, prefetch, cache, etc. */
  router?: SiteRouterOptions

  /** Light/dark theme bootstrap (default: enabled with `default: 'dark'`) */
  theme?: false | SiteThemeOptions

  /** Multi-locale builds */
  i18n?: SiteI18nOptions
}
```

### `seo`

```ts
interface SiteSeo {
  title?: string         // default <title> when a page doesn't override it
  description?: string   // default meta description and og:description
  siteName?: string      // og:site_name
  image?: string         // default og:image / twitter:image (absolute URL preferred)
  twitter?: string       // handle without @
  locale?: string        // og:locale (e.g. "en_US")
  type?: string          // og:type (e.g. "website", "profile")
  favicon?: string       // path relative to site root, e.g. "/favicon.svg" (auto-injected)
}
```

The framework strips stx's default "stx Project" tags during build and replaces them with the resolved values, so nothing leaks through.

### `pages`

Override SEO and sitemap settings per route:

```ts
defineSiteConfig({
  name: 'My Site',
  url: 'https://example.com',
  pages: {
    '/': { title: 'Home', priority: 1.0, changefreq: 'weekly' },
    '/blog': { title: 'Blog · My Site', changefreq: 'daily' },
    '/internal': { sitemap: false }, // exclude from sitemap.xml
  },
})
```

## Theme Bootstrap

The framework injects three things into every built page:

1. `class="dark"` (or `"light"`) on `<html>` for the initial paint.
2. A pre-paint inline script that overrides that class from `localStorage` (or `prefers-color-scheme`) before any layout runs — eliminates FOUC.
3. A delegated click handler that toggles `<html class="dark">` on any element with `id="theme-toggle"` and persists the choice.

Plus three meta tags:

- `<meta name="color-scheme" content="dark light">` — tells the UA we render correctly in either mode (no auto form-control inversion).
- `<meta name="theme-color" media="(prefers-color-scheme: light)" content="...">` and a dark sibling — initial chrome tint hint.
- An unmediated `<meta name="theme-color">` — kept in sync with `<html.dark>` by both the FOUC guard (initial) and the toggle handler (live). Stops the URL bar / platform chrome from flashing white on dark pages during navigation.

```ts
defineSiteConfig({
  name: 'My Site',
  url: 'https://example.com',
  theme: {
    default: 'dark',           // 'dark' | 'light' | 'auto' (system preference)
    storageKey: 'theme',       // localStorage key
    colors: {
      light: '#ffffff',        // theme-color when in light mode (URL bar tint)
      dark: '#0a0a0a',         // theme-color when in dark mode
    },
  },
})
```

Pass `theme: false` to opt out entirely. Pages just need an `id="theme-toggle"` element somewhere — the framework wires the click handler.

## Magic SPA View Transitions

Internal anchor clicks (anything with a `data-stx-link` attribute, plus every same-origin `<a href>` when `interceptAllLinks: true`) swap the page content without a full reload, with a CSS view-transition on the `<main>` subtree.

You don't need to mark anything up. The site builder:

- **Auto-wraps** body content in `<main>` when neither `<main>` nor `[data-stx-content]` is present, between the last `nav`/`header` close and the first `footer` open. Theme/router scripts stay outside the wrap so they don't animate.
- **Targets bare `<main>` for view-transitions** — any page with a `<main>` element gets `view-transition-name: stx-content` automatically. The router fades that subtree on every SPA nav; the nav and footer stay stable across the swap.
- **Defaults to `interceptAllLinks: true`** for static-site builds — every page is part of the same SPA shell, so all internal anchors should swap client-side. `mailto:`, `tel:`, external URLs, `target="_blank"`, and `download` links still navigate natively.

```ts
defineSiteConfig({
  name: 'My Site',
  url: 'https://example.com',
  spa: true,                          // default
  router: {
    color: '#6366f1',                 // progress bar color
    progress: true,                   // show progress bar (default true)
    prefetch: true,                   // prefetch on hover (default true)
    cache: true,                      // cache fetched pages (default true)
    interceptAllLinks: true,          // intercept bare <a href> (default for site builds)
  },
})
```

## Multi-Locale Builds

When `i18n` is configured, the framework emits one copy of every page per locale: the default locale at `/`, others at `/<code>/`. Each copy gets:

- `<html lang="...">`
- Per-locale `og:locale`
- `<link rel="alternate" hreflang="...">` for every locale
- A canonical URL pointing at itself
- A localized sitemap entry

Tokens use `{t:key}` syntax (NOT `{{ t('key') }}` — that would clash with stx's own templating). They get rewritten per locale during the post-process pass.

```html
<!-- pages/index.stx -->
<h1>{t:hero.title}</h1>
<p>{t:hero.lead}</p>

<nav id="lang-picker"></nav>
```

```ts
defineSiteConfig({
  name: 'My Site',
  url: 'https://example.com',
  i18n: {
    locales: ['en', 'de', 'es'],
    defaultLocale: 'en',
    labels: { en: 'English', de: 'Deutsch', es: 'Español' },
    translations: {
      en: { 'hero.title': 'Welcome', 'hero.lead': 'A fast static site' },
      de: { 'hero.title': 'Willkommen', 'hero.lead': 'Eine schnelle statische Website' },
      // 'es' falls back to translations/es.json on disk
    },
    translationsDir: 'translations',  // default
    format: 'json',                   // 'json' | 'yaml' | 'yml'
    pickerSelector: '#lang-picker',   // default
  },
})
```

### Translation Sources

Translations resolve from two sources, **inline winning**:

1. `i18n.translations[locale]` in the config — wins for any key it defines.
2. `translationsDir/<locale>.{json,yaml}` files on disk.

Both formats support nested keys (`nav.home`, `hero.title`). Nested objects in JSON/YAML get flattened to dotted lookups to match stx's `@translate` convention. Missing keys fall back to the default locale's value, then to the key itself.

### Language Picker

Any element matching `pickerSelector` (default `#lang-picker`) receives `<button data-lang="en">English</button>` children that the framework's click handler navigates with. The picker:

- Marks the active locale via `aria-current`
- Listens for `stx:navigate` and `popstate` to re-mark the active button after SPA hops

## Sitemap & robots.txt

`sitemap.xml` is generated at the site root by default. Per-page `priority` (0-1) and `changefreq` come from `siteConfig.pages[path]`. Set `sitemap: false` on a `PageMeta` to exclude it from the sitemap entirely.

`robots.txt`:

```ts
defineSiteConfig({
  // ...
  robots: 'allow',                    // default — Allow all
  // robots: 'disallow',              // Disallow all (use for staging)
  // robots: false,                   // don't generate one
  // robots: 'User-agent: *\nDisallow: /admin\n',  // raw content
})
```

## Building

```ts
import { buildStaticSite } from '@stacksjs/stx'
import siteConfig from './site.config'

const result = await buildStaticSite({
  ...siteConfig,
  noClean: false,  // skip cleaning outDir before build (default: false)
})

console.log(`Built ${result.pages.length} pages in ${result.durationMs}ms`)
```

## Lower-Level Helpers

For advanced cases (custom build pipelines, doc engines), the individual helpers are exported too:

```ts
import {
  injectSeo,                  // inject SEO meta tags into raw HTML
  generateSitemap,            // generate sitemap.xml content
  generateRobots,             // generate robots.txt content
  injectRouterScript,         // inject the SPA router into HTML
  injectThemeBootstrap,       // inject the FOUC guard + theme toggle handler
  buildLangPickerScript,      // build the language-picker click handler script
  buildAlternateLinks,        // build hreflang link tags
  localizePath,               // rewrite a path for a given locale
  resolveI18n,                // load and merge translation sources
} from '@stacksjs/stx'
```

Each is documented in [`packages/stx/src/site-builder/`](https://github.com/stacksjs/stx/tree/main/packages/stx/src/site-builder).

## Deployment

Pair with `@stacksjs/ts-cloud` for one-line deploys (S3 + CloudFront + Route 53):

```ts
import { deploySite } from '@stacksjs/ts-cloud'

await deploySite({
  domain: 'example.com',
  outDir: 'dist',
})
```

`deploySite` is a smart-defaults wrapper around the existing external-DNS flow; static site projects depend on `@stacksjs/stx` + `@stacksjs/ts-cloud` directly with no intermediate package.
