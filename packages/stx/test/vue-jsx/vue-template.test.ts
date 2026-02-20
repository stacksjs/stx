import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { processVueTemplate, hasVueTemplateSyntax } from '../../src/vue-template'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('Vue Template Syntax Detection', () => {
  it('should detect v-if directives', () => {
    expect(hasVueTemplateSyntax('<div v-if="show">hello</div>')).toBe(true)
  })

  it('should detect v-for directives', () => {
    expect(hasVueTemplateSyntax('<li v-for="item in items">{{ item }}</li>')).toBe(true)
  })

  it('should detect v-bind: prefix', () => {
    expect(hasVueTemplateSyntax('<div v-bind:class="active">hello</div>')).toBe(true)
  })

  it('should detect v-model', () => {
    expect(hasVueTemplateSyntax('<input v-model="name">')).toBe(true)
  })

  it('should return false for plain HTML', () => {
    expect(hasVueTemplateSyntax('<div class="hello">world</div>')).toBe(false)
  })

  it('should return false for stx directives', () => {
    expect(hasVueTemplateSyntax('@if(show) <div>hello</div> @endif')).toBe(false)
  })
})

describe('Vue Template Directive Transform', () => {
  it('should transform v-if into @if/@endif block', () => {
    const input = '<div v-if="show">Hello</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('@if(show)')
    expect(output).toContain('<div>Hello</div>')
    expect(output).toContain('@endif')
  })

  it('should transform v-if/v-else chain', () => {
    const input = '<div v-if="show">Yes</div><div v-else>No</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('@if(show)')
    expect(output).toContain('<div>Yes</div>')
    expect(output).toContain('@else')
    expect(output).toContain('<div>No</div>')
    expect(output).toContain('@endif')
  })

  it('should transform v-if/v-else-if/v-else chain', () => {
    const input = '<p v-if="type === \'a\'">A</p><p v-else-if="type === \'b\'">B</p><p v-else>Other</p>'
    const output = processVueTemplate(input)
    expect(output).toContain('@if(type === \'a\')')
    expect(output).toContain('@elseif(type === \'b\')')
    expect(output).toContain('@else')
    expect(output).toContain('@endif')
  })

  it('should transform v-for with simple syntax', () => {
    const input = '<li v-for="item in items">{{ item }}</li>'
    const output = processVueTemplate(input)
    expect(output).toContain('@foreach(items as item)')
    expect(output).toContain('@endforeach')
  })

  it('should transform v-for with index', () => {
    const input = '<li v-for="(item, index) in items">{{ index }}: {{ item }}</li>'
    const output = processVueTemplate(input)
    expect(output).toContain('@foreach(items as index => item)')
    expect(output).toContain('@endforeach')
  })

  it('should strip :key from v-for elements', () => {
    const input = '<li v-for="item in items" :key="item.id">{{ item }}</li>'
    const output = processVueTemplate(input)
    expect(output).not.toContain(':key')
  })

  it('should transform v-show into @show', () => {
    const input = '<div v-show="visible">content</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('@show="visible"')
  })

  it('should transform v-model on native input to @model', () => {
    const input = '<input v-model="name">'
    const output = processVueTemplate(input)
    expect(output).toContain('@model="name"')
  })

  it('should transform v-model on component to :modelValue + event', () => {
    const input = '<MyInput v-model="name">content</MyInput>'
    const output = processVueTemplate(input)
    expect(output).toContain(':modelValue="name"')
    expect(output).toContain('@update:modelValue="name = $event"')
  })

  it('should transform named v-model on component', () => {
    const input = '<MyInput v-model:title="pageTitle">content</MyInput>'
    const output = processVueTemplate(input)
    expect(output).toContain(':title="pageTitle"')
    expect(output).toContain('@update:title="pageTitle = $event"')
  })

  it('should transform v-bind: to @bind:', () => {
    const input = '<div v-bind:class="classes">hello</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('@bind:class="classes"')
  })

  it('should transform v-on: to @ events', () => {
    const input = '<button v-on:click="handleClick">Click</button>'
    const output = processVueTemplate(input)
    expect(output).toContain('@click="handleClick"')
  })

  it('should transform v-html to raw expression', () => {
    const input = '<div v-html="rawHtml">old content</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('{!! rawHtml !!}')
    expect(output).not.toContain('old content')
  })

  it('should transform v-text to escaped expression', () => {
    const input = '<span v-text="message">old text</span>'
    const output = processVueTemplate(input)
    expect(output).toContain('{{ message }}')
    expect(output).not.toContain('old text')
  })

  it('should transform v-pre to data-stx-skip', () => {
    const input = '<div v-pre>{{ raw }}</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('data-stx-skip')
    expect(output).not.toContain('v-pre')
  })

  it('should transform v-once to @once block', () => {
    const input = '<div v-once>static</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('@once')
    expect(output).toContain('@endonce')
  })

  it('should transform v-memo to data-stx-memo', () => {
    const input = '<div v-memo="[a, b]">memoized</div>'
    const output = processVueTemplate(input)
    expect(output).toContain('data-stx-memo="[a, b]"')
  })

  it('should transform v-slot: to # shorthand', () => {
    const input = '<template v-slot:header>Header content</template>'
    const output = processVueTemplate(input)
    expect(output).toContain('#header')
  })

  it('should pass through templates without Vue syntax unchanged', () => {
    const input = '@if(show)\n  <div>Hello</div>\n@endif'
    const output = processVueTemplate(input)
    expect(output).toBe(input)
  })
})

describe('Vue Template Integration', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('should process v-if through the full stx pipeline', async () => {
    const testFile = await createTestFile('vue-if.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Vue If</title>
      <script>
        module.exports = { show: true, hide: false };
      </script>
      </head>
      <body>
        <div v-if="show">Visible</div>
        <div v-if="hide">Hidden</div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('Visible')
    expect(outputHtml).not.toContain('Hidden')
  })

  it('should process v-for through the full stx pipeline', async () => {
    const testFile = await createTestFile('vue-for.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Vue For</title>
      <script>
        module.exports = { items: ['apple', 'banana', 'cherry'] };
      </script>
      </head>
      <body>
        <ul>
          <li v-for="item in items">{{ item }}</li>
        </ul>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('apple')
    expect(outputHtml).toContain('banana')
    expect(outputHtml).toContain('cherry')
  })

  it('should process v-html through the full stx pipeline', async () => {
    const testFile = await createTestFile('vue-html.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Vue Html</title>
      <script>
        module.exports = { rawHtml: '<strong>Bold</strong>' };
      </script>
      </head>
      <body>
        <div v-html="rawHtml">placeholder</div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)
    expect(outputHtml).toContain('<strong>Bold</strong>')
    expect(outputHtml).not.toContain('placeholder')
  })
})
