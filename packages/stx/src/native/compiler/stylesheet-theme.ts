import { generate, parse, type CssNode } from '@stacksjs/ts-css/parse'

export interface NativeStylesheetTheme {
  light: Array<[string, string]>
  dark: Array<[string, string]>
}

interface Candidate { value: string, important: boolean, specificity: number }

/** Document-level variables only. Never promote a component selector to global scope. */
export async function extractStylesheetTheme(html: string, report: (name: string) => void): Promise<NativeStylesheetTheme> {
  const schemes = { light: new Map<string, Candidate>(), dark: new Map<string, Candidate>() }
  type Scheme = keyof typeof schemes
  const reported = new Set<string>()
  const warn = (name: string): void => { if (!reported.has(name)) { reported.add(name); report(name) } }
  const hasVariables = (node: CssNode): boolean => {
    if (node.type === 'Declaration') return node.property.startsWith('--')
    if (node.type === 'Rule' || node.type === 'Atrule') return !!node.block && [...node.block.children].some(hasVariables)
    return false
  }
  const mediaSchemes = (query: string): Scheme[] | undefined => {
    const normalized = query.replace(/\s+/g, '').toLowerCase()
    if (!normalized || normalized === 'all' || normalized === 'screen') return ['light', 'dark']
    const match = /^(?:screenand)?\(prefers-color-scheme:(light|dark)\)$/.exec(normalized)
    return match ? [match[1] as Scheme] : undefined
  }
  function visit(nodes: Iterable<CssNode>, active: Scheme[]): void {
    for (const node of nodes) {
      if (!hasVariables(node)) continue
      if (node.type === 'Atrule') {
        const query = node.prelude ? generate(node.prelude) : ''
        const enabled = node.name.toLowerCase() === 'media' ? mediaSchemes(query) : undefined
        if (!enabled) { warn(`@${node.name} ${query}`.trim()); continue }
        visit(node.block!.children, active.filter(scheme => enabled.includes(scheme)))
        continue
      }
      if (node.type !== 'Rule') continue
      const selectors = node.prelude.type === 'SelectorList' ? [...node.prelude.children].map(generate) : [generate(node.prelude)]
      for (const selector of selectors) {
        // .dark/.light are the document appearance classes on the web; native
        // appearance supplies the same document-level state without a DOM.
        const match = /^(html|:root)?(?:\.(dark|light))?$/.exec(selector.trim())
        if (!match || (!match[1] && !match[2])) { warn(selector); continue }
        const specificity = (match[1] === ':root' ? 10 : match[1] ? 1 : 0) + (match[2] ? 10 : 0)
        for (const declaration of node.block.children) {
          if (declaration.type !== 'Declaration') { if (hasVariables(declaration)) warn(`nested rule in ${selector}`); continue }
          if (!declaration.property.startsWith('--')) continue
          const candidate = { value: generate(declaration.value), important: !!declaration.important, specificity }
          for (const scheme of active) {
            if (match[2] && match[2] !== scheme) continue
            const previous = schemes[scheme].get(declaration.property)
            if (!previous || Number(candidate.important) > Number(previous.important)
              || (candidate.important === previous.important && candidate.specificity >= previous.specificity))
              schemes[scheme].set(declaration.property, candidate)
          }
        }
      }
    }
  }
  let css = ''
  let active: Scheme[] | undefined
  await new HTMLRewriter().on('style', {
    element(element) {
      css = ''
      const type = element.getAttribute('type')
      active = !type || type.toLowerCase() === 'text/css' ? mediaSchemes(element.getAttribute('media') ?? '') : undefined
      element.onEndTag(() => {
        try {
          const ast = parse(css)
          if (ast.type !== 'StyleSheet') return
          if (!active) { if ([...ast.children].some(hasVariables)) warn('style type/media'); return }
          visit(ast.children, active)
        }
        catch { warn('invalid stylesheet') }
      })
    },
    text(chunk) { css += chunk.text },
  }).transform(new Response(html)).text()
  return {
    light: [...schemes.light].map(([name, entry]) => [name, entry.value]),
    dark: [...schemes.dark].map(([name, entry]) => [name, entry.value]),
  }
}
