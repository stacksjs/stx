/**
 * The code editor without its stx template.
 *
 * `@stacksjs/components/code-editor`. Everything `<CodeEditor>` is made of, for
 * a host that mounts one itself or that wants the model on its own:
 *
 * - `EditorCore` and the rest of `./core`: the document, selection, history,
 *   commands and keymap. No DOM, so it runs anywhere.
 * - `EditorView`: the text field over its painted copy.
 * - `CodeEditorController`: the two joined, with highlighting and completion.
 */

export * from './controller'
export * from './core'
export { createLanguageTokenizer, MAX_TOKENIZED_LINE_LENGTH, tokenizerStateKey } from './tokenizer'
export * from './view'
