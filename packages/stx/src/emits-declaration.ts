/** Compile-time event contracts. Component setup is never executed to read them. */
import { macroCall } from './component-contract'
import { parseStringLiteral } from './directive-arguments'
import { Tokenizer } from './parser/tokenizer'
import { localType, skipBalanced, splitTopLevel } from './props-declaration'
import type { ComponentLibraryEvent } from './types'


function eventName(raw: string): string | undefined {
  const name = raw.trim()
  return /^[A-Za-z_$][\w$]*$/.test(name) ? name : parseStringLiteral(name) ?? undefined
}

/** The native module emitter puts one argument in detail, and multiple in a tuple. */
function detailFromTuple(tuple: string): string {
  const members = splitTopLevel(tuple.trim().slice(1, -1), ',', true)
  if (members.length !== 1) return tuple.trim()
  const member = members[0]!
  if (member.startsWith('...')) return tuple.trim()
  const labelled = /^(?:[A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/.exec(member)
  return labelled ? `${labelled[2]}${labelled[1] ? ' | undefined' : ''}` : member
}

export interface EmitsDeclaration {
  text: string
  start: number
  end: number
  typeName?: string
  events: Record<string, ComponentLibraryEvent>
}

export function parseEmitsDeclaration(code: string): EmitsDeclaration | null {
  const call = macroCall(code, ['defineEmits'], true)
  if (!call) return null
  const events: Record<string, ComponentLibraryEvent> = Object.create(null)
  const typeName = /^[A-Za-z_$][\w$]*$/.test(call.type.trim()) ? call.type.trim() : undefined
  const type = typeName ? localType(code, typeName) : call.type.trim()
  if (type?.startsWith('{')) {
    for (const member of splitTopLevel(type.slice(1, -1), ';,\n', true)) {
      // The documented overload form: (event: 'change', value: string): void.
      if (member.startsWith('(')) {
        const end = skipBalanced(member, 0, '(', ')')
        if (end < 0) continue
        const parameters = splitTopLevel(member.slice(1, end - 1), ',', true)
        const first = parameters.shift() || ''
        const colon = first.indexOf(':')
        if (colon < 0) continue
        for (const literal of splitTopLevel(first.slice(colon + 1), '|', true)) {
          const name = eventName(literal)
          if (name !== undefined) events[name] = { detailType: detailFromTuple(`[${parameters.join(', ')}]`) }
        }
        continue
      }
      const tokens = new Tokenizer(member, 'javascript').tokenize().filter(token => !['WHITESPACE', 'COMMENT', 'EOF'].includes(token.type))
      const key = tokens[0], colon = tokens.findIndex(token => token.value === ':')
      if (!key || colon < 0) continue
      const name = eventName(key.value)
      const value = member.slice(tokens[colon]!.end).trim()
      if (name !== undefined) events[name] = { detailType: value.startsWith('[') ? detailFromTuple(value) : value }
    }
  }
  else {
    const argument = call.args[0]?.trim() || ''
    if (argument.startsWith('[')) {
      for (const item of splitTopLevel(argument.slice(1, -1), ',', false)) {
        const name = eventName(item)
        if (name !== undefined) events[name] = { detailType: 'unknown' }
      }
    }
    else if (argument.startsWith('{')) {
      for (const member of splitTopLevel(argument.slice(1, -1), ',', false)) {
        const key = new Tokenizer(member, 'javascript').tokenize().find(token => !['WHITESPACE', 'COMMENT'].includes(token.type))
        const name = key && eventName(key.value)
        if (name !== undefined) events[name] = { detailType: 'unknown' }
      }
    }
  }
  return { ...call, text: code.slice(call.start, call.end), typeName, events }
}
