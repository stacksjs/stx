import { getHighlighter } from 'shiki'
import type { Highlighter } from 'shiki'

let highlighter: Highlighter

export async function initHighlighter() {
  highlighter = await getHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['html', 'typescript', 'javascript'],
    langAlias: {
      stx: 'html' // Use HTML as base for stx
    }
  })

  return highlighter
}

export function highlight(code: string, lang = 'stx', theme = 'github-dark') {
  if (!highlighter) {
    throw new Error('Highlighter not initialized')
  }
  return highlighter.codeToHtml(code, { lang, theme })
}
