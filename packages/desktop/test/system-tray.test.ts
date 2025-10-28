import { describe, expect, it, spyOn } from 'bun:test'
import { createMenubar, createSystemTray } from '../src/system-tray'

describe('System Tray', () => {
  describe('createSystemTray', () => {
    it('should warn that feature is not yet implemented', async () => {
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray()

      expect(consoleWarnSpy).toHaveBeenCalledWith('System tray functionality not yet implemented')

      consoleWarnSpy.mockRestore()
    })

    it('should return a SystemTrayInstance', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

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
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray({
        icon: './icon.png',
      })

      expect(tray).not.toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()

      consoleWarnSpy.mockRestore()
    })

    it('should accept tooltip option', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray({
        tooltip: 'My App',
      })

      expect(tray).not.toBeNull()
    })

    it('should accept menu option', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray({
        menu: [
          { label: 'Open', onClick: () => {} },
          { label: 'Quit', onClick: () => {} },
        ],
      })

      expect(tray).not.toBeNull()
    })

    it('should accept all options', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

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
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray1 = await createSystemTray()
      const tray2 = await createSystemTray()

      expect(tray1?.id).not.toBe(tray2?.id)
    })
  })

  describe('SystemTrayInstance methods', () => {
    it('setIcon should warn not implemented', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray()
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      tray?.setIcon('./new-icon.png')

      expect(consoleWarnSpy).toHaveBeenCalledWith('setIcon not implemented', './new-icon.png')

      consoleWarnSpy.mockRestore()
    })

    it('setTooltip should warn not implemented', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray()
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      tray?.setTooltip('New tooltip')

      expect(consoleWarnSpy).toHaveBeenCalledWith('setTooltip not implemented', 'New tooltip')

      consoleWarnSpy.mockRestore()
    })

    it('setMenu should warn not implemented', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray()
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      const menu = [{ label: 'Test', onClick: () => {} }]
      tray?.setMenu(menu)

      expect(consoleWarnSpy).toHaveBeenCalledWith('setMenu not implemented', menu)

      consoleWarnSpy.mockRestore()
    })

    it('destroy should warn not implemented', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

      const tray = await createSystemTray()
      const consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})

      tray?.destroy()

      expect(consoleWarnSpy).toHaveBeenCalledWith('destroy not implemented')

      consoleWarnSpy.mockRestore()
    })
  })

  describe('createMenubar', () => {
    it('should be an alias for createSystemTray', () => {
      expect(createMenubar).toBe(createSystemTray)
    })

    it('should work the same as createSystemTray', async () => {
      spyOn(console, 'warn').mockImplementation(() => {})

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
      spyOn(console, 'warn').mockImplementation(() => {})

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
      spyOn(console, 'warn').mockImplementation(() => {})

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
      spyOn(console, 'warn').mockImplementation(() => {})

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
      spyOn(console, 'warn').mockImplementation(() => {})

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
      spyOn(console, 'warn').mockImplementation(() => {})

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
})
