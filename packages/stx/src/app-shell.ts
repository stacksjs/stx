/**
 * App Shell Module (Phase 3c)
 *
 * Provides single-shell architecture for stx applications.
 * One `app.stx` shell wraps all pages — its `<slot />` is the page injection point.
 *
 * - Direct requests: full shell + page content pre-rendered into `<slot />`
 * - SPA navigation (`X-STX-Router: true`): page fragment only (no shell wrapper)
 *
 * @module app-shell
 */

import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { classifyAllScripts } from './script-classifier'

// Cache router script at module level (loaded once)
let _cachedRouterScript: string | null = null
function getRouterScriptCached(): string {
  if (_cachedRouterScript !== null) return _cachedRouterScript
  try {
    const { getRouterScript } = require('stx-router')
    _cachedRouterScript = `<script>${getRouterScript()}</script>`
  }
  catch {
    _cachedRouterScript = ''
  }
  return _cachedRouterScript
}

/**
 * Processed shell ready for page injection
 */
export interface ProcessedShell {
  /** The processed shell HTML with a placeholder where page content goes */
  beforeSlot: string
  afterSlot: string
  /** Shell file path */
  filePath: string
  /** Shell's own scripts (to avoid re-injecting on SPA navigation) */
  shellScripts: string[]
  /** Shell's own styles */
  shellStyles: string[]
}

/**
 * Detect an app shell file in the given directory.
 *
 * @deprecated Use `layouts/default.stx` instead. The framework now auto-generates
 * the document shell from `stx.config.ts` `app.head` configuration.
 * The app.stx shell pattern is kept for backwards compatibility.
 *
 * Checks for `app.stx` in the project root (or configured shell path).
 * Returns the absolute path if found, null otherwise.
 */
export function detectShell(appDir: string, shellConfig?: string | false): string | null {
  // Explicitly disabled
  if (shellConfig === false) {
    return null
  }

  // Explicit shell path
  if (shellConfig && typeof shellConfig === 'string') {
    const shellPath = path.resolve(appDir, shellConfig)
    if (fs.existsSync(shellPath)) {
      return shellPath
    }
    return null
  }

  // Auto-detect: check for app.stx in project root
  const defaultShellPath = path.join(appDir, 'app.stx')
  if (fs.existsSync(defaultShellPath)) {
    return defaultShellPath
  }

  return null
}

/**
 * Process the app shell template and split it at the `<slot />` injection point.
 *
 * The shell is processed through `processDirectives()` with a placeholder
 * for the slot, then split into before/after parts for fast page composition.
 */
export async function processShell(
  shellPath: string,
  options: StxOptions,
): Promise<ProcessedShell | null> {
  try {
    const content = await Bun.file(shellPath).text()

    // Extract <template> block if SFC format
    let shellTemplate = content
    const templateMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i)
    if (templateMatch) {
      shellTemplate = templateMatch[1].trim()
    }

    // Classify shell scripts using the unified classifier
    const classified = classifyAllScripts(content)

    // Shell scripts that persist across navigations (client + signals, not server)
    const shellScripts = [
      ...classified.client.map(s => s.fullTag),
      ...classified.signals.map(s => s.fullTag),
    ]

    // Extract shell styles
    const shellStyles: string[] = []
    const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi
    let styleMatch: RegExpExecArray | null
    while ((styleMatch = styleRegex.exec(content)) !== null) {
      shellStyles.push(styleMatch[0])
    }

    // Remove server and client scripts from template, keep signals scripts
    // so processDirectives can handle them (signals runtime injection, setup functions)
    let cleanTemplate = shellTemplate
    for (const s of classified.server) {
      cleanTemplate = cleanTemplate.replace(s.fullTag, '')
    }
    for (const s of classified.client) {
      cleanTemplate = cleanTemplate.replace(s.fullTag, '')
    }
    // Remove styles from template (re-injected in shell composition)
    cleanTemplate = cleanTemplate.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

    // Replace <slot /> or <slot></slot> with a unique placeholder
    const SLOT_PLACEHOLDER = '<!--__STX_PAGE_SLOT__-->'
    cleanTemplate = cleanTemplate
      .replace(/<slot\s*\/>/gi, SLOT_PLACEHOLDER)
      .replace(/<slot\s*>\s*<\/slot>/gi, SLOT_PLACEHOLDER)

    if (!cleanTemplate.includes(SLOT_PLACEHOLDER)) {
      console.warn(`[stx] Shell ${shellPath} has no <slot /> — pages won't be injected`)
      return null
    }

    // Process shell directives (server-side evaluation of @if, expressions, etc.)
    const { processDirectives, extractVariables, defaultConfig, loadStxConfig } = await import('./')
    const projectConfig = await loadStxConfig()

    const shellContext: Record<string, any> = {
      __filename: shellPath,
      __dirname: path.dirname(shellPath),
    }

    // Execute server scripts for shell context
    for (const script of shellScripts) {
      const scriptContent = script.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
      if (scriptContent && !script.includes('client') && !script.includes('type="module"')) {
        await extractVariables(scriptContent[1], shellContext, shellPath)
      }
    }

    const processedShell = await processDirectives(
      cleanTemplate,
      shellContext,
      shellPath,
      { ...defaultConfig, ...projectConfig, ...options },
      new Set<string>(),
    )

    // Split at the slot placeholder
    const slotIndex = processedShell.indexOf(SLOT_PLACEHOLDER)
    if (slotIndex === -1) {
      console.warn(`[stx] Shell slot placeholder lost during processing`)
      return null
    }

    return {
      beforeSlot: processedShell.substring(0, slotIndex),
      afterSlot: processedShell.substring(slotIndex + SLOT_PLACEHOLDER.length),
      filePath: shellPath,
      shellScripts,
      shellStyles,
    }
  }
  catch (error) {
    console.error(`[stx] Error processing shell ${shellPath}:`, error)
    return null
  }
}

