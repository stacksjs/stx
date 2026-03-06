import type { RenderResult } from './types'

function createRenderResult(html: string): RenderResult {
  return {
    html,

    contains(text: string): boolean {
      return html.includes(text)
    },

    querySelector(selector: string): string | null {
      // Simplified regex-based tag content matching
      // Supports simple tag selectors like "h1", "div", "p"
      const tag = selector.replace(/[^a-z0-9-]/gi, '')
      if (!tag)
        return null

      // Match self-closing tags or tags with content
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*/\\s*>`, 'i')
      const contentRegex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i')

      const contentMatch = html.match(contentRegex)
      if (contentMatch)
        return contentMatch[1]

      const selfClosingMatch = html.match(selfClosingRegex)
      if (selfClosingMatch)
        return ''

      return null
    },

    hasElement(tag: string): boolean {
      const regex = new RegExp(`<${tag}[\\s>/]`, 'i')
      return regex.test(html)
    },

    getAttribute(tag: string, attr: string): string | null {
      const regex = new RegExp(`<${tag}\\b[^>]*\\s${attr}=["']([^"']*)["'][^>]*>`, 'i')
      const match = html.match(regex)
      return match ? match[1] : null
    },
  }
}

/**
 * Render a template string with data interpolation.
 * Replaces {{ key }} expressions with corresponding values from data.
 */
export function renderTemplate(template: string, data?: Record<string, unknown>): RenderResult {
  let html = template

  if (data) {
    html = html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
      if (key in data) {
        const value = data[key]
        return value == null ? '' : String(value)
      }
      return ''
    })
  }

  return createRenderResult(html)
}

/**
 * Render a named component with props and slots.
 * Generates a component-like HTML structure for testing.
 */
export function renderComponent(
  name: string,
  props?: Record<string, unknown>,
  slots?: Record<string, string>,
): RenderResult {
  const propsStr = props
    ? Object.entries(props)
        .map(([key, value]) => ` ${key}="${String(value)}"`)
        .join('')
    : ''

  const defaultSlot = slots?.default ?? ''
  const namedSlots = slots
    ? Object.entries(slots)
        .filter(([key]) => key !== 'default')
        .map(([key, value]) => `<template slot="${key}">${value}</template>`)
        .join('')
    : ''

  const html = `<${name}${propsStr}>${defaultSlot}${namedSlots}</${name}>`

  return createRenderResult(html)
}
