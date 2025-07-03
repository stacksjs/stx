import { getHighlighter } from 'shiki'
import type { Highlighter, Lang } from 'shiki'

let highlighter: Highlighter

export async function initHighlighter() {
  highlighter = await getHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['html', 'typescript', 'javascript']
  })

  // Register STX as a custom language
  await highlighter.loadLanguage({
    id: 'stx',
    scopeName: 'source.stx',
    grammar: {
      $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
      name: 'STX',
      patterns: [
        {
          name: 'keyword.control.directive.stx',
          match: '@(if|else|endif|foreach|endforeach|forelse|empty|endforelse|switch|case|default|break|unless|endunless|ts|endts|component|endcomponent|extends|section|endsection|include|yield|parent|import)\\b'
        },
        {
          name: 'string.interpolated.stx',
          begin: '{{',
          end: '}}',
          patterns: [
            {
              include: 'source.ts'
            }
          ]
        },
        {
          begin: '@ts\\b',
          end: '@endts\\b',
          name: 'meta.embedded.block.typescript',
          contentName: 'source.ts',
          patterns: [
            {
              include: 'source.ts'
            }
          ]
        },
        {
          include: 'text.html.basic'
        }
      ]
    }
  })

  return highlighter
}

export function highlight(code: string, lang: Lang = 'stx', theme = 'github-dark') {
  if (!highlighter) {
    throw new Error('Highlighter not initialized')
  }
  return highlighter.codeToHtml(code, { lang, theme })
} 