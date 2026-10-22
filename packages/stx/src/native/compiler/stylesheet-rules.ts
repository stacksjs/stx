import { generate, parse, type CssNode } from '@stacksjs/ts-css/parse'

/**
 * A class's declarations from the page's own stylesheets, as CSS text, by
 * layer: what `.stat-value { ... }` gives an element with that class.
 *
 * Web views style their parts with small classes of their own (`.panel-title`,
 * `.bw-card`) beside the utilities. Natively a class only meant something if
 * it was a utility, so those parts lost their look. The text is parsed where
 * it is applied, so a `var(--hq-action)` in it reads the screen's variables.
 */
export interface NativeStylesheetRule {
  light?: string
  dark?: string
  /** `@media (min-width: ...)` layers, by min-width in points. */
  responsive?: Array<{ min: number, light?: string, dark?: string }>
}

export type NativeStylesheetRules = Record<string, NativeStylesheetRule>

/** The variants a touch screen has no use for: the browser draws these states. */
const POINTER_PSEUDO = /^(?::hover|:active|:visited|:focus|:focus-visible|:focus-within)$/

function mediaLayer(query: string): { dark?: boolean, min?: number } | 'skip' | undefined {
  const normalized = query.replace(/\s+/g, '').toLowerCase()
  if (!normalized || normalized === 'all' || normalized === 'screen') return {}
  if (/^(?:screenand)?\(prefers-color-scheme:dark\)$/.test(normalized)) return { dark: true }
  if (/^(?:screenand)?\(prefers-color-scheme:light\)$/.test(normalized)) return {}
  // States a native host has no notion of, or takes care of itself.
  if (/prefers-reduced-motion|\(hover|\(pointer|print|forced-colors|prefers-contrast/.test(normalized)) return 'skip'
  const width = /^(?:screenand)?\(min-width:([\d.]+)(px|rem|em)\)$/.exec(normalized)
  if (width) return { min: Number(width[1]) * (width[2] === 'px' ? 1 : 16) }
  return undefined
}

/** The page's simple class rules; anything more involved is reported, not guessed at. */
export async function extractStylesheetRules(html: string, report: (name: string) => void): Promise<NativeStylesheetRules> {
  const rules: NativeStylesheetRules = {}
  const reported = new Set<string>()
  const warn = (name: string): void => { if (!reported.has(name)) { reported.add(name); report(name) } }
  const append = (name: string, declarations: string, layer: { dark?: boolean, min?: number }): void => {
    if (!declarations.trim()) return
    const rule = rules[name] ??= {}
    const key = layer.dark ? 'dark' : 'light'
    if (layer.min === undefined) {
      rule[key] = rule[key] ? `${rule[key]};${declarations}` : declarations
      return
    }
    const responsive = rule.responsive ??= []
    let entry = responsive.find(item => item.min === layer.min)
    if (!entry) responsive.push(entry = { min: layer.min })
    entry[key] = entry[key] ? `${entry[key]};${declarations}` : declarations
  }
  function visit(nodes: Iterable<CssNode>, layer: { dark?: boolean, min?: number }): void {
    for (const node of nodes) {
      if (node.type === 'Atrule') {
        const name = node.name.toLowerCase()
        // Fonts, animations and imports are the browser's to load.
        if (['font-face', 'keyframes', '-webkit-keyframes', 'import', 'charset', 'property', 'page', 'layer'].includes(name)) {
          if (name === 'layer' && node.block) visit(node.block.children, layer)
          continue
        }
        if (name !== 'media' || !node.block) { warn(`@${name}`); continue }
        const query = node.prelude ? generate(node.prelude) : ''
        const media = mediaLayer(query)
        if (media === 'skip') continue
        if (!media) { warn(`@media ${query}`); continue }
        visit(node.block.children, { dark: layer.dark || media.dark, min: media.min ?? layer.min })
        continue
      }
      if (node.type !== 'Rule' || node.block.type !== 'Block') continue
      const declarations = [...node.block.children].filter(child => child.type === 'Declaration').map(child => generate(child)).join(';')
      const selectors = node.prelude.type === 'SelectorList' ? [...node.prelude.children].map(generate) : [generate(node.prelude)]
      for (const selector of selectors) {
        const match = /^(?:(?:html|:root)?\.dark\s+)?\.(-?[a-z_][\w-]*)((?::{1,2}[a-z-]+)*)$/i.exec(selector.trim())
        if (!match) {
          // Element and document selectors are the page's base styles, not a class's.
          if (!/^(?:html|:root|body|\*|::?[a-z-]+)/i.test(selector.trim())) warn(selector.trim())
          continue
        }
        const pseudo = match[2]
        if (pseudo) {
          if (!POINTER_PSEUDO.test(pseudo)) warn(selector.trim())
          continue
        }
        const dark = layer.dark || /^(?:(?:html|:root)?\.dark\s+)/i.test(selector.trim())
        append(match[1], declarations, { dark, min: layer.min })
      }
    }
  }
  let css = ''
  let usable = true
  await new HTMLRewriter().on('style', {
    element(element) {
      css = ''
      const type = element.getAttribute('type')
      usable = !type || type.toLowerCase() === 'text/css'
      element.onEndTag(() => {
        if (!usable) return
        try {
          const ast = parse(css)
          if (ast.type === 'StyleSheet') visit(ast.children, {})
        }
        catch { warn('invalid stylesheet') }
      })
    },
    text(chunk) { css += chunk.text },
  }).transform(new Response(html)).text()
  for (const rule of Object.values(rules)) rule.responsive?.sort((a, b) => a.min - b.min)
  return rules
}
