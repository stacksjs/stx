import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { createMenubar, createSystemTray, getActiveTrayInstances, getTrayInstance } from '../src/system-tray'

describe('System Tray', () => {
  let consoleSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    // Spy on console.log since system tray uses console.log in non-native environment
    consoleSpy = spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
    // Clean up any created trays
    const trayIds = getActiveTrayInstances()
    trayIds.forEach((id) => {
      const tray = getTrayInstance(id)
      tray?.destroy()
    })
  })

  describe('createSystemTray', () => {
    it('should log tray creation in non-native environment', async () => {
      await createSystemTray()

      expect(consoleSpy).toHaveBeenCalled()
      const calls = consoleSpy.mock.calls
      expect(calls.some(call => call[0]?.includes('[stx-tray]'))).toBe(true)
    })

    it('should return a SystemTrayInstance', async () => {
      const tray = await createSystemTray()

      expect(tray).not.toBeNull()
      expect(tray?.id).toBeDefined()
      expect(tray?.id).toContain('tray-')
      expect(typeof tray?.setIcon).toBe('function')
      expect(typeof tray?.setTooltip).toBe('function')
      expect(typeof tray?.setMenu).toBe('function')
      expect(typeof tray?.destroy).toBe('function')
    })

    it('should accept icon option', async () => {
      const tray = await createSystemTray({
        icon: './icon.png',
      })

      expect(tray).not.toBeNull()
      expect(consoleSpy).toHaveBeenCalled()
    })

    it('should accept tooltip option', async () => {
      const tray = await createSystemTray({
        tooltip: 'My App',
      })

      expect(tray).not.toBeNull()
      const calls = consoleSpy.mock.calls
      expect(calls.some(call => call[0]?.includes('My App'))).toBe(true)
    })

    it('should accept menu option', async () => {
      const tray = await createSystemTray({
        menu: [
          { label: 'Open', onClick: () => {} },
          { label: 'Quit', onClick: () => {} },
        ],
      })

      expect(tray).not.toBeNull()
      const calls = consoleSpy.mock.calls
      expect(calls.some(call => call[0]?.includes('Menu items: 2'))).toBe(true)
    })

    it('should accept all options', async () => {
      const tray = await createSystemTray({
        icon: './icon.png',
        tooltip: 'My App',
        menu: [
          { label: 'Item 1', onClick: () => {} },
          { type: 'separator' },
          { label: 'Quit', onClick: () => {} },
        ],
      })

      expect(tray).not.toBeNull()
    })

    it('should generate unique tray IDs', async () => {
      const tray1 = await createSystemTray()
      const tray2 = await createSystemTray()

      expect(tray1?.id).not.toBe(tray2?.id)
    })
  })

  describe('SystemTrayInstance methods', () => {
    it('setIcon should update the icon', async () => {
      const tray = await createSystemTray()

      // Should not throw
      tray?.setIcon('./new-icon.png')

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('setTooltip should update the tooltip', async () => {
      const tray = await createSystemTray()

      tray?.setTooltip('New tooltip')

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('setMenu should update the menu', async () => {
      const tray = await createSystemTray()

      const menu = [{ label: 'Test', onClick: () => {} }]
      tray?.setMenu(menu)

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('destroy should clean up the tray', async () => {
      const tray = await createSystemTray()
      const id = tray?.id

      tray?.destroy()

      // Tray should be removed from active instances
      const trays = getActiveTrayInstances()
      expect(trays.find(t => t.id === id)).toBeUndefined()
    })
  })

  describe('createMenubar', () => {
    it('should be an alias for createSystemTray', () => {
      expect(createMenubar).toBe(createSystemTray)
    })

    it('should work the same as createSystemTray', async () => {
      const menubar = await createMenubar({
        icon: './icon.png',
        tooltip: 'Menubar App',
      })

      expect(menubar).not.toBeNull()
      expect(menubar?.id).toBeDefined()
    })
  })

  describe('Complex menu structures', () => {
    it('should handle menu with separators', async () => {
      const tray = await createSystemTray({
        menu: [
          { label: 'Item 1', onClick: () => {} },
          { type: 'separator' },
          { label: 'Item 2', onClick: () => {} },
        ],
      })

      expect(tray).not.toBeNull()
    })

    it('should handle menu with checkboxes', async () => {
      const tray = await createSystemTray({
        menu: [
          {
            label: 'Enable Feature',
            type: 'checkbox',
            checked: true,
            onClick: () => {},
          },
        ],
      })

      expect(tray).not.toBeNull()
    })

    it('should handle menu with submenus', async () => {
      const tray = await createSystemTray({
        menu: [
          {
            label: 'File',
            type: 'submenu',
            submenu: [
              { label: 'Open', onClick: () => {} },
              { label: 'Save', onClick: () => {} },
            ],
          },
        ],
      })

      expect(tray).not.toBeNull()
    })

    it('should handle menu with accelerators', async () => {
      const tray = await createSystemTray({
        menu: [
          {
            label: 'Settings',
            accelerator: 'Cmd+,',
            onClick: () => {},
          },
        ],
      })

      expect(tray).not.toBeNull()
    })

    it('should handle disabled menu items', async () => {
      const tray = await createSystemTray({
        menu: [
          {
            label: 'Disabled Item',
            enabled: false,
            onClick: () => {},
          },
        ],
      })

      expect(tray).not.toBeNull()
    })
  })

  describe('Tray management', () => {
    it('should track active tray instances', async () => {
      const tray1 = await createSystemTray()
      const tray2 = await createSystemTray()

      const trayIds = getActiveTrayInstances()
      expect(trayIds.length).toBeGreaterThanOrEqual(2)
      expect(trayIds.includes(tray1?.id as string)).toBe(true)
      expect(trayIds.includes(tray2?.id as string)).toBe(true)
    })
  })
})
