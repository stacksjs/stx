/* eslint-disable regexp/no-super-linear-backtracking, regexp/no-misleading-capturing-group, regexp/optimal-quantifier-concatenation */
import type * as vscode from 'vscode'

// Helper function to find the line number of a @foreach declaration for a given variable
export function findForeachDeclarationForVariable(document: vscode.TextDocument, currentLine: number, variableName: string): number | null {
  // Look for @foreach in previous lines (up to 10 lines back)
  for (let i = 0; i <= 10; i++) {
    // First check the current line
    if (i === 0) {
      const line = document.lineAt(currentLine).text
      const foreachMatch = line.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/)
      if (foreachMatch && foreachMatch[2].trim() === variableName) {
        return currentLine
      }
    }
    // Then check previous lines
    else if (currentLine - i >= 0) {
      const prevLine = document.lineAt(currentLine - i).text
      const prevForeachMatch = prevLine.match(/@foreach\s*\(([^)]+)\s+as\s+(\w+)(?:\s*,\s*(\w+))?\)/)
      if (prevForeachMatch && prevForeachMatch[2].trim() === variableName) {
        return currentLine - i
      }
    }
  }

  return null
}
