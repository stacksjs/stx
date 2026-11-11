# CodeEditor

A code editor: highlighting, a gutter, auto-indent, bracket pairing, comment
toggle, undo, completions, inline results, diagnostics and ghost text. No
third-party editor underneath; the tokenizer is `ts-syntax-highlighter`.

```html
<script client>
const code = state('const user = await User.find(1)\n')

function run(detail) {
  // detail.value is the whole text, detail.selection where the caret is.
}
</script>

<CodeEditor
  language="typescript"
  height="24rem"
  v-model:value="code"
  @run="run($event)"
/>
```

A component's event hands its payload to the handler as `$event`, so `run`
above receives the detail object itself.

## How it works

The editor is a real `<textarea>` with its text made transparent, laid over a
copy of the same text drawn in colour. You type into the field and see the
copy. Because it is a real field, the browser supplies the caret, selection,
input methods, dictation, the clipboard, drag and drop, and a control a screen
reader already understands.

Three layers of code, each usable without the ones above it:

| File | What it is |
|---|---|
| `core/` | The model: document as lines, selection, undo history, commands, keymap, incremental highlighting, the completion list. No DOM and no stx. |
| `view.ts` | The DOM: keeps the two layers aligned, draws only the lines on screen, positions widgets, squiggles and ghost text. |
| `controller.ts` | The two joined, plus the highlighter and the run and completion wiring. |
| `CodeEditor.stx` | The template, the styles, and the props and events. |

`@stacksjs/components/code-editor` exports the first three for a host that
mounts an editor itself.

## Props

| Prop | Default | |
|---|---|---|
| `value` | `''` | The text. Two-way with `v-model:value`. |
| `language` | `'typescript'` | Any language id `ts-syntax-highlighter` knows. An unknown one is shown plain. Also sets the comment marker and which brackets pair. |
| `readonly`, `disabled` | `false` | |
| `lineNumbers` | `true` | |
| `highlight` | `true` | Off shows plain text. |
| `tabSize` | `2` | |
| `insertSpaces` | `true` | Indent with spaces rather than tab characters. |
| `autoComplete` | `true` | Offer completions while typing, not only on Ctrl+Space. |
| `completions` | `[]` | Names always on offer: `{ label, insert?, detail?, kind?, filterText?, boost? }`. |
| `widgets` | `[]` | Shown beside lines: `{ line, column?, text, kind?, className? }`. `column` defaults to the end of the line. |
| `diagnostics` | `[]` | `{ from: { line, column }, to: { line, column }, message, severity? }`. Drawn as a squiggle, marked in the gutter, and said after the line. |
| `inlineDiagnostics` | `true` | Show each diagnostic's message after its line. |
| `ghostText` | `''` | A suggestion at the caret. Tab takes it, Escape lets it go, typing its first characters keeps it. |
| `keymap` | `{}` | Bindings laid over the defaults, bound with `:keymap`. An empty command name unbinds a key. |
| `theme` | follows the page | `light` or `dark` pins the code colours. |
| `height` | `'20rem'` | Any CSS length. `100%` fills a sized parent. |
| `placeholder`, `label`, `name`, `id`, `autofocus`, `className` | | `label` is the field's accessible name. |

Lines and columns are zero-based everywhere, as a language server counts them.

## Events

| Event | Payload |
|---|---|
| `@input`, `@change` | The text. |
| `@selection` | `{ anchor, head, from, to, line, column, text, empty }` |
| `@run` | `{ value, selection }`. Cmd+Enter, or Ctrl+Enter off a Mac. |
| `@run-selection` | `{ text, from, to, line, selected }`. With Shift. The caret's line when nothing is selected. |
| `@complete` | `{ query, from, to, line, column, textBefore, explicit, trigger }`. Answer by calling `showCompletions(items, { from })`. |
| `@completion-accept` | The item taken. |
| `@ghost` | `{ outcome: 'accept' \| 'dismiss', text }` |
| `@focus`, `@blur` | |

## Methods

Through a ref on the component: `getValue`, `setValue`, `getSelection`,
`setSelection(anchor, head)`, `focus`, `undo`, `redo`, `exec(command)`,
`setWidgets`, `setDiagnostics`, `setGhostText`, `showCompletions(items, { from })`,
`closeCompletions`, and `editor()` for the controller itself.

## Keys

| Key | |
|---|---|
| Enter | New line at the same indentation, one level deeper after an opening bracket. |
| Tab, Shift+Tab | Indent or outdent the selected lines. With no selection, Tab moves to the next tab stop. |
| Cmd/Ctrl+/ | Comment or uncomment the selected lines. |
| Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y | Undo, redo. |
| Cmd/Ctrl+Enter | Run. |
| Shift+Cmd/Ctrl+Enter | Run the selection. |
| Ctrl+Space | Completions. |
| Escape, then Tab | Leave the editor. Tab indents, so this is the way out by keyboard. |

In a binding, `Mod` is Command on a Mac and Control elsewhere:
`:keymap="{ 'Mod-s': 'run', 'Tab': '' }"`.

## Theming

Everything is a CSS custom property that falls back to one of the library's
role tokens, so an app that has themed its roles already has a matching editor.

- The editor: `--stx-code-bg`, `--stx-code-fg`, `--stx-code-gutter-fg`,
  `--stx-code-caret`, `--stx-code-selection`, `--stx-code-active-line`,
  `--stx-code-error`, `--stx-code-warning`, `--stx-code-info`.
- The code: `--stx-syntax-keyword`, `-string`, `-comment`, `-numeric`,
  `-constant`, `-function`, `-operator`, `-punctuation`, `-type`, `-variable`,
  `-tag`, `-attribute`. `<CodeBlock>` reads the same ones.
- The type: `--stx-code-font`, `--stx-code-font-size`, `--stx-code-line-height`.
  Give the last two in pixels. The two layers only stay on the same pixels if a
  line is a whole number of them.

## Limits of this version

- **One cursor.** The input surface is a textarea and a textarea has one. The
  model already holds a list of ranges, so an input surface of the editor's own
  can add more without changing it.
- **No soft wrap.** Long lines scroll sideways.
- **The whole text lives in the field.** In WebKit the field itself spends
  about 7 ms on a typed character once it holds 2,000 lines, before the editor
  does anything; the editor adds between 1 and 2 ms. That is inside a frame, and
  it grows with the size of the file. It is the ceiling of this technique, and
  the reason for the next one.
- **Grammars ship with the page.** stx inlines a component's imports into the
  page, so a page with an editor carries every grammar the highlighter has.
