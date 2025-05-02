/* eslint-disable no-console */
import * as vscode from 'vscode'

const config = vscode.workspace.getConfiguration('blade')

function activate(context: vscode.ExtensionContext) {
  console.log('Laravel blade activated!')

  const LANGUAGES = { scheme: 'file', language: 'blade' }

  if (config.format.enable === true) {
    context.subscriptions.push(
      vscode.languages.registerDocumentFormattingEditProvider(LANGUAGES, {
        provideDocumentFormattingEdits(document: vscode.TextDocument) {
          const start = new vscode.Position(0, 0)
          const end = new vscode.Position(
            document.lineCount - 1,
            document.lineAt(document.lineCount - 1).text.length,
          )
          const rng = new vscode.Range(start, end)

          return beautify(document, rng)
        },
      }),
    )

    context.subscriptions.push(
      vscode.languages.registerDocumentRangeFormattingEditProvider(LANGUAGES, {
        provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range) {
          let end = range.end

          if (end.character === 0) {
            end = end.translate(-1, Number.MAX_VALUE)
          }
          else {
            end = end.translate(0, Number.MAX_VALUE)
          }

          const rng = new vscode.Range(new vscode.Position(range.start.line, 0), end)

          return beautify(document, rng)
        },
      }),
    )
  }
}

function deactivate() {}

export {
  activate,
  deactivate,
}
