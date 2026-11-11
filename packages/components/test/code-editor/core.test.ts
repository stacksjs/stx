/**
 * The editor core, with no browser anywhere near it.
 *
 * That it can be tested like this is the design, not a convenience: the
 * document, the selection, the history and the commands hold no DOM, so what a
 * key does is a question about data.
 */
import { describe, expect, test } from 'bun:test'
import {
  createKeymap,
  defaultKeymap,
  EditorCore,
  handleTextInput,
  indentString,
  indentWidth,
  keyName,
  languageConfig,
  mapOffset,
  normalizeBinding,
  registerDefaultCommands,
  TextDocument,
} from '../../src/ui/code-editor/core'

/**
 * An editor from a picture of one: `|` is the caret, `[` and `]` a selection
 * (anchor first). `show()` draws the result the same way, so a test reads as
 * before and after.
 */
function editor(picture: string, options: ConstructorParameters<typeof EditorCore>[0] = {}): EditorCore {
  let clock = 0
  const caret = picture.indexOf('|')
  const open = picture.indexOf('[')
  const close = picture.indexOf(']')
  const value = picture.replace(/[|[\]]/g, '')
  const core = new EditorCore({ value, now: () => (clock += 10_000), ...options })
  registerDefaultCommands(core)

  if (caret !== -1)
    core.setSelection(caret)
  else if (open !== -1 && close !== -1)
    core.setSelection(open, close - 1)

  return core
}

function show(core: EditorCore): string {
  const { anchor, head } = core.main
  const text = core.value
  if (anchor === head)
    return `${text.slice(0, head)}|${text.slice(head)}`

  const from = Math.min(anchor, head)
  const to = Math.max(anchor, head)

  return `${text.slice(0, from)}[${text.slice(from, to)}]${text.slice(to)}`
}

/** Type characters the way the view does: the editor first, the field otherwise. */
function type(core: EditorCore, text: string): void {
  for (const character of text) {
    if (handleTextInput(core, character))
      continue

    const from = Math.min(core.main.anchor, core.main.head)
    const to = Math.max(core.main.anchor, core.main.head)
    const value = core.value
    core.syncInput(value.slice(0, from) + character + value.slice(to), from + 1, from + 1)
  }
}

describe('the document', () => {
  test('holds text as lines and gives it back unchanged', () => {
    const doc = new TextDocument('one\ntwo\n\nfour')

    expect(doc.lineCount).toBe(4)
    expect(doc.line(2)).toBe('')
    expect(doc.toString()).toBe('one\ntwo\n\nfour')
    expect(doc.length).toBe(13)
  })

  test('reads every line ending as one', () => {
    const doc = new TextDocument('a\r\nb\rc')

    expect(doc.toString()).toBe('a\nb\nc')
    expect(doc.lineCount).toBe(3)
  })

  test('converts offsets and positions both ways', () => {
    const doc = new TextDocument('one\ntwo\n\nfour')

    expect(doc.positionAt(0)).toEqual({ line: 0, column: 0 })
    expect(doc.positionAt(3)).toEqual({ line: 0, column: 3 })
    expect(doc.positionAt(4)).toEqual({ line: 1, column: 0 })
    expect(doc.positionAt(8)).toEqual({ line: 2, column: 0 })
    expect(doc.positionAt(13)).toEqual({ line: 3, column: 4 })

    for (let offset = 0; offset <= doc.length; offset++)
      expect(doc.offsetAt(doc.positionAt(offset))).toBe(offset)
  })

  test('clamps a position past the end of its line, and an offset past the document', () => {
    const doc = new TextDocument('ab\ncd')

    expect(doc.offsetAt({ line: 0, column: 99 })).toBe(2)
    expect(doc.offsetAt({ line: 99, column: 0 })).toBe(3)
    expect(doc.positionAt(999)).toEqual({ line: 1, column: 2 })
    expect(doc.positionAt(-5)).toEqual({ line: 0, column: 0 })
  })

  test('slices across lines', () => {
    const doc = new TextDocument('one\ntwo\nthree')

    expect(doc.slice(2, 9)).toBe('e\ntwo\nt')
    expect(doc.slice(4, 7)).toBe('two')
    expect(doc.slice(5, 5)).toBe('')
  })

  test('a replacement reports the lines it touched', () => {
    const doc = new TextDocument('one\ntwo\nthree')
    const change = doc.replace(2, 9, 'X\nY')

    expect(doc.toString()).toBe('onX\nYhree')
    expect(change).toMatchObject({ removed: 'e\ntwo\nt', fromLine: 0, removedLines: 3, insertedLines: 2 })
  })

  test('offsets stay right after an edit above them', () => {
    const doc = new TextDocument('a\nb\nc\nd')
    // Warm the table of line starts, then change a line before the end of it.
    expect(doc.positionAt(6)).toEqual({ line: 3, column: 0 })
    doc.replace(0, 1, 'longer')

    expect(doc.positionAt(11)).toEqual({ line: 3, column: 0 })
    expect(doc.lineInfo(3)).toMatchObject({ from: 11, to: 12, text: 'd' })
  })

  test('matches a plain string through a run of random edits', () => {
    let seed = 7
    const random = (limit: number): number => {
      seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
      return seed % limit
    }
    const pieces = ['a', 'bc', '\n', '  ', '{\n}', '', 'word\nword\n', '\n\n']
    const doc = new TextDocument('start\nmiddle\nend')
    let plain = doc.toString()

    for (let step = 0; step < 400; step++) {
      const from = random(plain.length + 1)
      const to = Math.min(plain.length, from + random(6))
      const insert = pieces[random(pieces.length)]!
      doc.replace(from, to, insert)
      plain = plain.slice(0, from) + insert + plain.slice(to)

      expect(doc.toString()).toBe(plain)
      expect(doc.length).toBe(plain.length)
      const probe = random(plain.length + 1)
      const position = doc.positionAt(probe)
      expect(plain.split('\n')[position.line]!.length).toBeGreaterThanOrEqual(position.column)
      expect(doc.offsetAt(position)).toBe(probe)
    }
  })
})