/**
 * Compose a full page by injecting page content into the processed shell.
 *
 * Wraps the page content in a document structure with the shell's layout,
 * shell scripts, shell styles, and the router.
 */
export function composeShellWithPage(
  shell: ProcessedShell,
  pageContent: string,
  pageTitle?: string,
): string {
  const title = pageTitle || 'stx App'

  // Router script (cached at module level)
  const routerScript = getRouterScriptCached()

  // Configure router to use data-stx-content as the swap container
  const routerConfig = `<script>window.__stxRouterConfig={container:'[data-stx-content]'};</script>`

  // Build the full HTML document
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${shell.shellStyles.join('\n  ')}
</head>
<body>
${shell.beforeSlot}
<div data-stx-content>${pageContent}</div>
${shell.afterSlot}
${shell.shellScripts.filter(s => !s.includes('server')).join('\n')}
${routerConfig}
${routerScript}
</body>
</html>`

  return html
}

/**
 * Strip document wrapper (DOCTYPE, html, head, body) from page content,
 * returning just the body content as a fragment.
 *
 * If the content has no document wrapper, it's returned as-is.
 *
 * Preserves:
 * - `<script>` tags from `<body>` (page scripts)
 * - `<style>` tags from `<head>` (page styles, moved to fragment)
 * - Body content
 *
 * Strips:
 * - `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers
 * - `<meta>`, `<title>`, `<link>` tags from `<head>`
 */
export function stripDocumentWrapper(html: string): string {
  const trimmed = html.trim()

  // No document wrapper — already a fragment
  if (!/<!DOCTYPE\b/i.test(trimmed) && !/^<html[\s>]/i.test(trimmed)) {
    return html
  }

  // Extract <style> tags from <head> (page-specific styles to preserve)
  const headStyles: string[] = []
  const headMatch = trimmed.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
  if (headMatch) {
    const headContent = headMatch[1]
    const styleRegex = /<style\b[^>]*>[\s\S]*?<\/style>/gi
    let m: RegExpExecArray | null
    while ((m = styleRegex.exec(headContent)) !== null) {
      headStyles.push(m[0])
    }
  }

  // Use index-based extraction for <body> — more robust than regex with [\s\S]*?
  // which can match the wrong </body> if one appears in a string literal
  const bodyOpenMatch = trimmed.match(/<body\b[^>]*>/i)
  const bodyCloseIdx = trimmed.lastIndexOf('</body>')
  if (bodyOpenMatch && bodyCloseIdx !== -1) {
    const bodyStart = bodyOpenMatch.index! + bodyOpenMatch[0].length
    const bodyContent = trimmed.slice(bodyStart, bodyCloseIdx).trim()
    if (headStyles.length > 0) {
      return headStyles.join('\n') + '\n' + bodyContent
    }
    return bodyContent
  }

  // Fallback: strip tags manually if structure doesn't match cleanly
  let result = trimmed
  result = result.replace(/<!DOCTYPE\b[^>]*>/i, '')
  result = result.replace(/<html\b[^>]*>/i, '')
  result = result.replace(/<\/html\s*>/i, '')
  if (headMatch) {
    result = result.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, headStyles.join('\n'))
  }
  result = result.replace(/<body\b[^>]*>/i, '')
  result = result.replace(/<\/body\s*>/i, '')

  return result.trim()
}

/**
 * Check if a request is an SPA navigation request (from the stx router).
 */
export function isSpaNavigation(request: Request): boolean {
  return request.headers.get('X-STX-Router') === 'true'
}
