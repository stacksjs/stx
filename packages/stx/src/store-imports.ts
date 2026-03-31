/**
 * Store Import Transformation
 *
 * Transforms `import { x } from '@stores'` statements in client scripts
 * into runtime lookups against the global store registry.
 *
 * @module store-imports
 */

/**
 * Transform import statements from @stores to runtime code.
 *
 * Transforms:
 * ```js
 * import { appStore, chatStore } from '@stores'
 * ```
 *
 * Into:
 * ```js
 * const { appStore, chatStore } = window.__STX_STORES__
 * ```
 *
 * Also transforms @composables imports to window.__composables.
 */
export function transformStoreImports(code: string): string {
  // Match: import { store1, store2 } from '@stores' or "stx/stores" or 'stx/stores'
  const storeRegex = /import\s*\{([^}]+)\}\s*from\s*['"](@stores|stx\/stores)['"]\s*;?\n?/g

  code = code.replace(storeRegex, (_match, imports: string) => {
    const storeNames = imports
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    return `const { ${storeNames.join(', ')} } = window.__STX_STORES__\n`
  })

  // Match: import { useSiteApi, useFetchData } from '@composables'
  const composablesRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@composables['"]\s*;?\n?/g

  code = code.replace(composablesRegex, (_match, imports: string) => {
    const names = imports
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    return `const { ${names.join(', ')} } = window.__composables\n`
  })

  return code
}
