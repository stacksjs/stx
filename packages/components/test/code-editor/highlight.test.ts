/**
 * Highlighting redoes only what a change could have affected.
 *
 * Tested mostly against a tokenizer small enough to hold in your head: it
 * knows one thing, block comments, which is the one thing that makes a line's
 * tokens depend on the lines above it. Every call is counted, because the
 * claim under test is about how much work is done, not only about the answer.
 */
import type { LineTokenizer } from '../../src/ui/code-editor/core'
import { describe, expect, test } from 'bun:test'
import { EditorCore, LineHighlighter } from '../../src/ui/code-editor/core'
import { createLanguageTokenizer, tokenizerStateKey } from '../../src/ui/code-editor/tokenizer'

type CommentState = 'code' | 'comment'

function countingTokenizer(): LineTokenizer<CommentState> & { calls: string[] } {
  const calls: string[] = []

  return {
    calls,
    initialState: () => 'code',
    stateKey: state => state,
    tokenizeLine(text, start) {
      calls.push(text)
      const tokens = []
      let state = start
      let rest = text

      while (rest !== '') {
        const marker = state === 'code' ? '/*' : '*/'
        const at = rest.indexOf(marker)
        if (at === -1) {
          tokens.push({ type: state === 'code' ? '' : 'comment', content: rest })
          break
        }

        const end = state === 'code' ? at : at + 2
        if (end > 0)
          tokens.push({ type: state === 'code' ? '' : 'comment', content: rest.slice(0, end) })
        rest = rest.slice(end)
        if (state === 'code') {
          tokens.push({ type: 'comment', content: '/*' })
          rest = rest.slice(2)
        }
        state = state === 'code' ? 'comment' : 'code'
      }

      return { tokens, endState: state }
    },
  }
}

/** An editor wired to a highlighter the way the view wires them. */
function wired(value: string) {
  const core = new EditorCore({ value })
  const tokenizer = countingTokenizer()
  const highlighter = new LineHighlighter(tokenizer, core.doc)
  core.subscribe((transaction) => {
    for (let index = transaction.changes.length - 1; index >= 0; index--)
      highlighter.applyChange(transaction.changes[index]!)
  })
  highlighter.update()
  tokenizer.calls.length = 0

  const types = (): string[] => Array.from({ length: core.doc.lineCount }, (_, index) =>
    highlighter.get(index)!.tokens.map(token => token.type || 'code').join(','))

  /** What a from-scratch tokenize of the current text gives, for comparison. */
  const fresh = (): string[] => {
    const scratch = new LineHighlighter(countingTokenizer(), core.doc)
    scratch.update()

    return Array.from({ length: core.doc.lineCount }, (_, index) =>
      scratch.get(index)!.tokens.map(token => token.type || 'code').join(','))
  }

  return { core, tokenizer, highlighter, types, fresh }
}

const FILE = Array.from({ length: 200 }, (_, index) => `const value${index} = ${index}`).join('\n')

