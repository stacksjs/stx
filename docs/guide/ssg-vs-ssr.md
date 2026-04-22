# SSG vs SSR

stx supports two build modes. Both produce server-rendered HTML -- the difference is **when** that rendering happens.

## The Two Modes

| | SSG (Static Site Generation) | SSR (Server-Side Rendering) |
|---|---|---|
| Config | `ssr: false` (default) | `ssr: true` |
| Build command | `bun run build` | `bun run build` |
| Output | `dist/*.html` | `.output/` |
| `<script server>` runs | Once at build time | Per request |
| Deploy target | S3, CloudFront, Netlify, Vercel | EC2, Docker, any server with Bun |
| Cost | $1-2/month (static hosting) | $15-50/month (compute) |

## SSG: Static Site Generation (Default)

SSG is the default mode. When you run `bun run build`, stx processes every page in your `pagesDir`, executes all `<script server>` blocks, renders the templates, and writes static HTML files to `dist/`.

```typescript
// stx.config.ts
export default {
  // ssr: false is the default -- you don't need to set it
  build: {
    pagesDir: 'pages',
    outputDir: 'dist',
  },
}
```

### How SSG Build Works

1. stx discovers all `.stx` files in `pagesDir`
2. For each page, it runs the `<script server>` block in Bun
3. Template expressions (`{{ }}`) are evaluated with the server-side variables
4. The resulting HTML is written to `dist/`
5. `<script client>` blocks are preserved in the output for browser execution
6. Static assets from `publicDir` are copied to `dist/`

```
pages/
  index.stx     -->  dist/index.html
  about.stx     -->  dist/about.html
  blog/
    index.stx   -->  dist/blog/index.html
    [slug].stx  -->  dist/blog/hello-world.html (for each slug)
```

### SSG Is Server-Rendered

A common misconception: "SSG is not server-rendered." **It is.** SSG runs your server code in Bun, evaluates templates, and produces complete HTML -- exactly like SSR. The only difference is timing:

- SSG does this once at build time and saves the result
- SSR does this on every request

The output HTML is identical. Search engines see the same fully-rendered content.

### When to Use SSG

- Marketing sites and landing pages
- Documentation and blogs
- Dashboards that fetch data client-side
- Any page where the content is the same for all users
- Sites where you want the cheapest possible hosting

### SSG with Client-Side Data

SSG pages are not "dead" static pages. They can fetch data client-side after loading:

```html
<script server>
useSeoMeta({ title: 'Live Dashboard' })
</script>

<script client>
const metrics = state(null)

onMount(async () => {
  // Fetches fresh data in the browser, even though the page was built statically
  const res = await fetch('/api/metrics')
  metrics.set(await res.json())
})
</script>

<h1>Live Dashboard</h1>
<div :show="metrics()">
  <span x-text="metrics()?.activeUsers"></span> active users
</div>
```

The HTML shell (heading, layout, styles) is static. The dynamic data loads after the page is in the browser.

## SSR: Server-Side Rendering

SSR mode runs a Bun server that renders pages on every request. Set `ssr: true` in your config:

```typescript
// stx.config.ts
export default {
  ssr: true,
}
```

### How SSR Works

1. A request hits the Bun server
2. stx matches the URL to a page file
3. The `<script server>` block runs with access to request context
4. Template expressions are evaluated with fresh data
5. The complete HTML is sent as the response

### When to Use SSR

- Pages that need per-request authentication
- Personalized content (user-specific dashboards, profiles)
- Real-time data that must be fresh on every page load
- Pages that use request headers, cookies, or query params in `<script server>`

### SSR Build Output

```bash
bun run build
# Produces .output/ directory with:
#   .output/server.ts    -- production Bun server
#   .output/public/      -- static assets
```

Deploy by running the server:

```bash
cd .output
bun server.ts
```

## Dev Mode Is the Same for Both

During development, `bun run dev` (or `stx serve`) renders pages dynamically per-request regardless of your `ssr` setting. This gives you instant feedback when editing templates.

```bash
# Both SSG and SSR apps use the same dev server
bun run dev
# Starts at http://localhost:3000
```

The `ssr` flag only affects `bun run build`. In dev mode, every request re-reads files from disk, re-executes server scripts, and re-renders templates. No caching, no build step.

