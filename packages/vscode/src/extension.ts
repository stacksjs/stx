import * as vscode from 'vscode'
import * as path from 'path'

import { VirtualTsDocumentProvider } from './providers/virtualTsDocumentProvider';
import { createHoverProvider } from './providers/hoverProvider';
import { createDefinitionProvider } from './providers/definitionProvider';
import { createCompletionProvider } from './providers/completionProvider';

export function activate(context: vscode.ExtensionContext) {
  // Create virtual TypeScript files for each STX file to support language features
  const virtualTsDocumentProvider = new VirtualTsDocumentProvider();
  console.log('STX Extension - Activating');

  // Ensure STX files are recognized
  // The language should be registered in the package.json
  // but we'll force language association here for any .stx files
  vscode.workspace.textDocuments.forEach(document => {
    if (document.fileName.endsWith('.stx') && document.languageId !== 'stx') {
      vscode.languages.setTextDocumentLanguage(document, 'stx')
        .then(() => console.log(`Set language ID for ${document.fileName} to stx`));
    }
  });

  // Create providers
  const hoverProvider = vscode.languages.registerHoverProvider(
    'stx',
    createHoverProvider(virtualTsDocumentProvider)
  );

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    'stx',
    createDefinitionProvider(virtualTsDocumentProvider)
  );

  // Create a CompletionItemProvider that works for all directives
  const completionProvider = createCompletionProvider();

  // Register for basic trigger, when user types "@"
  const atTriggerCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'stx', // Use simple string identifier
    completionProvider,
    '@' // Trigger on @ symbol
  );

  // Register for additional triggers for parameter completions
  const parameterCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'stx', // Use simple string identifier
    completionProvider,
    '\'', // Trigger on quote
    '"', // Trigger on double-quote
    '`', // Trigger on backtick
    ',' // Trigger on comma
  );

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
    if (document.languageId === 'stx' || document.fileName.endsWith('.stx')) {
      virtualTsDocumentProvider.trackDocument(document);

      // If the file has .stx extension but doesn't have stx language ID, set it
      if (document.languageId !== 'stx' && document.fileName.endsWith('.stx')) {
        vscode.languages.setTextDocumentLanguage(document, 'stx')
          .then(() => console.log(`Set language ID for ${document.fileName} to stx`));
      }

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
    if (document.languageId === 'stx' || document.fileName.endsWith('.stx')) {
      virtualTsDocumentProvider.trackDocument(document);
    }
  });

  // Automatically set language ID for .stx files
  const fileOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const fileName = document.fileName;
    const extension = path.extname(fileName);

    if (extension.toLowerCase() === '.stx' && document.languageId !== 'stx') {
      await vscode.languages.setTextDocumentLanguage(document, 'stx');
      console.log(`Set language ID for ${fileName} to stx`);
    }
  });

  context.subscriptions.push(
    documentChangeListener,
    documentOpenListener,
    fileOpenListener,
    hoverProvider,
    definitionProvider,
    atTriggerCompletionProvider,
    parameterCompletionProvider
  );

  console.log('STX language support activated');
}

export function deactivate() {
  console.log('STX language support deactivated');
}