describe('incremental highlighting', () => {
  test('typing in a line retokenizes that line and nothing else', () => {
    const { core, tokenizer, highlighter } = wired(FILE)
    const offset = core.doc.offsetAt({ line: 100, column: 5 })
    core.dispatch({ changes: [{ from: offset, to: offset, insert: 'x' }] })
    const pass = highlighter.update()

    expect(tokenizer.calls).toEqual([core.doc.line(100)])
    expect(pass).toEqual({ from: 100, to: 101, pending: false })
  })

  test('a new line retokenizes the two halves, not the two hundred below', () => {
    const { core, tokenizer, highlighter, types, fresh } = wired(FILE)
    const offset = core.doc.offsetAt({ line: 50, column: 5 })
    core.dispatch({ changes: [{ from: offset, to: offset, insert: '\n' }] })
    highlighter.update()

    expect(tokenizer.calls).toHaveLength(2)
    expect(core.doc.lineCount).toBe(201)
    expect(types()).toEqual(fresh())
  })

  test('deleting lines costs one line', () => {
    const { core, tokenizer, highlighter, types, fresh } = wired(FILE)
    const from = core.doc.offsetAt({ line: 10, column: 3 })
    const to = core.doc.offsetAt({ line: 40, column: 3 })
    core.dispatch({ changes: [{ from, to, insert: '' }] })
    highlighter.update()

    expect(tokenizer.calls).toHaveLength(1)
    expect(types()).toEqual(fresh())
  })

  test('opening a block comment runs down to where it closes, and stops', () => {
    const { core, tokenizer, highlighter, types, fresh } = wired('a\nb\nc\nd */ e\nf\ng')
    core.dispatch({ changes: [{ from: 0, to: 0, insert: '/* ' }] })
    highlighter.update()

    // Lines 0 to 3 changed colour. Line 4 is entered as code, as before.
    expect(tokenizer.calls).toHaveLength(4)
    expect(types()).toEqual(['comment,comment', 'comment', 'comment', 'comment,code', 'code', 'code'])
    expect(types()).toEqual(fresh())
  })

  test('closing it again puts everything back', () => {
    const { core, highlighter, types, fresh } = wired('/* a\nb\nc\nd')
    expect(types()).toEqual(['comment,comment', 'comment', 'comment', 'comment'])

    core.dispatch({ changes: [{ from: 4, to: 4, insert: ' */' }] })
    highlighter.update()

    expect(types()).toEqual(['comment,comment', 'code', 'code', 'code'])
    expect(types()).toEqual(fresh())
  })

  test('several edits before one update are all taken in', () => {
    const { core, highlighter, types, fresh } = wired(FILE)
    core.dispatch({ changes: [{ from: 0, to: 0, insert: '/*\n' }] })
    core.dispatch({ changes: [{ from: core.doc.offsetAt({ line: 120, column: 0 }), to: core.doc.offsetAt({ line: 120, column: 0 }), insert: '*/\n' }] })
    core.dispatch({ changes: [{ from: core.doc.offsetAt({ line: 60, column: 0 }), to: core.doc.offsetAt({ line: 70, column: 0 }), insert: '' }] })
    highlighter.update()

    expect(types()).toEqual(fresh())
  })

  test('a transaction of many changes is taken in as one', () => {
    const { core, highlighter, types, fresh } = wired('a\nb /* c\nd\ne */ f\ng')
    core.dispatch({
      changes: [
        { from: 0, to: 0, insert: '// ' },
        { from: core.doc.offsetAt({ line: 1, column: 2 }), to: core.doc.offsetAt({ line: 1, column: 4 }), insert: '' },
        { from: core.doc.offsetAt({ line: 4, column: 0 }), to: core.doc.offsetAt({ line: 4, column: 0 }), insert: '\n\n' },
      ],
    })
    highlighter.update()

    expect(types()).toEqual(fresh())
  })

  test('undo is highlighted like any other change', () => {
    const { core, highlighter, types, fresh } = wired('a\nb\nc */ d')
    core.dispatch({ changes: [{ from: 0, to: 0, insert: '/*' }] })
    highlighter.update()
    core.undo()
    highlighter.update()

    expect(types()).toEqual(['code', 'code', 'code'])
    expect(types()).toEqual(fresh())
  })

  test('agrees with a from-scratch tokenize through a run of random edits', () => {
    let seed = 11
    const random = (limit: number): number => {
      seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
      return seed % limit
    }
    const pieces = ['/*', '*/', '\n', 'x', '', ' */\n/* ', '\n\n', 'code /* c */ more']
    const { core, highlighter, types, fresh } = wired('one\ntwo /* three\nfour */ five\nsix')

    for (let step = 0; step < 300; step++) {
      const from = random(core.doc.length + 1)
      const to = Math.min(core.doc.length, from + random(8))
      core.dispatch({ changes: [{ from, to, insert: pieces[random(pieces.length)]! }] })
      if (random(3) > 0)
        highlighter.update()
      if (!highlighter.pending)
        expect(types()).toEqual(fresh())
    }

    highlighter.update()
    expect(types()).toEqual(fresh())
  })
})

describe('a budget', () => {
  test('the first pass does the screen and a little more, then says it is not finished', () => {
    const core = new EditorCore({ value: FILE })
    const tokenizer = countingTokenizer()
    const highlighter = new LineHighlighter(tokenizer, core.doc)
    const pass = highlighter.update({ through: 39, maxLines: 10 })

    expect(pass).toEqual({ from: 0, to: 50, pending: true })
    expect(highlighter.get(49)).not.toBeNull()
    expect(highlighter.get(50)).toBeNull()
    expect(highlighter.firstDirtyLine).toBe(50)
  })

  test('later passes pick up where the last one stopped, until done', () => {
    const core = new EditorCore({ value: FILE })
    const tokenizer = countingTokenizer()
    const highlighter = new LineHighlighter(tokenizer, core.doc)
    let passes = 0
    while (highlighter.update({ through: -1, maxLines: 64 }).pending)
      passes++

    expect(passes).toBe(3)
    expect(tokenizer.calls).toHaveLength(200)
    expect(highlighter.get(199)).not.toBeNull()
  })

  test('an edit above an unfinished pass does not lose the rest', () => {
    const core = new EditorCore({ value: FILE })
    const tokenizer = countingTokenizer()
    const highlighter = new LineHighlighter(tokenizer, core.doc)
    core.subscribe((transaction) => {
      for (let index = transaction.changes.length - 1; index >= 0; index--)
        highlighter.applyChange(transaction.changes[index]!)
    })
    highlighter.update({ through: 9, maxLines: 0 })
    core.dispatch({ changes: [{ from: 0, to: 0, insert: 'x\ny\n' }] })
    highlighter.update()

    expect(highlighter.pending).toBe(false)
    for (let index = 0; index < core.doc.lineCount; index++)
      expect(highlighter.get(index)!.text).toBe(core.doc.line(index))
  })

  test('a cascade cut short by the budget resumes, and still stops where it should', () => {
    const { core, tokenizer, highlighter, types, fresh } = wired(`${FILE}\n*/\n${FILE}`)
    core.dispatch({ changes: [{ from: 0, to: 0, insert: '/*' }] })
    const first = highlighter.update({ through: 0, maxLines: 20 })

    expect(first.pending).toBe(true)
    while (highlighter.update({ through: -1, maxLines: 50 }).pending) { /* until settled */ }

    // The comment closes at line 200. Nothing after 201 was looked at again.
    expect(tokenizer.calls).toHaveLength(201)
    expect(types()).toEqual(fresh())
  })

  test('a reset starts over, for a new language', () => {
    const { core, highlighter } = wired('/* a\nb')
    const other = countingTokenizer()
    highlighter.reset(other, core.doc)

    expect(highlighter.get(0)).toBeNull()
    highlighter.update()
    expect(other.calls).toHaveLength(2)
  })
})

