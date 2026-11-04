import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'bun:test'

const helper = pathToFileURL(resolve(import.meta.dir, '../test-utils/browser-lifecycle.ts')).href

for (const mode of ['teardown', 'view-close', 'browser-exit', 'target-detach']) {
  test(`browser lifecycle diagnostics preserve ${mode} without retrying a view`, async () => {
    const child = Bun.spawn([process.execPath, '-e', `
      import { WebView } from 'bun'
      import { observeBrowserLifecycle } from ${JSON.stringify(helper)}
      const mode = ${JSON.stringify(mode)}
      const messages = []
      const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response('<!doctype html><p>lifecycle</p>') })
      const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
      let control, observer
      const deadline = setTimeout(() => { throw new Error('Lifecycle control timed out') }, 20_000)
      function closeUnexpectedView() { view.close() }
      try {
        await view.navigate(server.url.href)
        let targetId
        if (mode === 'target-detach') {
          targetId = (await view.cdp('Target.getTargetInfo')).targetInfo.targetId
          control = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
          await control.navigate(server.url.href)
        }
        observer = await observeBrowserLifecycle(view, mode, message => messages.push(message))
        if (mode === 'teardown') { observer.dispose(); observer.dispose(); view.close() }
        else if (mode === 'view-close') closeUnexpectedView()
        else if (mode === 'browser-exit') WebView.closeAll()
        else await control.cdp('Target.closeTarget', { targetId })
        // Wait for the native notification, rather than retrying any read.
        await observer.settled
        let error = ''
        try { await view.evaluate('1') } catch (failure) { error = String(failure) }
        console.log(JSON.stringify({ messages, error }))
      }
      finally { observer?.dispose(); view.close(); control?.close(); server.stop(true); clearTimeout(deadline) }
    `], { stdout: 'pipe', stderr: 'pipe' })
    const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
    expect(exitCode, stderr).toBe(0)
    const result = JSON.parse(stdout.trim()) as { messages: string[], error: string }
    expect(result.error).toContain('view is closed')
    if (mode === 'teardown') expect(result.messages).toEqual([])
    else {
      expect(result.messages.join('\n')).toContain(`[browser lifecycle] ${mode}:`)
      const reason = mode === 'view-close' ? /Error: WebView closed/ : mode === 'browser-exit' ? /Chrome (?:process closed the pipe|killed by signal|exited)/ : /page detached \(crashed or closed\)/
      expect(result.messages.join('\n')).toMatch(reason)
      if (mode === 'view-close') expect(result.messages.join('\n')).toContain('closeUnexpectedView')
    }
  }, 30_000)
}
