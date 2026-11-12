/**
 * Type hints, before anything is drawn: which word is under a point, which
 * call the caret is in, and how an answer is cut up for display.
 */
import { describe, expect, it } from 'bun:test'
import { callContext, hoverPlainText, parseHoverContent, signatureParts, wordAt } from '../../src/ui/code-editor/core'

describe('the word at a column', () => {
  const line = 'const total = add(first, $second)'

  it('is the whole word, whichever of its characters is pointed at', () => {
    expect(wordAt(line, 6)).toEqual({ from: 6, to: 11, word: 'total' })
    expect(wordAt(line, 8)).toEqual({ from: 6, to: 11, word: 'total' })
    expect(wordAt(line, 10)).toEqual({ from: 6, to: 11, word: 'total' })
  })

  it('is nothing on a space, an operator or a bracket', () => {
    expect(wordAt(line, 5)).toBeNull()
    expect(wordAt(line, 12)).toBeNull()
    expect(wordAt(line, 17)).toBeNull()
  })

  it('is nothing past the end of the line', () => {
    expect(wordAt(line, line.length)).toBeNull()
    expect(wordAt(line, 99)).toBeNull()
    expect(wordAt(line, -1)).toBeNull()
  })

  it('counts the position just after a word only when asked, which is where a caret rests', () => {
    expect(wordAt(line, 11)).toBeNull()
    expect(wordAt(line, 11, true)).toEqual({ from: 6, to: 11, word: 'total' })
    expect(wordAt('add', 3, true)).toEqual({ from: 0, to: 3, word: 'add' })
    expect(wordAt('a  b', 2, true)).toBeNull()
  })

  it('takes a dollar sign, an underscore and a letter with an accent as part of a word', () => {
    expect(wordAt(line, 26)?.word).toBe('$second')
    expect(wordAt('_privé = 1', 3)?.word).toBe('_privé')
  })
})

describe('hover content', () => {
  it('is a code block for each fence and text for what lies between', () => {
    expect(parseHoverContent('```ts\nconst total: number\n```\nThe sum of both.\n\nSee `add`.')).toEqual([
      { kind: 'code', language: 'ts', text: 'const total: number' },
      { kind: 'text', language: '', text: 'The sum of both.\n\nSee `add`.' },
    ])
  })

  it('keeps a signature that runs over several lines whole', () => {
    const [block] = parseHoverContent('```typescript\nfunction add(\n  a: number,\n  b: number,\n): number\n```')

    expect(block).toEqual({ kind: 'code', language: 'typescript', text: 'function add(\n  a: number,\n  b: number,\n): number' })
  })

  it('takes a fence that names no language, and one drawn with tildes', () => {
    expect(parseHoverContent('```\nplain\n```')).toEqual([{ kind: 'code', language: '', text: 'plain' }])
    expect(parseHoverContent('~~~js\nlet a\n~~~')).toEqual([{ kind: 'code', language: 'js', text: 'let a' }])
  })

  it('is one piece of text when there is no fence at all', () => {
    expect(parseHoverContent('const total: number')).toEqual([{ kind: 'text', language: '', text: 'const total: number' }])
  })

  it('is nothing when there is nothing to say', () => {
    expect(parseHoverContent('')).toEqual([])
    expect(parseHoverContent('  \n\n')).toEqual([])
    expect(parseHoverContent('```ts\n```')).toEqual([])
  })

  it('reads Windows line endings as line endings', () => {
    expect(parseHoverContent('```ts\r\nlet a\r\n```\r\nNote.')).toEqual([
      { kind: 'code', language: 'ts', text: 'let a' },
      { kind: 'text', language: '', text: 'Note.' },
    ])
  })

  it('is one line of plain words for a screen reader', () => {
    expect(hoverPlainText('```ts\nfunction add(\n  a: number,\n): number\n```\nAdds.\n\nTwice.')).toBe('function add( a: number, ): number. Adds. Twice.')
  })
})

