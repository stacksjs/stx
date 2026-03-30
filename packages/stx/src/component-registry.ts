/**
 * Component Registry
 *
 * Handles resolution of both builtin and file-based STX components.
 * Builtin components (e.g., StxLink, StxImage) are registered in-memory
 * and render directly to HTML without requiring a .stx file on disk.
 * File-based components are resolved through a multi-strategy search
 * that mirrors the existing resolution logic in utils.ts.
 *
 * @module component-registry
 */

import path from 'node:path'
import fs from 'node:fs'
import process from 'node:process'
import { fileExists } from './utils'
import type { StxOptions } from './types'

/**
 * Context passed to builtin component render functions.
 */
export interface RenderContext {
  /** Template variable context */
  context: Record<string, any>
  /** Path of the template invoking this component */
  filePath: string
  /** Compiler options */
  options: StxOptions
  /** Dependency set for cache invalidation tracking */
  dependencies: Set<string>
}

/**
 * Props resolved from component attributes, categorized by binding type.
 */
export interface ResolvedProps {
  /** Static attribute values — e.g. title="Hello", disabled */
  static: Record<string, string | boolean>
  /** Server-side dynamic bindings — e.g. :count="items.length" (evaluated at compile time) */
  serverDynamic: Record<string, unknown>
  /** Client-side reactive bindings — expression string preserved for signals */
  clientReactive: Record<string, string>
  /** Event handler bindings — e.g. @click="handler()" */
  events: Record<string, string>
}

/**
 * Definition for a builtin component that renders without a .stx file.
 */
export interface BuiltinComponentDef {
  /** Canonical component name (e.g. "StxLink") */
  name: string
  /** Alternative names that resolve to this component (e.g. ["stx-link"]) */
  aliases: string[]
  /** Render the component to an HTML string */
  render(props: ResolvedProps, slotContent: string, ctx: RenderContext): string
}

/**
 * Convert a kebab-case string to PascalCase.
 *
 * @example kebabToPascal("stx-link") // "StxLink"
 */
export function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

/**
 * Convert a PascalCase string to kebab-case.
 *
 * @example pascalToKebab("StxLink") // "stx-link"
 */
export function pascalToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Central registry for STX components.
 *
 * Manages builtin components (registered in-memory) and provides
 * file-based component resolution with multi-directory search.
 */
export class ComponentRegistry {
  /** Map of lowercase name/alias → builtin definition */
  builtins: Map<string, BuiltinComponentDef> = new Map()

  /**
   * Register a builtin component under its canonical name and all aliases.
   */
  registerBuiltin(def: BuiltinComponentDef): void {
    this.builtins.set(def.name.toLowerCase(), def)
    for (const alias of def.aliases) {
      this.builtins.set(alias.toLowerCase(), def)
    }
  }

  /**
   * Check whether a component name matches a registered builtin (case-insensitive).
   */
  isBuiltin(name: string): boolean {
    return this.builtins.has(name.toLowerCase())
  }

  /**
   * Retrieve a builtin component definition by name (case-insensitive).
   * Returns null if no matching builtin is found.
   */
  getBuiltin(name: string): BuiltinComponentDef | null {
    return this.builtins.get(name.toLowerCase()) ?? null
  }

  /**
   * Resolve a file-based component to an absolute file path.
   *
   * Resolution order:
   * 1. Check `context.__importedComponents` Map (explicit @import directives)
   * 2. Generate name variants: [baseName.stx, PascalCase.stx, kebab-case.stx]
   * 3. Search directories in priority order:
   *    - Page-relative components/
   *    - Global componentsDir
   *    - Parent-relative components/
   *    - Project root src/components and components/
   *    - Built-in STX components directory
   * 4. Search subdirectories one level deep within each directory
   * 5. Return null if not found
   */
  async resolveFile(
    name: string,
    fromFile: string,
    options: StxOptions,
    parentContext?: Record<string, any>,
  ): Promise<string | null> {
    const baseName = name.endsWith('.stx') ? name.slice(0, -4) : name

    // 1. Check explicitly imported components
    const importedComponents = parentContext?.__importedComponents as Map<string, string> | undefined
    if (importedComponents) {
      const namesToTry = [
        baseName,
        baseName.toLowerCase(),
        kebabToPascal(baseName),
        pascalToKebab(baseName),
      ]
      for (const n of namesToTry) {
        if (importedComponents.has(n)) {
          return importedComponents.get(n)!
        }
      }
    }

    // 2. Generate file name variants
    const fileVariants = [...new Set([
      `${baseName}.stx`,
      `${kebabToPascal(baseName)}.stx`,
      `${pascalToKebab(baseName)}.stx`,
    ])]

    // Handle relative paths (./foo or ../foo)
    if (baseName.startsWith('./') || baseName.startsWith('../')) {
      const resolved = path.resolve(path.dirname(fromFile), `${baseName}.stx`)
      if (await fileExists(resolved)) {
        return resolved
      }
      return null
    }

    // 3. Build search directories in priority order
    const searchDirs: string[] = []
    const componentsDir = options.componentsDir || ''

    // Page-relative components/ (when rendering within a layout)
    const originalFilePath = parentContext?.__originalFilePath as string | undefined
    if (originalFilePath) {
      searchDirs.push(path.join(path.dirname(originalFilePath), 'components'))
    }

    // Global componentsDir from options
    if (componentsDir) {
      searchDirs.push(componentsDir)
    }

    // Parent-relative components/
    const parentRelative = path.join(path.dirname(fromFile), 'components')
    if (!searchDirs.includes(parentRelative)) {
      searchDirs.push(parentRelative)
    }

    // Project root fallback directories
    const projectRoot = process.cwd()
    const fallbackDirs = [
      path.resolve(projectRoot, 'src/components'),
      path.resolve(projectRoot, 'components'),
      // Built-in STX components directory
      path.resolve(import.meta.dir, 'components'),
    ]
    for (const fallback of fallbackDirs) {
      if (!searchDirs.includes(fallback)) {
        searchDirs.push(fallback)
      }
    }

    // 4. Search each directory with all naming variants
    for (const dir of searchDirs) {
      if (!dir) continue

      // Try direct file matches
      for (const variant of fileVariants) {
        const tryPath = path.join(dir, variant)
        if (await fileExists(tryPath)) {
          return tryPath
        }
      }

      // Search subdirectories one level deep
      try {
        const dirStat = fs.statSync(dir, { throwIfNoEntry: false })
        if (!dirStat?.isDirectory()) continue

        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const subDir = path.join(dir, entry.name)
            for (const variant of fileVariants) {
              const tryPath = path.join(subDir, variant)
              if (await fileExists(tryPath)) {
                return tryPath
              }
            }
          }
        }
      }
      catch {
        // Ignore directory read errors
      }
    }

    // 5. Not found
    return null
  }
}

/** Singleton registry instance shared across the framework */
export const registry = new ComponentRegistry()
