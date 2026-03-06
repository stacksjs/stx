export function generate404Page(config?: { title?: string, message?: string }): string {
  const title = config?.title ?? 'Page Not Found'
  const message = config?.message ?? 'The page you are looking for does not exist or has been moved.'

  return generateFallbackPage({
    statusCode: 404,
    title,
    message,
  })
}

export function generate500Page(config?: { title?: string, message?: string, showError?: boolean, error?: Error }): string {
  const title = config?.title ?? 'Internal Server Error'
  const message = config?.message ?? 'Something went wrong. Please try again later.'

  let errorDetail = ''
  if (config?.showError && config?.error) {
    errorDetail = `
      <div style="margin-top: 24px; padding: 16px; background: #1a1a2e; border-radius: 8px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
        <pre style="margin: 0; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 13px; color: #e0e0e0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(config.error.message)}</pre>
      </div>`
  }

  return generateFallbackPage({
    statusCode: 500,
    title,
    message,
    extra: errorDetail,
  })
}

export function generateMaintenancePage(config?: { title?: string, message?: string, retryAfter?: number }): string {
  const title = config?.title ?? 'Under Maintenance'
  const message = config?.message ?? 'We are currently performing scheduled maintenance. Please check back soon.'

  let retryInfo = ''
  if (config?.retryAfter) {
    const minutes = Math.ceil(config.retryAfter / 60)
    retryInfo = `
      <p style="color: #999; font-size: 14px; margin-top: 16px;">
        Estimated time: ${minutes} minute${minutes === 1 ? '' : 's'}
      </p>`
  }

  return generateFallbackPage({
    statusCode: 503,
    title,
    message,
    extra: retryInfo,
    icon: 'wrench',
  })
}

function generateFallbackPage(opts: {
  statusCode: number
  title: string
  message: string
  extra?: string
  icon?: string
}): string {
  const iconSvg = opts.icon === 'wrench'
    ? `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
    : `<div style="font-size: 64px; color: #444; margin-bottom: 16px;">${opts.statusCode}</div>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin: 0; padding: 0; background: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
  <div style="text-align: center; padding: 40px 20px; max-width: 500px;">
    ${iconSvg}
    <h1 style="color: #e0e0e0; font-size: 28px; font-weight: 600; margin: 16px 0 12px 0;">${escapeHtml(opts.title)}</h1>
    <p style="color: #888; font-size: 16px; line-height: 1.6; margin: 0;">${escapeHtml(opts.message)}</p>
    ${opts.extra ?? ''}
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
