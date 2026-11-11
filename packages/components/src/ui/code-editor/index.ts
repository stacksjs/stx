export type { CodeEditorConfig, CodeEditorHooks, CompletionRequest, PopupItem, PopupState, RunDetail, RunSelectionDetail, SelectionDetail } from './controller'
export type { CompletionItem, Keymap, Position } from './core'
export type { CaretAnchor, DiagnosticSeverity, EditorDiagnostic, EditorViewOptions, EditorWidget } from './view'
export { default as CodeEditor } from './CodeEditor.stx'

export interface CodeEditorProps {
  /** The text. Two-way with `v-model:value`. */
  value?: string
  /** A language id the highlighter knows. Default `typescript`. */
  language?: string
  readonly?: boolean
  disabled?: boolean
  /** Show the gutter. Default true. */
  lineNumbers?: boolean
  /** Colour the code. Default true. */
  highlight?: boolean
  /** Columns per indent level. Default 2. */
  tabSize?: number
  /** Indent with spaces rather than tab characters. Default true. */
  insertSpaces?: boolean
  /** Offer completions while typing, not only on Ctrl-Space. Default true. */
  autoComplete?: boolean
  /** Names always on offer in the completion popup. */
  completions?: import('./core').CompletionItem[]
  /** Results, notes and errors shown beside lines. Lines are zero-based. */
  widgets?: import('./view').EditorWidget[]
  /** Ranges drawn with a squiggle. */
  diagnostics?: import('./view').EditorDiagnostic[]
  /** Show each diagnostic's message after its line. Default true. */
  inlineDiagnostics?: boolean
  /** A suggestion shown at the caret. Tab takes it, Escape lets it go. */
  ghostText?: string
  /** Bindings laid over the defaults, such as `{ 'Mod-s': 'run' }`. */
  keymap?: import('./core').Keymap
  /** Pin the code colours to `light` or `dark`. Follows the page otherwise. */
  theme?: 'light' | 'dark'
  /** A CSS length. Default `20rem`. */
  height?: string
  placeholder?: string
  /** The field's accessible name. Default `Code editor`. */
  label?: string
  autofocus?: boolean
  name?: string
  id?: string
  className?: string
}
