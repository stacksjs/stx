import { readFileSync } from 'node:fs'
import type { StxError } from './error-types'

export function formatError(error: Error): string {
  const stxError = error as StxError
  const parts: string[] = [error.name || 'Error']

  if (stxError.code) {
    parts.push(`[${stxError.code}]`)
  }

  parts.push(error.message)

  if (stxError.filePath) {
    let location = stxError.filePath
    if (stxError.line !== undefined) {
      location += `:${stxError.line}`
      if (stxError.column !== undefined) {
        location += `:${stxError.column}`
      }
    }
    parts.push(`at ${location}`)
  }

  return parts.join(': ')
}

export function formatErrorDetailed(error: Error): string {
  const lines: string[] = []
  const stxError = error as StxError

  lines.push(`${error.name || 'Error'}: ${error.message}`)

  if (stxError.code) {
    lines.push(`  Code: ${stxError.code}`)
  }

  if (stxError.filePath) {
    lines.push(`  File: ${stxError.filePath}`)
  }

  if (stxError.line !== undefined) {
    lines.push(`  Line: ${stxError.line}${stxError.column !== undefined ? `, Column: ${stxError.column}` : ''}`)
  }

  if (stxError.hint) {
    lines.push(`  Hint: ${stxError.hint}`)
  }

  if (error.stack) {
    lines.push('')
    lines.push('Stack trace:')
    const stackLines = error.stack.split('\n').slice(1)
    for (const line of stackLines) {
      lines.push(`  ${line.trim()}`)
    }
  }

  return lines.join('\n')
}

export function extractSourceContext(filePath: string, line: number, contextLines: number = 3): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const allLines = content.split('\n')
    const start = Math.max(0, line - 1 - contextLines)
    const end = Math.min(allLines.length, line + contextLines)
    const result: string[] = []

    for (let i = start; i < end; i++) {
      const lineNum = i + 1
      const prefix = lineNum === line ? '>' : ' '
      result.push(`${prefix} ${String(lineNum).padStart(4)} | ${allLines[i]}`)
    }

    return result
  }
  catch {
    return []
  }
}

export function getErrorHint(error: Error): string | null {
  const msg = error.message.toLowerCase()

  if (msg.includes('cannot find module') || msg.includes('module not found')) {
    return 'Did you install dependencies? Try running `bun install`.'
  }

  if (msg.includes('is not defined') || msg.includes('is not a function')) {
    return 'Check that the variable or function is properly imported or declared.'
  }

  if (msg.includes('enoent') || msg.includes('no such file')) {
    return 'The file or directory does not exist. Check the path for typos.'
  }

  if (msg.includes('eacces') || msg.includes('permission denied')) {
    return 'Permission denied. Check file permissions or run with appropriate access.'
  }

  if (msg.includes('syntax error') || msg.includes('unexpected token')) {
    return 'There is a syntax error in your code. Check for missing brackets, quotes, or semicolons.'
  }

  if (msg.includes('econnrefused') || msg.includes('connection refused')) {
    return 'Connection refused. Is the server running?'
  }

  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'The operation timed out. Check network connectivity or increase the timeout.'
  }

  if (msg.includes('port') && (msg.includes('in use') || msg.includes('already'))) {
    return 'The port is already in use. Try a different port or stop the other process.'
  }

  return null
}