describe('indentation arithmetic', () => {
  test('a tab advances to the next stop, not by a fixed amount', () => {
    expect(indentWidth('\t', 4)).toBe(4)
    expect(indentWidth('  \t', 4)).toBe(4)
    expect(indentWidth('    \t ', 4)).toBe(9)
  })

  test('writes a width as spaces or as tabs with the remainder in spaces', () => {
    expect(indentString(4, 2, true)).toBe('    ')
    expect(indentString(5, 4, false)).toBe('\t ')
    expect(indentString(0, 2, true)).toBe('')
  })
})

describe('selection mapping', () => {
  const insertAt = (from: number, insert: string) => [{ from, to: from, insert, removed: '', fromLine: 0, removedLines: 1, insertedLines: 1 }]

  test('an offset after an insertion moves with it', () => {
    expect(mapOffset(5, insertAt(2, 'abc'))).toBe(8)
  })

  test('an offset before an insertion stays', () => {
    expect(mapOffset(1, insertAt(2, 'abc'))).toBe(1)
  })

  test('an offset at an insertion goes after it, unless told to stay', () => {
    expect(mapOffset(2, insertAt(2, 'abc'), 1)).toBe(5)
    expect(mapOffset(2, insertAt(2, 'abc'), -1)).toBe(2)
  })

  test('an offset inside a deleted range collapses to where it was', () => {
    const deleted = [{ from: 2, to: 6, insert: '', removed: 'xxxx', fromLine: 0, removedLines: 1, insertedLines: 1 }]

    expect(mapOffset(4, deleted)).toBe(2)
    expect(mapOffset(8, deleted)).toBe(4)
  })

  test('a selection with no explicit destination rides along with the edit', () => {
    const core = editor('const a = 1\nconst b|')
    core.dispatch({ changes: [{ from: 0, to: 0, insert: '// ' }] })

    expect(show(core)).toBe('// const a = 1\nconst b|')
  })
})

