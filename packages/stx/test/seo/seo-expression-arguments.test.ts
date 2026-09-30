/**
 * The SEO directives take expressions, and say so when one cannot be used.
 *
 * `@seo` only matched `@seo({`, so `@seo(seo)` stayed in the page as text.
 * `@meta` read its arguments with a pattern over quoted strings, so
 * `@meta('author', post.author)` shipped the words "post.author" as the author
 * and a quoted `'title'` could be swapped for a variable of that name.
 * `@structuredData(prodcut)` emitted a JSON-LD block holding only `@context`,
 * and `@metaTag(undefinedVar)` an empty `<meta>`. None of them said anything.
 *
 * Every argument is now an expression evaluated against the template context,
 * and a directive that cannot produce its tag leaves an inline comment and a
 * console warning naming the file.
 */
import type { HeadConfig } from '../../src/head'
import type { CustomDirective, StxOptions } from '../../src/types'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processCustomDirectives } from '../../src/custom-directives'
import { parseStringLiteral, splitTopLevelArgs } from '../../src/directive-arguments'
import { processMetaDirective } from '../../src/head'
import { processIncludes } from '../../src/includes'
import { processDirectives } from '../../src/process'
import { metaDirective, processMetaDirectives, processSeoDirective, processStructuredData } from '../../src/seo'

const options = { ...defaultConfig } as StxOptions
const FILE = 'views/page.stx'

let warn: ReturnType<typeof spyOn>

beforeEach(() => {
  warn = spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warn.mockRestore()
})

/** Every console warning so far, as one string. */
function warnings(): string {
  return warn.mock.calls.map((args: unknown[]) => args.join(' ')).join('\n')
}

// =============================================================================
// @seo
// =============================================================================

describe('@seo takes any expression that evaluates to an object', () => {
  const seo = { title: 'Pricing', description: 'Plans and prices', canonical: 'https://example.com/pricing' }

  it('reads a variable', () => {
    const html = processSeoDirective('@seo(seo)', { seo }, FILE, options)

    expect(html).toContain('<title>Pricing</title>')
    expect(html).toContain('<meta name="description" content="Plans and prices">')
    expect(html).toContain('<link rel="canonical" href="https://example.com/pricing">')
    expect(html).not.toContain('@seo')
    expect(warn).not.toHaveBeenCalled()
  })

  it('reads a member of a variable', () => {
    const html = processSeoDirective('@seo(page.seo)', { page: { seo } }, FILE, options)
    expect(html).toContain('<title>Pricing</title>')
  })

  it('calls a function', () => {
    const buildSeo = (title: string) => ({ title, openGraph: { image: '/og.png' } })
    const html = processSeoDirective('@seo(buildSeo(\'From a call\'))', { buildSeo }, FILE, options)

    expect(html).toContain('<title>From a call</title>')
    expect(html).toContain('<meta property="og:image" content="/og.png">')
  })

  it('spreads and overrides', () => {
    const html = processSeoDirective('@seo({ ...seo, title: `${seo.title} | Example` })', { seo }, FILE, options)
    expect(html).toContain('<title>Pricing | Example</title>')
  })

  it('still takes an object literal, across lines', () => {
    const html = processSeoDirective(`@seo({
      title: 'Literal',
      openGraph: { type: 'article' },
    })`, {}, FILE, options)

    expect(html).toContain('<title>Literal</title>')
    expect(html).toContain('<meta property="og:type" content="article">')
  })

  it('keeps a paren inside a string inside the call', () => {
    const html = processSeoDirective('@seo({ title: \'Smile :)\' }) after', {}, FILE, options)

    expect(html).toContain('<title>Smile :)</title>')
    expect(html).toEndWith(' after')
  })

  it('renders nothing, quietly, for a variable that holds null', () => {
    const html = processSeoDirective('<head>@seo(page.seo)</head>', { page: { seo: null } }, FILE, options)

    expect(html).toBe('<head></head>')
    expect(warn).not.toHaveBeenCalled()
  })

  it('accepts a guard for a variable only some pages define', () => {
    const html = processSeoDirective('@seo(seo ?? {})', {}, FILE, options)

    expect(html).toBe('')
    expect(warn).not.toHaveBeenCalled()
  })

  it('does not change the object it was given', () => {
    const data = { title: 'T', structuredData: { '@type': 'Thing' } }
    processSeoDirective('@seo(data)', { data }, FILE, options)
    expect(data.structuredData).toEqual({ '@type': 'Thing' })
  })

  it('writes a title that is not a string instead of throwing', () => {
    const html = processSeoDirective('@seo({ title: 2026 })', {}, FILE, options)
    expect(html).toContain('<title>2026</title>')
  })

  it('escapes what it writes into attributes', () => {
    const html = processSeoDirective('@seo(seo)', { seo: { description: '"><script>alert(1)</script>' } }, FILE, options)

    expect(html).toContain('content="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"')
    expect(html).not.toContain('<script>alert')
  })

  it('gives structuredData a schema.org @context and keeps </script> inside the block', () => {
    const html = processSeoDirective('@seo(seo)', {
      seo: { structuredData: { '@type': 'Article', headline: '</script><b>x</b>' } },
    }, FILE, options)

    expect(html).toContain('"@context":"https://schema.org"')
    expect(html).toContain('<\\/script>')
    expect(html.match(/<\/script>/g)).toHaveLength(1)
  })
})

