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

/** What running an action produced. */
export interface PageActionResult {
  /** Set when the action asked for a redirect; the caller answers 303. */
  redirect?: string
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
    // `return { redirect: '/somewhere' }` — a plain key rather than an injected
    // `redirect()` global, so an action stays a pure function.
    const to = (result as Record<string, unknown>).redirect
    if (typeof to === 'string' && to)
      return { redirect: to, ran: true }

    // Merged, not replaced: the action's keys win over the block's so a
    // re-render shows the submitted values, but everything else the page
    // computed for its GET render is still there.
    Object.assign(context, result)
  }

  return { ran: true }
}

/**
 * The response a redirecting action should produce.
 *
 * 303 rather than 302 deliberately: it is the status that makes a browser
 * follow up with a GET, so a reload or a Back does not resubmit the form.
 */
export function actionRedirectResponse(to: string): Response {
  return new Response(null, {
    status: 303,
    headers: {
      'Location': to,
      // A redirect that answers a submission is never a cacheable page.
      'Cache-Control': 'no-store',
    },
  })
}
