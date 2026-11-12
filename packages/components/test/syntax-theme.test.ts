/**
 * The colours of code, held in one place.
 *
 * `utils/syntax-theme.ts` says what a keyword looks like. Three other things
 * have to agree with it and none of them can import it: the highlighter's own
 * themes (another package), and the `<style>` blocks of `<CodeBlock>` and
 * `<CodeEditor>`, which stx extracts from the component's source before any
 * interpolation runs and so have to be literal text. This is what keeps the
 * copies from drifting.
 */
import { describe, expect, it } from 'bun:test'
import { resolve } from 'node:path'
import { getTheme, themeTokenColors, TOKEN_CLASSES } from 'ts-syntax-highlighter/browser'
import { codeBlockCss, SYNTAX_DARK, SYNTAX_LIGHT, SYNTAX_TOKENS, syntaxThemeCss } from '../src/utils/syntax-theme'

const SRC = resolve(import.meta.dir, '../src')

async function styleOf(file: string): Promise<string> {
  const source = await Bun.file(resolve(SRC, file)).text()

  // Anchored to the start of a line: the block itself, not a mention of one in a comment.
  return [...source.matchAll(/^<style>\n([\s\S]*?)^<\/style>/gm)].map(match => match[1]!).join('\n')
}

describe('the palettes', () => {
  it('cover exactly the classes the highlighter writes', () => {
    expect([...SYNTAX_TOKENS].sort()).toEqual([...TOKEN_CLASSES].sort())
  })

  for (const [name, palette] of [['github-light', SYNTAX_LIGHT], ['github-dark', SYNTAX_DARK]] as const) {
    it(`${name} matches the highlighter's own theme`, () => {
      const theme = getTheme(name)!
      const colors = themeTokenColors(theme)

      expect(palette.background).toBe(theme.colors['editor.background'])
      expect(palette.foreground).toBe(theme.colors['editor.foreground'])
      for (const token of SYNTAX_TOKENS)
        expect(palette[token], token).toBe(colors[token]!.foreground!)
    })
  }
})

describe('the copies in component style blocks', () => {
  it('<CodeBlock> ships the whole sheet: palettes, token rules and its panel', async () => {
    expect(await styleOf('components/CodeBlock.stx')).toContain(codeBlockCss())
  })

  it('<CodeEditor> ships the palettes and the token rules', async () => {
    expect(await styleOf('ui/code-editor/CodeEditor.stx')).toContain(syntaxThemeCss())
  })

  it('neither is empty, which is what an interpolated style block would be', async () => {
    for (const file of ['components/CodeBlock.stx', 'ui/code-editor/CodeEditor.stx']) {
      const style = await styleOf(file)

      expect(style, file).not.toContain('{{')
      expect(style, file).toContain('.tok-keyword { color: var(--stx-syntax-keyword); }')
    }
  })
})
