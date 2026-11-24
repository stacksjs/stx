import { createHash } from 'node:crypto'
import type { ExternalizeHtmlResult } from './build-externalize'
import { insertBeforeBodyClose } from './document-tags'
import { scanHtmlScriptElements, scanHtmlTags } from './html-masking'
import { outputNeedsSignalsRuntime } from './runtime-injection'

/**
 * The runtime waits for the first island.
 *
 * An island (`client="interaction|visible|idle|media:…"` on a component tag)
 * defers its own setup, but the page still loaded the whole signals runtime,
 * and every bundle behind it, from a parser-blocking tag in the head: the
 * island's inert script is hydrated by code inside that runtime. On a page
 * whose only reactive content is islands, that is the entire client library
 * fetched and run before the first paint to wire up nothing yet.
 *
 * For such a page this pass makes the runtime and its bundles inert
 * (`type="stx/lazy"`) and adds a small loader. The loader arms each island's
 * own trigger; the first one to fire loads the runtime and bundles in their
 * written order, starts the runtime, and hands the island over to it. A click
 * that lands on an island before it is hydrated is held and replayed once it
 * is, so the first tap on a control is never lost and never falls through to
 * the browser's default.
 *
 * Until then an island shows its server-rendered markup. Conditional parts
 * (`:if`, `:show`) stay cloaked, since nothing has decided them yet: write an
 * island so that what is visible before hydration is right on its own, with
 * static text and attributes beside the reactive ones.
 *
 * "Hydrated" here means the runtime has announced it (`stx:hydrated`), not
 * that the trigger fired: a chunked island's setup is still on the network
 * between the two, and a click let through in that gap reached a form with no
 * handler on it and submitted it natively.
 *
 * A page qualifies only when everything that needs the runtime sits inside an
 * island. One eager component script, one page script that reaches for
 * `window.stx`, one reactive attribute outside an island, and the page is
 * returned untouched: it needs the runtime at once, as before.
 *
 * Run it before {@link deferScripts}, on full documents only. A router
 * fragment is loaded into a page that either already has the runtime or
 * falls back to a full load, so it keeps its tags as they are.
 */
export interface LazyIslandRuntimeResult extends ExternalizeHtmlResult {
  /** Whether the page qualified and was rewritten. */
  applied: boolean
  /** Why a document with islands kept its eager runtime, for diagnostics. */
  reason?: string
}

/** The runtime itself and the page bundles spliced in behind it, in order. */
const LAZY_BUNDLE = /(?:^|\s)data-stx-(?:runtime|messages|modules|stores|composables|component-factories)(?=[\s=]|$)/i
/** Scripts that belong to the document and never reach for the runtime. */
const STANDALONE = /(?:^|\s)data-stx-(?:router|owned-routes|offline|color-mode-boot|appearance-bootstrap|events|lazy-runtime)(?=[\s=]|$)/i
/** An eager component's setup: its root is bound as the page loads. */
const EAGER_COMPONENT = /(?:^|\s)data-stx-(?:owner|instance)(?=[\s=]|$)/i
const ISLAND_TYPE = /(?:^|\s)type\s*=\s*(?:"stx\/island"|'stx\/island'|stx\/island)(?=[\s>]|$)/i
const SCRIPT_TYPE = /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
const HAS_SRC = /(?:^|\s)src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module'])
/**
 * An attribute the runtime binds: `:name`, `@event`, `x-data`, `x-cloak`, a
 * page setup marker or a suspense boundary. Tested against a tag's attributes
 * with their quoted values blanked, so a class or an alt text cannot match.
 */
const REACTIVE_ATTRIBUTE = /(?:^|\s)(?:[:@][a-z][\w.:-]*|x-data|x-cloak|data-stx|data-stx-auto|data-stx-suspense)(?=[\s=]|$)/i
const QUOTED = /"[^"]*"|'[^']*'/g
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

/** `<template>` subtrees: inert content the browser does not run or bind. */
function templateRanges(html: string): [number, number][] {
  const ranges: [number, number][] = []
  let depth = 0
  let start = 0
  for (const match of html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->|<\/?template\b[^>]*>/gi)) {
    if (!/^<\/?template\b/i.test(match[0])) continue
    if (match[0].startsWith('</')) {
      if (depth > 0 && --depth === 0) ranges.push([start, match.index! + match[0].length])
    }
    else if (depth++ === 0) start = match.index!
  }
  if (depth > 0) ranges.push([start, html.length])
  return ranges
}

/**
 * Where each island's subtree starts and ends, and whether any reactive
 * markup sits outside all of them. One pass over the tags: an island is its
 * root element (the one carrying `stx-hydrate`) through its matching close.
 */