describe('the call the caret is in', () => {
  it('is the nearest unclosed parenthesis, at its first argument', () => {
    expect(callContext('const x = add(')).toEqual({ open: 13, active: 0 })
  })

  it('counts the commas typed so far', () => {
    expect(callContext('add(1, 2, ')).toEqual({ open: 3, active: 2 })
  })

  it('is the inner call when one is nested in another', () => {
    expect(callContext('add(1, mul(2, 3, ')).toEqual({ open: 10, active: 2 })
  })

  it('goes back to the outer call once the inner one is closed', () => {
    expect(callContext('add(mul(2, 3), ')).toEqual({ open: 3, active: 1 })
  })

  it('does not count a comma inside an array or an object argument', () => {
    expect(callContext('add([1, 2, 3], { a: 1, b: 2 }, ')).toEqual({ open: 3, active: 2 })
    expect(callContext('add({ a: 1, ')).toEqual({ open: 3, active: 0 })
  })

  it('does not count a comma or a bracket inside a string', () => {
    expect(callContext('log("a, b (c", ')).toEqual({ open: 3, active: 1 })
    expect(callContext('log(\'it\\\'s, fine\', `x, ${y}`, ')).toEqual({ open: 3, active: 2 })
  })

  it('does not count what a comment holds', () => {
    expect(callContext('add(1, // one, two (\n')).toEqual({ open: 3, active: 1 })
    expect(callContext('add(/* a, b */ 1, ')).toEqual({ open: 3, active: 1 })
  })

  it('is nothing outside any call', () => {
    expect(callContext('const x = 1')).toBeNull()
    expect(callContext('add(1, 2)')).toBeNull()
    expect(callContext('')).toBeNull()
  })

  it('is nothing inside a string, where no argument is being written', () => {
    expect(callContext('add("one, ')).toBeNull()
  })

  it('is nothing in a block that follows a closed parenthesis', () => {
    expect(callContext('if (ready) {\n  total')).toBeNull()
    expect(callContext('function add(a, b) {\n  return a, ')).toBeNull()
  })

  it('still finds the call from inside a callback passed to it', () => {
    expect(callContext('items.map((item) => {\n  return item')).toEqual({ open: 9, active: 0 })
  })

  it('ignores a closer whose opener came before the text began', () => {
    expect(callContext(') + add(1, ')).toEqual({ open: 7, active: 1 })
  })
})

describe('a signature, cut around its active parameter', () => {
  const label = 'add(a: number, b: number): number'

  it('marks the parameter by its text', () => {
    expect(signatureParts({ label, parameters: ['a: number', 'b: number'], active: 1 })).toEqual({
      before: 'add(a: number, ',
      active: 'b: number',
      after: '): number',
      parameterDocumentation: '',
    })
  })

  it('marks the first one when no active parameter is given', () => {
    expect(signatureParts({ label, parameters: ['a: number', 'b: number'] }).active).toBe('a: number')
  })

  it('takes a parameter given as offsets into the label, as a language server may', () => {
    expect(signatureParts({ label, parameters: [[4, 13], [15, 24]], active: 1 }).active).toBe('b: number')
  })

  it('tells two parameters with the same text apart by their order', () => {
    const parts = signatureParts({ label: 'pair(value, value)', parameters: ['value', 'value'], active: 1 })

    expect(parts.before).toBe('pair(value, ')
    expect(parts.active).toBe('value')
    expect(parts.after).toBe(')')
  })

  it('carries what the active parameter says about itself', () => {
    const parts = signatureParts({ label, parameters: [{ label: 'a: number', documentation: 'The first.' }, { label: [15, 24], documentation: 'The second.' }], active: 1 })

    expect(parts.active).toBe('b: number')
    expect(parts.parameterDocumentation).toBe('The second.')
  })

  it('marks nothing past the last parameter, and nothing it cannot find', () => {
    expect(signatureParts({ label, parameters: ['a: number', 'b: number'], active: 2 })).toEqual({ before: label, active: '', after: '', parameterDocumentation: '' })
    expect(signatureParts({ label, parameters: ['nope'], active: 0 }).active).toBe('')
    expect(signatureParts({ label }).before).toBe(label)
  })

  it('keeps offsets that run off the label inside it', () => {
    expect(signatureParts({ label: 'f(a)', parameters: [[2, 99]], active: 0 })).toMatchObject({ before: 'f(', active: 'a)', after: '' })
  })
})