describe('transactions', () => {
  test('several changes in one are given in the same coordinates', () => {
    const core = editor('|a\nb\nc')
    core.dispatch({
      changes: [
        { from: 0, to: 0, insert: '  ' },
        { from: 2, to: 2, insert: '  ' },
        { from: 4, to: 4, insert: '  ' },
      ],
    })

    expect(core.value).toBe('  a\n  b\n  c')
  })

  test('listeners hear a change with the lines it touched', () => {
    const core = editor('one\ntwo|')
    const heard: Array<{ fromLine: number, removedLines: number, insertedLines: number }> = []
    core.subscribe((transaction) => {
      for (const change of transaction.changes)
        heard.push({ fromLine: change.fromLine, removedLines: change.removedLines, insertedLines: change.insertedLines })
    })
    core.dispatch({ changes: [{ from: 7, to: 7, insert: '\nthree' }] })

    expect(heard).toEqual([{ fromLine: 1, removedLines: 1, insertedLines: 2 }])
  })

  test('nothing is announced when nothing changed', () => {
    const core = editor('abc|')
    let calls = 0
    core.subscribe(() => calls++)
    core.dispatch({ changes: [{ from: 1, to: 1, insert: '' }] })
    core.setSelection(3)

    expect(calls).toBe(0)
  })

  test('a read-only editor refuses edits but still moves its selection', () => {
    const core = editor('abc|', { readOnly: true })
    core.dispatch({ changes: [{ from: 0, to: 1, insert: 'X' }] })
    core.setSelection(1)

    expect(show(core)).toBe('a|bc')
    expect(core.exec('insertNewlineAndIndent')).toBe(false)
    expect(handleTextInput(core, '(')).toBe(false)
  })

  test('a read-only editor still takes a value from its host', () => {
    const core = editor('abc|', { readOnly: true })
    core.setValue('new text')

    expect(core.value).toBe('new text')
  })
})

describe('input from a text field', () => {
  test('one typed character becomes one insertion', () => {
    const core = editor('const |= 1')
    const seen: string[] = []
    core.subscribe(transaction => seen.push(JSON.stringify(transaction.changes.map(change => [change.from, change.to, change.insert]))))
    core.syncInput('const a= 1', 7, 7)

    expect(seen).toEqual(['[[6,6,"a"]]'])
    expect(show(core)).toBe('const a|= 1')
  })

  test('a paste over a selection becomes one replacement', () => {
    const core = editor('let [x] = 1')
    core.syncInput('let value = 1', 9, 9)

    expect(show(core)).toBe('let value| = 1')
  })

  test('a repeated character is still found, wherever the field says the caret is', () => {
    const core = editor('aa|a')
    core.syncInput('aaaa', 3, 3)

    expect(core.value).toBe('aaaa')
    expect(core.main.head).toBe(3)
  })

  test('a selection made backwards keeps its direction', () => {
    const core = editor('abcdef|')
    core.syncInput('abcdef', 1, 4, true)

    expect(core.main).toEqual({ anchor: 4, head: 1 })
  })

  test('a field that reports the same text only moves the selection', () => {
    const core = editor('abc|')
    let changed = false
    core.subscribe((transaction) => { changed ||= transaction.docChanged })
    core.syncInput('abc', 1, 1)

    expect(changed).toBe(false)
    expect(show(core)).toBe('a|bc')
  })
})

