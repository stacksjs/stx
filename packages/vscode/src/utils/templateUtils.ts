import * as fs from 'node:fs'
import * as path from 'node:path'
import * as vscode from 'vscode'
import {
  COMPONENT_SEARCH_DIRECTORIES,
  findTemplatePathReferences,
  TEMPLATE_SEARCH_DIRECTORIES,
} from './template-paths'

/**
 * Extracts a template path from an include or component directive.
 * Handles different formats: 'path/to/file', "path/to/file", etc.
 */
export function extractTemplatePath(line: string): string | null {
  return findTemplatePathReferences(line)[0]?.path ?? null
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
  const searchDirectories = [...new Set([
    ...TEMPLATE_SEARCH_DIRECTORIES,
    ...COMPONENT_SEARCH_DIRECTORIES,
  ])]

  for (const dir of searchDirectories) {
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
  const reference = findTemplatePathReferences(lineText)[0]
  return reference
    ? new vscode.Range(line, reference.start, line, reference.end)
    : null
}
