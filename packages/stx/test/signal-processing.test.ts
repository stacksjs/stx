/**
 * Tests for signal-processing loop-expression parser & `@foreach` → `@for`
 * attribute conversion.
 *
 * Regression focus: `@foreach(items as idx => item)` must NOT be converted to a
 * client-side `@for` attribute when `items` is server-side data. Before the
 * fix, the regex only recognized `items as item` and `items as item, idx`, so
 * `idx => item` and `(item, idx)` variants fell through to client-side
 * conversion even though the iterable was server data.
 */

import { describe, expect, it } from 'bun:test'
import { convertSignalLoopsToAttributes, parseLoopExpression } from '../src/signal-processing'

describe('parseLoopExpression', () => {
  it('parses Blade-style "items as item"', () => {
    expect(parseLoopExpression('items as item')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: null,
    })
  })

  it('parses Blade-style "items as idx => item"', () => {
    expect(parseLoopExpression('items as idx => item')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses Blade-style "items as item, idx"', () => {
    expect(parseLoopExpression('items as item, idx')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses Blade-style "items as (item, idx)"', () => {
    expect(parseLoopExpression('items as (item, idx)')).toEqual({
      style: 'as', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses Blade-style "obj.list as item"', () => {
    expect(parseLoopExpression('obj.list as item')).toEqual({
      style: 'as', iterable: 'obj.list', itemVar: 'item', indexVar: null,
    })
  })

  it('parses JS-style "item in items"', () => {
    expect(parseLoopExpression('item in items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: null,
    })
  })

  it('parses JS-style "(item, idx) in items"', () => {
    expect(parseLoopExpression('(item, idx) in items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('parses JS-style "item of items"', () => {
    expect(parseLoopExpression('item of items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: null,
    })
  })

  it('parses comma-form in JS style: "item, idx in items"', () => {
    expect(parseLoopExpression('item, idx in items')).toEqual({
      style: 'in', iterable: 'items', itemVar: 'item', indexVar: 'idx',
    })
  })

  it('returns unknown for malformed input', () => {
    const parsed = parseLoopExpression('<<<garbage>>>')
    expect(parsed.style).toBe('unknown')
    expect(parsed.iterable).toBeNull()
  })
})

describe('convertSignalLoopsToAttributes — server-data detection', () => {
  it('leaves server-data @foreach alone with "as item" syntax', () => {
    const input = `
      @foreach(items as item)
        <div>{{ item.name }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [{ name: 'a' }] })
    // When the iterable is server data, signal-processing should NOT convert
    // to a client-side @for attribute — processLoops runs server-side instead.
    expect(output).toContain('@foreach(items as item)')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('leaves server-data @foreach alone with "as idx => item" syntax', () => {
    // This is the regression: previously the regex didn't recognize
    // `idx => item`, so convertSignalLoops would hoist it to client-side
    // even when `items` was in the server context.
    const input = `
      @foreach(items as idx => item)
        <div>{{ idx }}: {{ item.name }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [{ name: 'a' }] })
    expect(output).toContain('@foreach(items as idx => item)')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('leaves server-data @foreach alone with "as (item, idx)" syntax', () => {
    const input = `
      @foreach(items as (item, idx))
        <p>{{ idx }}</p>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [] })
    expect(output).toContain('@foreach(items as (item, idx))')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('leaves server-data @foreach alone with "as item, idx" syntax', () => {
    const input = `
      @foreach(items as item, idx)
        <p>{{ idx }}</p>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { items: [] })
    expect(output).toContain('@foreach(items as item, idx)')
    expect(output).not.toMatch(/@for\s*=/)
  })

  it('converts client-data @foreach into @for attribute (idx => item form)', () => {
    // When the iterable is NOT in context, signal-processing legitimately
    // converts to client-side @for. The converted expression must use JS-style
    // `(item, idx) in items` form so bindFor can parse it.
    const input = `
      @foreach(clientList as idx => item)
        <div>{{ item }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, {})
    expect(output).toMatch(/@for\s*=\s*"\(item, idx\) in clientList"/)
  })

  it('converts client-data @foreach into @for attribute (single-var form)', () => {
    const input = `
      @foreach(clientList as item)
        <div>{{ item }}</div>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, {})
    expect(output).toMatch(/@for\s*=\s*"item in clientList"/)
  })

  it('handles nested @foreach where outer is server + inner is client', () => {
    const input = `
      @foreach(serverItems as item)
        @foreach(clientSub as subItem)
          <span>{{ subItem }}</span>
        @endforeach
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { serverItems: [] })
    // Outer left alone
    expect(output).toContain('@foreach(serverItems as item)')
    // Inner converted
    expect(output).toMatch(/@for\s*=\s*"subItem in clientSub"/)
  })

  it('respects deep property access for server-data detection', () => {
    // Should use the root variable name for the context check.
    const input = `
      @foreach(state.users as idx => user)
        <p>{{ user.name }}</p>
      @endforeach
    `
    const output = convertSignalLoopsToAttributes(input, { state: { users: [] } })
    expect(output).toContain('@foreach(state.users as idx => user)')
    expect(output).not.toMatch(/@for\s*=/)
  })
})
