/**
 * SPA Shell Generator
 *
 * When `ssr: false` is set in the config, templates are not processed
 * server-side. Instead, a client-side shell is served that contains:
 * - A mount point for the application
 * - The raw template in a <template> tag
 * - Serialized context data for client-side hydration
 * - A bootstrap script that initializes the signals runtime
 */

export interface SpaShellOptions {
  /** The raw template content (unprocessed directives) */
  template: string
  /** Context/variables to serialize for client-side use */
  context?: Record<string, unknown>
  /** Page title */
  title?: string
}

/**
 * Escape a string for safe embedding inside a JSON <script> block.
 * Prevents XSS via </script> injection and Unicode line terminators.
 */
function escapeJsonForScript(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/**
 * Strip internal context properties (prefixed with `__`) that should
 * not be exposed to the client.
 */
function stripInternalProps(context: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const key of Object.keys(context)) {
    if (!key.startsWith('__')) {
      cleaned[key] = context[key]
    }
  }
  return cleaned
}

/**
 * Generate a client-side SPA shell that wraps the raw template
 * for client-side rendering.
 */
export function generateSpaShell(options: SpaShellOptions): string {
  const { template, context = {}, title = 'stx App' } = options

  const clientData = stripInternalProps(context)
  const serializedData = escapeJsonForScript(JSON.stringify(clientData))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
  <div id="stx-app"></div>
  <template id="stx-template">${template}</template>
  <script>window.__STX_DATA__ = ${serializedData};</script>
  <script type="module">
    // stx client-side bootstrap
    const template = document.getElementById('stx-template');
    const app = document.getElementById('stx-app');
    if (template && app) {
      app.innerHTML = template.innerHTML;
    }
  </script>
</body>
</html>`
}
