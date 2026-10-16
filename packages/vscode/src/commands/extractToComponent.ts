import * as path from 'node:path'
import * as vscode from 'vscode'
import {
  componentDirectoryForDocument,
  extractedComponentContent,
  normalizeComponentName,
} from './extract-component'

export function registerExtractToComponentCommand(): vscode.Disposable {
  return vscode.commands.registerCommand('stx.extractToComponent', async (document: vscode.TextDocument, range: vscode.Range) => {
    const selection = document.getText(range)
    if (!selection.trim())
      return

    const requestedName = await vscode.window.showInputBox({
      prompt: 'Name the extracted stx component',
      placeHolder: 'UserCard',
      validateInput: value => normalizeComponentName(value)
        ? undefined
        : 'Use a component name beginning with a letter',
    })
    if (!requestedName)
      return

    const componentName = normalizeComponentName(requestedName)
    if (!componentName)
      return

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
    if (!workspaceFolder) {
      await vscode.window.showErrorMessage('Open the stx file in a workspace before extracting a component.')
      return
    }

    const componentDirectory = componentDirectoryForDocument(
      workspaceFolder.uri.fsPath,
      document.uri.fsPath,
    )
    const componentUri = vscode.Uri.file(path.join(componentDirectory, `${componentName}.stx`))

    try {
      await vscode.workspace.fs.stat(componentUri)
      await vscode.window.showErrorMessage(`Component ${componentName}.stx already exists.`)
      return
    }
    catch {
      // A missing target is the expected path.
    }

    await vscode.workspace.fs.createDirectory(vscode.Uri.file(componentDirectory))

    const edit = new vscode.WorkspaceEdit()
    edit.createFile(componentUri)
    edit.insert(componentUri, new vscode.Position(0, 0), extractedComponentContent(selection))
    edit.replace(document.uri, range, `<${componentName} />`)

    if (!await vscode.workspace.applyEdit(edit)) {
      await vscode.window.showErrorMessage(`Could not extract ${componentName}.stx.`)
      return
    }

    const componentDocument = await vscode.workspace.openTextDocument(componentUri)
    await vscode.window.showTextDocument(componentDocument)
  })
}
