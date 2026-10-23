/** Build-time preparation for templates embedded in standalone menu bar apps. */
import type { BunPlugin } from 'bun'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractAndStripCssImports, renderVendorStyleTags } from './client-script'
import { bundleClientScript, hasUserImports } from './client-script-bundler'
import { scanScriptTags } from './signal-processing'

/**
 * Resolve client imports before starting Bun's outer native build. Server
 * rendering and signal hydration remain runtime operations, so each popup
 * opens with fresh preferences. Every embedded template must be listed.
 */
export async function menuBarTemplatePlugin(options: {
  templates: string[]
  projectRoot?: string
}): Promise<BunPlugin> {
  const templates = new Map<string, string>()
  for (const template of options.templates) {
    const path = realpathSync(resolve(template))
    let source = await Bun.file(path).text()
    const scripts = scanScriptTags(source, {
      skipAttrs: /\bserver\b|\bsrc\s*=|\btype\s*=\s*["'](?!(?:text\/javascript|application\/javascript|module)["'])[^"']*["']/,
    })
    // Work backwards so source positions stay valid across replacements.
    for (const script of scripts.reverse()) {
      const css = extractAndStripCssImports(script.body, { filePath: path, projectRoot: options.projectRoot || process.cwd() })
      const imported = hasUserImports(css.code)
      if (!imported && css.styles.length === 0) continue
      // Formatting TS first also places declarations on separate lines for the
      // bundler's binding scan, preserving handlers used only in the template.
      const transpiler = new Bun.Transpiler({ loader: 'ts', target: 'browser' })
      const code = imported ? await bundleClientScript(transpiler.transformSync(css.code), path, {
        projectRoot: options.projectRoot || process.cwd(),
        externalizeUserModules: false,
        throwOnFailure: true,
      }) : css.code
      const replacement = `${renderVendorStyleTags(css.styles)}<script${script.attrs}>${code.replace(/<\/script/gi, '<\\/script')}</script>`
      source = source.slice(0, script.start) + replacement + source.slice(script.end)
    }
    templates.set(path, source)
  }
  return {
    name: 'stx-menubar-template',
    setup(build) {
      build.onLoad({ filter: /\.stx$/ }, ({ path }) => {
        const contents = templates.get(path)
        if (contents === undefined) throw new Error(`Embedded template was not prepared: ${path}`)
        return { contents, loader: 'text' }
      })
    },
  }
}