describe('against the real highlighter', () => {
  test('tokens carry the classes a stylesheet colours, and rebuild the line', async () => {
    const tokenizer = (await createLanguageTokenizer('typescript'))!
    const text = 'const total: number = sum(1, "two") // note'
    const { tokens } = tokenizer.tokenizeLine(text, tokenizer.initialState())

    expect(tokens.map(token => token.content).join('')).toBe(text)
    expect(tokens.find(token => token.content === 'const')!.type).toBe('keyword')
    expect(tokens.find(token => token.content === '"two"')!.type).toBe('string')
    expect(tokens.find(token => token.content === '// note')!.type).toBe('comment')
    expect(tokens.find(token => token.content === 'sum')!.type).toBe('function')
  })

  test('neighbouring tokens of one class are merged into a run', async () => {
    const tokenizer = (await createLanguageTokenizer('typescript'))!
    const { tokens } = tokenizer.tokenizeLine('a b c', tokenizer.initialState())

    expect(tokens).toEqual([{ type: '', content: 'a b c' }])
  })

  test('a block comment carries across lines through the state', async () => {
    const tokenizer = (await createLanguageTokenizer('typescript'))!
    const first = tokenizer.tokenizeLine('/* open', tokenizer.initialState())
    const second = tokenizer.tokenizeLine('const stillComment = 1', first.endState)
    const third = tokenizer.tokenizeLine('*/ const code = 1', second.endState)

    expect(second.tokens).toEqual([{ type: 'comment', content: 'const stillComment = 1' }])
    expect(third.tokens.some(token => token.type === 'keyword')).toBe(true)
    expect(tokenizer.stateKey(tokenizer.initialState())).toBe('')
    expect(tokenizer.stateKey(first.endState)).not.toBe('')
    expect(tokenizer.stateKey(third.endState)).toBe('')
  })

  test('the state key tells an open comment from an open template string', async () => {
    const tokenizer = (await createLanguageTokenizer('typescript'))!
    const comment = tokenizer.tokenizeLine('/* a', tokenizer.initialState()).endState
    const again = tokenizer.tokenizeLine('/* b', tokenizer.initialState()).endState

    expect(tokenizerStateKey(comment)).toBe(tokenizerStateKey(again))
  })

  test('typing in a 2,000 line file retokenizes one line', async () => {
    const tokenizer = (await createLanguageTokenizer('typescript'))!
    let calls = 0
    const counted: typeof tokenizer = {
      ...tokenizer,
      tokenizeLine: (text, state) => {
        calls++
        return tokenizer.tokenizeLine(text, state)
      },
    }
    const core = new EditorCore({ value: Array.from({ length: 2000 }, (_, index) => `export const item${index}: number = compute(${index}, 'x') // n`).join('\n') })
    const highlighter = new LineHighlighter(counted, core.doc)
    core.subscribe((transaction) => {
      for (let index = transaction.changes.length - 1; index >= 0; index--)
        highlighter.applyChange(transaction.changes[index]!)
    })
    highlighter.update()
    expect(calls).toBe(2000)

    calls = 0
    const offset = core.doc.offsetAt({ line: 1000, column: 13 })
    core.syncInput(`${core.value.slice(0, offset)}z${core.value.slice(offset)}`, offset + 1, offset + 1)
    highlighter.update()

    expect(calls).toBe(1)
  })

  test('an unknown language has no tokenizer, rather than a wrong one', async () => {
    expect(await createLanguageTokenizer('no-such-language')).toBeNull()
  })

  test('a very long line is shown plain and does not disturb the state', async () => {
    const tokenizer = (await createLanguageTokenizer('typescript'))!
    const state = tokenizer.tokenizeLine('/* open', tokenizer.initialState()).endState
    const long = 'x'.repeat(20_000)
    const result = tokenizer.tokenizeLine(long, state)

    expect(result.tokens).toEqual([{ type: '', content: long }])
    expect(result.endState).toBe(state)
  })
})
