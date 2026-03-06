/**
 * Convert a text string into a URL-friendly slug.
 * Handles: lowercase, replace non-alphanumeric with hyphens,
 * collapse multiple hyphens, trim leading/trailing hyphens.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract the filename without extension from a file path and use it as a slug.
 * e.g. "content/posts/hello-world.md" -> "hello-world"
 */
export function fileNameToSlug(filePath: string): string {
  const basename = filePath.split('/').pop() || filePath
  const withoutExt = basename.replace(/\.[^.]+$/, '')
  return withoutExt
}
