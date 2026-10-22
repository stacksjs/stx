/** Source ranges for slot-local bindings, shared by rendering and typechecking. */
export interface SlotScope {
  start: number
  end: number
  binding: string
}

export function collectSlotScopes(source: string): SlotScope[] {
  if (!source.includes('#') && !source.includes('v-slot:') && !source.includes('data-stx-slot-binding'))
    return []
  const scopes: SlotScope[] = []
  const stack: Array<SlotScope | undefined> = []
  // Consume complete tags and raw regions: quoted tag text and script strings
  // must not introduce scopes.
  const tags = /<!--[\s\S]*?-->|<script\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/script\s*>|<style\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/style\s*>|<\/?[a-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi
  for (const match of source.matchAll(tags)) {
    const tag = match[0]
    if (/^<\/template\s*>$/i.test(tag)) {
      const scope = stack.pop()
      if (scope)
        scope.end = match.index
    }
    else if (/^<template\b/i.test(tag) && !/\/\s*>$/.test(tag)) {
      const attrs = tag.slice('<template'.length)
      const binding = [...attrs.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
        .find(attr => /^(?:#[\w-]+|v-slot:[\w-]+|data-stx-slot-binding)$/i.test(attr[1]))
      let value = (binding?.[2] ?? binding?.[3])?.trim()
      if (value && binding?.[1] === 'data-stx-slot-binding') {
        try { value = decodeURIComponent(value) }
        catch { value = undefined }
      }
      const scope = value ? { start: match.index + tag.length, end: source.length, binding: value } : undefined
      stack.push(scope)
      if (scope)
        scopes.push(scope)
    }
  }
  return scopes
}
