/**
 * A page handling its own form submission (stacksjs/stx#1847).
 *
 * A page that declares `action` in its `<script server>` block receives its own
 * non-GET request. Whatever the action returns is merged into the render
 * context, so `errors` and `values` repopulate the very same template that drew
 * the form — one handler for the no-JS submit and the enhanced one, which is
 * the half of the Laravel/Remix/SvelteKit contract stx was missing.
 *
 * ## Why this is a module rather than two implementations
 *
 * It shipped in `bun-plugin/src/serve.ts` only, so a form worked under
 * `buddy dev` and silently did nothing in production — the request fell through
 * to the ordinary render and answered 200 with the pre-submit markup, which is
 * indistinguishable from the action having run and found nothing wrong. That is
 * the same dev-only-correctness shape as `stx typecheck` being stricter than
 * the editor, and this repo has been bitten repeatedly by two hand-maintained
 * copies of one rule drifting apart. One module, both servers.
 */

import { serializeSetCookie, type SetCookieOptions } from './cookie-serialize'

/**
 * Everything an action is given about the request.
 *
 * A plain object rather than the `Request` alone, so an action is a pure
 * function of its inputs and unit-tests without a server around it.
 */
export interface PageActionContext {
  /** The live request, for an action that needs headers or a file upload. */
  request: Request
  /** The parsed form body. */
  form: Record<string, string | string[]>
  /** Route parameters, e.g. `{ id: '7' }` for `/posts/:id`. */
  params: Record<string, string>
  /** Parsed query string. */
  query: Record<string, unknown>
  /** Request cookies. */
  cookies: Record<string, string>
}

/**
 * A cookie an action wants set on the response.
 *
 * A bare string is the whole cookie for the common case; the object form adds
 * the attributes a session cookie needs.
 */
export type PageActionCookie = string | (SetCookieOptions & { value: string })

/** What running an action produced. */
export interface PageActionResult {
  /** Set when the action asked for a redirect; the caller answers 303. */
  redirect?: string
  /**
   * `Set-Cookie` header values the caller must append to its response.
   *
   * Already serialized, so every caller appends the same strings rather than
   * each re-deriving the attributes — a session cookie that is `HttpOnly` on
   * one code path and not on another is a security bug, not an inconsistency.
   */
  cookies?: string[]
  /** True when an action existed and ran. */
  ran: boolean
}

/** Request data a caller has already parsed, if it has. */
export interface RunPageActionOptions {
  request?: Request
  method?: string
  params?: Record<string, string>
  cookies?: Record<string, string>
}

/**
 * Parse a form submission body into a plain object.
 *
 * Handles both encodings a browser form can send: `multipart/form-data` and
 * `application/x-www-form-urlencoded`. A repeated field name collapses to an
 * array, so `<input name="tag">` twice reads as `['a', 'b']` rather than
 * silently keeping only the last one — checkbox groups are the common case.
 *
 * File parts are skipped: the value would be a `File`, and a page action that
 * wants uploads should read `request.formData()` itself rather than have this
 * hand it something that cannot round-trip into a re-rendered form field.
 */
export async function parseFormBody(request: Request): Promise<Record<string, string | string[]>> {
  const type = request.headers.get('content-type') || ''
  const form: Record<string, string | string[]> = {}

  const put = (key: string, value: string): void => {
    const existing = form[key]
    if (existing === undefined)
      form[key] = value
    else if (Array.isArray(existing))
      existing.push(value)
    else
      form[key] = [existing, value]
  }

  if (type.includes('multipart/form-data')) {
    const data = await request.formData()
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string')
        put(key, value)
    }
    return form
  }

  if (type.includes('application/x-www-form-urlencoded')) {
    for (const [key, value] of new URLSearchParams(await request.text()).entries())
      put(key, value)
    return form
  }

  return form
}

/**
 * Whether this request should run a page action at all.
 *
 * GET and HEAD never do — a page action is for submissions, and running one on
 * a GET would make every page load a mutation.
 */
export function isActionableMethod(method: string | undefined): boolean {
  if (!method)
    return false

  const verb = method.toUpperCase()

  return verb !== 'GET' && verb !== 'HEAD'
}

