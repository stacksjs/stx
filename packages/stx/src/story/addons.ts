/**
 * STX Story - Addon System
 * Extensible addon architecture for story functionality
 */

import type { ServerStoryFile, StoryContext } from './types'

/**
 * Addon panel configuration
 */
export interface AddonPanel {
  /** Panel ID */
  id: string
  /** Panel title */
  title: string
  /** Panel icon (iconify format) */
  icon?: string
  /** Render function returning HTML */
  render: (ctx: AddonContext) => string
}

/**
 * Toolbar item configuration
 */
export interface ToolbarItem {
  /** Item ID */
  id: string
  /** Item title */
  title: string
  /** Item icon */
  icon?: string
  /** Render function returning HTML */
  render: (ctx: AddonContext) => string
  /** Click handler name */
  onClick?: string
}

/**
 * Story decorator function
 */
export type StoryDecorator = (
  story: ServerStoryFile,
  ctx: AddonContext,
) => ServerStoryFile

/**
 * Addon context passed to render functions
 */
export interface AddonContext {
  /** Current story file */
  story?: ServerStoryFile
  /** Current variant ID */
  variantId?: string
  /** Story context */
  storyContext: StoryContext
  /** Current state */
  state: Record<string, any>
}

/**
 * Addon definition
 */
export interface StoryAddon {
  /** Addon name */
  name: string
  /** Unique addon ID */
  id: string
  /** Addon panel (shown in bottom panel) */
  panel?: AddonPanel
  /** Story decorator */
  decorator?: StoryDecorator
  /** Toolbar items */
  toolbar?: ToolbarItem[]
  /** Initialization function */
  init?: (ctx: StoryContext) => void | Promise<void>
}

/**
 * Registered addons
 */
const addons: Map<string, StoryAddon> = new Map()

/**
 * Register an addon
 */
export function registerAddon(addon: StoryAddon): void {
  if (addons.has(addon.id)) {
    console.warn(`Addon "${addon.id}" is already registered, overwriting...`)
  }
  addons.set(addon.id, addon)
}

/**
 * Unregister an addon
 */
export function unregisterAddon(id: string): boolean {
  return addons.delete(id)
}

/**
 * Get all registered addons
 */
export function getAddons(): StoryAddon[] {
  return Array.from(addons.values())
}

/**
 * Get an addon by ID
 */
export function getAddon(id: string): StoryAddon | undefined {
  return addons.get(id)
}

/**
 * Initialize all addons
 */
export async function initializeAddons(ctx: StoryContext): Promise<void> {
  for (const addon of addons.values()) {
    if (addon.init) {
      await addon.init(ctx)
    }
  }
}

/**
 * Apply all decorators to a story
 */
export function applyDecorators(
  story: ServerStoryFile,
  ctx: AddonContext,
): ServerStoryFile {
  let decorated = story

  for (const addon of addons.values()) {
    if (addon.decorator) {
      decorated = addon.decorator(decorated, ctx)
    }
  }

  return decorated
}

/**
 * Get all addon panels
 */
export function getAddonPanels(): AddonPanel[] {
  const panels: AddonPanel[] = []

  for (const addon of addons.values()) {
    if (addon.panel) {
      panels.push(addon.panel)
    }
  }

  return panels
}

/**
 * Get all toolbar items
 */
export function getToolbarItems(): ToolbarItem[] {
  const items: ToolbarItem[] = []

  for (const addon of addons.values()) {
    if (addon.toolbar) {
      items.push(...addon.toolbar)
    }
  }

  return items
}

// =============================================================================
// Built-in Addons
// =============================================================================

/**
 * Actions addon - logs component events
 */
export const actionsAddon: StoryAddon = {
  name: 'Actions',
  id: 'actions',
  panel: {
    id: 'actions-panel',
    title: 'Actions',
    icon: 'ph:lightning',
    render: (_ctx) => {
      return `
        <div class="addon-actions">
          <div class="addon-actions-header">
            <span>Event Log</span>
            <button onclick="window.__stxStory.clearActions()">Clear</button>
          </div>
          <div class="addon-actions-list" id="actions-list">
            <div class="addon-actions-empty">No actions logged yet</div>
          </div>
        </div>
      `
    },
  },
}

/**
 * Viewport addon - responsive preview sizes
 */
export const viewportAddon: StoryAddon = {
  name: 'Viewport',
  id: 'viewport',
  toolbar: [
    {
      id: 'viewport-select',
      title: 'Viewport',
      icon: 'ph:device-mobile',
      render: (ctx) => {
        const presets = ctx.storyContext.config.responsivePresets
        const options = presets
          .map(p => `<option value="${p.width}">${p.label}</option>`)
          .join('')

        return `
          <select id="viewport-select" onchange="window.__stxStory.setViewport(this.value)">
            <option value="">Responsive</option>
            ${options}
          </select>
        `
      },
    },
  ],
}

/**
 * Backgrounds addon - change preview background
 */
export const backgroundsAddon: StoryAddon = {
  name: 'Backgrounds',
  id: 'backgrounds',
  toolbar: [
    {
      id: 'background-select',
      title: 'Background',
      icon: 'ph:paint-bucket',
      render: (ctx) => {
        const presets = ctx.storyContext.config.backgroundPresets
        const options = presets
          .map(p => `<option value="${p.color}">${p.label}</option>`)
          .join('')

        return `
          <select id="background-select" onchange="window.__stxStory.setBackground(this.value)">
            ${options}
          </select>
        `
      },
    },
  ],
}

/**
 * Docs addon - auto-generated documentation
 */
export const docsAddon: StoryAddon = {
  name: 'Docs',
  id: 'docs',
  panel: {
    id: 'docs-panel',
    title: 'Docs',
    icon: 'ph:book-open',
    render: (_ctx) => {
      return `
        <div class="addon-docs">
          <div class="addon-docs-content" id="docs-content">
            Select a story to view documentation
          </div>
        </div>
      `
    },
  },
}

/**
 * Measure addon - spacing/sizing overlay
 */
export const measureAddon: StoryAddon = {
  name: 'Measure',
  id: 'measure',
  toolbar: [
    {
      id: 'measure-toggle',
      title: 'Measure',
      icon: 'ph:ruler',
      render: () => {
        return `
          <button
            class="toolbar-btn"
            onclick="window.__stxStory.toggleMeasure()"
            title="Toggle measure overlay"
          >
            📏
          </button>
        `
      },
    },
  ],
}

/**
 * Outline addon - component boundaries
 */
export const outlineAddon: StoryAddon = {
  name: 'Outline',
  id: 'outline',
  toolbar: [
    {
      id: 'outline-toggle',
      title: 'Outline',
      icon: 'ph:bounding-box',
      render: () => {
        return `
          <button
            class="toolbar-btn"
            onclick="window.__stxStory.toggleOutline()"
            title="Toggle outline overlay"
          >
            ⬜
          </button>
        `
      },
    },
  ],
}

/**
 * Register all built-in addons
 */
export function registerBuiltinAddons(): void {
  registerAddon(actionsAddon)
  registerAddon(viewportAddon)
  registerAddon(backgroundsAddon)
  registerAddon(docsAddon)
  registerAddon(measureAddon)
  registerAddon(outlineAddon)
}
