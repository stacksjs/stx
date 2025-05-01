import * as vscode from 'vscode'
import * as path from 'path'

export function activate(context: vscode.ExtensionContext) {
  // Register command to set language mode to STX
  const setLanguageMode = vscode.commands.registerCommand('stx.setLanguageMode', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await vscode.languages.setTextDocumentLanguage(editor.document, 'stx');
      vscode.window.showInformationMessage('Language mode set to STX');
    } else {
      vscode.window.showWarningMessage('No active editor found to set language mode.');
    }
  });

  // Show a welcome message when an STX file is opened
  const stxOpenListener = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'stx') {
      vscode.window.showInformationMessage('Welcome to STX (Stacks) language support!');
    }
  });

  // Automatically set language ID for .stx files
  const documentOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const fileName = document.fileName;
    const extension = path.extname(fileName);

    if (extension.toLowerCase() === '.stx' && document.languageId !== 'stx') {
      await vscode.languages.setTextDocumentLanguage(document, 'stx');
    }
  });

  // Check all currently open documents
  vscode.workspace.textDocuments.forEach(async (document) => {
    const fileName = document.fileName;
    const extension = path.extname(fileName);

    if (extension.toLowerCase() === '.stx' && document.languageId !== 'stx') {
      await vscode.languages.setTextDocumentLanguage(document, 'stx');
    }
  });

  context.subscriptions.push(
    setLanguageMode,
    stxOpenListener,
    documentOpenListener
  );
}

export function deactivate() {}