function scanIslands(html: string): { ranges: [number, number][], reactiveOutside: string } {
  const ranges: [number, number][] = []
  let reactiveOutside = ''
  let island = ''
  let depth = 0
  let start = 0
  for (const tag of scanHtmlTags(html)) {
    const name = tag.name.toLowerCase()
    if (island) {
      if (name !== island) continue
      if (tag.closing) {
        if (--depth === 0) {
          ranges.push([start, tag.end])
          island = ''
        }
      }
      else if (!tag.selfClosing) {
        depth++
      }
      continue
    }
    if (tag.closing || name === 'script' || name === 'style') continue
    const names = tag.attributes.replace(QUOTED, '""')
    if (/(?:^|\s)stx-hydrate(?=[\s=]|$)/i.test(names)) {
      if (!tag.selfClosing && !VOID.has(name)) {
        island = name
        depth = 1
        start = tag.start
      }
      continue
    }
    // `<body data-stx-auto>` is the stamp signal processing leaves on any page
    // whose template has signal syntax and no `<script setup>`, and the
    // island's own markup is enough to earn it. It asks the runtime to bind
    // the body's reactive markup, so it means something only where there is
    // reactive markup outside the islands - which this scan finds in the
    // elements themselves. Counted as reactive, it kept every server-rendered
    // page with an island from qualifying.
    const own = name === 'body' ? names.replace(/(?:^|\s)data-stx-auto(?=[\s=]|$)(?:\s*=\s*"")?/gi, ' ') : names
    if (!reactiveOutside && REACTIVE_ATTRIBUTE.test(own)) reactiveOutside = html.slice(tag.start, Math.min(tag.end, tag.start + 160))
  }
  // An unclosed island owns the rest of the document.
  if (island) ranges.push([start, html.length])
  return { ranges, reactiveOutside }
}

/**
 * The loader, written for every browser the runtime itself supports. It holds
 * no reference to `window.stx`: a page that never triggers an island never
 * learns the runtime exists.
 */
export const LAZY_ISLAND_RUNTIME_LOADER = `(function(){var d=document,w=window,started=0,pending=null,replay=null;
function each(l,f){Array.prototype.forEach.call(l,f)}
function load(){var q=Array.prototype.slice.call(d.querySelectorAll('script[type="stx/lazy"]')),i=0;(function next(){var t=q[i++];if(!t){boot();return}if(t.hasAttribute('data-stx-runtime')&&w.stx){t.parentNode.removeChild(t);next();return}var s=d.createElement('script'),a=t.attributes,k;for(k=0;k<a.length;k++){if(a[k].name!=='type'&&a[k].name!=='data-stx-lazy-src')s.setAttribute(a[k].name,a[k].value)}s.async=false;s.onload=next;s.onerror=function(){console.error('[stx] lazy runtime script failed to load:',s.src);next()};s.src=t.getAttribute('data-stx-lazy-src');t.parentNode.replaceChild(s,t)})()}
function boot(){if(typeof w.__stxDomReadyHandler==='function'){try{w.__stxDomReadyHandler()}catch(e){console.error('[stx] lazy runtime failed to start',e)}}var el=pending,tries=0;if(!el)return;(function wake(){if(el.__stx_hydrated)return;if(el.__stx_hydration_scheduled){el.dispatchEvent(new Event('mouseenter'));return}if(tries++<150)setTimeout(wake,20)})()}
function start(el,ev){if(ev&&ev.type==='click'){ev.preventDefault();ev.stopPropagation();replay=[el,ev.target]}if(started)return;started=1;pending=el;if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',load);else load()}
w.addEventListener('stx:hydrated',function(e){if(e.detail&&e.detail.el)e.detail.el.__stx_lazy_ready=1;var r=replay;if(!r||!e.detail||e.detail.el!==r[0])return;replay=null;setTimeout(function(){if(r[1]&&r[1].isConnected!==false&&typeof r[1].click==='function')r[1].click()},0)});
function arm(el){if(el.__stx_lazy_armed)return;el.__stx_lazy_armed=1;var t=el.getAttribute('stx-hydrate')||'idle',go=function(ev){start(el,ev)};
el.addEventListener('click',function(ev){if(!el.__stx_lazy_ready)go(ev)},true);
if(t==='interaction'){each(['mouseenter','focusin','touchstart'],function(n){el.addEventListener(n,function(){if(!el.__stx_hydrated)go()},{once:true,passive:true})})}
else if(t==='visible'){if(typeof IntersectionObserver==='function'){var io=new IntersectionObserver(function(es){each(es,function(e){if(e.isIntersecting){io.disconnect();go()}})},{rootMargin:'50px'});io.observe(el)}else go()}
else if(t==='idle'){if(typeof requestIdleCallback==='function')requestIdleCallback(function(){go()},{timeout:2000});else setTimeout(function(){go()},200)}
else if(t.indexOf('media:')===0){var m=w.matchMedia(t.slice(6));if(m.matches)go();else{var h=function(e){if(e.matches){m.removeEventListener('change',h);go()}};m.addEventListener('change',h)}}
else go()}
function init(){each(d.querySelectorAll('[stx-hydrate]'),arm)}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init()})();`

