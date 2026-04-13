import path from 'node:path'
import { loadStxConfig } from './config'

export type BuildMode = 'ssg' | 'ssr'

export interface BuildModeDetectionResult {
  mode: BuildMode
  /** Files that contain `<script server>` */
  serverScriptFiles: string[]
  totalFilesScanned: number
  scanDurationMs: number
}

export interface ComponentValidationError {
  file: string
  message: string
}

/**
 * Regex that matches an explicit `<script server>` tag.
 *
 * IMPORTANT: bare `<script>` (no attributes) is classified as `server`
 * by the script-classifier for variable extraction purposes, but it
 * does NOT mean the app needs a running server. Only the explicit
 * `server` attribute should flip the build into SSR mode.
 */
const SERVER_SCRIPT_RE = /<script\b[^>]*\bserver\b/i

/**
 * Regex that matches an explicit `<script client>` or `<script>` with
 * no server attribute — i.e. client-side scripts.
 */
const CLIENT_SCRIPT_RE = /<script\b[^>]*\bclient\b/i

/**
 * Scan all `.stx` files in the project and determine the build mode.
 *
 * - Zero `<script server>` tags → `'ssg'` (static site, flat HTML in `dist/`)
 * - Any `<script server>` tag  → `'ssr'` (server bundle in `.output/`)
 */
export async function detectBuildMode(root?: string): Promise<BuildModeDetectionResult> {
  const start = performance.now()
  const config = await loadStxConfig()

  const projectRoot = root || config.root || process.cwd()
  const dirs = [
    config.build?.pagesDir || config.pagesDir || 'pages',
    config.componentsDir || 'components',
    config.layoutsDir || 'layouts',
    config.partialsDir || 'partials',
  ].map(d => path.resolve(projectRoot, d))

  const serverScriptFiles: string[] = []
  let totalFilesScanned = 0

  for (const dir of dirs) {
    const stxFiles = await collectStxFiles(dir)

    for (const file of stxFiles) {
      totalFilesScanned++
      const content = await Bun.file(file).text()

      if (SERVER_SCRIPT_RE.test(content)) {
        serverScriptFiles.push(path.relative(projectRoot, file))
      }
    }
  }

  return {
    mode: serverScriptFiles.length > 0 ? 'ssr' : 'ssg',
    serverScriptFiles,
    totalFilesScanned,
    scanDurationMs: Math.round(performance.now() - start),
  }
}

/**
 * Validate that components don't mix `<script server>` and `<script client>`.
 *
 * Components should be server OR client — compose them via props/slots.
 * Pages are allowed to have both (e.g. `<script server>` for SEO +
 * `<script client>` for interactivity).
 */
export async function validateComponentScripts(root?: string): Promise<ComponentValidationError[]> {
  const config = await loadStxConfig()
  const projectRoot = root || config.root || process.cwd()
  const componentsDir = path.resolve(projectRoot, config.componentsDir || 'components')

  const errors: ComponentValidationError[] = []
  const stxFiles = await collectStxFiles(componentsDir)

  for (const file of stxFiles) {
    const content = await Bun.file(file).text()
    const hasServer = SERVER_SCRIPT_RE.test(content)
    const hasClient = CLIENT_SCRIPT_RE.test(content) || (/<script\b(?![^>]*\bserver\b)[^>]*>/i.test(content) && !hasServer)

    if (hasServer && hasClient) {
      const relative = path.relative(projectRoot, file)
      errors.push({
        file: relative,
        message: `Component "${relative}" has both <script server> and <script client>. `
          + `Components should be server OR client — compose them via props/slots.`,
      })
    }
  }

  return errors
}

/**
 * Recursively collect all `.stx` files in a directory.
 */
async function collectStxFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  try {
    const glob = new Bun.Glob('**/*.stx')
    for await (const file of glob.scan({ cwd: dir, absolute: true })) {
      files.push(file)
    }
  }
  catch {
    // Directory doesn't exist — that's fine, not every project has all dirs
  }

  return files
}
