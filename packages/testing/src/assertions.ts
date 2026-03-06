import type { TestResponse } from './types'

/**
 * Assert that html contains the given text.
 */
export function assertContains(html: string, text: string): void {
  if (!html.includes(text)) {
    throw new Error(`Expected HTML to contain "${text}" but it did not.\nHTML: ${html}`)
  }
}

/**
 * Assert that html does NOT contain the given text.
 */
export function assertNotContains(html: string, text: string): void {
  if (html.includes(text)) {
    throw new Error(`Expected HTML to NOT contain "${text}" but it did.\nHTML: ${html}`)
  }
}

/**
 * Assert that html contains an element with the given tag.
 */
export function assertHasElement(html: string, tag: string): void {
  const regex = new RegExp(`<${tag}[\\s>/]`, 'i')
  if (!regex.test(html)) {
    throw new Error(`Expected HTML to contain <${tag}> element but it did not.\nHTML: ${html}`)
  }
}

/**
 * Assert the exact count of a given tag in the html.
 */
export function assertElementCount(html: string, tag: string, count: number): void {
  const regex = new RegExp(`<${tag}[\\s>/]`, 'gi')
  const matches = html.match(regex)
  const actual = matches ? matches.length : 0
  if (actual !== count) {
    throw new Error(
      `Expected ${count} <${tag}> element(s) but found ${actual}.\nHTML: ${html}`,
    )
  }
}

/**
 * Assert that an element has a specific attribute, optionally with a specific value.
 */
export function assertHasAttribute(html: string, tag: string, attr: string, value?: string): void {
  if (value !== undefined) {
    const regex = new RegExp(`<${tag}\\b[^>]*\\s${attr}=["']${escapeRegex(value)}["'][^>]*>`, 'i')
    if (!regex.test(html)) {
      throw new Error(
        `Expected <${tag}> to have attribute ${attr}="${value}" but it did not.\nHTML: ${html}`,
      )
    }
  }
  else {
    const regex = new RegExp(`<${tag}\\b[^>]*\\s${attr}[=\\s>]`, 'i')
    if (!regex.test(html)) {
      throw new Error(
        `Expected <${tag}> to have attribute "${attr}" but it did not.\nHTML: ${html}`,
      )
    }
  }
}

/**
 * Assert the response has a specific status code.
 */
export function assertStatusCode(response: TestResponse, code: number): void {
  if (response.status !== code) {
    throw new Error(`Expected status code ${code} but got ${response.status}`)
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
