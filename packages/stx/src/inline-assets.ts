/**
 * Inline asset processing module for STX templates.
 *
 * Handles automatic inlining of local JavaScript and CSS files referenced
 * via <script src="..."> and <link href="..." rel="stylesheet"> tags,
 * replacing them with inline <script> and <style> blocks.
 */
import path from 'node:path'
import { getPublicEnvDefine } from './public-env'

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
export async function resolveInlinePath(assetPath: string, templateDir: string, _filePath: string): Promise<string | null> {
  try {
    let resolvedPath: string

    if (assetPath.startsWith('/')) {
      // Absolute path from project root - resolve relative to template's parent directories
      // Try to find a reasonable base (look for common project roots)
      let baseDir = templateDir
      for (let i = 0; i < 5; i++) {
        const potentialPath = path.join(baseDir, assetPath)
        if (await Bun.file(potentialPath).exists()) {
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
    if (await Bun.file(resolvedPath).exists()) {
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
/**
 * Marker for the one error in this file that must not be swallowed.
 *
 * The inlining below runs inside a try/catch whose job is to tolerate a
 * missing file and leave the tag alone. That catch is right for ENOENT and
 * wrong for a bundle we produced and know is broken, so the check throws this
 * and the catch re-throws it.
 */
const IMPORT_META_ERROR = Symbol.for('stx.inline-assets.import-meta')

/**
 * Refuse to inline browser code that still references `import.meta`.
 *
 * What gets written below is a classic `<script>`, not `type="module"`, and
 * `import.meta` there is a SyntaxError. That is a PARSE error: it cannot be
 * guarded, defaulted or caught, so the entire script fails and every feature
 * on the page goes with it — not just the line that used it.
 *
 * The failure is almost impossible to read from the outside. A page whose
 * client script never ran still renders its server HTML, so it looks alive
 * while doing nothing, and a public page built this way sat on a loading
 * spinner with one cryptic console line to explain it.
 *
 * `import.meta.env.STX_PUBLIC_*` is substituted before this point and never
 * reaches here. What does reach here is everything else: `import.meta.glob`
 * from a dependency, `import.meta.url`, `import.meta.dir`. Those are module
 * syntax that a classic script cannot hold, and the honest answer is to say
 * so at build time rather than ship a dead page.
 */
function assertInlinableForClassicScript(code: string, source: string): void {
  if (!code.includes('import.meta'))
    return

  const error = new Error(
    `[stx] ${source} still references \`import.meta\` after bundling, and it is being inlined as a classic <script> where that is a SyntaxError — the whole script fails to parse, taking every other script on the page with it.\n`
    + `  \`import.meta.env.STX_PUBLIC_*\` is substituted at build time and is safe; anything else is not.\n`
    + `  Fix it by moving the module-only code (\`import.meta.glob\`, \`import.meta.url\`) into its own module, or by resolving the value without \`import.meta\`.`,
  ) as Error & { [key: symbol]: boolean }
  error[IMPORT_META_ERROR] = true

  throw error
}

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

    const resolvedPath = await resolveInlinePath(srcPath, templateDir, filePath)

    if (resolvedPath) {
      try {
        let fileContent = await Bun.file(resolvedPath).text()
        dependencies.add(resolvedPath)

        // Transpile TypeScript to JavaScript
        if (srcPath.endsWith('.ts') || srcPath.endsWith('.tsx')) {
          const result = await Bun.build({
            entrypoints: [resolvedPath],
            target: 'browser',
            minify: true,
            define: getPublicEnvDefine(),
          })
          if (result.outputs.length > 0) {
            fileContent = await result.outputs[0].text()
            assertInlinableForClassicScript(fileContent, srcPath)
          }
        }

        // Replace with inline script
        const inlineScript = `<script>\n// Source: ${srcPath}\n${fileContent}\n</script>`
        output = output.replace(fullMatch, inlineScript)

        // Reset regex to continue searching
        scriptRegex.lastIndex = 0
      }
      catch (error) {
        // A missing file is tolerated: the tag is left alone for other build
        // tooling to handle. A bundle we produced and know cannot parse is
        // not, or this catch would restore exactly the silent failure the
        // check above exists to prevent.
        if ((error as Record<symbol, boolean> | null)?.[IMPORT_META_ERROR])
          throw error
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
      const resolvedPath = await resolveInlinePath(hrefPath, templateDir, filePath)

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