describe('@seo reports what it cannot use', () => {
  it('names a variable that does not exist, in the page and on the console', () => {
    const html = processSeoDirective('<head>@seo(seo)</head>', {}, FILE, options)

    expect(html).toContain('<!-- [SEO Error')
    expect(html).toContain('"seo" is not defined')
    expect(html).not.toContain('<title>')
    expect(warnings()).toContain('@seo(seo)')
    expect(warnings()).toContain(FILE)
    expect(warnings()).toContain('"seo" is not defined')
  })

  it('reports a value that is not an object', () => {
    const html = processSeoDirective('@seo(title)', { title: 'Just a string' }, FILE, options)

    expect(html).toContain('<!-- [SEO Error')
    expect(html).toContain('expected an object')
    expect(warnings()).toContain('got a string')
  })

  it('reports an array', () => {
    const html = processSeoDirective('@seo(list)', { list: [{ title: 'x' }] }, FILE, options)
    expect(html).toContain('got an array')
  })

  it('reports a syntax error', () => {
    const html = processSeoDirective('@seo({ invalid!!! })', {}, FILE, options)

    expect(html).toContain('<!-- [SEO Error')
    expect(warn).toHaveBeenCalled()
  })

  it('reports an expression the evaluator refuses', () => {
    const html = processSeoDirective('@seo(eval(\'x\'))', {}, FILE, options)

    expect(html).toContain('not allowed')
    expect(warn).toHaveBeenCalled()
  })

  it('reports an object literal that threw while it was built', () => {
    const html = processSeoDirective('@seo({ title: Object.keys(undefined) })', {}, FILE, options)
    expect(html).toContain('threw')
  })

  it('reports an empty call', () => {
    const html = processSeoDirective('@seo()', {}, FILE, options)
    expect(html).toContain('expected an object')
  })

  it('reports a call that is never closed, and keeps its text', () => {
    const html = processSeoDirective('@seo({ title: \'x\' ', {}, FILE, options)

    expect(html).toContain('no closing parenthesis')
    expect(html).toContain('@seo({ title: \'x\' ')
  })

  it('warns about keys it does not read, and says where they live', () => {
    const html = processSeoDirective('@seo({ title: \'T\', image: \'/og.png\', url: \'https://x\' })', {}, FILE, options)

    // The rest still renders.
    expect(html).toContain('<title>T</title>')
    expect(warnings()).toContain('image (use openGraph.image)')
    expect(warnings()).toContain('url (use canonical or openGraph.url)')
  })

  it('warns about an openGraph that is not an object', () => {
    const html = processSeoDirective('@seo({ title: \'T\', openGraph: \'/og.png\' })', {}, FILE, options)

    expect(html).toContain('<title>T</title>')
    expect(html).not.toContain('og:')
    expect(warnings()).toContain('openGraph must be an object')
  })

  it('does not treat an e-mail address as a call', () => {
    const html = processSeoDirective('mail hello@seo(team) today', {}, FILE, options)

    expect(html).toBe('mail hello@seo(team) today')
    expect(warn).not.toHaveBeenCalled()
  })
})

// =============================================================================
// @structuredData and @metaTag
// =============================================================================

