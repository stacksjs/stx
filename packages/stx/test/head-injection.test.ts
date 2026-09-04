/**
 * Head fragments share one rebuild (stacksjs/stx#1945).
 *
 * Each pass that adds something small to a finished page's head used to splice
 * it in itself, and a splice is a copy of the whole document: 212KB allocated
 * to insert a few hundred bytes, once per pass. Measuring the top-level
 * pipeline of one render found 86 assignments of which only ten produced a new
 * string, and six of those were whole-document copies made for a small
 * insertion. Collecting the fragments and applying them together removes one
 * such copy per pass after the first.
 *
 * The property that must survive is placement: these exist to be live before
 * first paint, and a fragment that lands in the wrong half of the head, or
 * ahead of the charset declaration, is worse than one that costs a copy.
 */

import { describe, expect, it } from 'bun:test'
import { applyHeadInjections, createHeadInjections, hasHeadInjections } from '../src/head-injection'

const PAGE = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>t</title></head><body><p>x</p></body></html>'

describe('head injections', () => {
  it('returns the very same string when nothing was contributed', () => {
    // Not an equal string -- the same one. A page needing no injections must
    // not be rebuilt, which is the whole point.
    const injections = createHeadInjections()
    const out = applyHeadInjections(PAGE, injections)
    expect(Object.is(out, PAGE)).toBe(true)
    expect(hasHeadInjections(injections)).toBe(false)
  })

  it('puts each fragment at its own anchor in one pass', () => {
    const injections = createHeadInjections()
    injections.afterOpen.push('<meta name="a">')
    injections.beforeClose.push('<style>b{}</style>')
    const out = applyHeadInjections(PAGE, injections)

    const head = out.slice(out.indexOf('<head'), out.indexOf('</head>'))
    expect(head).toContain('<meta name="a">')
    expect(head).toContain('<style>b{}</style>')
    // afterOpen precedes the original head content, beforeClose follows it.
    expect(head.indexOf('<meta name="a">')).toBeLessThan(head.indexOf('<title>'))
    expect(head.indexOf('<style>b{}</style>')).toBeGreaterThan(head.indexOf('<title>'))
  })

  it('keeps push order within an anchor', () => {
    const injections = createHeadInjections()
    injections.beforeClose.push('<!--first-->', '<!--second-->')
    const out = applyHeadInjections(PAGE, injections)
    expect(out.indexOf('<!--first-->')).toBeLessThan(out.indexOf('<!--second-->'))
  })

  it('handles a contribution to only one anchor', () => {
    const onlyOpen = createHeadInjections()
    onlyOpen.afterOpen.push('<meta name="o">')
    expect(applyHeadInjections(PAGE, onlyOpen)).toContain('<head><meta name="o">')

    const onlyClose = createHeadInjections()
    onlyClose.beforeClose.push('<meta name="c">')
    expect(applyHeadInjections(PAGE, onlyClose)).toContain('<meta name="c"></head>')
  })

  it('leaves a document with no head alone', () => {
    // An SPA fragment has nowhere to put these and carries the same
    // information in response headers instead; it is not an error.
    const fragment = '<main><p>just content</p></main>'
    const injections = createHeadInjections()
    injections.afterOpen.push('<meta name="a">')
    injections.beforeClose.push('<meta name="b">')
    expect(Object.is(applyHeadInjections(fragment, injections), fragment)).toBe(true)
  })

  it('finds the head when it carries attributes', () => {
    const withAttrs = '<html><head lang="en" data-x><title>t</title></head><body></body></html>'
    const injections = createHeadInjections()
    injections.afterOpen.push('<meta name="a">')
    expect(applyHeadInjections(withAttrs, injections)).toContain('data-x><meta name="a">')
  })
})
