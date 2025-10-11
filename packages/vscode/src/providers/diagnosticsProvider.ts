import * as vscode from 'vscode'

/**
 * Creates a diagnostic collection for stx files
 */
export function createDiagnosticsProvider(context: vscode.ExtensionContext): vscode.DiagnosticCollection {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('stx')
  context.subscriptions.push(diagnosticCollection)

  // Update diagnostics when document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'stx' || event.document.fileName.endsWith('.stx')) {
        updateDiagnostics(event.document, diagnosticCollection)
      }
    }),
  )

  // Update diagnostics when document opens
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'stx' || document.fileName.endsWith('.stx')) {
        updateDiagnostics(document, diagnosticCollection)
      }
    }),
  )

  // Update diagnostics for already open documents
  vscode.workspace.textDocuments.forEach((document) => {
    if (document.languageId === 'stx' || document.fileName.endsWith('.stx')) {
      updateDiagnostics(document, diagnosticCollection)
    }
  })

  // Clear diagnostics when document closes
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnosticCollection.delete(document.uri)
    }),
  )

  return diagnosticCollection
}

/**
 * Directive pairs that need to be matched
 */
const directivePairs: Record<string, string> = {
  if: 'endif',
  unless: 'endunless',
  for: 'endfor',
  foreach: 'endforeach',
  forelse: 'endforelse',
  while: 'endwhile',
  switch: 'endswitch',
  ts: 'endts',
  js: 'endjs',
  script: 'endscript',
  css: 'endcss',
  markdown: 'endmarkdown',
  raw: 'endraw',
  verbatim: 'endverbatim',
  component: 'endcomponent',
  slot: 'endslot',
  webcomponent: 'endwebcomponent',
  section: 'endsection',
  push: 'endpush',
  pushIf: 'endpushIf',
  pushOnce: 'endpushOnce',
  prepend: 'endprepend',
  prependOnce: 'endprependOnce',
  auth: 'endauth',
  guest: 'endguest',
  can: 'endcan',
  cannot: 'endcannot',
  env: 'endenv',
  isset: 'endisset',
  empty: 'endempty',
  error: 'enderror',
  once: 'endonce',
  transition: 'endtransition',
  motion: 'endmotion',
  scrollAnimate: 'endscrollAnimate',
}

/**
 * Updates diagnostics for a document
 */
function updateDiagnostics(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection): void {
  const diagnostics: vscode.Diagnostic[] = []

  // Stack to track open directives
  interface DirectiveInfo {
    name: string
    line: number
    character: number
  }
  const stack: DirectiveInfo[] = []

  // Regular expression to match directives
  const directiveRegex = /@(\w+)(?:\(|$|\s)/g

  // Process each line
  for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
    const line = document.lineAt(lineNum)
    const text = line.text

    // Find all directives in the line
    let match: RegExpExecArray | null
    directiveRegex.lastIndex = 0
    while ((match = directiveRegex.exec(text)) !== null) {
      const directiveName = match[1]
      const position = match.index + 1 // +1 to skip the @

      // Check if it's an opening directive
      if (directivePairs[directiveName]) {
        stack.push({
          name: directiveName,
          line: lineNum,
          character: position,
        })
      }
      // Check if it's a closing directive
      else {
        // Check if this is an end directive
        const isEndDirective = directiveName.startsWith('end')
        if (isEndDirective) {
          // Find the corresponding opening directive
          const openingName = Object.keys(directivePairs).find(
            key => directivePairs[key] === directiveName,
          )

          if (openingName) {
            // Pop from stack if it matches
            if (stack.length > 0) {
              const lastOpening = stack[stack.length - 1]
              if (lastOpening.name === openingName) {
                stack.pop()
              }
              else {
                // Mismatched directive
                const diagnostic = new vscode.Diagnostic(
                  new vscode.Range(
                    new vscode.Position(lineNum, position),
                    new vscode.Position(lineNum, position + directiveName.length),
                  ),
                  `Mismatched directive. Expected @${directivePairs[lastOpening.name]} but found @${directiveName}`,
                  vscode.DiagnosticSeverity.Error,
                )
                diagnostics.push(diagnostic)
              }
            }
            else {
              // Closing directive without opening
              const diagnostic = new vscode.Diagnostic(
                new vscode.Range(
                  new vscode.Position(lineNum, position),
                  new vscode.Position(lineNum, position + directiveName.length),
                ),
                `Unexpected @${directiveName}. No matching opening directive found`,
                vscode.DiagnosticSeverity.Error,
              )
              diagnostics.push(diagnostic)
            }
          }
        }
      }
    }
  }

  // Report unclosed directives
  for (const unclosed of stack) {
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(
        new vscode.Position(unclosed.line, unclosed.character),
        new vscode.Position(unclosed.line, unclosed.character + unclosed.name.length),
      ),
      `Unclosed @${unclosed.name} directive. Expected @${directivePairs[unclosed.name]}`,
      vscode.DiagnosticSeverity.Warning,
    )
    diagnostics.push(diagnostic)
  }

  diagnosticCollection.set(document.uri, diagnostics)
}