describe('@structuredData takes any expression', () => {
  it('reads a variable and fills in @context without touching it', () => {
    const product = { '@type': 'Product', name: 'Widget' }
    const html = processStructuredData('@structuredData(product)', { product }, FILE)

    expect(html).toContain('"name":"Widget"')
    expect(html).toContain('"@context":"https://schema.org"')
    expect(product).not.toHaveProperty('@context')
  })

  it('writes an array of graphs, each with a @context', () => {
    const html = processStructuredData('@structuredData(graphs)', {
      graphs: [{ '@type': 'Organization', name: 'A' }, { '@type': 'WebSite', name: 'B' }],
    }, FILE)

    expect(html.match(/"@context":"https:\/\/schema.org"/g)).toHaveLength(2)
  })

  it('reports a variable that does not exist rather than emitting a bare @context', () => {
    const html = processStructuredData('@structuredData(prodcut)', { product: {} }, FILE)

    expect(html).not.toContain('application/ld+json')
    expect(html).toContain('"prodcut" is not defined')
    expect(warnings()).toContain(FILE)
  })

  it('reports a value JSON-LD cannot hold', () => {
    const html = processStructuredData('@structuredData(name)', { name: 'Widget' }, FILE)
    expect(html).toContain('expected an object or an array of objects')
  })

  it('keeps </script> inside the block', () => {
    const html = processStructuredData('@structuredData(data)', { data: { '@type': 'Thing', name: '</script><script>alert(1)</script>' } }, FILE)

    expect(html.match(/<\/script>/g)).toHaveLength(1)
    expect(html).toContain('<\\/script>')
  })
})

describe('@metaTag takes any expression', () => {
  it('reads a variable', () => {
    const html = processMetaDirectives('@metaTag(tag)', { tag: { name: 'author', content: 'Jane' } }, FILE, options)
    expect(html).toBe('<meta name="author" content="Jane">')
  })

  it('reports a variable that does not exist rather than emitting an empty <meta>', () => {
    const html = processMetaDirectives('@metaTag(tag)', {}, FILE, options)

    expect(html).not.toContain('<meta')
    expect(html).toContain('"tag" is not defined')
    expect(warn).toHaveBeenCalled()
  })

  it('reports a tag with no name, property or httpEquiv', () => {
    const html = processMetaDirectives('@metaTag({ content: \'x\' })', {}, FILE, options)
    expect(html).toContain('needs a name, property or httpEquiv')
  })

  it('leaves out a tag with no content', () => {
    const html = processMetaDirectives('@metaTag({ name: \'author\', content: post.author })', { post: {} }, FILE, options)

    expect(html).toBe('')
    expect(warn).not.toHaveBeenCalled()
  })
})

// =============================================================================
// @meta
// =============================================================================

