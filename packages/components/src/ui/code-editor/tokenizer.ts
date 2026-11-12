/**
 * The highlighter, as the line tokenizer the editor core asks for.
 *
 * The core takes a tokenizer rather than importing one, so this is the only
 * file in the editor that knows `ts-syntax-highlighter` exists. It reaches it
 * through the package's browser entry: the root entry loads a config file from
 * disk, which a page cannot do.
 */
import type { TokenizerState } from 'ts-syntax-highlighter/browser'
import type { HighlightToken, LineTokenizer } from './core/highlight'
import { resolveGrammar, tokenClass, Tokenizer } from 'ts-syntax-highlighter/browser'

/**
 * A line longer than this is shown plain.
 *
 * A minified bundle is one line of a hundred thousand characters. Nobody reads
 * it, some grammars are quadratic in it, and it would be re-tokenized whole on
 * every key typed into it.
 */
export const MAX_TOKENIZED_LINE_LENGTH = 10_000

/** A string equal exactly when two tokenizer states are. */
export function tokenizerStateKey(state: TokenizerState): string {
  const { frames } = state
  // Nearly every line of nearly every file ends where it began: at the root.
  if (frames.length === 1 && frames[0]!.pattern === null && !frames[0]!.raw)
    return ''

  let key = ''
  for (const frame of frames)
    key += `${frame.pattern ?? ''}\u0001${frame.raw ? frame.end ?? '' : ''}\u0001${frame.scopes.join(' ')}\u0002`

  return key
}

/**
 * A line tokenizer for a language, or null when the highlighter has no grammar
 * for it. The editor shows plain text then, which is the right floor: the code
 * is the content and the colour is decoration.
 */
export async function createLanguageTokenizer(language: string): Promise<LineTokenizer<TokenizerState> | null> {
  const grammar = await resolveGrammar(language)
  if (!grammar)
    return null

  const tokenizer = new Tokenizer(grammar)
  const lines: string[] = ['']

  return {
    initialState: () => tokenizer.initialState(),
    stateKey: tokenizerStateKey,
    tokenizeLine(text, state) {
      if (text.length > MAX_TOKENIZED_LINE_LENGTH)
        return { tokens: [{ type: '', content: text }], endState: state }

      lines[0] = text
      const result = tokenizer.tokenizeLinesFrom(lines, state, 1)
      const tokens: HighlightToken[] = []
      let last: HighlightToken | undefined

      for (const token of result.lines[0]!.tokens) {
        const type = tokenClass(token.type)
        // Neighbours of one colour are one run: half the elements to create,
        // and nothing a reader could tell apart.
        if (last && last.type === type)
          last.content += token.content
        else
          tokens.push(last = { type, content: token.content })
      }

      return { tokens, endState: result.endState }
    },
  }
}
