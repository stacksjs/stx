import type { SystemTrayInstance, SystemTrayMenuItem, SystemTrayOptions } from './types'

/**
 * Create a system tray/menubar application
 */
export async function createSystemTray(options: SystemTrayOptions = {}): Promise<SystemTrayInstance | null> {
  console.warn('System tray functionality not yet implemented')
  console.warn('Options:', options)

  // TODO: Implement system tray using Zyte's native APIs
  // This would require platform-specific implementations:
  // - macOS: NSStatusBar
  // - Linux: AppIndicator
  // - Windows: Shell_NotifyIcon

  const instance: SystemTrayInstance = {
    id: `tray-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    setIcon: (icon: string) => {
      console.warn('setIcon not implemented', icon)
    },
    setTooltip: (tooltip: string) => {
      console.warn('setTooltip not implemented', tooltip)
    },
    setMenu: (menu: SystemTrayMenuItem[]) => {
      console.warn('setMenu not implemented', menu)
    },
    destroy: () => {
      console.warn('destroy not implemented')
    },
  }

  return instance
}

/**
 * Create a menubar application (alias for createSystemTray)
 */
export const createMenubar: typeof createSystemTray = createSystemTray
