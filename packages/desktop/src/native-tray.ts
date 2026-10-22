import { hasBridge } from './_bridge'

/** Update the existing Craft status item from its page, without host imports. */
interface CraftTrayNamespace {
  setIcon: (options: { icon: string }) => Promise<unknown>
  setTitle: (options: { title: string }) => Promise<unknown>
  setTooltip: (options: { tooltip: string }) => Promise<unknown>
}

async function call(action: (tray: CraftTrayNamespace) => Promise<unknown>): Promise<void> {
  if (!hasBridge('tray')) return
  const tray = (window.craft as unknown as { tray: CraftTrayNamespace }).tray
  await action(tray)
}

export const nativeTray = {
  /** An SF Symbol name, file URL, or PNG data URL. Craft draws it as a template. */
  setIcon: (icon: string): Promise<void> => call(tray => tray.setIcon({ icon })),
  setTitle: (title: string): Promise<void> => call(tray => tray.setTitle({ title })),
  setTooltip: (tooltip: string): Promise<void> => call(tray => tray.setTooltip({ tooltip })),
}
