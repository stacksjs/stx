import { afterAll, describe, expect, it } from 'bun:test'
import { plugin as unocss } from '../src/index'
import unoConfig from '../uno.config'

describe('bun-plugin-unocss', () => {
  it('should inject generated CSS into HTML', async () => {
    const htmlPath = `${import.meta.dir}/test.html`
    await Bun.write(htmlPath, `
    <!DOCTYPE html>
    <html>
      <head><title>Test</title></head>
      <body>
        <div class="mt-24 text-red-500"></div>
      </body>
    </html>
  `)

    const result = await Bun.build({
      entrypoints: [htmlPath],
      outdir: `${import.meta.dir}/out`,
      plugins: [unocss(unoConfig)],
    })

    const output = await result.outputs[0].text()
    expect(output).toInclude('.mt-24{margin-top:6rem}')
    expect(output).toInclude('.text-red-500{color:rgb(239 68 68)}')
  })

  it('should handle HTML without UnoCSS classes', async () => {
    const html = `<!DOCTYPE html><html><head></head><body></body></html>`
    await Bun.write('test-empty.html', html)

    const result = await Bun.build({
      entrypoints: ['test-empty.html'],
      outdir: 'out',
      plugins: [unocss(unoConfig)],
      root: import.meta.dir,
    })

    const output = await result.outputs[0].text()
    // Check for presence of style tag with default layers
    expect(output).toInclude('<style></style>')
    expect(output).toInclude('/* layer: preflights */')
    expect(output).not.toInclude('margin-top:6rem')
  })

  afterAll(async () => {
    await Bun.$`rm -rf out test.html test-empty.html`.quiet()
  })
})
