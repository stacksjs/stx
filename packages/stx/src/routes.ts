// Re-export named route primitives from @stacksjs/router
export { defineRoute, defineRoutes, resetRoutes, route, setAppUrl } from '@stacksjs/router'

import { route } from '@stacksjs/router'
import { safeEvaluateObject } from './safe-evaluator'

/**
 * Process @route directives in stx templates
 * (Kept in core stx because it depends on safe-evaluator)
 */
export function processRouteDirectives(template: string): string {
  return template.replace(/@route\(\s*(['"])([^'"]+)\1(?:\s*,\s*(\{[^}]+\}))?\s*(?:,\s*(true|false)\s*)?\)/g, (_, _quote, routeName, paramsJson, absolute) => {
    try {
      // Parse the params object if provided using safe evaluation
      const params = paramsJson ? safeEvaluateObject(paramsJson, {}) : {}
      // Parse the absolute flag if provided
      const isAbsolute = absolute === 'true'

      return route(routeName, params, isAbsolute)
    }
    catch (error) {
      console.error(`Error processing @route directive: ${error}`)
      return '#route-error'
    }
  })
}