describe('@meta evaluates an unquoted value', () => {
  it('reads a variable', () => {
    const html = processMetaDirectives('@meta(\'author\', authorVar)', { authorVar: 'Jane Doe' }, FILE, options)
    expect(html).toBe('<meta name="author" content="Jane Doe">')
  })

  it('reads a member, instead of sending the expression as text', () => {
    const html = processMetaDirectives('@meta(\'author\', post.author)', { post: { author: 'Bob' } }, FILE, options)

    expect(html).toBe('<meta name="author" content="Bob">')
    expect(html).not.toContain('post.author')
  })

  it('evaluates a call with commas and a template literal', () => {
    const context = { join: (a: string, b: string) => `${a} and ${b}`, site: 'Example' }

    expect(processMetaDirectives('@meta(\'author\', join(\'A\', \'B\'))', context, FILE, options))
      .toBe('<meta name="author" content="A and B">')
    expect(processMetaDirectives('@meta(\'og:site_name\', `${site} Docs`)', context, FILE, options))
      .toBe('<meta property="og:site_name" content="Example Docs">')
  })

  it('never looks a quoted value up in the context', () => {
    const html = processMetaDirectives('@meta(\'description\', \'title\')', { title: 'Not this' }, FILE, options)
    expect(html).toBe('<meta name="description" content="title">')
  })

  it('keeps a paren and a comma inside a quoted value', () => {
    const html = processMetaDirectives('@meta(\'description\', \'Fast, small (and free)\')', {}, FILE, options)
    expect(html).toBe('<meta name="description" content="Fast, small (and free)">')
  })

  it('joins an array', () => {
    const html = processMetaDirectives('@meta(\'keywords\', tags)', { tags: ['stx', 'bun', 'seo'] }, FILE, options)
    expect(html).toBe('<meta name="keywords" content="stx, bun, seo">')
  })

  it('addresses Open Graph by property', () => {
    const html = processMetaDirectives('@meta(\'og:title\', post.title)', { post: { title: 'Hello' } }, FILE, options)
    expect(html).toBe('<meta property="og:title" content="Hello">')
  })

  it('evaluates a name that is an expression', () => {
    const html = processMetaDirectives('@meta(tag.name, tag.value)', { tag: { name: 'robots', value: 'noindex' } }, FILE, options)
    expect(html).toBe('<meta name="robots" content="noindex">')
  })

  it('still reads a bare name as the name, as the guide documents', () => {
    const html = processMetaDirectives('@meta(og:image, "/preview.jpg")', {}, FILE, options)
    expect(html).toBe('<meta property="og:image" content="/preview.jpg">')
  })

  it('renders nothing, quietly, for a value that is empty', () => {
    const html = processMetaDirectives('@meta(\'author\', post.author)', { post: { author: null } }, FILE, options)

    expect(html).toBe('')
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('@meta keeps its one-argument form', () => {
  it('reads og:title from the context', () => {
    expect(processMetaDirectives('@meta(\'og:title\')', { title: 'From context' }, FILE, options))
      .toBe('<meta property="og:title" content="From context">')
  })

  it('reads og:image from openGraph', () => {
    expect(processMetaDirectives('@meta(\'og:image\')', { openGraph: { image: '/og.png' } }, FILE, options))
      .toBe('<meta property="og:image" content="/og.png">')
  })

  it('renders nothing when the context has no value', () => {
    expect(processMetaDirectives('@meta(\'og:title\')', {}, FILE, options)).toBe('')
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('@meta reports what it cannot use', () => {
  it('names a variable that does not exist', () => {
    const html = processMetaDirectives('@meta(\'author\', authr)', { author: 'Jane' }, FILE, options)

    expect(html).toContain('<!-- [Meta Error')
    expect(html).toContain('"authr" is not defined')
    expect(html).toContain('quote it')
    expect(warnings()).toContain(FILE)
  })

  it('reports an object where text belongs', () => {
    const html = processMetaDirectives('@meta(\'author\', post)', { post: { author: 'Bob' } }, FILE, options)
    expect(html).toContain('the content must be text, got an object')
  })

  it('reports too many arguments', () => {
    const html = processMetaDirectives('@meta(\'a\', \'b\', \'c\')', {}, FILE, options)
    expect(html).toContain('got 3 arguments')
  })

  it('reports a call that is never closed', () => {
    const html = processMetaDirectives('@meta(\'author\', \'Jane\'', {}, FILE, options)
    expect(html).toContain('no closing parenthesis')
  })
})

describe('the staged @meta passes resolve arguments the same way', () => {
  it('metaDirective evaluates the value it is given as written', () => {
    const context: Record<string, any> = { post: { author: 'Bob' } }
    const output = metaDirective.handler('', ['\'author\'', 'post.author'], context, FILE)

    expect(output).toBe('')
    expect((context.__stx_runtime_head as HeadConfig).meta).toEqual([{ name: 'author', content: 'Bob' }])
  })

  it('metaDirective reports a variable that does not exist, and stages nothing', () => {
    const context: Record<string, any> = {}
    const output = metaDirective.handler('', ['\'author\'', 'author'], context, FILE) as string

    expect(output).toContain('"author" is not defined')
    expect(context.__stx_runtime_head).toBeUndefined()
    expect(warnings()).toContain(FILE)
  })

  it('head.ts processMetaDirective stages both forms, with expressions', () => {
    const context: Record<string, any> = { post: { author: 'Bob' }, title: 'T' }
    const output = processMetaDirective('@meta(\'author\', post.author)@meta(\'og:title\')<p>x</p>', context, FILE)

    expect(output).toBe('<p>x</p>')
    expect((context.__stx_runtime_head as HeadConfig).meta).toEqual([
      { name: 'author', content: 'Bob' },
      { property: 'og:title', content: 'T' },
    ])
  })

  it('reaches <head> through a full render', async () => {
    const html = await processDirectives(
      '@meta(\'author\', post.author)\n@meta(\'description\', summary(post, 11))\n<div>hi</div>',
      { post: { author: 'Bob', body: 'A long body of text' }, summary: (p: { body: string }, n: number) => p.body.slice(0, n) },
      FILE,
      { ...options, autoShell: true, app: { head: { title: 'Site' } } } as unknown as StxOptions,
      new Set<string>(),
    )

    const headEnd = html.indexOf('</head>')
    expect(html.indexOf('<meta name="author" content="Bob">')).toBeGreaterThan(-1)
    expect(html.indexOf('<meta name="author" content="Bob">')).toBeLessThan(headEnd)
    expect(html).toContain('<meta name="description" content="A long body">')
    expect(html).not.toContain('post.author')
  })
})

// =============================================================================
// Custom directives
// =============================================================================

describe('CustomDirective.rawParams', () => {
  it('passes arguments as written and matches the call by balance', async () => {
    const seen: string[][] = []
    const directive: CustomDirective = {
      name: 'probe',
      rawParams: true,
      handler: (_content, params) => {
        seen.push(params)
        return 'ok'
      },
    }

    const output = await processCustomDirectives('@probe(\'a, b\', fn(x, y), \'Smile :)\') tail', {}, FILE, { customDirectives: [directive] } as StxOptions)

    expect(output).toBe('ok tail')
    expect(seen).toEqual([['\'a, b\'', 'fn(x, y)', '\'Smile :)\'']])
  })

  it('leaves the quote-stripping default alone', async () => {
    const seen: string[][] = []
    const directive: CustomDirective = {
      name: 'probe',
      handler: (_content, params) => {
        seen.push(params)
        return ''
      },
    }

    await processCustomDirectives('@probe(\'a\', b)', {}, FILE, { customDirectives: [directive] } as StxOptions)
    expect(seen).toEqual([['a', 'b']])
  })
})

describe('argument helpers', () => {
  it('splits at top-level commas only', () => {
    expect(splitTopLevelArgs('\'a, b\', [1, 2], { c: 1, d: 2 }, f(g, h), `x, ${y}`'))
      .toEqual(['\'a, b\'', '[1, 2]', '{ c: 1, d: 2 }', 'f(g, h)', '`x, ${y}`'])
  })

  it('tells a string literal from an expression', () => {
    expect(parseStringLiteral('\'It\\\'s\'')).toBe('It\'s')
    expect(parseStringLiteral('"a"')).toBe('a')
    expect(parseStringLiteral('`plain`')).toBe('plain')
    expect(parseStringLiteral('\'a\' + \'b\'')).toBeNull()
    expect(parseStringLiteral('`${a}`')).toBeNull()
    expect(parseStringLiteral('title')).toBeNull()
  })
})

// =============================================================================
// Partials
// =============================================================================

describe('expression arguments inside a partial', () => {
  let dir: string

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'stx-seo-expr-'))
    await writeFile(join(dir, 'head.stx'), `
<script server>
const seo = { title: \`\${name} | Example\`, openGraph: { image: '/og.png' } }
const author = 'Jane Doe'
function buildSchema(n) { return { '@type': 'WebSite', name: n } }
</script>
@seo(seo)
@meta('author', author)
@meta('og:site_name', \`\${name} Docs\`)
@structuredData(buildSchema(name))
`)
    await writeFile(join(dir, 'broken.stx'), `
<script server>
const seo = { title: 'Declared' }
</script>
@seo(pageSeo)
@meta('author', writer)
`)
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  function render(partial: string, context: Record<string, unknown>) {
    return processIncludes(`<head>@include('${partial}')</head>`, context, join(dir, 'page.stx'), { partialsDir: dir, componentsDir: dir }, new Set())
  }

  it('evaluates @seo(variable), @meta with expressions and @structuredData(call) in the partial scope', async () => {
    const html = await render('head.stx', { name: 'Pricing' })

    expect(html).toContain('<title>Pricing | Example</title>')
    expect(html).toContain('<meta property="og:image" content="/og.png">')
    expect(html).toContain('<meta name="author" content="Jane Doe">')
    expect(html).toContain('<meta property="og:site_name" content="Pricing Docs">')
    expect(html).toContain('"name":"Pricing"')
    expect(html).toContain('"@context":"https://schema.org"')
    expect(html).not.toContain('@seo')
    expect(html).not.toContain('@meta')
    expect(html).not.toContain('@structuredData')
    expect(warn).not.toHaveBeenCalled()
  })

  it('evaluates them in the partial scope through a full render', async () => {
    const page = '<!DOCTYPE html><html><head>@include(\'head.stx\')</head><body><p>body</p></body></html>'
    const html = await processDirectives(page, { name: 'Docs' }, join(dir, 'page.stx'), {
      ...options,
      partialsDir: dir,
      componentsDir: dir,
    } as StxOptions, new Set<string>())

    const headEnd = html.indexOf('</head>')
    expect(html.indexOf('<title>Docs | Example</title>')).toBeGreaterThan(-1)
    expect(html.indexOf('<title>Docs | Example</title>')).toBeLessThan(headEnd)
    expect(html).toContain('<meta name="author" content="Jane Doe">')
    expect(html).toContain('"name":"Docs"')
    // The injector read the partial's title rather than minting a placeholder.
    expect(html).not.toContain('stx Project')
    expect(warn).not.toHaveBeenCalled()
  })

  it('reports names the partial does not have, naming the partial', async () => {
    const html = await render('broken.stx', {})

    expect(html).toContain('"pageSeo" is not defined')
    expect(html).toContain('"writer" is not defined')
    expect(html).not.toContain('<title>')
    expect(warnings()).toContain('broken.stx')
  })
})
