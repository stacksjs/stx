import * as vscode from 'vscode'

/**
 * Creates a code actions provider for quick fixes
 */
export function createCodeActionsProvider(): vscode.CodeActionProvider {
  return {
    provideCodeActions(document, range, context, token) {
      const actions: vscode.CodeAction[] = []

      // Directive pairs
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

      // Check for diagnostics at the current position
      for (const diagnostic of context.diagnostics) {
        // Handle unclosed directives
        if (diagnostic.message.includes('Unclosed @')) {
          const match = diagnostic.message.match(/Unclosed @(\w+).*Expected @(\w+)/)
          if (match) {
            const directiveName = match[1]
            const endDirective = match[2]

            // Create a quick fix to add the closing directive
            const fix = new vscode.CodeAction(
              `Add missing @${endDirective}`,
              vscode.CodeActionKind.QuickFix,
            )
            fix.diagnostics = [diagnostic]
            fix.isPreferred = true

            // Find the end of the directive block (or end of document)
            let insertLine = document.lineCount - 1

            // Try to find a good insertion point (after the last line with content)
            for (let i = diagnostic.range.start.line + 1; i < document.lineCount; i++) {
              const line = document.lineAt(i).text.trim()
              // Stop at another directive at the same indentation level
              if (line.match(/^@\w+/) && !line.startsWith(`@end`)) {
                insertLine = i - 1
                break
              }
            }

            // Get indentation of the opening directive
            const openingLine = document.lineAt(diagnostic.range.start.line)
            const indent = openingLine.text.match(/^\s*/)?.[0] || ''

            fix.edit = new vscode.WorkspaceEdit()
            fix.edit.insert(
              document.uri,
              new vscode.Position(insertLine + 1, 0),
              `${indent}@${endDirective}\n`,
            )

            actions.push(fix)
          }
        }

        // Handle mismatched directives
        if (diagnostic.message.includes('Mismatched directive')) {
          const match = diagnostic.message.match(/Expected @(\w+) but found @(\w+)/)
          if (match) {
            const expectedEnd = match[1]
            const foundEnd = match[2]

            // Create a quick fix to replace with correct directive
            const fix = new vscode.CodeAction(
              `Change to @${expectedEnd}`,
              vscode.CodeActionKind.QuickFix,
            )
            fix.diagnostics = [diagnostic]
            fix.isPreferred = true

            fix.edit = new vscode.WorkspaceEdit()
            fix.edit.replace(
              document.uri,
              diagnostic.range,
              expectedEnd,
            )

            actions.push(fix)
          }
        }

        // Handle unexpected closing directives
        if (diagnostic.message.includes('Unexpected @end')) {
          const match = diagnostic.message.match(/Unexpected @(\w+)/)
          if (match) {
            const directiveName = match[1]

            // Create a quick fix to remove the directive
            const removeFix = new vscode.CodeAction(
              `Remove @${directiveName}`,
              vscode.CodeActionKind.QuickFix,
            )
            removeFix.diagnostics = [diagnostic]

            const line = document.lineAt(diagnostic.range.start.line)
            removeFix.edit = new vscode.WorkspaceEdit()
            removeFix.edit.delete(
              document.uri,
              line.range,
            )

            actions.push(removeFix)
          }
        }
      }

      // Additional code actions based on context
      const line = document.lineAt(range.start.line)
      const lineText = line.text

      // Suggest converting @if to @unless (and vice versa)
      const ifMatch = lineText.match(/@if\s*\(\s*!\s*(.+?)\s*\)/)
      if (ifMatch && range.start.character <= lineText.indexOf('@if') + 3) {
        const condition = ifMatch[1]
        const convertAction = new vscode.CodeAction(
          'Convert to @unless',
          vscode.CodeActionKind.RefactorRewrite,
        )
        convertAction.edit = new vscode.WorkspaceEdit()
        convertAction.edit.replace(
          document.uri,
          new vscode.Range(
            new vscode.Position(range.start.line, lineText.indexOf('@if')),
            new vscode.Position(range.start.line, lineText.indexOf(')') + 1),
          ),
          `@unless(${condition})`,
        )
        actions.push(convertAction)
      }

      const unlessMatch = lineText.match(/@unless\s*\((.+?)\)/)
      if (unlessMatch && range.start.character <= lineText.indexOf('@unless') + 7) {
        const condition = unlessMatch[1]
        const convertAction = new vscode.CodeAction(
          'Convert to @if with negation',
          vscode.CodeActionKind.RefactorRewrite,
        )
        convertAction.edit = new vscode.WorkspaceEdit()
        convertAction.edit.replace(
          document.uri,
          new vscode.Range(
            new vscode.Position(range.start.line, lineText.indexOf('@unless')),
            new vscode.Position(range.start.line, lineText.indexOf(')') + 1),
          ),
          `@if(!${condition})`,
        )
        actions.push(convertAction)
      }

      // Extract to component action for selected HTML
      if (!range.isEmpty) {
        const selectedText = document.getText(range)
        if (selectedText.includes('<') && selectedText.includes('>')) {
          const extractAction = new vscode.CodeAction(
            'Extract to component',
            vscode.CodeActionKind.RefactorExtract,
          )
          extractAction.command = {
            command: 'stx.extractToComponent',
            title: 'Extract to Component',
            arguments: [document, range],
          }
          actions.push(extractAction)
        }
      }

      return actions
    },
  }
}