/**
 * Run a page's own `action`, if it declared one, and merge what it returned.
 *
 * The action is picked up off the render context rather than parsed out of the
 * source: the server block has already run by this point, so a declared
 * `action` is simply there — and it can close over anything else the block
 * defined, which a regex-extracted function could not.
 *
 * Inert on GET and for any page without an action, so a page that does not opt
 * in pays one `typeof` check.
 */
export async function runPageAction(
  context: Record<string, any>,
  options: RunPageActionOptions = {},
): Promise<PageActionResult> {
  const request = options.request
  const method = options.method ?? request?.method

  if (!request || !isActionableMethod(method))
    return { ran: false }

  if (typeof context.action !== 'function')
    return { ran: false }

  let form: Record<string, string | string[]> = {}
  try {
    form = await parseFormBody(request)
  }
  catch {
    // A malformed or already-consumed body is not worth failing the render
    // over — the action still runs and sees an empty form, which its own
    // validation rejects the same way an empty submit would.
  }

  const result = await context.action({
    request,
    form,
    params: options.params ?? {},
    query: context.query ?? {},
    cookies: options.cookies ?? {},
  } satisfies PageActionContext)

  if (result && typeof result === 'object') {
    const returned = result as Record<string, unknown>

    /*
     * Cookies the action wants on the response (stacksjs/stx#1927).
     *
     * The read side already hands `cookies` in, so handing them back is the
     * other half of a symmetry that was missing — and without it the canonical
     * form could not work at all. Sign-in is DEFINED by establishing a session:
     * POST credentials, verify, set the session cookie, 303 away. Three of those
     * four steps were expressible. The result was that every app kept a separate
     * JSON endpoint for sign-in purely because it could set a cookie, which is
     * exactly the two-handlers-per-form split page actions exist to remove.
     *
     * Serialized here rather than at each call site so `HttpOnly` and `SameSite`
     * cannot differ between the redirect path and the re-render path.
     */
    const cookies = serializeActionCookies(returned.cookies)

    // `return { redirect: '/somewhere' }` — a plain key rather than an injected
    // `redirect()` global, so an action stays a pure function.
    const to = returned.redirect
    if (typeof to === 'string' && to)
      return { redirect: to, ran: true, ...(cookies.length > 0 ? { cookies } : {}) }

    // Merged, not replaced: the action's keys win over the block's so a
    // re-render shows the submitted values, but everything else the page
    // computed for its GET render is still there.
    //
    // `cookies` and `redirect` are the action's protocol with the caller, not
    // page data — merging them would overwrite the request cookies the template
    // reads under the same name.
    const { cookies: _cookies, redirect: _redirect, ...data } = returned
    Object.assign(context, data)

    if (cookies.length > 0)
      return { ran: true, cookies }
  }

  return { ran: true }
}

/**
 * Turn what an action returned under `cookies` into `Set-Cookie` values.
 *
 * Accepts the shape the read side uses — a record keyed by name — with either a
 * bare string or an options object per entry. Anything unrecognised is dropped
 * rather than guessed at, because a malformed cookie that silently half-works is
 * worse than one that is absent.
 */
function serializeActionCookies(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return []

  const headers: string[] = []

  for (const [name, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!name)
      continue

    if (typeof entry === 'string') {
      headers.push(serializeSetCookie(name, entry))
      continue
    }

    if (entry && typeof entry === 'object') {
      const options = entry as SetCookieOptions & { value?: unknown }
      // `value` is required: an entry without one cannot express a cookie, and
      // writing an empty one would DELETE the cookie the author meant to set.
      if (typeof options.value !== 'string')
        continue
      headers.push(serializeSetCookie(name, options.value, options))
    }
  }

  return headers
}

/**
 * The response a redirecting action should produce.
 *
 * 303 rather than 302 deliberately: it is the status that makes a browser
 * follow up with a GET, so a reload or a Back does not resubmit the form.
 */
export function actionRedirectResponse(to: string, cookies: readonly string[] = []): Response {
  const headers = new Headers({
    'Location': to,
    // A redirect that answers a submission is never a cacheable page.
    'Cache-Control': 'no-store',
  })

  // `append`, not `set`: a response may legitimately carry several `Set-Cookie`
  // headers — a session cookie plus a CSRF rotation is the ordinary case — and
  // `set` would keep only the last one. Built from a `Headers` rather than an
  // object literal for the same reason: an object cannot hold a repeated key.
  for (const cookie of cookies)
    headers.append('Set-Cookie', cookie)

  return new Response(null, { status: 303, headers })
}
