/**
 * STX Router Directive
 *
 * Usage in templates:
 *   @stxRouter - Inject the SPA router script
 *   @stxRouter('main') - Specify custom container selector
 */

import type { CustomDirective } from '../types'
import { getRouterScript } from './index'

/**
 * Handler for @stxRouter directive
 * Injects the SPA router script into the page
 */
export async function stxRouterHandler(
  _content: string,
  params: string[],
  _context: Record<string, unknown>,
  _filePath: string,
): Promise<string> {
  const container = params[0]?.replace(/['"]/g, '') || 'main'

  // Generate the router script with custom container if specified
  let script = getRouterScript()

  // Replace default container if custom one specified
  if (container !== 'main') {
    script = script.replace(
      `container:'main'`,
      `container:'${container}'`,
    )
  }

  return `<script>${script}</script>`
}

/**
 * Custom directive for @stxRouter
 */
export const stxRouterDirective: CustomDirective = {
  name: 'stxRouter',
  handler: stxRouterHandler,
  hasEndTag: false,
  description: 'Inject the STX SPA router script for client-side navigation',
}
