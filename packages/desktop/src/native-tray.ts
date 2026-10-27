import { hasBridge, onCraftEvent } from './_bridge'

export interface NativeTrayMenuItem {
  id?: string
  label?: string
  action?: string
  type?: 'normal' | 'separator' | 'checkbox' | 'radio'
  checked?: boolean
  enabled?: boolean
  shortcut?: string
  submenu?: NativeTrayMenuItem[]
}

export interface NativeTrayClick {
  button: 'left' | 'right'
  timestamp: number
  modifiers: Record<string, boolean>
}

/** Update the existing Craft status item from its page, without host imports. */
interface CraftTrayNamespace {
  setIcon: (icon: string) => Promise<unknown>
  setTitle: (title: string) => Promise<unknown>
  setTooltip: (tooltip: string) => Promise<unknown>
  setMenu: (items: NativeTrayMenuItem[]) => Promise<unknown>
}

async function call(action: (tray: CraftTrayNamespace) => Promise<unknown>): Promise<void> {
  if (!hasBridge('tray')) return
  const tray = (window.craft as unknown as { tray: CraftTrayNamespace }).tray
  await action(tray)
}

export const nativeTray = {
  /** An SF Symbol name, file URL, or PNG data URL. Craft draws it as a template. */
  setIcon: (icon: string): Promise<void> => call(tray => tray.setIcon(icon)),
  setTitle: (title: string): Promise<void> => call(tray => tray.setTitle(title)),
  setTooltip: (tooltip: string): Promise<void> => call(tray => tray.setTooltip(tooltip)),
  /** Replace the native right-click menu. Built-in actions include show, hide and quit. */
  setMenu: (items: NativeTrayMenuItem[]): Promise<void> => call(tray => tray.setMenu(items)),
  /** Left clicks arrive directly from AppKit, including while the window is hidden. */
  onClick: (callback: (event: NativeTrayClick) => void): (() => void) => onCraftEvent<NativeTrayClick>('craft:tray:click', callback),
  /** Custom menu actions; built-in show/hide/quit are handled by Craft. */
  onMenuAction: (callback: (event: { action: string }) => void): (() => void) => onCraftEvent<{ action: string }>('craft:tray:menuAction', callback),
}
