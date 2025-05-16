import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'

/**
 * Extracts a template path from an include or component directive.
 * Handles different formats: 'path/to/file', "path/to/file", etc.
 */
export function extractTemplatePath(line: string): string | null {
  // Regular includes/components with path as first parameter
  // @include('path/to/file'), @component("path/to/file")
  const regularMatch = line.match(/@(?:include|component)\s*\(\s*['"]([^'"]+)['"]/)

  if (regularMatch && regularMatch[1]) {
    return regularMatch[1]
  }

  // Conditional includes with path as second parameter
  // @includeIf(condition, 'path/to/file'), @includeWhen(user.isAdmin, "path/to/file")
  const conditionalMatch = line.match(/@(?:includeIf|includeWhen|includeUnless|includeFirst)\s*\([^,]*,\s*['"]([^'"]+)['"]/)

  if (conditionalMatch && conditionalMatch[1]) {
    return conditionalMatch[1]
  }

  return null
}

/**
 * Normalizes a template path by handling different formats
 * and adding the .stx extension if missing.
 */
export function normalizeTemplatePath(templatePath: string): string {
  // Replace dots with slashes for Laravel-style includes
  let normalizedPath = templatePath.replace(/\./g, '/')

  // Add .stx extension if not present
  if (!normalizedPath.endsWith('.stx')) {
    normalizedPath += '.stx'
  }

  return normalizedPath
}

/**
 * Resolves a template path to a full file path.
 * Searches in common template directories like 'views', 'templates', 'partials', 'components'.
 */
export function resolveTemplatePath(documentUri: vscode.Uri, templatePath: string): vscode.Uri | null {
  const normalizedPath = normalizeTemplatePath(templatePath)
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri)

  if (!workspaceFolder) {
    return null
  }

  // Get the directory of the current document
  const documentDir = path.dirname(documentUri.fsPath)

  // Try to resolve relative to the current document
  const relativePath = path.join(documentDir, normalizedPath)
  if (fs.existsSync(relativePath)) {
    return vscode.Uri.file(relativePath)
  }

  // Common directories to search for templates
  const searchDirs = [
    '', // workspace root
    'views',
    'templates',
    'partials',
    'components',
    'resources/views',
    'resources/templates',
    'examples/partials',
    'examples/components',
  ]

  for (const dir of searchDirs) {
    const fullPath = path.join(workspaceFolder.uri.fsPath, dir, normalizedPath)
    if (fs.existsSync(fullPath)) {
      return vscode.Uri.file(fullPath)
    }
  }

  return null
}

/**
 * Extracts the position of the template path in a directive line.
 */
export function getTemplatePathRange(document: vscode.TextDocument, line: number): vscode.Range | null {
  const lineText = document.lineAt(line).text

  // Regular includes/components with path as first parameter
  const regularMatch = lineText.match(/@(?:include|component)\s*\(\s*(['"])([^'"]+)\1/)

  if (regularMatch) {
    const startPos = lineText.indexOf(regularMatch[2], regularMatch.index!)
    const endPos = startPos + regularMatch[2].length

    return new vscode.Range(
      new vscode.Position(line, startPos),
      new vscode.Position(line, endPos),
    )
  }

  // Conditional includes with path as second parameter
  const conditionalMatch = lineText.match(/@(?:includeIf|includeWhen|includeUnless|includeFirst)\s*\([^,]*,\s*(['"])([^'"]+)\1/)

  if (conditionalMatch) {
    const startPos = lineText.indexOf(conditionalMatch[2], conditionalMatch.index!)
    const endPos = startPos + conditionalMatch[2].length

    return new vscode.Range(
      new vscode.Position(line, startPos),
      new vscode.Position(line, endPos),
    )
  }

  return null
}