/**
 * Make the runtime and its bundles wait for the first island trigger, when
 * islands are the only reactive content the document has.
 */
export function lazyIslandRuntime(html: string, basePath = '/_stx'): LazyIslandRuntimeResult {
  const untouched: LazyIslandRuntimeResult = { html, assets: [], bytesInlined: 0, applied: false }
  if (!html.includes('stx/island') || !html.includes('data-stx-runtime') || html.includes('data-stx-lazy-runtime'))
    return untouched

  const templates = templateRanges(html)
  const inTemplate = (index: number) => templates.some(([start, end]) => index >= start && index < end)
  const scan = scanIslands(html)
  if (scan.reactiveOutside) return { ...untouched, reason: `reactive markup outside every island: ${scan.reactiveOutside}` }
  const inIsland = (index: number) => scan.ranges.some(([start, end]) => index >= start && index < end)
  const lazy: { start: number, end: number, attrs: string, body: string }[] = []
  let islands = 0
  let runtime = false

  for (const script of scanHtmlScriptElements(html)) {
    if (inTemplate(script.start)) continue
    const attrs = script.attrs
    const body = html.slice(script.bodyStart, script.bodyEnd)
    if (ISLAND_TYPE.test(attrs)) {
      islands++
      continue
    }
    const type = SCRIPT_TYPE.exec(attrs)
    // Data blocks and other non-script types are never run by the browser.
    if (type && !JS_TYPES.has((type[1] ?? type[2] ?? type[3] ?? '').toLowerCase().trim())) continue
    if (LAZY_BUNDLE.test(attrs)) {
      // A module bundle cannot be re-created in order by the loader.
      if (type && (type[1] ?? type[2] ?? type[3] ?? '').toLowerCase().trim() === 'module') return { ...untouched, reason: 'a runtime bundle is a module script' }
      if (/(?:^|\s)data-stx-runtime(?=[\s=]|$)/i.test(attrs)) runtime = true
      lazy.push({ start: script.start, end: script.end, attrs, body })
      continue
    }
    if (EAGER_COMPONENT.test(attrs)) {
      // A component nested in an island is set up with it: its script waits
      // for the runtime in its written place. Anywhere else it is eager.
      if (!inIsland(script.start) || HAS_SRC.test(attrs)) return { ...untouched, reason: `an eager component script outside every island: <script${attrs.slice(0, 140)}>` }
      lazy.push({ start: script.start, end: script.end, attrs, body })
      continue
    }
    if (HAS_SRC.test(attrs)) continue
    if (STANDALONE.test(attrs) && !outputNeedsSignalsRuntime(body)) continue
    if (outputNeedsSignalsRuntime(body)) return { ...untouched, reason: `a page script that reaches for the runtime: <script${attrs.slice(0, 140)}>` }
  }

  if (!islands || !runtime)
    return untouched

  const assets: ExternalizeHtmlResult['assets'] = []
  const seen = new Set<string>()
  let bytesInlined = 0
  let output = ''
  let cursor = 0
  for (const script of lazy) {
    let attrs = script.attrs
    let src = HAS_SRC.exec(attrs)
    let url = src ? (src[1] ?? src[2] ?? src[3] ?? '') : ''
    if (src) {
      attrs = attrs.replace(HAS_SRC, '')
    }
    else {
      // An inline bundle becomes a content-addressed asset: the loader runs
      // scripts by URL, in order, without evaluating strings.
      const filename = `modules.${createHash('sha256').update(script.body).digest('hex').slice(0, 16)}.js`
      if (!seen.has(filename)) {
        seen.add(filename)
        assets.push({ filename, contents: script.body, contentType: 'text/javascript; charset=utf-8' })
      }
      bytesInlined += script.body.length
      url = `${basePath}/${filename}`
      src = null
    }
    attrs = attrs.replace(/(?:^|\s)(?:async|defer)(?=[\s=]|$)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '').replace(SCRIPT_TYPE, '')
    output += `${html.slice(cursor, script.start)}<script type="stx/lazy" data-stx-lazy-src="${url}"${attrs.trimEnd() ? ` ${attrs.trim()}` : ''}></script>`
    cursor = script.end
  }
  output += html.slice(cursor)
  output = insertBeforeBodyClose(output, `<script data-stx-lazy-runtime>${LAZY_ISLAND_RUNTIME_LOADER}</script>`)
  return { html: output, assets, bytesInlined, applied: true }
}
