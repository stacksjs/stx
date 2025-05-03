import * as vscode from 'vscode'
import * as path from 'path'

import { VirtualTsDocumentProvider } from './providers/virtualTsDocumentProvider';
import { createHoverProvider } from './providers/hoverProvider';
import { createDefinitionProvider } from './providers/definitionProvider';

export function activate(context: vscode.ExtensionContext) {
  // Create virtual TypeScript files for each STX file to support language features
  const virtualTsDocumentProvider = new VirtualTsDocumentProvider();

  // Register the virtual document provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('stx-ts', virtualTsDocumentProvider)
  );

  // Track document changes
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument(event => {
    if (event.document.languageId === 'stx') {
      virtualTsDocumentProvider.updateVirtualTsDocument(event.document);
    }
  });

  // Track document opens
  const documentOpenListener = vscode.workspace.onDidOpenTextDocument(document => {
    if (document.languageId === 'stx') {
      virtualTsDocumentProvider.trackDocument(document);

      // Automatically show TypeScript features for STX files
      vscode.window.showInformationMessage('Welcome to STX (Stacks) language support!');

      // Open a virtual TypeScript document for this STX file
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: document.uri.path + '.ts'
      });

      // Load the virtual document in the background to activate TypeScript features
      vscode.workspace.openTextDocument(virtualUri)
        .then(() => {
          console.log('TypeScript virtual document created for', document.uri.toString());
        }, (error: Error) => {
          console.error('Failed to open virtual TypeScript document:', error);
        });
    }
  });

  // Process already open documents
  vscode.workspace.textDocuments.forEach(document => {
    if (document.languageId === 'stx') {
      virtualTsDocumentProvider.trackDocument(document);
    }
  });

  // Register the hover provider for STX files
  const hoverProvider = vscode.languages.registerHoverProvider(
    'stx',
    createHoverProvider(virtualTsDocumentProvider)
  );

  // Register definition provider for cmd+click
  const definitionProvider = vscode.languages.registerDefinitionProvider(
    'stx',
    createDefinitionProvider(virtualTsDocumentProvider)
  );

  // Automatically set language ID for .stx files
  const fileOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const fileName = document.fileName;
    const extension = path.extname(fileName);

    if (extension.toLowerCase() === '.stx' && document.languageId !== 'stx') {
      await vscode.languages.setTextDocumentLanguage(document, 'stx');
    }
  });

  context.subscriptions.push(
    documentChangeListener,
    documentOpenListener,
    fileOpenListener,
    hoverProvider,
    definitionProvider
  );
}

export function deactivate() {}
