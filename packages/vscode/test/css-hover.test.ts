/**
 * Utility-class hovers show formatted CSS.
 *
 * `prettifyCSS` called `.trim()` on the promise Prettier 3's `format`
 * returns. That threw, its `catch` returned the input unchanged, and every
 * hover showed the engine's output as generated. These tests drive the hover
 * provider with the real CSS engine and Prettier, so they fail if the output
 * stops being formatted for any reason, not only that one.
 */
import type * as vscode from 'vscode'
import { describe, expect, test } from 'bun:test'
import { CssContext, loadCssEngineConfig } from '../src/ts-css/context'
import { createCssHoverProvider, DEFAULT_REM_TO_PX_RATIO, remToPxRatio } from '../src/ts-css/hover-provider'
import { prettifyCSS } from '../src/ts-css/utils/css-parser'

class Position {
  constructor(readonly line: number, readonly character: number) {}
  isBefore(other: Position): boolean {
    return this.line < other.line || (this.line === other.line && this.character < other.character)
  }

  isAfter(other: Position): boolean {
    return other.isBefore(this)
  }
}

class MarkdownString {
  value = ''
  supportHtml = false
  isTrusted = false
  appendMarkdown(text: string): this {
    this.value += text
    return this
  }

  appendCodeblock(code: string, language: string): this {
    this.value += `\n\`\`\`${language}\n${code}\n\`\`\`\n`
    return this
  }
}

class Hover {
  constructor(readonly contents: MarkdownString) {}
}

type Settings = Record<string, Record<string, unknown>>

/** `settings` maps a section to the values the user set in it. */
function vscodeStub(settings: Settings = {}): typeof vscode {
  return {
    workspace: {
      workspaceFolders: undefined,
      getConfiguration: (section: string) => {
        const values = settings[section] ?? {}
        return {
          get: (key: string, fallback?: unknown) => key in values ? values[key] : fallback,
          inspect: (key: string) => ({ key: `${section}.${key}`, globalValue: values[key] }),
        }
      },
    },
    MarkdownString,
    Hover,
  } as unknown as typeof vscode
}

/** A one-line document whose cursor is on `className`. */
function documentWith(className: string, prefix = ''): { document: vscode.TextDocument, position: vscode.Position } {
  const text = `${prefix}<div class="flex ${className}"></div>`
  const offsetAt = (position: Position) => position.character
  const document = {
    getText: () => text,
    offsetAt,
    positionAt: (offset: number) => new Position(0, offset),
  } as unknown as vscode.TextDocument

  return { document, position: new Position(0, text.indexOf(className) + 1) as unknown as vscode.Position }
}

async function hoverText(className: string, settings?: Settings, prefix?: string): Promise<string> {
  const stub = vscodeStub(settings)
  const context = new CssContext(await loadCssEngineConfig(stub))
  await context.waitReady()

  const { document, position } = documentWith(className, prefix)
  const hover = await createCssHoverProvider(stub, context).provideHover(document, position, {} as vscode.CancellationToken) as unknown as Hover | null

  expect(hover).not.toBeNull()
  return hover!.contents.value
}

/** The contents of the hover's css code block. */
function codeBlock(markdown: string): string {
  return markdown.match(/```css\n([\s\S]*?)\n```/)![1]
}

describe('prettifyCSS', () => {
  test('formats CSS', async () => {
    expect(await prettifyCSS('.p-4{padding:1rem;margin:0}')).toBe('.p-4 {\n  padding: 1rem;\n  margin: 0;\n}')
  })

  test('returns input it cannot parse unchanged', async () => {
    expect(await prettifyCSS('.p-4{padding:')).toBe('.p-4{padding:')
  })
})

describe('utility-class hover', () => {
  // The engine's own output is already indented for most single rules, so
  // these use the classes where it is not: a keyframes block it writes one
  // step per line, and declarations too long for one line.
  test('shows the CSS formatted, one declaration per line', async () => {
    const css = codeBlock(await hoverText('animate-spin'))

    expect(css).toBe(await prettifyCSS(css))
    expect(css).toContain('@keyframes spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}')
  })

  test('wraps a declaration too long for one line', async () => {
    const css = codeBlock(await hoverText('transition'))

    expect(css).toBe(await prettifyCSS(css))
    expect(css).toContain('  transition-property:\n    color, background-color,')
  })

  test('adds the px value next to rem', async () => {
    expect(codeBlock(await hoverText('p-4'))).toBe('.p-4 {\n  padding: 1rem /* 16px */;\n}')
  })

  // Finding the class under the cursor used to loop forever once it skipped a
  // class attribute the cursor was not in. The loop is synchronous, so a
  // regression hangs this file rather than failing it.
  test('finds a class in an attribute after the first one', async () => {
    const css = codeBlock(await hoverText('p-4', {}, '<span class="block"></span>\n'))
    expect(css).toContain('padding: 1rem')
  })

  test('converts rem with stx.utilityClasses.remToPxRatio', async () => {
    const css = codeBlock(await hoverText('p-4', { 'stx.utilityClasses': { remToPxRatio: 10 } }))
    expect(css).toContain('padding: 1rem /* 10px */;')
  })
})

describe('remToPxRatio', () => {
  test('defaults to 16', () => {
    expect(remToPxRatio(vscodeStub())).toBe(DEFAULT_REM_TO_PX_RATIO)
    expect(DEFAULT_REM_TO_PX_RATIO).toBe(16)
  })

  test('reads stx.utilityClasses.remToPxRatio', () => {
    expect(remToPxRatio(vscodeStub({ 'stx.utilityClasses': { remToPxRatio: 10 } }))).toBe(10)
  })

  test('still honours css.remToPxRatio, the key it used to be contributed under', () => {
    expect(remToPxRatio(vscodeStub({ css: { remToPxRatio: 20 } }))).toBe(20)
  })

  test('prefers the new key when both are set', () => {
    expect(remToPxRatio(vscodeStub({ 'stx.utilityClasses': { remToPxRatio: 10 }, 'css': { remToPxRatio: 20 } }))).toBe(10)
  })

  test('honours 0, which hides the px values', () => {
    expect(remToPxRatio(vscodeStub({ 'stx.utilityClasses': { remToPxRatio: 0 } }))).toBe(0)
  })
})
