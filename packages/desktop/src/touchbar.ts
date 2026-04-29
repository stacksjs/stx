/**
 * Touch Bar (legacy macOS hardware)
 *
 * Apple has stopped shipping Touch Bar on new MacBooks, but a large
 * fleet of 2016-2022 Pros still has them. Apps that want to do the
 * right thing for those users can hand a small set of contextual
 * controls here.
 *
 * No fallback outside Craft windows — Touch Bar is hardware-only.
 */

import { hasBridge, onCraftEvent } from './_bridge'

export type TouchBarItemType = 'button' | 'label' | 'slider' | 'spacer' | 'colorPicker' | 'segmented'

export interface TouchBarItem {
  /** Unique id for later updates / event correlation. */
  id: string
  type: TouchBarItemType
  label?: string
  /** SF Symbol name or asset id. */
  icon?: string
  /** Initial state for sliders. 0..1. */
  value?: number
  /** Initial enabled state. */
  enabled?: boolean
  /** For segmented controls. */
  segments?: Array<{ id: string, label?: string, icon?: string }>
}

export interface TouchBarActionEvent {
  /** id of the item the user touched. */
  id: string
  /** Slider value if applicable. */
  value?: number
  /** Selected segment id if applicable. */
  segment?: string
}

export interface TouchBarAPI {
  addItem: (item: TouchBarItem) => Promise<void>
  removeItem: (id: string) => Promise<void>
  updateItem: (id: string, props: Partial<TouchBarItem>) => Promise<void>
  setLabel: (id: string, label: string) => Promise<void>
  setIcon: (id: string, icon: string) => Promise<void>
  setEnabled: (id: string, enabled: boolean) => Promise<void>
  setSliderValue: (id: string, value: number) => Promise<void>
  clear: () => Promise<void>
  show: () => Promise<void>
  hide: () => Promise<void>
  onAction: (cb: (event: TouchBarActionEvent) => void) => () => void
}

export const touchbar: TouchBarAPI = {
  async addItem(item)              { if (hasBridge('touchbar')) await window.craft!.touchbar.addItem(item) },
  async removeItem(id)             { if (hasBridge('touchbar')) await window.craft!.touchbar.removeItem(id) },
  async updateItem(id, props)      { if (hasBridge('touchbar')) await window.craft!.touchbar.updateItem(id, props) },
  async setLabel(id, label)        { if (hasBridge('touchbar')) await window.craft!.touchbar.setLabel(id, label) },
  async setIcon(id, icon)          { if (hasBridge('touchbar')) await window.craft!.touchbar.setIcon(id, icon) },
  async setEnabled(id, enabled)    { if (hasBridge('touchbar')) await window.craft!.touchbar.setEnabled(id, enabled) },
  async setSliderValue(id, value)  { if (hasBridge('touchbar')) await window.craft!.touchbar.setSliderValue(id, value) },
  async clear()                    { if (hasBridge('touchbar')) await window.craft!.touchbar.clear() },
  async show()                     { if (hasBridge('touchbar')) await window.craft!.touchbar.show() },
  async hide()                     { if (hasBridge('touchbar')) await window.craft!.touchbar.hide() },
  onAction(cb) {
    return onCraftEvent<TouchBarActionEvent>('craft:touchbar:action', cb)
  },
}
