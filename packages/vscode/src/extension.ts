import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'

import { createCodeActionsProvider } from './providers/codeActionsProvider'
import { createCompletionProvider } from './providers/completionProvider'
import { createDefinitionProvider } from './providers/definitionProvider'
import { createDiagnosticsProvider } from './providers/diagnosticsProvider'
import { createDocumentLinkProvider } from './providers/documentLinkProvider'
import { createFoldingRangeProvider } from './providers/foldingProvider'
import { createHoverProvider } from './providers/hoverProvider'
import { createPathCompletionProvider } from './providers/pathCompletionProvider'
import { createSemanticTokensProvider, legend } from './providers/semanticTokensProvider'
import { VirtualTsDocumentProvider } from './providers/virtualTsDocumentProvider'
import { ComponentRegistry } from './services/ComponentRegistry'

export async function activate(context: vscode.ExtensionContext) {
  // Create virtual TypeScript files for each stx and MD file to support language features
  const virtualTsDocumentProvider = new VirtualTsDocumentProvider()
  console.log('stx Extension - Activating')

  // Initialize the ComponentRegistry for prop type inference
  const componentRegistry = ComponentRegistry.getInstance()
  componentRegistry.scanWorkspace().then(() => {
    console.log(`stx Extension - ComponentRegistry initialized with ${componentRegistry.getAllComponents().length} components`)
  })
  componentRegistry.watchWorkspace(context)

  // Verify snippets file exists
  const snippetsPath = path.join(context.extensionPath, 'src', 'snippets', 'stx.json')
  if (fs.existsSync(snippetsPath)) {
    try {
      const snippetsContent = fs.readFileSync(snippetsPath, 'utf-8')
      const snippets = JSON.parse(snippetsContent)
      console.log(`stx Extension - Loaded ${Object.keys(snippets).length} snippets from ${snippetsPath}`)
    }
    catch (error) {
      console.error(`stx Extension - Error loading snippets: ${error}`)
    }
  }
  else {
    console.error(`stx Extension - Snippets file not found: ${snippetsPath}`)
  }

  // Ensure stx files are recognized
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
    '.', // Trigger on dot for props. completion
  )

  // Register path completion provider for @include and @component
  const pathCompletionProvider = vscode.languages.registerCompletionItemProvider(
    'stx',
    createPathCompletionProvider(),
    '/', // Trigger on forward slash for path navigation
    '\'', // Trigger on quote
    '"', // Trigger on double-quote
  )

  // Register the virtual document provider
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('stx-ts', virtualTsDocumentProvider),
  )

  // Create diagnostics provider for syntax validation
  createDiagnosticsProvider(context)

  // Register code actions provider for quick fixes
  const codeActionsProvider = vscode.languages.registerCodeActionsProvider(
    'stx',
    createCodeActionsProvider(),
    {
      providedCodeActionKinds: [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.RefactorRewrite,
        vscode.CodeActionKind.RefactorExtract,
      ],
    },
  )

  // Register folding range provider
  const foldingRangeProvider = vscode.languages.registerFoldingRangeProvider(
    'stx',
    createFoldingRangeProvider(),
  )

  // Register semantic tokens provider for enhanced syntax highlighting
  const semanticTokensProvider = vscode.languages.registerDocumentSemanticTokensProvider(
    'stx',
    createSemanticTokensProvider(),
    legend,
  )

  // Track document changes with debouncing to avoid excessive recomputation
  let updateTimeout: ReturnType<typeof setTimeout> | undefined
  const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'stx'
      || (event.document.languageId === 'markdown' && event.document.fileName.endsWith('.md'))) {
      clearTimeout(updateTimeout)
      updateTimeout = setTimeout(() => {
        virtualTsDocumentProvider.updateVirtualTsDocument(event.document)
      }, 150)
    }
  })

  // Track document opens and create virtual TypeScript documents
  const documentOpenListener = vscode.workspace.onDidOpenTextDocument(async (document) => {
    const isStx = document.languageId === 'stx' || document.fileName.endsWith('.stx')
    const isMarkdown = document.languageId === 'markdown' && document.fileName.endsWith('.md')

    if (!isStx && !isMarkdown) return

    virtualTsDocumentProvider.trackDocument(document)

    // Set language ID for .stx files if needed
    if (isStx && document.languageId !== 'stx') {
      try {
        await vscode.languages.setTextDocumentLanguage(document, 'stx')
      }
      catch {
        // Language may already be set
      }
    }

    // Create virtual TypeScript document for IDE features
    const virtualUri = document.uri.with({
      scheme: 'stx-ts',
      path: `${document.uri.path}.ts`,
    })

    try {
      await vscode.workspace.openTextDocument(virtualUri)
    }
    catch (error) {
      console.error('Failed to open virtual TypeScript document:', error)
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

  context.subscriptions.push(
    documentChangeListener,
    documentOpenListener,
    hoverProvider,
    definitionProvider,
    documentLinkProvider,
    atTriggerCompletionProvider,
    parameterCompletionProvider,
    pathCompletionProvider,
    codeActionsProvider,
    foldingRangeProvider,
    semanticTokensProvider,
  )

  // Activate Crosswind utility class features
  const utilityClassesEnabled = vscode.workspace.getConfiguration('stx.utilityClasses').get<boolean>('enable', true)

  if (utilityClassesEnabled) {
    try {
      const { activateCrosswind } = await import('./crosswind/index')
      await activateCrosswind(context)
      console.log('stx Extension - Crosswind utility class features activated')
    }
    catch (error) {
      console.error('stx Extension - Failed to activate Crosswind features:', error)
      vscode.window.showErrorMessage(`Failed to activate Crosswind: ${error}`)
    }
  }

  console.log('stx language support activated (with Markdown frontmatter support)')
}

export function deactivate() {
  // Clean up the ComponentRegistry
  ComponentRegistry.resetInstance()
  console.log('stx language support deactivated')
}
