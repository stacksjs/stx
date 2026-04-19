import { defineMiddleware } from 'stx'

/**
 * Protects guest-only routes (/trips, /favorites, /host/*, /book/*).
 * Looks for the persisted `drivly-session` key; redirects to /login
 * with a `next` param so we can return the user after sign-in.
 *
 * This is a client-side check — server middleware runs at build time
 * with no request context. For real auth you'd pair this with a
 * server-side session cookie check.
 */
export default defineMiddleware('auth', (ctx) => {
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