## `<script server>` Works in Both Modes

The `ssr` config flag controls **when** server scripts run, not **whether** they run:

```html
<script server>
// In SSG: runs once at build time
// In SSR: runs on every request
// In dev: runs on every request
const data = await fetch('https://api.example.com/data').then(r => r.json())
</script>

<div>{{ data.title }}</div>
```

The template syntax, directives, and component system are identical in both modes. You can switch between SSG and SSR by changing one config flag.

## Decision Guide

### Choose SSG When:

- Content is the same for every visitor
- You want the lowest hosting cost
- You can tolerate stale data (rebuilt periodically or on content changes)
- SEO content does not depend on the viewer
- You want the fastest possible Time to First Byte (served from CDN)

### Choose SSR When:

- You need per-request authentication in `<script server>`
- Content varies by user (personalized feeds, dashboards with server-side auth checks)
- You need access to request cookies/headers in your server script
- Data must be absolutely fresh on every page load (not suitable for build-time snapshots)

### You Probably Want SSG

Most stx apps should start with SSG. It is simpler, cheaper, and faster. You can always add SSR later by flipping the flag. Client-side data fetching in `<script client>` covers most "dynamic" needs.

## Deploy Comparison

### SSG Deploy (Static Hosting)

```bash
# Build
bun run build

# Deploy to S3 + CloudFront
aws s3 sync dist/ s3://my-bucket --delete
aws cloudfront create-invalidation --distribution-id XYZ --paths "/*"

# Or deploy to Netlify
netlify deploy --prod --dir=dist

# Or deploy to Vercel
vercel --prod
```

Cost: $1-5/month for most sites. The `dist/` directory contains plain HTML, CSS, and JS files that any static hosting provider can serve.

### SSR Deploy (Server)

```bash
# Build
bun run build

# Deploy to EC2 / VPS
rsync -avz .output/ server:/app/
ssh server 'cd /app && bun server.ts'

# Or deploy with Docker
FROM oven/bun:latest
COPY .output/ /app/
WORKDIR /app
CMD ["bun", "server.ts"]
```

Cost: $15-50/month for a small server. You need a running Bun process to handle requests.

### Convention-Based Deploy with ts-cloud

If you use `ts-cloud` for deployment, it detects your build mode automatically:

- `dist/` directory present --> deploys as static site (S3 + CloudFront)
- `.output/` directory present --> deploys as server (EC2 + load balancer)

No deploy configuration needed. The build output is the convention.

## Hybrid Approach

You do not need to choose one mode for your entire app. A common pattern:

1. Marketing pages, docs, blog: SSG (cheap, fast, cacheable)
2. App dashboard, user settings: SSR (per-request auth, personalized)

Run two separate stx apps or use a reverse proxy to route between them:

```
example.com/            --> SSG (CloudFront)
example.com/blog/*      --> SSG (CloudFront)
app.example.com/*       --> SSR (EC2)
```

## Build Configuration Reference

```typescript
// stx.config.ts
export default {
  ssr: false, // true for SSR mode

  build: {
    pagesDir: 'pages',       // Where page files live
    outputDir: 'dist',       // SSG output directory
    publicDir: 'public',     // Static assets copied to output
    baseUrl: '/',            // Base URL for generated links
    sitemap: true,           // Generate sitemap.xml
    minify: true,            // Minify HTML output
    generate404: true,       // Generate a 404.html page
    trailingSlash: false,    // URL style: /about vs /about/
    cleanOutput: true,       // Delete output dir before build
    concurrency: 10,         // Parallel page processing
  },
}
```

## Warnings

> **SSG data is frozen at build time.**
> If your `<script server>` fetches from an API, the data is captured once during `bun run build`. To update it, rebuild and redeploy. For frequently changing data, use client-side fetching or switch to SSR.

> **SSR requires a running server.**
> Unlike SSG, SSR output cannot be deployed to static hosting. You need a server running Bun to handle requests. This has operational costs (monitoring, uptime, scaling).

> **Dev mode hides the SSG/SSR difference.**
> In development, pages always render per-request. You will not notice SSG staleness issues until you build. Test with `bun run build && bun run preview` to see what users see.

> **All stx apps currently use SSG.**
> SSR is available for when you need per-request server rendering, but the default (and most common) mode is SSG.
