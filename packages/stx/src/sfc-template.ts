/**
 * Locate the explicit wrapper `<template>` in an STX single-file component.
 *
 * A bare `<template>` can be an SFC wrapper, while a template carrying a
 * client directive (`:for`, `@if`, `x-else`, slots, or an id) is runtime DOM
 * and must stay in the rendered body. Keeping this distinction in one scanner
 * avoids subtle regex boundary bugs for punctuation-prefixed attributes.
 */

export interface SfcTemplateBlock {
  start: number
  openEnd: number
  closeStart: number
  end: number
  content: string
}

const TEMPLATE_TAG_RE = /<\/?template\b[^>]*>/gi
const CLIENT_TEMPLATE_ATTRIBUTE_RE
  = /(?:^|\s)(?:id\s*=|(?:x-|[@:])(?:for|if|else(?:-if)?)(?=\s|=|$)|#[\w-]+(?:\s*=|\s|$)|v-slot(?::[\w-]+)?(?=\s|=|$)|slot\s*=)/i

export function isClientTemplateTag(openingTag: string): boolean {
  const attrs = openingTag
    .replace(/^<template\b/i, '')
    .replace(/>$/, '')

  return CLIENT_TEMPLATE_ATTRIBUTE_RE.test(attrs)
}

export function findSfcTemplateBlock(source: string): SfcTemplateBlock | null {
  TEMPLATE_TAG_RE.lastIndex = 0

  let opening: RegExpExecArray | null
  while ((opening = TEMPLATE_TAG_RE.exec(source)) !== null) {
    if (opening[0].startsWith('</') || isClientTemplateTag(opening[0]))
      continue

    const start = opening.index
    const openEnd = TEMPLATE_TAG_RE.lastIndex
    let depth = 1
    let nested: RegExpExecArray | null

    while ((nested = TEMPLATE_TAG_RE.exec(source)) !== null) {
      if (nested[0].startsWith('</')) {
        depth--
        if (depth === 0) {
          const closeStart = nested.index
          return {
            start,
            openEnd,
            closeStart,
            end: TEMPLATE_TAG_RE.lastIndex,
            content: source.slice(openEnd, closeStart),
          }
        }
      }
      else {
        depth++
      }
    }

    return null
  }

  return null
}
