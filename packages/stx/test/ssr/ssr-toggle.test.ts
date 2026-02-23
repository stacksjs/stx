import type { StxOptions } from '../../src/types'
import { describe, expect, test } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { generateSpaShell } from '../../src/spa-shell'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

async function processTemplate(template: string, context: Record<string, any> = {}, options: StxOptions = defaultOptions): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, 'test.stx', options, dependencies)
}

describe('SSR Toggle', () => {
  test('default ssr config is true', () => {
    expect(defaultConfig.ssr).toBe(true)
  })

  test('ssr: false skips directive processing and returns raw template', async () => {
    const template = '<p>{{ name }}</p>'
    const result = await processTemplate(template, { name: 'World' }, { ...defaultOptions, ssr: false })
    expect(result).toBe('<p>{{ name }}</p>')
  })

  test('ssr: true processes directives normally', async () => {
    const template = '<p>{{ name }}</p>'
    const result = await processTemplate(template, { name: 'World' }, { ...defaultOptions, ssr: true })
    expect(result).toContain('World')
    expect(result).not.toContain('{{ name }}')
  })

  test('ssr defaults to true (processes directives when not set)', async () => {
    const template = '@if(true)\n<p>visible</p>\n@endif'
    const result = await processTemplate(template, {}, defaultOptions)
    expect(result).toContain('<p>visible</p>')
  })
})

describe('SPA Shell', () => {
  test('contains mount point div', () => {
    const html = generateSpaShell({ template: '<p>Hello</p>' })
    expect(html).toContain('<div id="stx-app"></div>')
  })

  test('contains template tag with raw content', () => {
    const html = generateSpaShell({ template: '<p>{{ name }}</p>' })
    expect(html).toContain('<template id="stx-template"><p>{{ name }}</p></template>')
  })

  test('serializes context as window.__STX_DATA__', () => {
    const html = generateSpaShell({
      template: '<p>test</p>',
      context: { name: 'World', count: 42 },
    })
    expect(html).toContain('window.__STX_DATA__')
    expect(html).toContain('"name"')
    expect(html).toContain('"World"')
    expect(html).toContain('"count"')
    expect(html).toContain('42')
  })

  test('XSS-escapes serialized data', () => {
    const html = generateSpaShell({
      template: '<p>test</p>',
      context: { payload: '</script><script>alert(1)</script>' },
    })
    // Should not contain literal </script> inside the JSON script block
    // The content should be escaped as \u003c/script\u003e
    expect(html).not.toContain('</script><script>alert(1)</script>')
    expect(html).toContain('\\u003c/script\\u003e')
  })

  test('strips internal __ context props from client data', () => {
    const html = generateSpaShell({
      template: '<p>test</p>',
      context: {
        name: 'public',
        __filename: '/path/to/file',
        __dirname: '/path/to',
        __stxProcessingDepth: 1,
      },
    })
    expect(html).toContain('"name"')
    expect(html).not.toContain('__filename')
    expect(html).not.toContain('__dirname')
    expect(html).not.toContain('__stxProcessingDepth')
  })

  test('uses provided title', () => {
    const html = generateSpaShell({
      template: '<p>test</p>',
      title: 'My Custom App',
    })
    expect(html).toContain('<title>My Custom App</title>')
  })

  test('uses default title when none provided', () => {
    const html = generateSpaShell({ template: '<p>test</p>' })
    expect(html).toContain('<title>stx App</title>')
  })

  test('includes bootstrap script', () => {
    const html = generateSpaShell({ template: '<p>test</p>' })
    expect(html).toContain('stx-template')
    expect(html).toContain('stx-app')
    expect(html).toContain('app.innerHTML = template.innerHTML')
  })
})
