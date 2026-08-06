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

/**
 * Remove `import` statements from a store or composable module body.
 *
 * These files are concatenated into one browser IIFE, so their imports have to
 * go: `state`, `derived` and `defineStore` are runtime globals rather than real
 * modules, and leaving the statements in makes the transpiler emit `require()`
 * calls that fail in the browser.
 *
 * The previous pattern was line-anchored (`^import\s+.*from …$`), so a
 * multi-line specifier list survived it — and survived Bun's transpiler too,
 * because `import` is legal at a module's top level. It only failed once the
 * body had been wrapped in the shared IIFE, where an import is a SyntaxError
 * that takes EVERY store in the bundle with it, reported as a misleading
 * "Store not found" (stacksjs/stx#1859).
 *
 * `[^'"]` between `import` and `from` is what keeps a multi-line match from
 * running past its own statement into the next one's specifier: the clause
 * never contains a quote, and the module specifier always does.
 *
 * Shared by both loaders because they carried byte-identical copies, which is
 * how one of them would have been fixed and the other left behind.
 */
export function stripModuleImports(code: string): string {
  return code
    // `import … from '…'`, however many lines the clause spans.
    .replace(/^import\s+[^'"]*?from\s*['"][^'"]+['"]\s*;?[ \t]*$/gm, '')
    // Side-effect only: `import './setup'`.
    .replace(/^import\s+['"][^'"]+['"]\s*;?[ \t]*$/gm, '')
}
