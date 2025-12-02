import type { SystemTrayInstance, SystemTrayMenuItem, SystemTrayOptions } from './types'

/**
 * System Tray / Menubar Implementation
 *
 * Provides cross-platform system tray functionality.
 * Uses platform-specific APIs when available, falls back to web-based simulation.
 *
 * Platform implementations:
 * - macOS: Uses NSStatusBar via native bindings (when available)
 * - Linux: Uses AppIndicator/libappindicator
 * - Windows: Uses Shell_NotifyIcon
 *
 * When native APIs are not available, provides a web-based simulation
 * that can be used for development and testing.
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

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Detect the current platform
 */
function getPlatform(): 'darwin' | 'linux' | 'win32' | 'unknown' {
  if (typeof process !== 'undefined' && process.platform) {
    return process.platform as 'darwin' | 'linux' | 'win32' | 'unknown'
  }
  return 'unknown'
}

/**
 * Check if native tray APIs are available
 */
function hasNativeTraySupport(): boolean {
  // Check for ts-zyte or other native bindings
  try {
    // Future: Check for @stacksjs/zyte bindings
    return false
  }
  catch {
    return false
  }
}

// =============================================================================
// Menu Rendering
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
 * Create a system tray/menubar application
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
 *     { label: 'Show Window', onClick: () => window.show() },
 *     { type: 'separator' },
 *     { label: 'Quit', onClick: () => process.exit(0) },
 *   ],
 * })
 * ```
 */
export async function createSystemTray(options: SystemTrayOptions = {}): Promise<SystemTrayInstance> {
  const id = generateTrayId()
  const platform = getPlatform()
  const hasNative = hasNativeTraySupport()

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
  if (hasNative) {
    // Future: Use native bindings
    console.log(`[stx-tray] Creating native tray for ${platform}`)
  }
  else {
    // Web-based simulation for development
    console.log(`[stx-tray] Created simulated tray (native APIs not available)`)
    console.log(`[stx-tray] ID: ${id}`)
    console.log(`[stx-tray] Tooltip: ${state.tooltip}`)
    console.log(`[stx-tray] Menu items: ${state.menu.length}`)
  }

  // Create instance methods
  const instance: SystemTrayInstance = {
    id,

    setIcon: (icon: string) => {
      state.icon = icon
      if (hasNative) {
        // Future: Update native icon
      }
      console.log(`[stx-tray:${id}] Icon updated`)
    },

    setTooltip: (tooltip: string) => {
      state.tooltip = tooltip
      if (hasNative) {
        // Future: Update native tooltip
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
      if (hasNative) {
        // Future: Update native menu
      }
      console.log(`[stx-tray:${id}] Menu updated (${menu.length} items)`)
    },

    destroy: () => {
      state.visible = false
      activeTrayInstances.delete(id)
      if (hasNative) {
        // Future: Destroy native tray
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
  if (!instance) return null

  return {
    id,
    setIcon: (icon: string) => {
      instance.state.icon = icon
    },
    setTooltip: (tooltip: string) => {
      instance.state.tooltip = tooltip
    },
    setMenu: (menu: SystemTrayMenuItem[]) => {
      instance.state.menu = menu
    },
    destroy: () => {
      activeTrayInstances.delete(id)
    },
  }
}

/**
 * Trigger a menu item action by label
 * Useful for testing and programmatic control
 */
export function triggerTrayAction(trayId: string, actionLabel: string): boolean {
  const instance = activeTrayInstances.get(trayId)
  if (!instance) return false

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
  if (!instance) return null

  return renderTrayMenu(instance.state.menu)
}

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
