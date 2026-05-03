# @stacksjs/stx-site

Build + deploy helpers for static stx marketing sites. Wraps `bun-plugin-stx`,
Crosswind CSS injection, and AWS deploy via Porkbun DNS into two opinionated
functions so a project's `scripts/` only need to declare site config.

## Install

```bash
bun add @stacksjs/stx-site
```

## Usage

```ts
// site.config.ts
import { defineSiteConfig } from '@stacksjs/stx-site'

export const site = defineSiteConfig({
  name: 'Paweł Dregan',
  url: 'https://paweldregan.com',
  description: 'Ultra runner. Coach. Husband.',
  seo: {
    image: 'https://paweldregan.com/og.png',
    twitter: 'ultrarunnerpaw',
  },
  pages: {
    '/about': { title: 'About — Paweł Dregan', priority: 0.9 },
  },
})
```

```ts
// scripts/build.ts
import { buildSite } from '@stacksjs/stx-site'
import { site } from '../site.config'

await buildSite(site)
```

```ts
// scripts/deploy.ts
import { deploySite } from '@stacksjs/stx-site'
import { site } from '../site.config'

const result = await deploySite({
  siteName: 'paweldregan',
  domain: new URL(site.url).hostname,
})

if (!result.success)
  process.exit(1)
```

## What `buildSite` does

1. Bundles all `pages/**/*.stx` with `bun-plugin-stx`
2. Injects Crosswind CSS into every emitted HTML file
3. Replaces stx's auto-injected default SEO tags with site-specific ones
4. Drops the empty `chunk-*.js` bundle artifacts and any stale `<script>` tags pointing at them
5. Copies `public/` verbatim into `dist/`
6. Synthesizes `404.html` (uses `pages/404.stx` if present, else clones index)
7. Generates `sitemap.xml` and `robots.txt`

## What `deploySite` does

Wraps `@stacksjs/ts-cloud`'s `deployStaticSiteWithExternalDnsFull` with
sensible defaults: non-SPA error handling, Porkbun DNS, AWS env-var checks,
and structured progress logging.

Set `singlePageApp: true` if your site is purely client-side routed.

## License

MIT
