import { expect, test } from 'bun:test'
import { pageHeadFragment } from '../src/page-head'
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