describe('undo and redo', () => {
  test('undo puts back the text and the selection', () => {
    const core = editor('one [two] three')
    core.dispatch({ changes: [{ from: 4, to: 7, insert: '2' }], selection: { anchor: 5, head: 5 } })

    expect(show(core)).toBe('one 2| three')
    expect(core.undo()).toBe(true)
    expect(show(core)).toBe('one [two] three')
    expect(core.redo()).toBe(true)
    expect(show(core)).toBe('one 2| three')
  })

  test('a word typed quickly is one step', () => {
    let clock = 0
    const core = new EditorCore({ value: '', now: () => (clock += 50) })
    type(core, 'hello')

    expect(core.history.undoDepth).toBe(1)
    core.undo()
    expect(core.value).toBe('')
  })

  test('a pause starts a new step', () => {
    let clock = 0
    const core = new EditorCore({ value: '', now: () => clock })
    type(core, 'ab')
    clock += 5_000
    type(core, 'cd')

    core.undo()
    expect(core.value).toBe('ab')
    core.undo()
    expect(core.value).toBe('')
  })

  test('moving the caret starts a new step', () => {
    let clock = 0
    const core = new EditorCore({ value: '', now: () => (clock += 10) })
    type(core, 'ab')
    core.setSelection(0)
    core.setSelection(2)
    type(core, 'cd')

    core.undo()
    expect(core.value).toBe('ab')
  })

  test('held backspace is one step, and comes back whole', () => {
    let clock = 0
    const core = new EditorCore({ value: 'abcdef', now: () => (clock += 30) })
    core.setSelection(6)
    for (let length = 5; length >= 3; length--)
      core.syncInput('abcdef'.slice(0, length), length, length)

    expect(core.value).toBe('abc')
    expect(core.history.undoDepth).toBe(1)
    core.undo()
    expect(show(core)).toBe('abcdef|')
  })

  test('forward delete is one step too', () => {
    let clock = 0
    const core = new EditorCore({ value: 'abcdef', now: () => (clock += 30) })
    core.setSelection(1)
    core.syncInput('acdef', 1, 1)
    core.syncInput('adef', 1, 1)

    expect(core.history.undoDepth).toBe(1)
    core.undo()
    expect(core.value).toBe('abcdef')
  })

  test('a change with several edits undoes as one', () => {
    const core = editor('[a\nb\nc]')
    core.exec('indentMore')
    expect(core.value).toBe('  a\n  b\n  c')
    core.undo()
    expect(show(core)).toBe('[a\nb\nc]')
    core.redo()
    expect(core.value).toBe('  a\n  b\n  c')
  })

  test('a new edit forgets what was undone', () => {
    const core = editor('|')
    core.dispatch({ changes: [{ from: 0, to: 0, insert: 'a' }] })
    core.undo()
    core.dispatch({ changes: [{ from: 0, to: 0, insert: 'b' }] })

    expect(core.redo()).toBe(false)
    expect(core.value).toBe('b')
  })

  test('undo with nothing to undo says so', () => {
    expect(editor('abc|').undo()).toBe(false)
  })

  test('a value set from outside is not something undo reaches behind', () => {
    const core = editor('old|')
    core.dispatch({ changes: [{ from: 3, to: 3, insert: '!' }] })
    core.setValue('entirely new')

    expect(core.undo()).toBe(false)
    expect(core.value).toBe('entirely new')
  })

  test('undo and redo walk a long history back to the start and forward again', () => {
    const core = editor('|')
    const states = [core.value]
    for (const piece of ['function f() {', '\n', '  return 1', '\n', '}']) {
      core.dispatch({ changes: [{ from: core.doc.length, to: core.doc.length, insert: piece }] })
      states.push(core.value)
    }

    for (let index = states.length - 2; index >= 0; index--) {
      core.undo()
      expect(core.value).toBe(states[index]!)
    }
    for (let index = 1; index < states.length; index++) {
      core.redo()
      expect(core.value).toBe(states[index]!)
    }
  })
})

describe('Enter', () => {
  test('keeps the indentation of the line it leaves', () => {
    const core = editor('    const a = 1|')
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('    const a = 1\n    |')
  })

  test('goes one level deeper after an opening bracket', () => {
    const core = editor('  if (ok) {|')
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('  if (ok) {\n    |')
  })

  test('between a pair, opens the block and leaves the closer below', () => {
    const core = editor('  call({|})')
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('  call({\n    |\n  })')
  })

  test('splits a line, carrying the rest down at the same indentation', () => {
    const core = editor('  one |two')
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('  one \n  |two')
  })

  test('replaces a selection', () => {
    const core = editor('a[bc]d')
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('a\n|d')
  })

  test('indents with tabs when the editor is set to', () => {
    const core = editor('\tif (x) {|', { insertSpaces: false, tabSize: 4 })
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('\tif (x) {\n\t\t|')
  })

  test('counts only the indentation before the caret', () => {
    const core = editor('  |    deep')
    core.exec('insertNewlineAndIndent')

    expect(show(core)).toBe('  \n  |    deep')
  })
})

describe('Tab and Shift-Tab', () => {
  test('a caret moves to the next tab stop', () => {
    const core = editor('a|', { tabSize: 4 })
    core.exec('indentMore')

    expect(show(core)).toBe('a   |')
  })

  test('a selection inside one line is replaced', () => {
    const core = editor('a[bc]d')
    core.exec('indentMore')

    expect(show(core)).toBe('a |d')
  })

  test('several lines are indented, and stay selected', () => {
    const core = editor('[one\ntwo]\nthree')
    core.exec('indentMore')

    expect(show(core)).toBe('[  one\n  two]\nthree')
  })

  test('an empty line in the middle is left empty', () => {
    const core = editor('[one\n\ntwo]')
    core.exec('indentMore')

    expect(core.value).toBe('  one\n\n  two')
  })

  test('a selection ending at the start of a line leaves that line alone', () => {
    const core = editor('[one\ntwo\n]three')
    core.exec('indentMore')

    expect(core.value).toBe('  one\n  two\nthree')
  })

  test('Shift-Tab takes one level off each line', () => {
    const core = editor('[    one\n  two\nthree]')
    core.exec('indentLess')

    expect(core.value).toBe('  one\ntwo\nthree')
  })

  test('Shift-Tab goes back to a tab stop from between two', () => {
    const core = editor('   one|')
    core.exec('indentLess')

    expect(core.value).toBe('  one')
  })

  test('Shift-Tab removes a tab character as one level', () => {
    const core = editor('\t\tone|', { insertSpaces: false, tabSize: 4 })
    core.exec('indentLess')

    expect(core.value).toBe('\tone')
  })

  test('indenting then outdenting is where it started', () => {
    const core = editor('[  one\n    two]')
    core.exec('indentMore')
    core.exec('indentLess')

    expect(show(core)).toBe('[  one\n    two]')
  })
})

