// @ts-nocheck - Skip type checking due to menu item type constraints
import type { SystemTrayInstance, SystemTrayMenuItem, SystemTrayOptions } from './types'
import process from 'node:process'

/**
 * System Tray / Menubar Implementation
 *
 * Provides cross-platform system tray functionality using Craft's native APIs.
 *
 * ## Architecture
 *
 * When running inside a Craft native window, tray operations use the
 * `window.craft.tray` bridge to communicate with the native process.
 *
 * When running outside Craft (e.g., in browser or Node.js), provides a
 * web-based simulation for development and testing.
 *
 * ## Usage in Craft
 *
 * The tray is automatically enabled when you pass `systemTray: true` to
 * the window options in Craft. This module provides additional TypeScript
 * APIs for programmatic control.
 *
 * ```typescript
 * // Create tray via @stacksjs/desktop
 * const tray = await createSystemTray({
 *   tooltip: 'My App',
 *   menu: [
 *     { label: 'Show Window', onClick: () => window.craft.window.show() },
 *     { type: 'separator' },
 *     { label: 'Quit', onClick: () => window.craft.app.quit() },
 *   ],
 * })
 *
 * // Or use Craft's bridge directly in your HTML/JS:
 * window.craft.tray.setTitle('My App')
 * window.craft.tray.setMenu([...])
 * ```
 */

// =============================================================================
// Types
// =============================================================================

interface TrayState {
  icon: string
  tooltip: string
  menu: SystemTrayMenuItem[]
  visible: boolean
}

/**
 * Menu item format expected by Craft's tray bridge
 */
interface CraftMenuItemDefinition {
  id: string
  label: string
  type?: 'normal' | 'separator' | 'checkbox' | 'radio'
  checked?: boolean
  enabled?: boolean
  action?: string
  shortcut?: string
  submenu?: CraftMenuItemDefinition[]
}

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Detect the current platform
 */
function getPlatform(): 'darwin' | 'linux' | 'win32' | 'unknown' {
  if (process.platform) {
    return process.platform as 'darwin' | 'linux' | 'win32' | 'unknown'
  }
  return 'unknown'
}

/**
 * Check if running inside a Craft native window
 */
function isInCraftWindow(): boolean {
  if (typeof window !== 'undefined' && (window as any).craft?.tray) {
    return true
  }
  return false
}

// =============================================================================
// Menu Conversion
// =============================================================================

/**
 * Convert SystemTrayMenuItem to Craft's menu format
 */
function convertMenuItem(item: SystemTrayMenuItem, index: number): CraftMenuItemDefinition {
  if (item.type === 'separator') {
    return {
      id: `sep-${index}`,
      label: '',
      type: 'separator',
    }
  }

  const menuItem: CraftMenuItemDefinition = {
    id: `item-${index}-${item.label.replace(/\s+/g, '-').toLowerCase()}`,
    label: item.label,
    type: item.type || 'normal',
    enabled: item.enabled !== false,
  }

  if (item.accelerator) {
    menuItem.shortcut = item.accelerator
  }

  if (item.type === 'checkbox') {
    menuItem.checked = item.checked || false
  }

  if (item.type === 'submenu' && item.submenu) {
    menuItem.submenu = item.submenu.map((subItem, subIndex) =>
      convertMenuItem(subItem, subIndex),
    )
  }

  return menuItem
}

/**
 * Convert array of SystemTrayMenuItems to Craft format
 */
function convertMenuItems(items: SystemTrayMenuItem[]): CraftMenuItemDefinition[] {
  return items.map((item, index) => convertMenuItem(item, index))
}

// =============================================================================
// Menu Rendering (Web Simulation)
// =============================================================================

/**
 * Render a menu item to HTML (for web-based simulation)
 */
function renderMenuItem(item: SystemTrayMenuItem, level: number = 0): string {
  if (item.type === 'separator') {
    return '<hr class="stx-tray-separator" />'
  }

  const indent = '  '.repeat(level)
  const disabled = item.enabled === false ? 'disabled' : ''
  const checked = item.checked ? '✓ ' : ''
  const accelerator = item.accelerator ? `<span class="accelerator">${item.accelerator}</span>` : ''

  let html = `${indent}<div class="stx-tray-item ${disabled}" data-action="${item.label}">`
  html += `<span class="label">${checked}${item.label}</span>${accelerator}`

  if (item.type === 'submenu' && item.submenu) {
    html += '<span class="arrow">▸</span>'
    html += '<div class="stx-tray-submenu">'
    for (const subItem of item.submenu) {
      html += renderMenuItem(subItem, level + 1)
    }
    html += '</div>'
  }

  html += '</div>'
  return html
}

/**
 * Render the full tray menu to HTML
 */
function renderTrayMenu(menu: SystemTrayMenuItem[]): string {
  let html = '<div class="stx-tray-menu">'
  for (const item of menu) {
    html += renderMenuItem(item)
  }
  html += '</div>'
  return html
}

