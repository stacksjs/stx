import { describe, expect, test } from 'bun:test'
import {
  assertContains,
  assertElementCount,
  assertHasAttribute,
  assertHasElement,
  assertNotContains,
  assertStatusCode,
} from '../src/assertions'
import { createTestResponse } from '../src/request'

describe('assertContains', () => {
  test('passes when html contains text', () => {
    expect(() => assertContains('<p>Hello World</p>', 'Hello')).not.toThrow()
  })

  test('throws when html does not contain text', () => {
    expect(() => assertContains('<p>Hello</p>', 'Goodbye')).toThrow(
      'Expected HTML to contain "Goodbye"',
    )
  })
})

describe('assertNotContains', () => {
  test('passes when html does not contain text', () => {
    expect(() => assertNotContains('<p>Hello</p>', 'Goodbye')).not.toThrow()
  })

  test('throws when html contains text', () => {
    expect(() => assertNotContains('<p>Hello</p>', 'Hello')).toThrow(
      'Expected HTML to NOT contain "Hello"',
    )
  })
})

describe('assertHasElement', () => {
  test('passes when element exists', () => {
    expect(() => assertHasElement('<div><span>x</span></div>', 'span')).not.toThrow()
  })

  test('throws when element is missing', () => {
    expect(() => assertHasElement('<div>text</div>', 'span')).toThrow(
      'Expected HTML to contain <span> element',
    )
  })
})

describe('assertElementCount', () => {
  test('passes when count matches', () => {
    const html = '<ul><li>a</li><li>b</li><li>c</li></ul>'
    expect(() => assertElementCount(html, 'li', 3)).not.toThrow()
  })

  test('throws when count does not match', () => {
    const html = '<ul><li>a</li><li>b</li></ul>'
    expect(() => assertElementCount(html, 'li', 3)).toThrow(
      'Expected 3 <li> element(s) but found 2',
    )
  })

  test('handles zero count', () => {
    expect(() => assertElementCount('<div>text</div>', 'span', 0)).not.toThrow()
  })
})

describe('assertHasAttribute', () => {
  test('passes when attribute exists with matching value', () => {
    const html = '<a href="/home">Home</a>'
    expect(() => assertHasAttribute(html, 'a', 'href', '/home')).not.toThrow()
  })

  test('throws when attribute value does not match', () => {
    const html = '<a href="/home">Home</a>'
    expect(() => assertHasAttribute(html, 'a', 'href', '/about')).toThrow(
      'Expected <a> to have attribute href="/about"',
    )
  })

  test('passes when checking attribute existence without value', () => {
    const html = '<input type="text" disabled>'
    expect(() => assertHasAttribute(html, 'input', 'type')).not.toThrow()
  })

  test('throws when attribute is missing', () => {
    const html = '<input type="text">'
    expect(() => assertHasAttribute(html, 'input', 'disabled')).toThrow(
      'Expected <input> to have attribute "disabled"',
    )
  })
})

describe('assertStatusCode', () => {
  test('passes when status code matches', () => {
    const res = createTestResponse({ status: 200 })
    expect(() => assertStatusCode(res, 200)).not.toThrow()
  })

  test('throws when status code does not match', () => {
    const res = createTestResponse({ status: 404 })
    expect(() => assertStatusCode(res, 200)).toThrow(
      'Expected status code 200 but got 404',
    )
  })
})
