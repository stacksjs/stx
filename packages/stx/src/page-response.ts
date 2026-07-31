const MIN_HTTP_STATUS = 100
const MAX_HTTP_STATUS = 599

/**
 * Read the static HTTP status declared by `definePageMeta`.
 *
 * The development server needs this before client scripts execute so error
 * pages and other non-200 documents carry the correct response semantics.
 */
export function extractPageResponseStatus(source: string): number | undefined {
  for (const call of source.matchAll(/\bdefinePageMeta\s*\(\s*\{([\s\S]*?)\}\s*\)/g)) {
    const match = call[1].match(/(?:^|,)\s*status\s*:\s*(\d{3})(?=\s*(?:,|$))/)
    if (!match)
      continue

    const status = Number(match[1])
    if (Number.isInteger(status) && status >= MIN_HTTP_STATUS && status <= MAX_HTTP_STATUS)
      return status
  }

  return undefined
}

