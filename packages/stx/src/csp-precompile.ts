import { parse, type Node } from 'acorn'
import { decodeHTML, decodeHTMLAttribute } from 'entities'
import { parseAttributes, decodeAttributeEntities } from './component-processing'
import { compileCspExpression } from './csp-expression'
import { scanHtmlScriptElements, scanHtmlTags } from './html-masking'
import { splitByPipe } from './parser'
import { escapeScriptBody } from './script-emit'

/** Compile the finished author template, never data later written by a binding. */
export function precompileCspBindings(html: string): string {
  for (const script of scanHtmlScriptElements(html).reverse()) {
    if (parseAttributes(script.attrs, { html: true }).some(attr => attr.name === 'data-stx-csp')) html = html.slice(0, script.start) + html.slice(script.end)
  }
  const bodies = new Map<string, string>()
  const setups = new Map<string, string>()
  const add = (key: string, body = key): void => {
    if (!bodies.has(key)) bodies.set(key, compileCspExpression(body))
  }
  const read = (expression: string): void => {
    if (!expression || /^__[A-Z_]+__$/.test(expression.trim())) return
    const parts = splitByPipe(expression)
    const reads = parts.length > 1 ? [parts[0], ...parts.slice(1).flatMap(pipe => pipe.split(':').slice(1).map(arg => arg.trim()))] : [expression]
    for (const expr of reads) {
      add('return ' + expr)
      add('return (' + expr + ')')
    }
  }
  const handler = (value: string): void => {
    if (!value) return
    add(value)
    const assignment = /^\w+\s*(?:[+\-*/])?=\s*(.+)$/.exec(value.trim())
    if (assignment) add('return ' + assignment[1])
    add('reactive:' + value, value + ';')
  }
  const mustaches = (text: string): void => {
    // Comments split DOM text nodes. In particular {<!--stx-literal-->{ is an
    // escaped literal, not a binding formed by deleting the comment.
    for (const segment of text.split(/<!--[\s\S]*?-->/g)) {
      for (const match of decodeHTML(segment).matchAll(/\{\{\s*([\s\S]+?)\s*\}\}/g)) read(match[1])
    }
  }
  let previousEnd = 0
  let raw = false
  for (const tag of scanHtmlTags(html)) {
    if (!raw) mustaches(html.slice(previousEnd, tag.start))
    previousEnd = tag.end
    const name = tag.name.toLowerCase()
    raw = !tag.closing && (name === 'script' || name === 'style')
    if (tag.closing) continue
    const attrs = parseAttributes(tag.attributes, { html: true })
    for (const attr of attrs) {
      const value = decodeHTMLAttribute(typeof attr.value === 'string' ? attr.value : '')
      const name = attr.name
      const base = name.split('.')[0]
      if ([':for', '@for', 'x-for'].includes(base)) {
        const list = /^\s*\(?\s*\w+(?:\s*,\s*\w+)?\s*\)?\s+(?:in|of)\s+(.+)\s*$/.exec(value)
        if (list) read(list[1])
      }
      else if (['x-data', 'data-stx-xdata'].includes(name)) add('return (' + value + ')')
      else if (['x-init', 'data-stx-xinit', 'x-destroy', 'data-stx-xdestroy'].includes(name)) add('reactive:' + value, value + ';')
      else if (name === 'data-stx-memo') read(value)
      else if (name === 'data-stx-slot-scope') {
        const slot = JSON.parse(value)
        add('const ' + slot.binding + ' = __stx_slot_value; return {' + slot.names.join(',') + '};')
      }
      else if (/^(?:@|:|x-)/.test(name) && !/^(?:::|@@)|^(?:x-ref|x-cloak|x-else|:else|@else|x-transition|x-tooltip)(?:[.:]|$)/.test(name)) {
        if (/^(?:@|x-on:)/.test(name) && !/^@(?:if|else-if|show|class|style|text|html|model|bind|key|memo)(?:[.:]|$)/.test(name)) handler(value)
        else {
          read(value)
          // evalAttrExpr and the row planner also apply the legacy STX entity
          // decoder after DOM parsing. Other binding paths use the DOM value.
          const legacyValue = decodeAttributeEntities(value)
          if (legacyValue !== value) read(legacyValue)
          if (/^(?:x-|:|@)model(?:\.|$)/.test(name)) add('model:' + value, value + ' = __v__')
        }
      }
    }
  }
  if (!raw) mustaches(html.slice(previousEnd))

  // The x-data bridge and non-reactive event emitter have already lowered
  // their author strings into literal call arguments. Read those structurally,
  // rather than trying to recover JS with a regex after minification.
  for (const script of scanHtmlScriptElements(html)) {
    const attrs = Object.fromEntries(parseAttributes(script.attrs, { html: true }).map(attr => [attr.name, attr.value]))
    if (attrs.src || 'data-stx-runtime' in attrs || 'data-stx-router' in attrs) continue
    const text = html.slice(script.bodyStart, script.bodyEnd)
    const type = typeof attrs.type === 'string' ? attrs.type : ''
    if (type && !['module', 'text/javascript', 'application/javascript', 'stx/island'].includes(type)) continue
    if ('data-stx-scoped' in attrs || type === 'stx/island') setups.set(text, `function(){\n${text}\n}`)
    const ast = parse(text, { ecmaVersion: 'latest', sourceType: type === 'module' ? 'module' : 'script' })
    const visit = (node: Node): void => {
      if (node.type === 'CallExpression') {
        const call = node as Node & { callee: { name?: string, property?: { name?: string } }, arguments: Array<{ value?: unknown }> }
        const literal = (index: number): string | null => typeof call.arguments[index]?.value === 'string' ? call.arguments[index].value as string : null
        if (call.callee.name === '__stx_runHandler' && literal(0) != null) add('event:' + decodeAttributeEntities(literal(0)!), decodeAttributeEntities(literal(0)!))
        if (call.callee.property?.name === '__stx_execute' && literal(0) != null) add('reactive:' + literal(0), literal(0) + ';')
        if (call.callee.property?.name === 'initScope' && literal(1) != null) {
          add('return (' + literal(1) + ')')
          if (literal(4)) add('reactive:' + literal(4), literal(4) + ';')
        }
      }
      for (const value of Object.values(node)) {
        for (const child of Array.isArray(value) ? value : [value]) {
          if (child && typeof child === 'object' && typeof child.type === 'string') visit(child)
        }
      }
    }
    visit(ast)
  }
  let registry = '__stxCspRegistry__'
  const definitions = [...bodies.values(), ...setups.values()].join('\n')
  while (definitions.includes(registry)) registry += '_'
  const entries = [...bodies].map(([key, value]) => `${registry}.expressions[${JSON.stringify(key)}]=${value};`).join('\n')
  const factories = [...setups].map(([key, value]) => `${registry}.setups[${JSON.stringify(key)}]=${value};`).join('\n')
  const code = `(function(){var ${registry}=window.__STX_CSP__||(window.__STX_CSP__={expressions:Object.create(null),setups:Object.create(null)});\n${entries}\n${factories}\n})();`
  // The router must preserve these bytes: wrapping or appending completion
  // markers changes their CSP hash. Registry ordering also applies to fragments.
  const script = `<script data-stx-csp data-stx-modules data-stx-csp-script>${escapeScriptBody(code)}</script>`
  const firstScript = scanHtmlScriptElements(html)[0]
  const head = /<head\b[^>]*>/i.exec(html)
  const at = firstScript?.start ?? (head ? head.index + head[0].length : 0)
  let output = html.slice(0, at) + script + html.slice(at)
  for (const entry of scanHtmlScriptElements(output).reverse()) {
    const open = output.slice(entry.start, entry.bodyStart)
    if (/\bdata-stx-csp-script\b/.test(open)) continue
    output = output.slice(0, entry.start) + open.replace(/^<script\b/i, '<script data-stx-csp-script') + output.slice(entry.bodyStart)
  }
  return output
}
