import type * as vscode from 'vscode'
import type { CrosswindContext } from './context'
import { extractClassesFromDocument } from './utils/class-matcher'
import { extractColorFromCSS, isColorClass } from './utils/color-extractor'

/**
 * Register color decorations for utility classes
 */
export async function registerColorDecorations(
  vscodeModule: typeof vscode,
  context: CrosswindContext,
  extensionContext: vscode.ExtensionContext,
): Promise<void> {
  const config = vscodeModule.workspace.getConfiguration('stx.utilityClasses')
  const colorPreviewEnabled = config.get<boolean>('colorPreview', true)

  if (!colorPreviewEnabled) {
    return
  }

  const borderRadius = config.get<string>('colorPreviewRadius', '0')

  const colorDecorationType = vscodeModule.window.createTextEditorDecorationType({
    before: {
      width: '0.9em',
      height: '0.9em',
      contentText: ' ',
      border: '1px solid',
      margin: `auto 0.2em auto 0; vertical-align: middle; border-radius: ${borderRadius};`,
    },
    dark: {
      before: {
        borderColor: '#eeeeee50',
      },
    },
    light: {
      before: {
        borderColor: '#00000050',
      },
    },
  })

  async function updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return
    }

    const document = editor.document
    const decorations: vscode.DecorationOptions[] = []
    const classes = extractClassesFromDocument(document)

    for (const { className, start, end } of classes) {
      if (!isColorClass(className)) {
        continue
      }

      try {
        const css = await context.getCSSForClass(className)

        if (!css) {
          continue
        }

        const color = extractColorFromCSS(css)

        if (color) {
          const startPos = document.positionAt(start)
          const endPos = document.positionAt(end)

          decorations.push({
            range: new vscodeModule.Range(startPos, endPos),
            renderOptions: {
              before: {
                backgroundColor: color,
              },
            },
          })
        }
      }
      catch (error) {
        console.error(`[Crosswind] Error processing color class "${className}":`, error)
      }
    }

    editor.setDecorations(colorDecorationType, decorations)
  }

  if (vscodeModule.window.activeTextEditor) {
    await updateDecorations(vscodeModule.window.activeTextEditor)
  }

  extensionContext.subscriptions.push(
    vscodeModule.window.onDidChangeActiveTextEditor(async (editor) => {
      await updateDecorations(editor)
    }),
  )

  let timeout: NodeJS.Timeout | undefined
  extensionContext.subscriptions.push(
    vscodeModule.workspace.onDidChangeTextDocument(async (event) => {
      if (event.document === vscodeModule.window.activeTextEditor?.document) {
        clearTimeout(timeout)
        timeout = setTimeout(async () => {
          await updateDecorations(vscodeModule.window.activeTextEditor)
        }, 300)
      }
    }),
  )

  extensionContext.subscriptions.push({
    dispose: () => {
      colorDecorationType.dispose()
      clearTimeout(timeout)
    },
  })
}
