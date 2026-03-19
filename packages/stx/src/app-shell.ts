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

    // Extract shell scripts (to preserve them across navigations)
    const shellScripts: string[] = []
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    let scriptMatch: RegExpExecArray | null
    while ((scriptMatch = scriptRegex.exec(content)) !== null) {
      const attrs = scriptMatch[1]
      // Skip server-only scripts
      if (attrs.includes('server')) continue
      shellScripts.push(scriptMatch[0])
    }

    // Extract shell styles
    const shellStyles: string[] = []
    const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi
    let styleMatch: RegExpExecArray | null
    while ((styleMatch = styleRegex.exec(content)) !== null) {
      shellStyles.push(styleMatch[0])
    }

    // Remove scripts and styles from template for processing
    let cleanTemplate = shellTemplate
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

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

  // Import router script for shell-level injection
  let routerScript = ''
  try {
    const { getRouterScript } = require('stx-router')
    routerScript = `<script>${getRouterScript()}</script>`
  }
  catch {
    // Router not available — SPA navigation won't work but pages still render
  }

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
 * Wrap page content as a fragment for SPA navigation.
 *
 * Returns just the page HTML, scripts, and styles — no document wrapper.
 * The client-side router will inject this into the shell's content area.
 */
export function buildPageFragment(pageContent: string): string {
  // The page content is already processed through processDirectives.
  // For SPA navigation, we return it as-is (no document wrapper).
  // The router's swap() function will handle injection.
  return pageContent
}

/**
 * Check if a request is an SPA navigation request (from the stx router).
 */
export function isSpaNavigation(request: Request): boolean {
  return request.headers.get('X-STX-Router') === 'true'
}
