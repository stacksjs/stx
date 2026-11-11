import { expect, test } from 'bun:test'
import { extractContainerContent } from '../src/app-shell'
import { pageCssFragment, pageHeadFragment } from '../src/page-head'
import { applyTranslations, type ResolvedI18n } from '../src/site-builder/i18n'

test('carries only metadata and strips arbitrary attributes (#2121)', () => {
  const fragment = pageHeadFragment(`<html><head>
<title>A &amp; &amp;lt; 你好</title><meta name="description" content="A &quot;quote&quot; &amp; &lt;/template&gt;" onclick="bad()">
<meta property="og:title" content="Social"><meta name="twitter:card" content="summary">
<link rel="canonical" href="/a?x=1&amp;y=2"><link rel="alternate" hreflang="de" href="/de/a">
<meta name="csrf-token" content="secret"><meta name="theme-color" content="red"><meta http-equiv="refresh" content="0;url=/bad">
<link rel="stylesheet" href="/app.css"><link rel="alternate" type="application/rss+xml" href="/rss">
<script>const fake = '<meta name="description" content="fake">'</script>
<!-- <meta name="description" content="comment"> -->
<style>.x:after { content: '<meta name="description" content="css">'; }</style>
</head><body><meta name="description" content="body"></body></html>`)
  expect(fragment).toContain('<title>A &amp; &amp;lt; 你好</title>')
  expect(fragment).toContain('content="A &quot;quote&quot; &amp; &lt;/template&gt;"')
  expect(fragment).toContain('property="og:title"')
  expect(fragment).toContain('name="twitter:card"')
  expect(fragment).toContain('href="/a?x=1&amp;y=2"')
  expect(fragment).toContain('hreflang="de"')
  for (const excluded of ['onclick', 'csrf', 'theme-color', 'http-equiv', 'stylesheet', 'rss', 'fake', 'comment', 'css', 'body'])
    expect(fragment).not.toContain(excluded)
})

test('an absent metadata set is explicit, not an old-server response', () => {
  expect(pageHeadFragment('<html><head></head><body>Page</body></html>')).toBe('<template data-stx-page-head="1"></template>\n')
})

test('handles quoted >, unquoted attributes, casing, and first duplicate attributes', () => {
  const fragment = pageHeadFragment(`<head><META NAME=DESCRIPTION CONTENT="a > b" content=wrong><LINK REL=canonical HREF=/en><link REL=alternate HREF=/nl HREFLANG=nl></head>`)
  expect(fragment).toContain('<meta name="description" content="a &gt; b">')
  expect(fragment).toContain('<link rel="canonical" href="/en">')
  expect(fragment).toContain('<link rel="alternate" href="/nl" hreflang="nl">')
  expect(fragment).not.toContain('wrong')
})

test('translations are safe in quoted metadata without double-decoding literal entities', () => {
  const i18n = { defaultLocale: 'en', translations: { en: { description: `"quoted" 'text' & <literal> &lt;` } } } as unknown as ResolvedI18n
  const html = applyTranslations('<head><meta name="description" content="{t:description}"></head>', i18n, 'en')
  expect(pageHeadFragment(html)).toContain('content="&quot;quoted&quot; &#39;text&#39; &amp; &lt;literal&gt; &amp;lt;"')
})

test('preserves numeric and named entities and unquoted trailing slashes for the HTML parser', () => {
  const fragment = pageHeadFragment(`<head><title>&copy; &#x1f331; &amp;lt;</title><meta name="description" content='&copy; &#169; &#x1f331; &amp;lt; "quote"'><link rel=canonical href=/en/></head>`)
  expect(fragment).toContain('<title>&copy; &#x1f331; &amp;lt;</title>')
  expect(fragment).toContain('content="&copy; &#169; &#x1f331; &amp;lt; &quot;quote&quot;"')
  expect(fragment).toContain('href="/en/"')
})

test('lists the stylesheets the page head links, and nothing else', () => {
  const fragment = pageCssFragment(`<html><head>
<title>Format</title><meta name="description" content="Format"><link rel="canonical" href="/format">
<link rel="stylesheet" href="/assets/styles/production/app.css">
<LINK REL=StyleSheet HREF=assets/format.css MEDIA=print>
<link href='https://fonts.example/css?family=Inter&amp;display=swap' rel="stylesheet" crossorigin integrity="sha384-abc" onload="bad()" id="fonts" referrerpolicy="no-referrer">
<link data-css="generated" rel="stylesheet" href="/_stx/css.0123456789abcdef.css">
<link rel="stylesheet" href="/off.css" disabled><link rel="stylesheet"><link rel="alternate stylesheet" href="/alt.css" title="Alt">
<link rel="preload" as="style" href="/preloaded.css"><link rel="preconnect" href="https://fonts.example"><link rel="icon" href="/icon.png">
<script>const fake = '<link rel="stylesheet" href="/script.css">'</script>
<!-- <link rel="stylesheet" href="/comment.css"> -->
<style>.x:after { content: '<link rel="stylesheet" href="/style.css">'; }</style>
</head><body><link rel="stylesheet" href="/body.css"><main>Format</main></body></html>`)
  expect(fragment).toBe('<template data-stx-page-css="1">'
    + '<link rel="stylesheet" href="/assets/styles/production/app.css">'
    + '<link rel="stylesheet" href="assets/format.css" media="print">'
    + '<link rel="stylesheet" href="https://fonts.example/css?family=Inter&amp;display=swap" crossorigin="" integrity="sha384-abc">'
    + '</template>\n')
})

test('a page that links no stylesheet sends no list, and the metadata contract is unchanged', () => {
  const html = '<html><head><title>Plain</title><link data-css="generated" rel="stylesheet" href="/_stx/css.0123456789abcdef.css"></head><body><main>Plain</main></body></html>'
  expect(pageCssFragment(html)).toBe('')
  expect(pageCssFragment('<main>No head at all</main>')).toBe('')
  expect(pageHeadFragment('<html><head><link rel="stylesheet" href="/app.css"></head><body></body></html>')).toBe('<template data-stx-page-head="1"></template>\n')
})

test('a stylesheet href cannot close the list or break out of its attribute', () => {
  const fragment = pageCssFragment(`<head><link rel="stylesheet" href='/a.css?x="></template><script>bad()</script>'></head>`)
  expect(fragment).toBe('<template data-stx-page-css="1"><link rel="stylesheet" href="/a.css?x=&quot;&gt;&lt;/template&gt;&lt;script&gt;bad()&lt;/script&gt;"></template>\n')
})

test('a router fragment carries the stylesheet list right behind the metadata', () => {
  const html = `<!doctype html><html><head><title>Format</title><meta name="description" content="Format">
<link rel="stylesheet" href="/assets/styles/production/format.css"></head><body><nav>Chrome</nav><main><h1>Format</h1></main></body></html>`
  const fragment = extractContainerContent(html, 'main', true)
  expect(fragment.startsWith('<template data-stx-page-head="1"><title>Format</title><meta name="description" content="Format"></template>\n'
    + '<template data-stx-page-css="1"><link rel="stylesheet" href="/assets/styles/production/format.css"></template>\n')).toBe(true)
  expect(fragment).toContain('<h1>Format</h1>')
  expect(fragment).not.toContain('Chrome')
  // Only when the caller asks for the router contract.
  expect(extractContainerContent(html, 'main')).not.toContain('data-stx-page-css')
})
