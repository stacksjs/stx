import { expect, it } from 'bun:test'

it('stops host resources once when the native window exits', () => {
  // A child isolates the desktop mock from the rest of the framework suite.
  const script = `
    import { mock } from 'bun:test'
    let opened = 0, stopped = 0, closed = 0, onClosed
    mock.module('@stacksjs/desktop', () => ({
      createPreferences: () => ({ getAll: () => ({}), close: () => closed++ }),
      setAutoLaunch: async () => {},
      createWindow: async () => {
        opened++
        return { close: () => onClosed(), onClosed: cb => { onClosed = cb } }
      },
    }))
    const { createMenuBarApp } = await import(${JSON.stringify(import.meta.resolve('../src/menubar'))})
    const app = createMenuBarApp({ name: 'Lifecycle', template: '/unused.stx', onStop: () => stopped++ })
    await app.start()
    await app.start()
    if (!app.url) throw new Error('server was not started')
    onClosed()
    app.stop()
    if (app.url !== null || opened !== 1 || stopped !== 1 || closed !== 1)
      throw new Error(JSON.stringify({ url: app.url, opened, stopped, closed }))
  `
  const result = Bun.spawnSync([process.execPath, '--eval', script], { stdout: 'pipe', stderr: 'pipe' })
  expect(result.stderr.toString()).toBe('')
  expect(result.exitCode).toBe(0)
})
