import { describe, expect, test } from 'bun:test'
import {
  getStxAttributeCompletionContext,
  getStxAttributeAtOffset,
  getStxAttributeDefinition,
  getStxDirectiveAtOffset,
  STX_ATTRIBUTE_DIRECTIVES,
  STX_DIRECTIVES,
  STX_DIRECTIVE_PAIRS,
  STX_OPENING_DIRECTIVE_BY_CLOSE,
  stxSnippetPreview,
} from '../src/language-features'

describe('shared stx language catalog', () => {
  test('keeps directive names unique', () => {
    const names = STX_DIRECTIVES.map(directive => directive.name)
    expect(new Set(names).size).toBe(names.length)
  })

  test('describes every block closing directive', () => {
    const names = new Set(STX_DIRECTIVES.map(directive => directive.name))
    for (const closing of Object.values(STX_DIRECTIVE_PAIRS))
      expect(names.has(closing)).toBe(true)
  })

  test('provides a lossless reverse block lookup', () => {
    for (const [opening, closing] of Object.entries(STX_DIRECTIVE_PAIRS))
      expect(STX_OPENING_DIRECTIVE_BY_CLOSE.get(closing)).toBe(opening)
  })

  test('covers current async, rendering, and document directives', () => {
    const names = new Set(STX_DIRECTIVES.map(directive => directive.name))
    for (const name of [
      'errorBoundary',
      'suspense',
      'async',
      'defer',
      'teleport',
      'keepAlive',
      'virtualList',
      'virtualGrid',
      'infiniteList',
      'client:visible',
      'static',
      'stream',
      'memo',
      'head',
      'seo',
      'structuredData',
      'csp',
    ])
      expect(names.has(name)).toBe(true)
  })

  test('finds the directive under the cursor, including colon strategies', () => {
    expect(getStxDirectiveAtOffset('@if(user)', 2)?.name).toBe('if')
    expect(getStxDirectiveAtOffset('  @client:visible', 12)?.name).toBe('client:visible')
    expect(getStxDirectiveAtOffset('@if(user) text @endif', 12)).toBeUndefined()
    expect(getStxDirectiveAtOffset('@if(user) text @endif', 19)?.name).toBe('endif')
  })

  test('keeps reactive attribute names unique', () => {
    const names = STX_ATTRIBUTE_DIRECTIVES.map(directive => directive.name)
    expect(new Set(names).size).toBe(names.length)
    expect(names).toEqual(expect.arrayContaining([
      ':if',
      ':for',
      'v-if',
      'v-memo',
      'x-if',
      'x-for',
      'x-text',
      '@click',
      'stx-hydrate',
    ]))
  })

  test('detects attribute completion in single and multiline opening tags', () => {
    expect(getStxAttributeCompletionContext('<button @cl')).toEqual({ prefix: '@cl' })
    expect(getStxAttributeCompletionContext('<div\n  class="card"\n  :fo')).toEqual({ prefix: ':fo' })
    expect(getStxAttributeCompletionContext('<section x-')).toEqual({ prefix: 'x-' })
  })

  test('does not confuse statements, values, or closed tags with attributes', () => {
    expect(getStxAttributeCompletionContext('@if(user)')).toBeUndefined()
    expect(getStxAttributeCompletionContext('<div title="@click')).toBeUndefined()
    expect(getStxAttributeCompletionContext('<div> @cl')).toBeUndefined()
    expect(getStxAttributeCompletionContext('</div @cl')).toBeUndefined()
    expect(getStxAttributeCompletionContext('if (left < right) @cl')).toBeUndefined()
  })

  test('finds reactive attributes and resolves modifiers', () => {
    const source = '<button\n  :if="ready"\n  @click.prevent="save()">Save</button>'
    expect(getStxAttributeAtOffset(source, source.indexOf(':if') + 2)?.name).toBe(':if')
    expect(getStxAttributeAtOffset(source, source.indexOf('@click') + 4)?.name).toBe('@click.prevent')
    expect(getStxAttributeDefinition('@click.prevent')?.name).toBe('@click')
    expect(getStxAttributeDefinition('x-bind:aria-label')?.name).toBe('x-bind:')
    expect(getStxAttributeAtOffset('<p>@click</p>', 5)).toBeUndefined()
  })

  test('renders snippets as readable documentation', () => {
    expect(stxSnippetPreview(':if="${1:condition}"')).toBe(':if="condition"')
    expect(stxSnippetPreview('@if(${1:condition})\n\t${2}\n@endif')).toBe('@if(condition)\n\t\n@endif')
    expect(stxSnippetPreview('${1|visible,idle|}')).toBe('visible')
  })
})
