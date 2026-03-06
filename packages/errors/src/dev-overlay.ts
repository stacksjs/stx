import type { StxError } from './error-types'
import type { OverlayConfig } from './types'
import { extractSourceContext, getErrorHint } from './formatter'

export function generateDevOverlay(error: Error, config?: OverlayConfig): string {
  const theme = config?.theme ?? 'dark'
  const showStack = config?.showStack !== false
  const showSource = config?.showSource !== false
  const showHints = config?.showHints !== false

  const stxError = error as StxError
  const hint = showHints ? getErrorHint(error) : null
  const stxHint = showHints && stxError.hint ? stxError.hint : null

  const isDark = theme === 'dark'
  const bg = isDark ? '#1a1a2e' : '#ffffff'
  const fg = isDark ? '#e0e0e0' : '#1a1a1a'
  const errorColor = '#ff6b6b'
  const headerBg = isDark ? '#16213e' : '#f5f5f5'
  const codeBg = isDark ? '#0f0f23' : '#f0f0f0'
  const hintBg = isDark ? '#1e3a2f' : '#e8f5e9'
  const hintColor = isDark ? '#81c784' : '#2e7d32'
  const borderColor = isDark ? '#333' : '#ddd'

  let sourceSection = ''
  if (showSource && stxError.filePath && stxError.line) {
    const sourceLines = extractSourceContext(stxError.filePath, stxError.line)
    if (sourceLines.length > 0) {
      const escapedLines = sourceLines.map(l => escapeHtml(l)).join('\n')
      sourceSection = `
        <div style="margin-top: 20px;">
          <h3 style="color: ${fg}; margin-bottom: 10px;">Source</h3>
          <div style="background: ${codeBg}; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid ${borderColor};">
            <pre style="margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5; color: ${fg};">${escapedLines}</pre>
          </div>
        </div>`
    }
  }

  let stackSection = ''
  if (showStack && error.stack) {
    const stackLines = error.stack.split('\n').slice(1).map(l => escapeHtml(l.trim())).join('\n')
    stackSection = `
        <div style="margin-top: 20px;">
          <h3 style="color: ${fg}; margin-bottom: 10px;">Stack Trace</h3>
          <div style="background: ${codeBg}; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid ${borderColor};">
            <pre style="margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 12px; line-height: 1.6; color: ${fg};">${stackLines}</pre>
          </div>
        </div>`
  }

  let hintSection = ''
  const displayHint = stxHint ?? hint
  if (displayHint) {
    hintSection = `
        <div style="margin-top: 20px; padding: 14px 18px; background: ${hintBg}; border-radius: 8px; border-left: 4px solid ${hintColor};">
          <strong style="color: ${hintColor};">Hint:</strong>
          <span style="color: ${hintColor}; margin-left: 6px;">${escapeHtml(displayHint)}</span>
        </div>`
  }

  let locationInfo = ''
  if (stxError.filePath) {
    let loc = stxError.filePath
    if (stxError.line !== undefined) {
      loc += `:${stxError.line}`
      if (stxError.column !== undefined) {
        loc += `:${stxError.column}`
      }
    }
    locationInfo = `<p style="color: ${fg}; opacity: 0.7; margin: 8px 0 0 0; font-size: 13px;">${escapeHtml(loc)}</p>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - ${escapeHtml(error.name || 'Error')}</title>
</head>
<body style="margin: 0; padding: 0; background: ${bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh;">
  <div style="max-width: 900px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: ${headerBg}; border-radius: 12px; padding: 24px 28px; border: 1px solid ${borderColor};">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <span style="font-size: 14px; font-weight: 600; color: ${errorColor}; background: ${isDark ? '#2d1b1b' : '#fde8e8'}; padding: 4px 10px; border-radius: 4px;">${escapeHtml(error.name || 'Error')}</span>
        ${stxError.code ? `<span style="font-size: 12px; color: ${fg}; opacity: 0.5;">${escapeHtml(stxError.code)}</span>` : ''}
      </div>
      <h1 style="color: ${errorColor}; font-size: 22px; font-weight: 600; margin: 0; line-height: 1.4;">${escapeHtml(error.message)}</h1>
      ${locationInfo}
    </div>
    ${hintSection}
    ${sourceSection}
    ${stackSection}
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
