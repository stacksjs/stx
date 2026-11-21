/** Application data caches can reuse only responses that need no HTTP validation. */
export function canReuseDataResponse(response: Response, request?: RequestInit): boolean {
  if (request?.cache === 'no-store') return false
  const directive = /(?:^|,)\s*(?:no-store|no-cache)(?:\s*(?:=|,|$))/i
  if (directive.test(response.headers.get('Cache-Control') || '')
    || directive.test(new Headers(request?.headers).get('Cache-Control') || '')) return false
  const vary = response.headers.get('Vary')
  if (!vary) return true
  // Some Vary fields are added by the browser and are invisible to a key
  // built from RequestInit. Reuse only when we control all the listed fields.
  const headers = new Headers(request?.headers)
  return vary.split(',').every(field => {
    const name = field.trim()
    return name !== '*' && (!name || headers.has(name))
  })
}
