/**
 * Inline asset processing module for STX templates.
 *
 * Handles automatic inlining of local JavaScript and CSS files referenced
 * via <script src="..."> and <link href="..." rel="stylesheet"> tags,
 * replacing them with inline <script> and <style> blocks.
 */
import path from 'node:path'

/**
 * Check if a URL is external (http, https, or protocol-relative)
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')
}

/**
 * Resolve an inline asset path relative to the template file.
 *
 * @param assetPath - The path from the src/href attribute
 * @param templateDir - Directory containing the template
 * @param filePath - Full path to the template file
 * @returns Resolved absolute path, or null if not found
 */
export function resolveInlinePath(assetPath: string, templateDir: string, _filePath: string): string | null {
  try {
    let resolvedPath: string

    if (assetPath.startsWith('/')) {
      // Absolute path from project root - resolve relative to template's parent directories
      // Try to find a reasonable base (look for common project roots)
      let baseDir = templateDir
      for (let i = 0; i < 5; i++) {
        const potentialPath = path.join(baseDir, assetPath)
        if (require('node:fs').existsSync(potentialPath)) {
          return potentialPath
        }
        baseDir = path.dirname(baseDir)
      }
      // Fallback: resolve from template directory
      resolvedPath = path.join(templateDir, assetPath)
    }
    else if (assetPath.startsWith('./') || assetPath.startsWith('../')) {
      // Relative path from template location
      resolvedPath = path.resolve(templateDir, assetPath)
    }
    else {
      // No prefix - treat as relative to template directory
      resolvedPath = path.resolve(templateDir, assetPath)
    }

    // Check if file exists
    if (require('node:fs').existsSync(resolvedPath)) {
      return resolvedPath
    }

    return null
  }
  catch {
    return null
  }
}

/**
 * Automatically inline local JS/CSS files.
 *
 * This function handles:
 * - `<script src="./file.js"></script>` → `<script>...file contents...</script>`
 * - `<link href="./file.css" rel="stylesheet">` → `<style>...file contents...</style>`
 *
 * Only local/relative paths are inlined. External URLs (http://, https://, //) are left as-is.
 *
 * @param template - The template string to process
 * @param filePath - Path to the current template file (for resolving relative paths)
 * @param dependencies - Set to track included file dependencies
 * @returns Template with local assets inlined
 */
export async function processInlineAssets(
  template: string,
  filePath: string,
  dependencies: Set<string>,
): Promise<string> {
  let output = template
  const templateDir = path.dirname(filePath)

  // Process external scripts with src attribute (local files only)
  // Matches: <script src="path"></script>
  const scriptRegex = /<script\b([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi
  let scriptMatch: RegExpExecArray | null

  while ((scriptMatch = scriptRegex.exec(output)) !== null) {
    const [fullMatch, before, srcPath, after] = scriptMatch

    // Skip external URLs
    if (isExternalUrl(srcPath)) {
      continue
    }

    const resolvedPath = resolveInlinePath(srcPath, templateDir, filePath)

    if (resolvedPath) {
      try {
        let fileContent = await Bun.file(resolvedPath).text()
        dependencies.add(resolvedPath)

        // Transpile TypeScript to JavaScript
        if (srcPath.endsWith('.ts') || srcPath.endsWith('.tsx')) {
          const result = await Bun.build({
            entrypoints: [resolvedPath],
            target: 'browser',
            minify: false,
          })
          if (result.outputs.length > 0) {
            fileContent = await result.outputs[0].text()
          }
        }

        // Replace with inline script
        const inlineScript = `<script>\n// Source: ${srcPath}\n${fileContent}\n</script>`
        output = output.replace(fullMatch, inlineScript)

        // Reset regex to continue searching
        scriptRegex.lastIndex = 0
      }
      catch (error) {
        // File doesn't exist - leave the tag as-is (might be handled by build tooling)
      }
    }
  }

  // Process external stylesheets (local files only)
  // Matches: <link href="path" rel="stylesheet"> or <link rel="stylesheet" href="path">
  const linkRegex = /<link\b([^>]*)href=["']([^"']+)["']([^>]*)(?:\/?>)/gi
  let linkMatch: RegExpExecArray | null

  while ((linkMatch = linkRegex.exec(output)) !== null) {
    const [fullMatch, before, hrefPath, after] = linkMatch
    const combinedAttrs = before + after

    // Skip external URLs
    if (isExternalUrl(hrefPath)) {
      continue
    }

    // Check if it's a stylesheet link
    const isStylesheet = /rel=["']stylesheet["']/.test(combinedAttrs) || hrefPath.endsWith('.css')

    if (isStylesheet) {
      const resolvedPath = resolveInlinePath(hrefPath, templateDir, filePath)

      if (resolvedPath) {
        try {
          const fileContent = await Bun.file(resolvedPath).text()
          dependencies.add(resolvedPath)

          // Replace with inline style
          const inlineStyle = `<style>\n/* Source: ${hrefPath} */\n${fileContent}\n</style>`
          output = output.replace(fullMatch, inlineStyle)

          // Reset regex to continue searching
          linkRegex.lastIndex = 0
        }
        catch (error) {
          // File doesn't exist - leave the tag as-is
        }
      }
    }
  }

  return output
}
