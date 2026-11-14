import { describe, expect, it } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { buildComponentLibrary } from '../../src/component-library'
import { createTempDir } from '../../src/temp-dir'

const styles = '/* exact whitespace, café and `quotes` */\n:host { color: rgb(12, 34, 56); }\n\np::after { content: "☃"; }'

describe('component library style metadata', () => {
  it('reports exact definition styles and resolved modes independently of CSS file options', async () => {
    const root = createTempDir('stx-library-styles-')
    try {
      const input = path.join(root, 'source')
      await Bun.write(path.join(input, 'Card.stx'), `<template><p>Card</p></template><style>\n${styles.split('\n\n')[0]}\n</style><style>${styles.split('\n\n')[1]}</style>`)
      await Bun.write(path.join(input, 'Empty.stx'), '<template><p>No styles</p></template>')
      for (const [index, mode] of ([false, true, 'open', 'closed'] as const).entries()) {
        const output = path.join(root, `dist-${index}`)
        const result = await buildComponentLibrary({
          inputDir: input,
          outputDir: output,
          components: [{ file: 'Card.stx', tag: `metadata-card-${index}`, shadowDOM: mode }],
          css: index % 2 === 0,
          minify: true,
        })
        const component = result.components[0]
        expect(component.styles).toBe(styles)
        expect(component.shadowMode).toBe(mode === true ? 'open' : mode)
        // Safe fixture only: the server consuming metadata never needs this import.
        const { Card } = await import(component.module)
        expect(Card.definition.styles).toBe(component.styles)
        expect(Card.definition.shadowMode).toBe(component.shadowMode)
        const element = document.createElement(component.tag) as HTMLElement & { renderRoot: HTMLElement | ShadowRoot }
        document.body.appendChild(element)
        const inlineStyles = element.renderRoot.querySelector('style')
        if (mode === false) expect(inlineStyles).toBeNull()
        else expect(inlineStyles?.textContent).toBe(component.styles)
        const { renderComponent } = await import(path.join(output, 'ssr.js'))
        const html = renderComponent(component.tag)
        if (mode === false) expect(html).not.toContain('<style>')
        else expect(html).toContain(`<style>${component.styles}</style>`)
        element.remove()
      }
      const result = await buildComponentLibrary({ inputDir: input, outputDir: path.join(root, 'empty'), components: [{ file: 'Empty.stx' }], bundle: false })
      expect(result.components[0].styles).toBe('')
      expect(result.components[0].shadowMode).toBe(false)
    }
    finally { await rm(root, { recursive: true, force: true }) }
  })

  it('builds and reports metadata in a DOM-free server without executing browser-only transitive imports', async () => {
    const root = createTempDir('stx-library-browser-import-')
    try {
      const input = path.join(root, 'source')
      await Bun.write(path.join(input, 'browser-leaf.ts'), 'export const label = document.documentElement.tagName')
      await Bun.write(path.join(input, 'browser.ts'), "export { label } from './browser-leaf'")
      await Bun.write(path.join(input, 'Card.stx'), `<script>import { label } from './browser'\nconst title = label</script><template><p>{{ title }}</p></template><style>${styles}</style>`)
      const child = Bun.spawn([process.execPath, '-e', `
        if ('document' in globalThis || 'HTMLElement' in globalThis) throw new Error('Expected DOM-free build');
        const { buildComponentLibrary } = await import(${JSON.stringify(path.resolve(import.meta.dir, '../../src/component-library.ts'))});
        const result = await buildComponentLibrary({ inputDir: ${JSON.stringify(input)}, outputDir: ${JSON.stringify(path.join(root, 'dist'))}, shadowDOM: 'closed', minify: true });
        console.log(JSON.stringify(result.components));
      `], { stdout: 'pipe', stderr: 'pipe' })
      const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited])
      expect(stderr).toBe('')
      expect(exitCode).toBe(0)
      const [component] = JSON.parse(stdout)
      expect(component.styles).toBe(styles)
      expect(component.shadowMode).toBe('closed')
    }
    finally { await rm(root, { recursive: true, force: true }) }
  })
})
