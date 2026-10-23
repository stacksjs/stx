import { expect, it } from 'bun:test'
import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { menuBarTemplatePlugin } from '../src/menubar-build'
import { boot, closeBrowser, settle } from './router/spa-harness'

it('embeds transitive client imports before the app is compiled and retains runtime server values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'stx-menubar-build-'))
  try {
    await writeFile(join(dir, 'message.ts'), 'export const message = "embedded client helper"')
    await writeFile(join(dir, 'panel.css'), '.fixture { color: tomato; }')
    await writeFile(join(dir, 'helper.ts'), 'export { message } from "./message"')
    await writeFile(join(dir, 'panel.stx'), `<h1>{{ title }}</h1><script type="application/json">{"keep":"original"}</script><script client lang="ts">import './panel.css'\nimport { message } from './helper'; const caption = state(message); const selected = state(-1); const duration = derived(() => selected()); const mode = state(null); function readCaption() { return caption() }</script><main>@foreach(durations as minutes)<button :class="{ selected: duration === {{ minutes }} }" :data-mode="mode ?? 'waiting'" @click="selected.set({{ minutes }}); mode.set('chosen')">{{ minutes }}</button>@endforeach</main>`)
    const renderer = fileURLToPath(import.meta.resolve('../src/render'))
    await writeFile(join(dir, 'app.ts'), `import template from './panel.stx' with {type:'text'}; import {renderTemplateString} from ${JSON.stringify(renderer)}; console.log(await renderTemplateString(template, '/source-no-longer-exists/panel.stx', {context: {title:'Fresh preference', durations:[5,-1], duration:'stale server state', mode:'stale server state'}}));`)
    const binary = join(dir, 'app')
    const build = await Bun.build({ entrypoints: [join(dir, 'app.ts')], target: 'bun', compile: { outfile: binary }, plugins: [await menuBarTemplatePlugin({ templates: [join(dir, 'panel.stx')] })] })
    expect(build.success).toBe(true)
    // The binary must work after its sources and imported helpers disappear.
    await rename(join(dir, 'helper.ts'), join(dir, 'helper.removed'))
    await rename(join(dir, 'message.ts'), join(dir, 'message.removed'))
    await rename(join(dir, 'panel.css'), join(dir, 'panel-css.removed'))
    await rename(join(dir, 'panel.stx'), join(dir, 'panel.removed'))
    const run = Bun.spawnSync([binary], { cwd: tmpdir() })
    expect(run.exitCode).toBe(0)
    const html = run.stdout.toString()
    expect(/<h1\b[^>]*>Fresh preference<\/h1>/.test(html)).toBe(true)
    expect(html).toContain('embedded client helper')
    expect(html).toContain('<script type="application/json">{"keep":"original"}</script>')
    expect(html.includes('color: tomato')).toBe(true)
    expect(html.includes('function readCaption')).toBe(true)
    expect(html.includes('get caption()')).toBe(true)
    expect(html).not.toContain('from "./helper"')
    expect(run.stderr.toString()).not.toContain('File not found')
    const browser = await boot({ documents: new Map([['/', html]]), dispose: async () => {} }, '/')
    await settle()
    const buttons = browser.document.querySelectorAll('button')
    expect(buttons[0].classList.contains('selected')).toBe(false)
    expect(buttons[1].classList.contains('selected')).toBe(true)
    expect(buttons[0].getAttribute('data-mode')).toBe('waiting')
    buttons[0].dispatchEvent(new browser.window.MouseEvent('click', { bubbles: true }))
    await settle()
    expect(buttons[0].classList.contains('selected')).toBe(true)
    expect(buttons[1].classList.contains('selected')).toBe(false)
    expect(buttons[0].getAttribute('data-mode')).toBe('chosen')
    expect(browser.errors).toEqual([])
  }
  finally {
    closeBrowser()
    await rm(dir, { recursive: true, force: true })
  }
}, 30000)

it('fails the native build for a missing client dependency', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'stx-menubar-missing-'))
  try {
    await writeFile(join(dir, 'panel.stx'), `<script client>import { absent } from './missing'; console.log(absent)</script>`)
    await writeFile(join(dir, 'app.ts'), `import template from './panel.stx' with {type:'text'}; console.log(template)`)
    await expect(menuBarTemplatePlugin({ templates: [join(dir, 'panel.stx')] })).rejects.toThrow()
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