describe('bracket pairing', () => {
  test('an opening bracket brings its closer', () => {
    const core = editor('call|')
    type(core, '(')

    expect(show(core)).toBe('call(|)')
  })

  test('typing the closer steps over the one already there', () => {
    const core = editor('call|')
    type(core, '()')

    expect(show(core)).toBe('call()|')
  })

  test('nesting pairs and typing through them leaves nothing doubled', () => {
    const core = editor('|')
    type(core, 'f([{')
    expect(show(core)).toBe('f([{|}])')
    type(core, '}])')
    expect(show(core)).toBe('f([{}])|')
  })

  test('no closer is added in front of a word', () => {
    const core = editor('|value')
    type(core, '(')

    expect(show(core)).toBe('(|value')
  })

  test('a selection is wrapped, and stays selected', () => {
    const core = editor('return [a + b]')
    type(core, '(')

    expect(show(core)).toBe('return ([a + b])')
  })

  test('a quote pairs', () => {
    const core = editor('const s = |')
    type(core, '"')

    expect(show(core)).toBe('const s = "|"')
  })

  test('an apostrophe inside a word does not', () => {
    const core = editor('// don|')
    type(core, '\'')

    expect(show(core)).toBe('// don\'|')
  })

  test('a closing quote steps over, an escaped one does not', () => {
    const closing = editor('"abc|"')
    type(closing, '"')
    expect(show(closing)).toBe('"abc"|')

    const escaped = editor('"abc\\|"')
    type(escaped, '"')
    expect(show(escaped)).toBe('"abc\\"|"')
  })

  test('a selection is wrapped in quotes', () => {
    const core = editor('log([hello])')
    type(core, '`')

    expect(show(core)).toBe('log(`[hello]`)')
  })

  test('backspace between an empty pair takes both', () => {
    const core = editor('call(|)')
    expect(core.exec('deleteBackward')).toBe(true)

    expect(show(core)).toBe('call|')
  })

  test('backspace with something in the pair is the field\'s to handle', () => {
    expect(editor('call(a|)').exec('deleteBackward')).toBe(false)
  })

  test('backspace in leading spaces goes back a tab stop', () => {
    const core = editor('      |x', { tabSize: 4 })
    core.exec('deleteBackward')

    expect(show(core)).toBe('    |x')
  })

  test('a closing brace on an indented empty line drops back a level', () => {
    const core = editor('if (x) {\n  a()\n  |')
    type(core, '}')

    expect(show(core)).toBe('if (x) {\n  a()\n}|')
  })

  test('a pair is one undo step', () => {
    const core = editor('f|')
    type(core, '(')
    core.undo()

    expect(show(core)).toBe('f|')
  })

  test('a language can have fewer quotes', () => {
    const core = editor('x = |', { language: languageConfig('python') })
    type(core, '`')

    expect(show(core)).toBe('x = `|')
  })
})

