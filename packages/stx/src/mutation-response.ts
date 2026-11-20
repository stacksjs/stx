/** @internal Content type shared by server mutations and the browser runtime. */
export const MUTATION_RESPONSE_CONTENT_TYPE = 'application/vnd.stx.mutation.v1+json'

/**
 * Return a mutation result and fresh JSON query values in the same response.
 * The handler supplies query payloads the request is authorized to read.
 */
export function mutationResponse<T>(data: T, queries: Readonly<Record<string, unknown>>, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', MUTATION_RESPONSE_CONTENT_TYPE)
  headers.set('Cache-Control', 'no-store')
  return Response.json({ data: data === undefined ? null : data, queries }, { ...init, headers })
}
