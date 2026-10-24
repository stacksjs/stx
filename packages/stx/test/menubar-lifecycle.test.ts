import { expect, it } from 'bun:test'

it('stops host resources once when the native window exits', () => {
  // A child isolates the desktop mock from the rest of the framework suite.
  const script = `
    import { mock } from 'bun:test'
    let opened = 0, stopped = 0, closed = 0, onClosed
    mock.module('@stacksjs/desktop', () => ({
      createPreferences: () => ({ getAll: () => ({}), close: () => closed++ }),
      setAutoLaunch: async () => {},
      createWindow: async (_url, options) => {
        if (options.headless !== true) throw new Error('Menu bar preferences must start hidden')
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

it('Craft-hosted backends authenticate their native session without launching another UI process', async () => {
  const script = `
    import { mock } from 'bun:test'
    let stopped = 0
    mock.module('@stacksjs/desktop', () => ({
      createPreferences: () => ({ getAll: () => ({}), close: () => {} }),
      setAutoLaunch: async () => { throw new Error('must not install a LaunchAgent') },
      createWindow: async () => { throw new Error('must not spawn a second native process') },
    }))
    const { createMenuBarApp } = await import(${JSON.stringify(import.meta.resolve('../src/menubar'))})
    const app = createMenuBarApp({ name: 'Hosted', template: '/unused.stx', templateSource: '<p>Native session</p>', host: 'craft', routes: { 'GET /api/status': () => ({ ready: true }) }, onStop: () => stopped++ })
    await app.start()
    const url = new URL(app.url)
    const unauthenticated = await fetch(url.origin + '/api/status')
    if (unauthenticated.status !== 401) throw new Error('unauthenticated API accepted')
    const initial = await fetch(app.url)
    if (initial.status !== 200 || !(await initial.text()).includes('Native session')) throw new Error('initial render failed')
    const cookie = initial.headers.get('set-cookie').split(';')[0]
    const response = await fetch(url.origin + '/api/status', {headers:{cookie}})
    if (!(await response.json()).ready) throw new Error('authenticated API failed')
    const crossOrigin = await fetch(url.origin + '/api/status', {headers:{cookie, origin:'https://example.com'}})
    if (crossOrigin.status !== 403) throw new Error('foreign origin accepted')
    app.stop()
    app.stop()
    if (stopped !== 1 || app.url !== null) throw new Error('backend cleanup failed')
    process.stdin.pause()
  `
  const child = Bun.spawn([process.execPath, '--eval', script], { stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' })
  const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
  expect(stderr).toBe('')
  expect(code).toBe(0)
  expect(stdout).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/\?session=[a-f\d-]+\n$/)
})

it('refuses LaunchAgent management in a native Craft host', () => {
  const script = `
    import { createMenuBarApp } from ${JSON.stringify(import.meta.resolve('../src/menubar'))}
    try {
      createMenuBarApp({ name: 'Hosted', template: '/unused.stx', host: 'craft', launchAtLogin: 'login', preferences: {login: false} })
      throw new Error('LaunchAgent accepted')
    } catch (error) {
      if (!error.message.includes('native autoLaunch API')) throw error
    }
  `
  const result = Bun.spawnSync([process.execPath, '--eval', script], {stdout:'pipe',stderr:'pipe'})
  expect(result.exitCode).toBe(0)
})
