/* eslint-disable no-console */
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'

import { createCompletionProvider } from './providers/completionProvider'
import { createDefinitionProvider } from './providers/definitionProvider'
import { createDocumentLinkProvider } from './providers/documentLinkProvider'
import { createHoverProvider } from './providers/hoverProvider'
import { VirtualTsDocumentProvider } from './providers/virtualTsDocumentProvider'

export function activate(context: vscode.ExtensionContext) {
  // Create virtual TypeScript files for each STX and MD file to support language features
  const virtualTsDocumentProvider = new VirtualTsDocumentProvider()
  console.log('STX Extension - Activating')

  // Verify snippets file exists
  const snippetsPath = path.join(context.extensionPath, 'src', 'snippets', 'stx.json')
  if (fs.existsSync(snippetsPath)) {
    try {
      const snippetsContent = fs.readFileSync(snippetsPath, 'utf-8')
      const snippets = JSON.parse(snippetsContent)
      console.log(`STX Extension - Loaded ${Object.keys(snippets).length} snippets from ${snippetsPath}`)
    }
    catch (error) {
      console.error(`STX Extension - Error loading snippets: ${error}`)
    }
  }
  else {
    console.error(`STX Extension - Snippets file not found: ${snippetsPath}`)
  }

  // Ensure STX files are recognized
  // The language should be registered in the package.json
  // but we'll force language association here for any .stx files
  vscode.workspace.textDocuments.forEach((document) => {
    if (document.fileName.endsWith('.stx') && document.languageId !== 'stx') {
      vscode.languages.setTextDocumentLanguage(document, 'stx')
        .then(() => console.log(`Set language ID for ${document.fileName} to stx`))
    }
  })

  // Create providers
  const hoverProvider = vscode.languages.registerHoverProvider(
    'stx',
    createHoverProvider(virtualTsDocumentProvider),
  )

  const definitionProvider = vscode.languages.registerDefinitionProvider(
    'stx',
    createDefinitionProvider(virtualTsDocumentProvider),
  )

  // Register document link provider for template paths
  const documentLinkProvider = vscode.languages.registerDocumentLinkProvider(
    'stx',
    createDocumentLinkProvider(),
  )

  // Create a CompletionItemProvider that works for all directives
  const completionProvider = createCompletionProvider()

  // Register for basic trigger, when user types "@"
  const atTriggerCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'stx', // Use simple string identifier
    completionProvider,
    '@', // Trigger on @ symbol
  )

  // Register for additional triggers for parameter completions
  const parameterCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'stx', // Use simple string identifier
    completionProvider,
    '\'', // Trigger on quote
    '"', // Trigger on double-quote
    '`', // Trigger on backtick
    ',', // Trigger on comma
  )

  // Register the virtual document provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('stx-ts', virtualTsDocumentProvider),
  )

  // Track document changes
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'stx'
      || (event.document.languageId === 'markdown' && event.document.fileName.endsWith('.md'))) {
      virtualTsDocumentProvider.updateVirtualTsDocument(event.document)
    }
  })

  // Track document opens
  const documentOpenListener = vscode.workspace.onDidOpenTextDocument((document) => {
    // Handle STX files
    if (document.languageId === 'stx' || document.fileName.endsWith('.stx')) {
      virtualTsDocumentProvider.trackDocument(document)

      // If the file has .stx extension but doesn't have stx language ID, set it
      if (document.languageId !== 'stx' && document.fileName.endsWith('.stx')) {
        vscode.languages.setTextDocumentLanguage(document, 'stx')
          .then(() => console.log(`Set language ID for ${document.fileName} to stx`))
      }

      // Open a virtual TypeScript document for this STX file
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: `${document.uri.path}.ts`,
      })

      // Load the virtual document in the background to activate TypeScript features
      vscode.workspace.openTextDocument(virtualUri)
        .then(() => {
          console.log('TypeScript virtual document created for', document.uri.toString())
        }, (error: Error) => {
          console.error('Failed to open virtual TypeScript document:', error)
        })
    }

    // Handle Markdown files
    if (document.languageId === 'markdown' && document.fileName.endsWith('.md')) {
      virtualTsDocumentProvider.trackDocument(document)

      // Open a virtual TypeScript document for this MD file to support frontmatter
      const virtualUri = document.uri.with({
        scheme: 'stx-ts',
        path: `${document.uri.path}.ts`,
      })

      // Load the virtual document in the background to activate TypeScript features
      vscode.workspace.openTextDocument(virtualUri)
        .then(() => {
          console.log('TypeScript virtual document created for Markdown file', document.uri.toString())
        }, (error: Error) => {
          console.error('Failed to open virtual TypeScript document for Markdown:', error)
        })
    }
  })

  // Process already open documents
  vscode.workspace.textDocuments.forEach((document) => {
    if (document.languageId === 'stx' || document.fileName.endsWith('.stx')) {
      virtualTsDocumentProvider.trackDocument(document)
    }

    // Also track Markdown files
    if (document.languageId === 'markdown' && document.fileName.endsWith('.md')) {
      virtualTsDocumentProvider.trackDocument(document)
    }
  })

  // Automatically set language ID for .stx files
  const fileOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const fileName = document.fileName
    const extension = path.extname(fileName)

    if (extension.toLowerCase() === '.stx' && document.languageId !== 'stx') {
      await vscode.languages.setTextDocumentLanguage(document, 'stx')
      console.log(`Set language ID for ${fileName} to stx`)
    }
  })

  context.subscriptions.push(
    documentChangeListener,
    documentOpenListener,
    fileOpenListener,
    hoverProvider,
    definitionProvider,
    documentLinkProvider,
    atTriggerCompletionProvider,
    parameterCompletionProvider,
  )

  console.log('STX language support activated (with Markdown frontmatter support)')
}

export function deactivate() {
  console.log('STX language support deactivated')
}
