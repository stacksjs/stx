/**
 * Where the canonical site URL comes from.
 *
 * The SSG defaulted `domain` to `http://localhost` and read no config at all,
 * so an app that declared `url: 'https://example.org'` still shipped a
 * sitemap.xml in which every entry was `http://localhost/…` — valid XML,
 * accepted by the build, and useless to a crawler. Nothing warned, because
 * from the build's point of view nothing failed (stacksjs/stx#1866).
 *
 * The URL is looked for in the places apps actually declare it, because there
 * is more than one: `stx.config.ts` for stx-native apps, `site.config.ts` for
 * the site-builder path (which has had `site.url` all along — that generator
 * was never wired to this one), and the deploy-platform env vars, which are the
 * only source available in CI where neither file knows the preview domain.
 *
 * @module site-url
 */

/** Where a resolved URL came from, for diagnostics. */
export type SiteUrlSource
  = | 'option'
    | 'stx.config'
    | 'site.config'
    | 'env'
    | 'fallback'

export interface ResolvedSiteUrl {
  url: string
  source: SiteUrlSource
  /** The env var or config key it came from, when there is one. */
  via?: string
}

/** Last resort. Deliberately not a real domain, so it is obvious in output. */
export const SITE_URL_FALLBACK = 'http://localhost'

/**
 * Deploy platforms that hand the build its own URL. Netlify's `URL` is the
 * production domain; Vercel's is bare-host, so it needs a scheme.
 */
const ENV_KEYS = ['STX_SITE_URL', 'SITE_URL', 'URL', 'VERCEL_URL', 'CF_PAGES_URL'] as const

function normalize(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed)
    return null
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    // Reject junk early rather than letting `new URL(entry.loc, domain)` throw
    // halfway through sitemap generation.
    return new URL(withScheme).origin + new URL(withScheme).pathname.replace(/\/$/, '')
  }
  catch {
    return null
  }
}

function fromEnv(env: Record<string, string | undefined>): ResolvedSiteUrl | null {
  for (const key of ENV_KEYS) {
    const value = env[key]
    if (!value)
      continue
    const url = normalize(value)
    if (url)
      return { url, source: 'env', via: key }
  }
  return null
}

/** Read `site.url` / `url` off a loaded config object of either shape. */
function fromConfigObject(config: unknown): string | null {
  if (!config || typeof config !== 'object')
    return null
  const record = config as Record<string, any>
  const candidate = record.site?.url ?? record.url ?? record.app?.url
  return typeof candidate === 'string' ? normalize(candidate) : null
}

/**
 * Load `site.config.ts` if the project has one.
 *
 * The site-builder path takes its `SiteConfig` as a function argument, so
 * nothing in stx ever read this file from disk — which is why an app could
 * declare `url` there and have the SSG ignore it.
 */
async function loadSiteConfigFile(cwd: string): Promise<string | null> {
  const { existsSync } = await import('node:fs')
  const path = await import('node:path')
  for (const name of ['site.config.ts', 'site.config.js', '.config/site.config.ts']) {
    const file = path.resolve(cwd, name)
    if (!existsSync(file))
      continue
    try {
      const module = await import(file)
      const url = fromConfigObject(module.default ?? module)
      if (url)
        return url
    }
    catch {
      // A config we cannot load is not a build failure here; the caller still
      // has the env and fallback paths.
    }
  }
  return null
}

/**
 * Resolve the canonical site URL, reporting where it came from so the caller
 * can warn when it had to fall back.
 *
 * Order is explicit-option, then app config, then deploy env, then localhost.
 */
export async function resolveSiteUrl(options: {
  explicit?: string
  stxConfig?: unknown
  cwd?: string
  env?: Record<string, string | undefined>
} = {}): Promise<ResolvedSiteUrl> {
  const cwd = options.cwd ?? process.cwd()
  const env = options.env ?? process.env

  if (options.explicit) {
    const url = normalize(options.explicit)
    if (url)
      return { url, source: 'option' }
  }

  const fromStx = fromConfigObject(options.stxConfig)
  if (fromStx)
    return { url: fromStx, source: 'stx.config', via: 'site.url' }

  const fromSiteFile = await loadSiteConfigFile(cwd)
  if (fromSiteFile)
    return { url: fromSiteFile, source: 'site.config', via: 'url' }

  const env_ = fromEnv(env)
  if (env_)
    return env_

  return { url: SITE_URL_FALLBACK, source: 'fallback' }
}

/**
 * The warning shown when a build produced localhost URLs.
 *
 * Loud, and it names the fix — a sitemap full of `http://localhost` is not
 * something anyone notices by reading build output.
 */
export function siteUrlFallbackWarning(): string {
  return [
    'No site URL configured — sitemap.xml and robots.txt will point at http://localhost.',
    `  Set one in stx.config.ts (site: { url: 'https://example.com' }), in site.config.ts,`,
    `  via --domain, or with SITE_URL in the build environment.`,
  ].join('\n')
}
