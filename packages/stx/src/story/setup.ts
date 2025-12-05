/**
 * STX Story - Setup file support
 * Handles global story setup configuration
 */

import type { StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Setup function signature
 */
export type SetupFunction = (ctx: SetupContext) => void | Promise<void>

/**
 * Context passed to setup function
 */
export interface SetupContext {
  /** Story context */
  storyContext: StoryContext
  /** Register a global component */
  registerComponent: (name: string, component: any) => void
  /** Add global CSS */
  addCSS: (css: string) => void
  /** Add global script */
  addScript: (script: string) => void
  /** Set global state */
  setState: (key: string, value: any) => void
}

/**
 * Global components registry
 */
const globalComponents: Map<string, any> = new Map()

/**
 * Global CSS styles
 */
let globalCSS: string[] = []

/**
 * Global scripts
 */
let globalScripts: string[] = []

/**
 * Global state
 */
const globalState: Map<string, any> = new Map()

/**
 * Load and execute the setup file
 */
export async function loadSetupFile(ctx: StoryContext): Promise<void> {
  const setupFile = ctx.config.setupFile
  if (!setupFile) return

  const setupPath = path.resolve(ctx.root, setupFile)

  // Check if setup file exists
  try {
    await fs.promises.access(setupPath)
  }
  catch {
    // Setup file doesn't exist, skip
    return
  }

  // Create setup context
  const setupCtx: SetupContext = {
    storyContext: ctx,
    registerComponent: (name, component) => {
      globalComponents.set(name, component)
    },
    addCSS: (css) => {
      globalCSS.push(css)
    },
    addScript: (script) => {
      globalScripts.push(script)
    },
    setState: (key, value) => {
      globalState.set(key, value)
    },
  }

  try {
    // Dynamic import the setup file
    const setupModule = await import(setupPath)

    // Call the setup function if it exists
    if (typeof setupModule.default === 'function') {
      await setupModule.default(setupCtx)
    }
    else if (typeof setupModule.setupStory === 'function') {
      await setupModule.setupStory(setupCtx)
    }
  }
  catch (error) {
    console.warn(`Warning: Failed to load setup file: ${error}`)
  }
}

/**
 * Get all registered global components
 */
export function getGlobalComponents(): Map<string, any> {
  return globalComponents
}

/**
 * Get all global CSS
 */
export function getGlobalCSS(): string {
  return globalCSS.join('\n')
}

/**
 * Get all global scripts
 */
export function getGlobalScripts(): string {
  return globalScripts.join('\n')
}

/**
 * Get global state
 */
export function getGlobalState(): Map<string, any> {
  return globalState
}

/**
 * Get a specific global state value
 */
export function getState<T = any>(key: string): T | undefined {
  return globalState.get(key)
}

/**
 * Reset all global setup (for testing)
 */
export function resetSetup(): void {
  globalComponents.clear()
  globalCSS = []
  globalScripts = []
  globalState.clear()
}

/**
 * Generate HTML for global setup (CSS + scripts)
 */
export function getSetupHTML(): string {
  const css = getGlobalCSS()
  const scripts = getGlobalScripts()

  let html = ''

  if (css) {
    html += `<style>\n${css}\n</style>\n`
  }

  if (scripts) {
    html += `<script>\n${scripts}\n</script>\n`
  }

  return html
}
