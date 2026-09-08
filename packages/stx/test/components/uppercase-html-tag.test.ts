/**
 * An HTML element SHOUTED in caps is an element, not a component.
 *
 * HTML tag names are case-insensitive, so `<STYLE>` and `<DIV>` are valid
 * markup. stx resolves component tags in three passes — kebab, PascalCase,
 * then single-word lowercase — and only the lowercase pass was given the
 * `htmlTags` skip set. `<STYLE>` matched the PascalCase pattern, resolved to
 * `style.stx`, found nothing, and spliced an ENOENT error string (listing
 * absolute server paths) into the rendered page.
 *
 * The fix cannot be "hand the PascalCase pass the same set": that test is
 * case-insensitive, so it would also swallow `<Table>`, `<Button>`, `<Image>`,
 * `<Video>`, `<Select>`, `<Progress>`, `<Form>` and `<Dialog>` — components
 * `@stacksjs/components` really ships. The discriminator is spelling: stx
 * components are PascalCase, never SCREAMING_CASE, so `Table` and `TABLE`
 * never collide. Both halves are pinned below.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { findComponentTags, uppercaseHtmlTagSkip } from '../../src/component-processing'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { clearComponentCache } from '../../src/utils'

/** The three patterns the renderer applies, in order. */
const PASCAL = /[A-Z][a-zA-Z0-9]*/
const LOWERCASE = /[a-z][a-z0-9]*/

const HTML_TAGS = new Set(['div', 'style', 'h1', 'br', 'table', 'button', 'a', 'clipPath'])
const SKIP = uppercaseHtmlTagSkip(HTML_TAGS)

const names = (html: string, pattern: RegExp, skip?: Set<string> | ((tag: string) => boolean)) =>
  findComponentTags(html, pattern, skip).map(t => t.tagName)

describe('the PascalCase pass skips SHOUTED HTML tags', () => {
  it('leaves <STYLE> alone', () => {
    expect(names('<STYLE>.a { color: red }</STYLE>', PASCAL, SKIP)).toEqual([])
  })

  it('leaves <DIV> alone', () => {
    expect(names('<DIV id="a">hi</DIV>', PASCAL, SKIP)).toEqual([])
  })

  it('leaves a numbered tag such as <H1> alone', () => {
    expect(names('<H1>Title</H1>', PASCAL, SKIP)).toEqual([])
  })

  it('leaves a void tag such as <BR> alone', () => {
    expect(names('<BR>', PASCAL, SKIP)).toEqual([])
  })

  it('matches the camelCase SVG entries case-insensitively', () => {
    // The tag sets spell SVG elements as `clipPath`, so a raw has() on the
    // lowercased name misses them. The all-caps check lowercases both sides.
    expect(names('<CLIPPATH></CLIPPATH>', PASCAL, SKIP)).toEqual([])
  })

  it('skips only the opening tag, so components inside still resolve', () => {
    // The skip must not consume the element's content — a real component
    // nested in a shouted wrapper would vanish with it.
    expect(names('<DIV><Card /></DIV>', PASCAL, SKIP)).toEqual(['Card'])
  })
})

describe('components that share an HTML tag name still resolve', () => {
  it('still claims <Table>', () => {
    expect(names('<Table>t</Table>', PASCAL, SKIP)).toEqual(['Table'])
  })

  it('still claims <Button>', () => {
    expect(names('<Button />', PASCAL, SKIP)).toEqual(['Button'])
  })

  it('still claims every other @stacksjs/components name that collides', () => {
    const shipped = ['Image', 'Video', 'Select', 'Progress', 'Form', 'Dialog', 'Audio', 'Textarea', 'Label', 'Option', 'Canvas']
    for (const name of shipped)
      expect(names(`<${name} />`, PASCAL, SKIP)).toEqual([name])
  })

  it('still claims an all-caps name that is not an HTML tag', () => {
    // Membership in the tag set is required, so <FAQ /> stays a component.
    expect(names('<FAQ />', PASCAL, SKIP)).toEqual(['FAQ'])
    expect(names('<CTA />', PASCAL, SKIP)).toEqual(['CTA'])
  })

  it('still claims an ordinary PascalCase component', () => {
    expect(names('<UserCard title="x" />', PASCAL, SKIP)).toEqual(['UserCard'])
  })
})

describe('the lowercase pass is unchanged', () => {
  it('still accepts a plain Set and skips known HTML tags', () => {
    expect(names('<div />', LOWERCASE, new Set(['div']))).toEqual([])
  })

  it('still claims a genuine single-word component', () => {
    expect(names('<card />', LOWERCASE, new Set(['div']))).toEqual(['card'])
  })
})

describe('end to end: a page of shouted HTML renders as itself', () => {
  const TEMP_DIR = path.join(import.meta.dir, 'temp-uppercase-html')
  const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')
  const PAGE = path.join(TEMP_DIR, 'page.stx')

  const render = (template: string) => processDirectives(
    template,
    {},
    PAGE,
    { ...defaultConfig, componentsDir: COMPONENTS_DIR },
    new Set<string>(),
  )

  beforeAll(async () => {
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })
    await Bun.write(path.join(COMPONENTS_DIR, 'Table.stx'), `<div class="component-table"><slot /></div>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'Button.stx'), `<button class="component-button"><slot /></button>`)
    await Bun.write(path.join(COMPONENTS_DIR, 'faq.stx'), `<section class="component-faq"><slot /></section>`)
    clearComponentCache()
  })

  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
    clearComponentCache()
  })

  it('renders <STYLE> verbatim instead of an ENOENT error', async () => {
    const out = await render('<STYLE>.a { color: red }</STYLE>')
    expect(out).not.toContain('Error loading component')
    expect(out).toContain('<STYLE>.a { color: red }</STYLE>')
  })

  it('renders <DIV> verbatim, attributes and content intact', async () => {
    const out = await render('<DIV id="a" class="b">hi</DIV>')
    expect(out).not.toContain('Error loading component')
    expect(out).toContain('<DIV id="a" class="b">hi</DIV>')
  })

  it('never leaks a server path for a shouted tag', async () => {
    const out = await render('<H1>Title</H1><BR><SPAN>x</SPAN>')
    expect(out).not.toContain('Searched paths')
    expect(out).toContain('<H1>Title</H1>')
    expect(out).toContain('<SPAN>x</SPAN>')
  })

  it('still renders a real <Table> component', async () => {
    const out = await render('<Table>rows</Table>')
    expect(out).not.toContain('Error loading component')
    expect(out).toContain('class="component-table"')
    expect(out).toContain('rows')
  })

  it('still renders a real <Button> component', async () => {
    const out = await render('<Button>Save</Button>')
    expect(out).not.toContain('Error loading component')
    expect(out).toContain('class="component-button"')
    expect(out).toContain('Save')
  })

  it('still renders an all-caps component that is not an HTML tag', async () => {
    const out = await render('<FAQ>q</FAQ>')
    expect(out).not.toContain('Error loading component')
    expect(out).toContain('class="component-faq"')
  })

  it('renders shouted HTML and real components side by side', async () => {
    const out = await render('<STYLE>.a{color:red}</STYLE><DIV>d</DIV><Table>t</Table><Button>b</Button>')
    expect(out).not.toContain('Error loading component')
    expect(out).toContain('<STYLE>.a{color:red}</STYLE>')
    expect(out).toContain('<DIV>d</DIV>')
    expect(out).toContain('class="component-table"')
    expect(out).toContain('class="component-button"')
  })
})
