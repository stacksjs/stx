/**
 * The colours of code, as CSS custom properties.
 *
 * Two places draw highlighted code - `<CodeBlock>` and `<CodeEditor>` - and
 * both write a class on each token (`tok-keyword`) rather than a colour. What a
 * keyword looks like is decided here, once, as `--stx-syntax-keyword`, so an
 * app re-themes both by setting a variable, and light and dark are the same
 * markup under a different set of values.
 *
 * The defaults are the highlighter's GitHub pair. `test/syntax-theme.test.ts`
 * holds them to `ts-syntax-highlighter`'s own themes, so they cannot drift from
 * what the highlighter would have written inline.
 *
 * A component's `<style>` block is extracted from its source before anything
 * is interpolated, so the two components carry this CSS as literal text rather
 * than importing it. The same test holds those copies to this file.
 */

/** The token classes, in the order the rules are written. */
export const SYNTAX_TOKENS: readonly string[] = [
  'keyword',
  'string',
  'comment',
  'numeric',
  'constant',
  'function',
  'operator',
  'punctuation',
  'type',
  'variable',
  'tag',
  'attribute',
]

export const SYNTAX_LIGHT: Readonly<Record<string, string>> = {
  background: '#ffffff',
  foreground: '#24292f',
  keyword: '#cf222e',
  string: '#0a3069',
  comment: '#6e7781',
  numeric: '#0550ae',
  constant: '#0550ae',
  function: '#8250df',
  operator: '#cf222e',
  punctuation: '#24292f',
  type: '#953800',
  variable: '#953800',
  tag: '#116329',
  attribute: '#0550ae',
}

export const SYNTAX_DARK: Readonly<Record<string, string>> = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  keyword: '#ff7b72',
  string: '#a5d6ff',
  comment: '#8b949e',
  numeric: '#79c0ff',
  constant: '#79c0ff',
  function: '#d2a8ff',
  operator: '#ff7b72',
  punctuation: '#c9d1d9',
  type: '#ffa657',
  variable: '#ffa657',
  tag: '#7ee787',
  attribute: '#79c0ff',
}

/** The properties a palette sets: the panel's two, then one per token. */
export const SYNTAX_PROPERTIES: readonly string[] = ['background', 'foreground', ...SYNTAX_TOKENS]

/** `--stx-syntax-keyword: #cf222e;` for every property, one per line. */
export function syntaxVariables(palette: Readonly<Record<string, string>>, indent = '  '): string {
  return SYNTAX_PROPERTIES.map(name => `${indent}--stx-syntax-${name}: ${palette[name]};`).join('\n')
}

/** The rules that colour a token class from its variable. */
export function syntaxTokenRules(): string {
  return SYNTAX_TOKENS
    .map(name => `.tok-${name} { color: var(--stx-syntax-${name}); }`)
    .concat('.tok-comment { font-style: italic; }')
    .join('\n')
}

/**
 * The whole sheet: light values, dark values for a reader following their
 * system and for an app with a `.dark` toggle, an explicit theme on the
 * element itself, and the token rules.
 *
 * `:where()` throughout, so none of it outranks a single class an app writes.
 */
export function syntaxThemeCss(): string {
  const light = syntaxVariables(SYNTAX_LIGHT)
  const dark = syntaxVariables(SYNTAX_DARK)

  return [
    `:where(:root) {\n${light}\n}`,
    `@media (prefers-color-scheme: dark) {\n:where(:root:not(.light)) {\n${dark}\n}\n}`,
    `:where(.dark) {\n${dark}\n}`,
    `:where([data-syntax-theme="light"]) {\n${light}\n}`,
    `:where([data-syntax-theme="dark"]) {\n${dark}\n}`,
    syntaxTokenRules(),
  ].join('\n')
}

/**
 * The block a `<CodeBlock>` draws its code in.
 *
 * Line numbers are a counter, not text, so selecting a numbered block and
 * copying it gives the code and not `1const a = 1`.
 */
export function syntaxPanelCss(): string {
  return [
    '.syntax {',
    '  margin: 0;',
    '  padding: 1rem;',
    '  overflow-x: auto;',
    '  border-radius: 0.375rem;',
    '  background-color: var(--stx-syntax-background);',
    '  color: var(--stx-syntax-foreground);',
    '  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;',
    '  font-size: 0.875rem;',
    '  line-height: 1.5;',
    '  tab-size: 2;',
    '}',
    '.syntax code { display: block; font-family: inherit; }',
    '.syntax[data-line-numbers] { counter-reset: stx-syntax-line; }',
    '.syntax[data-line-numbers] .line::before {',
    '  counter-increment: stx-syntax-line;',
    '  content: counter(stx-syntax-line);',
    '  display: inline-block;',
    '  width: 2.5em;',
    '  margin-right: 1em;',
    '  text-align: right;',
    '  opacity: 0.5;',
    '  user-select: none;',
    '}',
  ].join('\n')
}

/** Everything `<CodeBlock>` needs: the palettes, the token rules and the panel. */
export function codeBlockCss(): string {
  return `${syntaxThemeCss()}\n${syntaxPanelCss()}`
}
