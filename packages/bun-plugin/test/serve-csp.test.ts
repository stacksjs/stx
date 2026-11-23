import { expect, test } from 'bun:test'
import { WebView } from 'bun'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { freePort } from '../../stx/test-utils/test-port'

test('serve carries the compiled table in real fragments and retains nonce authorization through navigation', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stx-serve-csp-'))
  const port = freePort()
  const base = `http://127.0.0.1:${port}`
  let child: ReturnType<typeof Bun.spawn> | undefined
  let view: WebView | undefined
  let logs: Promise<string[]> | undefined
  try {
    mkdirSync(join(root, 'views'))
    writeFileSync(join(root, 'stx.config.ts'), `export default {cache:false,csp:{enabled:true,precompile:true,useNonce:true,addMetaTag:true,directives:{'script-src':["'self'"]}},router:{progress:false,prefetch:false,viewTransitions:false}}`)
    for (const name of ['index', 'two']) writeFileSync(join(root, 'views', name + '.stx'), `<!doctype html><html><head></head><body><main data-stx-content><script client>const count=state(1);window.serveProbe={name:'${name}',count};window.serveErrors=window.serveErrors||[];window.addEventListener('error',e=>window.serveErrors.push(e.message))</script><span id="served-count" x-text="count"></span><button id="served-add" @click="count += 2">More</button><StxLink to="/two">Two</StxLink><StxLink to="/">One</StxLink></main></body></html>`)
    writeFileSync(join(root, 'driver.ts'), `import {serve} from ${JSON.stringify(resolve(import.meta.dir, '../src/serve.ts'))};await serve({patterns:['views'],port:${port},open:false,imageWarmup:false})`)
    child = Bun.spawn([process.execPath, 'driver.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    logs = Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])
    let started = false
    for (let i = 0; i < 400; i++) {
      try { const response = await fetch(base); if (response.ok) { started = true; break } }
      catch { /* Starting. */ }
      await Bun.sleep(25)
    }
    expect(started).toBe(true)
    const fragment = await fetch(base + '/two', { headers: { 'X-STX-Router': 'true' } })
    const html = await fragment.text()
    expect(fragment.headers.get('X-STX-Fragment')).toBe('true')
    expect(html).toContain('data-stx-csp ')
    expect(html).not.toContain('<script data-stx-page>if(window.stx)window.stx._latestSetup=null;</script>')
    view = new WebView({ headless: true, backend: process.platform === 'darwin' ? { type: 'webkit' } : { type: 'chrome', url: false } } as any)
    await view.navigate(base)
    const until = async (expression: string) => {
      for (let i = 0; i < 200; i++) {
        if (await view!.evaluate(`Boolean(${expression})`)) return true
        await Bun.sleep(25)
      }
      return false
    }
    expect(await until('window.serveProbe && document.querySelector("#served-count")?.textContent === "1"')).toBe(true)
    await view.evaluate(`document.querySelector('a[href="/two"]').click()`)
    expect(await until('window.serveProbe.name === "two"')).toBe(true)
    await view.evaluate(`document.querySelector('#served-add').click()`)
    expect(await until('document.querySelector("#served-count").textContent === "3"')).toBe(true)
    await view.evaluate(`document.querySelector('a[href="/"]').click()`)
    expect(await until('window.serveProbe.name === "index"')).toBe(true)
    expect(JSON.parse(await view.evaluate('JSON.stringify(window.serveErrors)') as string)).toEqual([])
  }
  finally {
    view?.close()
    child?.kill()
    if (child) await child.exited
    await logs
    rmSync(root, { recursive: true, force: true })
  }
}, 45_000)
