import type * as vscode from 'vscode'

/**
 * Sort utility classes based on Crosswind's rule ordering
 */
export async function sortClasses(classes: string[]): Promise<string[]> {
  try {
    const crosswind = await import('@cwcss/crosswind')
    const { builtInRules, parseClass, defaultConfig } = crosswind

    const classesWithPriority = classes.map((className) => {
      const parsed = parseClass(className)

      let priority = Number.MAX_SAFE_INTEGER
      for (let i = 0; i < builtInRules.length; i++) {
        const rule = builtInRules[i]
        const result = rule(parsed, defaultConfig)
        if (result) {
          priority = i
          break
        }
      }

      return { className, priority }
    })

    classesWithPriority.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return a.className.localeCompare(b.className)
    })

    return classesWithPriority.map(item => item.className)
  }
  catch (error) {
    console.error('[Crosswind Sort] Error sorting classes:', error)
    return classes
  }
}

/**
 * Create command to sort classes in the active document
 */
export function createSortClassesCommand(vscodeModule: typeof vscode): vscode.Disposable {
  return vscodeModule.commands.registerCommand('stx.sortClasses', async () => {
    const editor = vscodeModule.window.activeTextEditor

    if (!editor) {
      vscodeModule.window.showErrorMessage('No active editor')
      return
    }

    const document = editor.document
    const text = document.getText()

    const classRegex = /class(?:Name)?=["']([^"']*)["']/g
    let match = classRegex.exec(text)
    const edits: { range: any, newText: string }[] = []

    while (match !== null) {
      const classContent = match[1]
      const classes = classContent.split(/\s+/).filter(Boolean)

      if (classes.length <= 1) {
        match = classRegex.exec(text)
        continue
      }

      const sortedClasses = await sortClasses(classes)
      const sortedContent = sortedClasses.join(' ')

      if (sortedContent !== classContent) {
        const startOffset = match.index + match[0].indexOf(classContent)
        const endOffset = startOffset + classContent.length

        edits.push({
          range: new vscodeModule.Range(
            document.positionAt(startOffset),
            document.positionAt(endOffset),
          ),
          newText: sortedContent,
        })
      }

      match = classRegex.exec(text)
    }

    if (edits.length === 0) {
      vscodeModule.window.showInformationMessage('No classes to sort')
      return
    }

    await editor.edit((editBuilder) => {
      for (const edit of edits) {
        editBuilder.replace(edit.range, edit.newText)
      }
    })

    vscodeModule.window.showInformationMessage(`Sorted ${edits.length} class attribute(s)`)
  })
}