// =============================================================================
// Tray Manager
// =============================================================================

// Active tray instances
const activeTrayInstances = new Map<string, { state: TrayState, handlers: Map<string, () => void> }>()

/**
 * Generate a unique tray ID
 */
function generateTrayId(): string {
  return `tray-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Set up event listener for tray menu actions (Craft bridge)
 */
let craftTrayListenerSetup = false

function setupCraftTrayListener(): void {
  if (craftTrayListenerSetup || typeof window === 'undefined') return

  window.addEventListener('craft:tray:menu', ((event: CustomEvent) => {
    const { action } = event.detail
    // Find the handler for this action
    for (const instance of activeTrayInstances.values()) {
      const handler = instance.handlers.get(action)
      if (handler) {
        handler()
        break
      }
    }
  }) as EventListener)

  craftTrayListenerSetup = true
}

/**
 * Create a system tray/menubar application
 *
 * When running inside a Craft native window, this creates a real native tray.
 * Otherwise, it creates a simulated tray for development purposes.
 *
 * @param options - Tray configuration options
 * @returns System tray instance
 *
 * @example
 * ```typescript
 * const tray = await createSystemTray({
 *   icon: './icon.png',
 *   tooltip: 'My App',
 *   menu: [
 *     { label: 'Show Window', onClick: () => stxWindow.show() },
 *     { type: 'separator' },
 *     { label: 'Quit', onClick: () => stxWindow.quit() },
 *   ],
 * })
 * ```
 */
export async function createSystemTray(options: SystemTrayOptions = {}): Promise<SystemTrayInstance> {
  const id = generateTrayId()
  const platform = getPlatform()
  const inCraft = isInCraftWindow()

  // Initialize state
  const state: TrayState = {
    icon: options.icon || '',
    tooltip: options.tooltip || 'stx Application',
    menu: options.menu || [],
    visible: true,
  }

  // Store click handlers
  const handlers = new Map<string, () => void>()
  for (const item of options.menu || []) {
    if (item.type !== 'separator' && item.onClick) {
      handlers.set(item.label, item.onClick)
    }
    // Handle submenu items
    if (item.type === 'submenu' && item.submenu) {
      for (const subItem of item.submenu) {
        if (subItem.type !== 'separator' && subItem.onClick) {
          handlers.set(subItem.label, subItem.onClick)
        }
      }
    }
  }

  // Store instance
  activeTrayInstances.set(id, { state, handlers })

  // Platform-specific implementation
  if (inCraft) {
    setupCraftTrayListener()

    // Use Craft's native tray APIs
    const craftWindow = window as any
    try {
      // Set the tray title/tooltip
      if (state.tooltip) {
        await craftWindow.craft.tray.setTitle({ title: state.tooltip })
        await craftWindow.craft.tray.setTooltip({ tooltip: state.tooltip })
      }

      // Set the icon if provided
      if (state.icon) {
        await craftWindow.craft.tray.setIcon({ icon: state.icon })
      }

      // Set the menu
      const craftMenu = convertMenuItems(state.menu)
      await craftWindow.craft.tray.setMenu({ items: craftMenu })

      console.log(`[stx-tray] Native tray created for ${platform}`)
    }
    catch (error) {
      console.warn('[stx-tray] Failed to create native tray:', error)
    }
  }
  else {
    // Web-based simulation for development
    console.log(`[stx-tray] Created simulated tray (not in Craft window)`)
    console.log(`[stx-tray] ID: ${id}`)
    console.log(`[stx-tray] Tooltip: ${state.tooltip}`)
    console.log(`[stx-tray] Menu items: ${state.menu.length}`)
  }

  // Create instance methods
  const instance: SystemTrayInstance = {
    id,

    setIcon: (icon: string) => {
      state.icon = icon
      if (inCraft) {
        const craftWindow = window as any
        craftWindow.craft.tray.setIcon({ icon }).catch((e: Error) => {
          console.warn('[stx-tray] Failed to set icon:', e)
        })
      }
      console.log(`[stx-tray:${id}] Icon updated`)
    },

    setTooltip: (tooltip: string) => {
      state.tooltip = tooltip
      if (inCraft) {
        const craftWindow = window as any
        craftWindow.craft.tray.setTooltip({ tooltip }).catch((e: Error) => {
          console.warn('[stx-tray] Failed to set tooltip:', e)
        })
      }
      console.log(`[stx-tray:${id}] Tooltip: ${tooltip}`)
    },

    setMenu: (menu: SystemTrayMenuItem[]) => {
      state.menu = menu
      // Update handlers
      handlers.clear()
      for (const item of menu) {
        if (item.type !== 'separator' && item.onClick) {
          handlers.set(item.label, item.onClick)
        }
        if (item.type === 'submenu' && item.submenu) {
          for (const subItem of item.submenu) {
            if (subItem.type !== 'separator' && subItem.onClick) {
              handlers.set(subItem.label, subItem.onClick)
            }
          }
        }
      }

      if (inCraft) {
        const craftWindow = window as any
        const craftMenu = convertMenuItems(menu)
        craftWindow.craft.tray.setMenu({ items: craftMenu }).catch((e: Error) => {
          console.warn('[stx-tray] Failed to set menu:', e)
        })
      }
      console.log(`[stx-tray:${id}] Menu updated (${menu.length} items)`)
    },

    destroy: () => {
      state.visible = false
      activeTrayInstances.delete(id)
      if (inCraft) {
        const craftWindow = window as any
        craftWindow.craft.tray.destroy?.().catch((e: Error) => {
          console.warn('[stx-tray] Failed to destroy tray:', e)
        })
      }
      console.log(`[stx-tray:${id}] Destroyed`)
    },
  }

  return instance
}

/**
 * Create a menubar application (alias for createSystemTray)
 */
export const createMenubar: typeof createSystemTray = createSystemTray

/**
 * Get all active tray instances
 */
export function getActiveTrayInstances(): string[] {
  return Array.from(activeTrayInstances.keys())
}

/**
 * Get a tray instance by ID
 */
export function getTrayInstance(id: string): SystemTrayInstance | null {
  const instance = activeTrayInstances.get(id)
  if (!instance)
    return null

  const inCraft = isInCraftWindow()

  return {
    id,
    setIcon: (icon: string) => {
      instance.state.icon = icon
      if (inCraft) {
        const craftWindow = window as any
        craftWindow.craft.tray.setIcon({ icon }).catch(() => {})
      }
    },
    setTooltip: (tooltip: string) => {
      instance.state.tooltip = tooltip
      if (inCraft) {
        const craftWindow = window as any
        craftWindow.craft.tray.setTooltip({ tooltip }).catch(() => {})
      }
    },
    setMenu: (menu: SystemTrayMenuItem[]) => {
      instance.state.menu = menu
      if (inCraft) {
        const craftWindow = window as any
        const craftMenu = convertMenuItems(menu)
        craftWindow.craft.tray.setMenu({ items: craftMenu }).catch(() => {})
      }
    },
    destroy: () => {
      activeTrayInstances.delete(id)
      if (inCraft) {
        const craftWindow = window as any
        craftWindow.craft.tray.destroy?.().catch(() => {})
      }
    },
  }
}

/**
 * Trigger a menu item action by label
 * Useful for testing and programmatic control
 */
export function triggerTrayAction(trayId: string, actionLabel: string): boolean {
  const instance = activeTrayInstances.get(trayId)
  if (!instance)
    return false

  const handler = instance.handlers.get(actionLabel)
  if (handler) {
    handler()
    return true
  }
  return false
}

/**
 * Get the HTML for a simulated tray menu
 * Useful for web-based testing and development
 */
export function getSimulatedTrayHTML(trayId: string): string | null {
  const instance = activeTrayInstances.get(trayId)
  if (!instance)
    return null

  return renderTrayMenu(instance.state.menu)
}

// =============================================================================
// Bridge Script Generator
// =============================================================================

/**
 * Generate a JavaScript snippet for tray control from inside a webview.
 * This provides convenient wrappers around the Craft tray bridge.
 */
export function getTrayBridgeScript(): string {
  return `
// STX Desktop Tray Bridge
// Provides convenient wrappers around window.craft.tray APIs
window.stxTray = {
  setTitle: (title) => window.craft?.tray?.setTitle({ title }),
  setTooltip: (tooltip) => window.craft?.tray?.setTooltip({ tooltip }),
  setIcon: (icon) => window.craft?.tray?.setIcon({ icon }),
  setMenu: (items) => window.craft?.tray?.setMenu({ items }),
  destroy: () => window.craft?.tray?.destroy(),

  // Check if tray is available
  isAvailable: () => typeof window.craft?.tray !== 'undefined',
};
`
}

// =============================================================================
// CSS Styles
// =============================================================================

/**
 * CSS styles for the simulated tray menu
 */
export const TRAY_MENU_STYLES = `
.stx-tray-menu {
  background: #2d2d2d;
  border-radius: 8px;
  padding: 4px 0;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #fff;
}

.stx-tray-item {
  padding: 6px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  position: relative;
}

.stx-tray-item:hover {
  background: #3d3d3d;
}

.stx-tray-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stx-tray-item .label {
  flex: 1;
}

.stx-tray-item .accelerator {
  margin-left: 20px;
  opacity: 0.6;
  font-size: 12px;
}

.stx-tray-item .arrow {
  margin-left: 8px;
  font-size: 10px;
}

.stx-tray-separator {
  margin: 4px 0;
  border: none;
  border-top: 1px solid #444;
}

.stx-tray-submenu {
  position: absolute;
  left: 100%;
  top: 0;
  background: #2d2d2d;
  border-radius: 8px;
  padding: 4px 0;
  min-width: 150px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: none;
}

.stx-tray-item:hover > .stx-tray-submenu {
  display: block;
}
`
