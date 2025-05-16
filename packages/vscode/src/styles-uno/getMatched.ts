import type { UnoGenerator } from '@unocss/core'
import type { TextDocument } from 'vscode'
import type { ContextLoader } from './contextLoader'
import { workspace } from 'vscode'
import { getConfig } from './configs'
import { defaultIdeMatchExclude, defaultIdeMatchInclude } from './integration/defaults'
import { getMatchedPositionsFromCode } from './integration/match-positions'

const cache = new Map<string, ReturnType<typeof getMatchedPositionsFromCode>>()

export function registerDocumentCacheCleaner(loader: ContextLoader): void {
  loader.ext.subscriptions.push(
    workspace.onDidChangeTextDocument((e) => {
      cache.delete(e.document.uri.fsPath)
    }),
  )
}

export function getMatchedPositionsFromDoc(
  uno: UnoGenerator,
  doc: TextDocument,
  force = false,
): ReturnType<typeof getMatchedPositionsFromCode> {
  const id = doc.uri.fsPath
  if (force)
    cache.delete(id)

  if (cache.has(id))
    return cache.get(id)!

  const options = getConfig().strictAnnotationMatch
    ? {
        includeRegex: defaultIdeMatchInclude,
        excludeRegex: defaultIdeMatchExclude,
      }
    : undefined

  const result = getMatchedPositionsFromCode(
    uno,
    doc.getText(),
    id,
    options,
  )

  cache.set(id, result)
  return result
}