describe('comment toggle', () => {
  test('comments the line the caret is on', () => {
    const core = editor('const a| = 1')
    core.exec('toggleLineComment')

    expect(show(core)).toBe('// const a| = 1')
  })

  test('uncomments it again, exactly', () => {
    const core = editor('  const a| = 1')
    core.exec('toggleLineComment')
    expect(core.value).toBe('  // const a = 1')
    core.exec('toggleLineComment')
    expect(show(core)).toBe('  const a| = 1')
  })

  test('lines up the markers at the shallowest indentation', () => {
    const core = editor('[  if (x) {\n    run()\n  }]')
    core.exec('toggleLineComment')

    expect(core.value).toBe('  // if (x) {\n  //   run()\n  // }')
  })

  test('skips blank lines, and they do not stop a block reading as commented', () => {
    const core = editor('[a\n\nb]')
    core.exec('toggleLineComment')
    expect(core.value).toBe('// a\n\n// b')
    core.exec('toggleLineComment')
    expect(core.value).toBe('a\n\nb')
  })

  test('a block with one uncommented line is commented, not uncommented', () => {
    const core = editor('[// a\nb]')
    core.exec('toggleLineComment')

    expect(core.value).toBe('// // a\n// b')
  })

  test('uncomments a marker with no space after it', () => {
    const core = editor('//a|')
    core.exec('toggleLineComment')

    expect(core.value).toBe('a')
  })

  test('uses the language\'s marker', () => {
    const core = editor('x = 1|', { language: languageConfig('python') })
    core.exec('toggleLineComment')

    expect(core.value).toBe('# x = 1')
  })

  test('does nothing in a language with no line comment', () => {
    const core = editor('{"a": 1}|', { language: languageConfig('json') })

    expect(core.exec('toggleLineComment')).toBe(false)
    expect(core.value).toBe('{"a": 1}')
  })

  test('is one undo step for the whole block', () => {
    const core = editor('[a\nb\nc]')
    core.exec('toggleLineComment')
    core.undo()

    expect(show(core)).toBe('[a\nb\nc]')
  })
})

describe('the keymap', () => {
  test('Mod is Command on a Mac and Control elsewhere', () => {
    expect(normalizeBinding('Mod-Enter', true)).toBe('Meta-Enter')
    expect(normalizeBinding('Mod-Enter', false)).toBe('Ctrl-Enter')
  })

  test('a binding is the same however its modifiers are ordered or cased', () => {
    expect(normalizeBinding('shift-mod-Z', true)).toBe(normalizeBinding('Mod-Shift-z', true))
  })

  test('the minus key can be bound', () => {
    expect(normalizeBinding('Mod--', false)).toBe('Ctrl--')
  })

  test('a key press is named the way a binding is', () => {
    expect(keyName({ key: 'Enter', metaKey: true })).toBe('Meta-Enter')
    expect(keyName({ key: 'Z', metaKey: true, shiftKey: true })).toBe('Shift-Meta-z')
    expect(keyName({ key: ' ', ctrlKey: true })).toBe('Ctrl-Space')
  })

  test('run and run-selection are bound on both platforms', () => {
    const mac = createKeymap([defaultKeymap], true)
    const other = createKeymap([defaultKeymap], false)

    expect(mac.lookup({ key: 'Enter', metaKey: true })).toBe('run')
    expect(mac.lookup({ key: 'Enter', metaKey: true, shiftKey: true })).toBe('runSelection')
    expect(other.lookup({ key: 'Enter', ctrlKey: true })).toBe('run')
    expect(other.lookup({ key: 'Enter', ctrlKey: true, shiftKey: true })).toBe('runSelection')
    // Control-Enter on a Mac is not Command-Enter.
    expect(mac.lookup({ key: 'Enter', ctrlKey: true })).toBeUndefined()
  })

  test('plain keys reach their commands', () => {
    const keymap = createKeymap([defaultKeymap], true)

    expect(keymap.lookup({ key: 'Tab' })).toBe('indentMore')
    expect(keymap.lookup({ key: 'Tab', shiftKey: true })).toBe('indentLess')
    expect(keymap.lookup({ key: '/', metaKey: true })).toBe('toggleLineComment')
    expect(keymap.lookup({ key: 'z', metaKey: true })).toBe('undo')
    expect(keymap.lookup({ key: 'Z', metaKey: true, shiftKey: true })).toBe('redo')
    expect(keymap.lookup({ key: 'a' })).toBeUndefined()
  })

  test('a later map rebinds a key, and an empty name unbinds it', () => {
    const keymap = createKeymap([defaultKeymap, { 'Tab': '', 'Mod-Enter': 'submit' }], false)

    expect(keymap.lookup({ key: 'Tab' })).toBeUndefined()
    expect(keymap.lookup({ key: 'Enter', ctrlKey: true })).toBe('submit')
  })

  test('a command can be run by the name a key gives', () => {
    const core = editor('a|')
    const keymap = createKeymap([defaultKeymap], true)
    core.exec(keymap.lookup({ key: 'Enter' })!)

    expect(show(core)).toBe('a\n|')
  })
})
