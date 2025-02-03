import type { BunPlugin } from 'bun'

const plugin: BunPlugin = {
  name: 'bun-plugin-blade',
  async setup(build) {
    build.onLoad({ filter: /\.html$/ }, async ({ path }) => {
      const html = await Bun.file(path).text()

      // Extract script and template sections
      const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
      const template = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

      // Create execution context from script
      const sandbox = { module: { exports: {} } }
      new Function('exports', scriptMatch?.[1] || '')(sandbox.module.exports)
      const context = { ...sandbox.module.exports }

      // Process Blade directives to template literals
      const jsTemplate = template
        .replace(/\n/g, '\\n') // Preserve newlines
        .replace(/`/g, '\\`') // Escape existing backticks
        .replace(/@if\s*\(([^)]+)\)/g, '${$1 ? `')
        .replace(/@elseif\s*\(([^)]+)\)/g, '` : $1 ? `')
        .replace(/@else/g, '` : `')
        .replace(/@endif/g, '`}')

      // Evaluate template with context
      const templateFn = new Function(...Object.keys(context), `return \`${jsTemplate}\`;`)
      const output = templateFn(...Object.values(context))

      return {
        contents: output,
        loader: 'html',
      }
    })
  },
}

export default plugin
