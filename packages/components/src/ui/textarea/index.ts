export { default as Textarea } from './Textarea.stx'
export { default as AiTextarea } from './AiTextarea.stx'

export interface TextareaProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  rows?: number
  autoResize?: boolean
  maxRows?: number
  error?: boolean
  label?: string
  helperText?: string
  required?: boolean
  maxLength?: number
  showCount?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  className?: string
}

export interface AiTextareaProps extends TextareaProps {
  /** What is being written; steers the completion. Default `'text'`. */
  kind?: 'note' | 'prompt' | 'todo' | 'text'
  /** Background for the model, such as the note title. */
  context?: string
  /**
   * Where suggestions come from: a URL that answers `POST { before, after, kind, context }`
   * with `{ completion }` (default `/ai/complete`), or a function
   * `(ctx, signal) => Promise<string | { completion: string }>`.
   */
  fetcher?: string | ((ctx: { before: string, after: string, caret: number, kind: string, context: string }, signal: AbortSignal) => Promise<string | { completion: string }>)
  /** Quiet time after the last keystroke before asking. Default 250. */
  debounceMs?: number
  /** Fewest characters before the caret that earn a request. Default 12. */
  minChars?: number
  /** Set false to turn suggestions off while keeping the field. */
  completions?: boolean
  name?: string
  id?: string
}
