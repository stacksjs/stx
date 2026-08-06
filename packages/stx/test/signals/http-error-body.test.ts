/**
 * A failed request carries the server's own message (stacksjs/stx#1848).
 *
 * Every data primitive threw a synthesized `HTTP nnn: statusText` BEFORE
 * touching the response body, so whatever the server actually said — a
 * validation map, a rate-limit reason, an auth message — was unreachable from
 * `useFetch`, `useQuery`, `useMutation` and the module `useFetch` alike, with no
 * escape hatch. `options.transform` only ever sees a successful parse, so it
 * could not be used to get at it either.
 *
 * That is the single most cited reason an app keeps writing raw `fetch()`: not
 * that the primitive is missing, but that it discards the one thing the caller
 * needs to render a useful error.
 *
 * The body is attached to the error rather than only interpolated into its
 * message: `err.data` is what a form needs to show per-field errors, and
 * `err.status` is what a caller needs to tell 401 from 500 without parsing
 * English.
 *
 * Both implementations are covered, because they are two implementations
 * (CLAUDE.md item 40) and this is exactly the kind of behaviour that drifts.
 */
import { describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

type HttpError = Error & { status?: number, statusText?: string, data?: unknown }

/**
 * Pull `__stxHttpError` out of the GENERATED runtime and make it callable.
 *
 * Throws rather than returning a stub if it cannot be found — a test that
 * locates code by searching generated text and quietly finds nothing becomes a
 * test that passes because it checked nothing (CLAUDE.md item 41).
 */
async function runtimeHttpError(): Promise<(r: Response) => Promise<HttpError>> {
  const src = generateSignalsRuntimeDev()
  const match = /async function __stxHttpError\(response\)\{?[\s\S]*?\n {2}\}/.exec(src)
  if (!match)
    throw new Error('__stxHttpError not found in the generated runtime')
  // eslint-disable-next-line no-new-func
  return new Function(`return (async function(){${match[0]}; return __stxHttpError })()`)()
}

function jsonResponse(status: number, statusText: string, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('the runtime turns a failed response into a useful error', () => {
  it('surfaces a JSON message field', async () => {
    const toError = await runtimeHttpError()
    const err = await toError(jsonResponse(422, 'Unprocessable', { message: 'Email already taken' }))

    expect(err.message).toContain('Email already taken')
    expect(err.status).toBe(422)
  })

  it('surfaces a JSON error field', async () => {
    const toError = await runtimeHttpError()
    const err = await toError(jsonResponse(401, 'Unauthorized', { error: 'token expired' }))

    expect(err.message).toContain('token expired')
    expect(err.status).toBe(401)
  })

  it('attaches the parsed body, not just the message', async () => {
    // The part a form actually needs: per-field errors, structured.
    const toError = await runtimeHttpError()
    const err = await toError(jsonResponse(422, 'Unprocessable', {
      message: 'Validation failed',
      errors: { email: ['taken'] },
    }))

    expect((err.data as { errors: Record<string, string[]> }).errors.email).toEqual(['taken'])
  })

  it('handles a plain-text body', async () => {
    const toError = await runtimeHttpError()
    const err = await toError(new Response('upstream exploded', { status: 500, statusText: 'Server Error' }))

    expect(err.message).toContain('upstream exploded')
    expect(err.data).toBe('upstream exploded')
  })

  it('still produces a sane error for an empty body', async () => {
    const toError = await runtimeHttpError()
    const err = await toError(new Response('', { status: 503, statusText: 'Unavailable' }))

    expect(err.message).toBe('HTTP 503: Unavailable')
    expect(err.status).toBe(503)
  })

  it('does not leave the status only in the message', async () => {
    // Parsing the message to branch on the status is what callers were doing.
    const toError = await runtimeHttpError()
    const err = await toError(jsonResponse(429, 'Too Many Requests', { message: 'slow down' }))

    expect(err.status).toBe(429)
    expect(err.statusText).toBe('Too Many Requests')
  })
})

describe('every throw site goes through it', () => {
  it('leaves no hand-built HTTP error behind in the runtime', async () => {
    // useFetch, useQuery and useMutation each had their own copy of the same
    // two lines. One helper, or they drift.
    const src = generateSignalsRuntimeDev()

    expect(src).not.toMatch(/throw new Error\('HTTP ' \+ response\.status/)
    expect((src.match(/throw await __stxHttpError\(response\)/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })
})
