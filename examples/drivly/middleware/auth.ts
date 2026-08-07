import { defineMiddleware } from 'stx'

/**
 * Protects guest-only routes (/trips, /favorites, /host/*, /book/*).
 * Looks for the persisted `drivly-session` key; redirects to /login
 * with a `next` param so we can return the user after sign-in.
 *
 * Runs as a universal middleware. The `localStorage` check below is a
 * demonstration only: for real enforcement, key this off a server-side
 * session cookie via `ctx.cookies` (which is populated on the server),
 * because a guard that can only see `localStorage` is not a security
 * boundary. See stacksjs/stx#1891.
 */
export default defineMiddleware((ctx) => {
  // Skip server-side (build-time) — stx executes middleware on each request
  // in dev-server mode, and at build time in SSG mode.
  if (typeof localStorage === 'undefined') return

  try {
    const raw = localStorage.getItem('drivly-session')
    const session = raw ? JSON.parse(raw) : null
    if (!session?.user) {
      return ctx.redirect('/login?next=' + encodeURIComponent(ctx.to.path))
    }
  }
  catch {
    return ctx.redirect('/login')
  }
})
