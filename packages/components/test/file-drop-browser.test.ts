import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

/**
 * FileDrop in a real browser: picking by the chooser and by a drop hands the
 * page the file, the picked row shows the file and follows the page's stage
 * and progress, and Remove asks the page to drop it.
 */
const root = join(import.meta.dir, '..')
const drop = join(root, 'src/ui/file-drop/FileDrop.stx')

async function boot() {
  const html = await processDirectives(`@import('FileDrop', '${drop}')
<!doctype html><html><head></head><body>
<script client>
const file = state(null)
const stage = state('')
const label = state('')
const progress = state(0)
const picks = []
const clears = []
window.probe = { file, stage, label, progress, picks, clears }
function picked(next) { picks.push(next.name); file.set(next) }
function cleared() { clears.push(true); file.set(null) }
</script>
<FileDrop :file="file" :stage="stage" :stageLabel="label" :progress="progress" label="Drop a video here" hint="Any clip works" removeLabel="Remove video" @pick="picked($event)" @clear="cleared()" />
</body></html>`, {}, join(root, 'file-drop.stx'), { ...defaultConfig, root, cache: false, debug: false }, new Set())
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: request => new URL(request.url).pathname === '/'
    ? new Response(html, { headers: { 'Content-Type': 'text/html' } }) : new Response('', { status: 404 }) })
  const view = new WebView({ headless: true, width: 800, height: 600, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
  }
  catch (error) { view.close(); server.stop(true); throw error }
  const until = async <T>(read: string, accept: (value: T) => boolean): Promise<T> => {
    let value: T = undefined as T
    for (let i = 0; i < 150; i++) {
      value = await view.evaluate<T>(read)
      if (accept(value)) return value
      await Bun.sleep(20)
    }
    return value
  }
  return { view, until, close() { view.close(); server.stop(true) } }
}

if (process.env.STX_FILE_DROP_CHILD !== '1') {
  it('picks, shows and follows a file in an isolated browser', async () => {
    const child = Bun.spawn([process.execPath, 'test', import.meta.path], { env: { ...process.env, STX_FILE_DROP_CHILD: '1' }, stdout: 'pipe', stderr: 'pipe' })
    const [exitCode, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()])
    if (exitCode !== 0) throw new Error(`FileDrop browser test failed:\n${stdout}\n${stderr}`)
    expect(`${stdout}\n${stderr}`).toContain('2 pass')
  }, 180_000)
}
else {
  it('hands the page a chosen or dropped file and shows it, with the page\'s stage and progress', async () => {
    const browser = await boot()
    const { view, until } = browser
    try {
      const zone = await until<string | null>(`document.querySelector('[data-file-drop-zone]')?.innerText ?? null`, value => !!value)
      expect(zone).toContain('Drop a video here')
      expect(zone).toContain('Any clip works')

      // Reached by keyboard: the hidden input takes focus and the zone around it shows a ring.
      const ring = await view.evaluate<string>(`(() => { document.querySelector('[data-file-drop-input]').focus(); return getComputedStyle(document.querySelector('[data-file-drop-zone]')).boxShadow })()`)
      expect(ring).not.toBe('none')

      // Chosen: the input's change hands the file over, and the input is emptied so the same file can be chosen again.
      await view.evaluate(`(() => {
        const input = document.querySelector('[data-file-drop-input]')
        const transfer = new DataTransfer()
        transfer.items.add(new File([new Uint8Array(3 * 1024 * 1024)], 'squat.mov', { type: 'video/quicktime' }))
        input.files = transfer.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      })()`)
      const picked = await until<{ name: string, size: string } | null>(`(() => { const row = document.querySelector('[data-file-drop-picked]'); return row ? { name: row.querySelector('[data-file-drop-name]').innerText, size: row.innerText } : null })()`, value => !!value)
      expect(picked!.name).toBe('squat.mov')
      expect(picked!.size).toContain('3.0 MB')
      expect(await view.evaluate(`window.probe.picks`)).toEqual(['squat.mov'])

      // On its way: the page's words and one bar; no Remove or Preview while it goes.
      await view.evaluate(`(() => { window.probe.stage.set('uploading'); window.probe.label.set('Uploading… 40%'); window.probe.progress.set(40) })()`)
      const going = await until<{ label: string, now: string | null, remove: boolean } | null>(`(() => { const s = document.querySelector('[data-file-drop-stage]'); return s ? { label: s.innerText, now: document.querySelector('[role=progressbar]').getAttribute('aria-valuenow'), remove: !!document.querySelector('[data-file-drop-remove]') } : null })()`, value => value?.now === '40')
      expect(going).toEqual({ label: 'Uploading… 40%', now: '40', remove: false })

      await view.evaluate(`window.probe.stage.set('')`)
      await until<boolean>(`!!document.querySelector('[data-file-drop-remove]')`, value => value)
      await view.evaluate(`document.querySelector('[data-file-drop-remove]').click()`)
      await until<boolean>(`!!document.querySelector('[data-file-drop-zone]')`, value => value)
      expect(await view.evaluate(`window.probe.clears.length`)).toBe(1)

      // Dropped: the same, from a drop on the zone.
      await view.evaluate(`(() => {
        const zone = document.querySelector('[data-file-drop-zone]')
        const transfer = new DataTransfer()
        transfer.items.add(new File([new Uint8Array(10)], 'lunge.mp4', { type: 'video/mp4' }))
        zone.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: transfer }))
        zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }))
      })()`)
      expect(await until<string[]>(`window.probe.picks`, value => value.length === 2)).toEqual(['squat.mov', 'lunge.mp4'])
    }
    finally { browser.close() }
  })

  it('ignores a pick while a file is on its way', async () => {
    const browser = await boot()
    const { view, until } = browser
    try {
      await until<boolean>(`!!window.probe`, value => value)
      await view.evaluate(`(() => { window.probe.file.set(new File([new Uint8Array(10)], 'first.mp4', { type: 'video/mp4' })); window.probe.stage.set('uploading') })()`)
      await until<boolean>(`!!document.querySelector('[data-file-drop-stage]')`, value => value)
      expect(await view.evaluate(`!!document.querySelector('[data-file-drop-zone]')`)).toBe(false)
      expect(await view.evaluate(`window.probe.picks.length`)).toBe(0)
    }
    finally { browser.close() }
  })
}
