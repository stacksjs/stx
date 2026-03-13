import type * as vscode from 'vscode'
import type { HeadwindContext } from './context'
import { extractClassesFromDocument } from './utils/class-matcher'
import { extractColorFromCSS, isColorClass } from './utils/color-extractor'

/**
 * Register color decorations for utility classes
 */
export async function registerColorDecorations(
  vscodeModule: typeof vscode,
  context: HeadwindContext,
  extensionContext: vscode.ExtensionContext,
): Promise<void> {
  const config = vscodeModule.workspace.getConfiguration('stx.utilityClasses')
  const colorPreviewEnabled = config.get<boolean>('colorPreview', true)

  if (!colorPreviewEnabled) {
    return
  }

  // Get border radius setting
  const borderRadius = config.get<string>('colorPreviewRadius', '0')

  // Create decoration type for color previews
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

  /**
   * Update decorations for the active editor
   */
  async function updateDecorations(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return
    }

    const document = editor.document
    const decorations: vscode.DecorationOptions[] = []

    // Extract all classes from the document
    const classes = extractClassesFromDocument(document)

    for (const { className, start, end } of classes) {
      // Skip non-color classes
      if (!isColorClass(className)) {
        continue
      }

      try {
        // Get CSS for this class
        const css = await context.getCSSForClass(className)

        if (!css) {
          continue
        }

        // Extract color from CSS
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
        console.error(`[Headwind] Error processing color class "${className}":`, error)
      }
    }

    editor.setDecorations(colorDecorationType, decorations)
  }

  // Update decorations for active editor
  if (vscodeModule.window.activeTextEditor) {
    await updateDecorations(vscodeModule.window.activeTextEditor)
  }

  // Listen for editor changes
  extensionContext.subscriptions.push(
    vscodeModule.window.onDidChangeActiveTextEditor(async (editor) => {
      await updateDecorations(editor)
    }),
  )

  // Listen for document changes (with debounce)
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

  // Clean up
  extensionContext.subscriptions.push({
    dispose: () => {
      colorDecorationType.dispose()
      clearTimeout(timeout)
    },
  })
}
