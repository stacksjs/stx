import { describe, expect, test } from 'bun:test'
import { renderComponent, renderTemplate } from '../src/template'

describe('renderTemplate', () => {
  test('renders a plain template without data', () => {
    const result = renderTemplate('<h1>Hello</h1>')
    expect(result.html).toBe('<h1>Hello</h1>')
  })

  test('interpolates string variables', () => {
    const result = renderTemplate('<h1>{{ title }}</h1>', { title: 'Welcome' })
    expect(result.html).toBe('<h1>Welcome</h1>')
  })

  test('interpolates number variables', () => {
    const result = renderTemplate('<p>Count: {{ count }}</p>', { count: 42 })
    expect(result.html).toBe('<p>Count: 42</p>')
  })

  test('interpolates boolean variables', () => {
    const result = renderTemplate('<p>{{ active }}</p>', { active: true })
    expect(result.html).toBe('<p>true</p>')
  })

  test('replaces null and undefined with empty string', () => {
    const result = renderTemplate('<p>{{ a }}|{{ b }}</p>', { a: null, b: undefined })
    expect(result.html).toBe('<p>|</p>')
  })

  test('replaces missing variables with empty string', () => {
    const result = renderTemplate('<p>{{ missing }}</p>', {})
    expect(result.html).toBe('<p></p>')
  })

  test('handles multiple variables', () => {
    const result = renderTemplate('<p>{{ first }} {{ last }}</p>', {
      first: 'John',
      last: 'Doe',
    })
    expect(result.html).toBe('<p>John Doe</p>')
  })

  test('handles expressions with no spaces', () => {
    const result = renderTemplate('<p>{{name}}</p>', { name: 'Alice' })
    expect(result.html).toBe('<p>Alice</p>')
  })

  test('handles expressions with extra spaces', () => {
    const result = renderTemplate('<p>{{   name   }}</p>', { name: 'Bob' })
    expect(result.html).toBe('<p>Bob</p>')
  })
})

describe('RenderResult.contains', () => {
  test('returns true when text is present', () => {
    const result = renderTemplate('<p>Hello World</p>')
    expect(result.contains('Hello')).toBe(true)
  })

  test('returns false when text is absent', () => {
    const result = renderTemplate('<p>Hello World</p>')
    expect(result.contains('Goodbye')).toBe(false)
  })
})

describe('RenderResult.hasElement', () => {
  test('detects element by tag', () => {
    const result = renderTemplate('<div><span>text</span></div>')
    expect(result.hasElement('div')).toBe(true)
    expect(result.hasElement('span')).toBe(true)
  })

  test('returns false for missing element', () => {
    const result = renderTemplate('<div>text</div>')
    expect(result.hasElement('span')).toBe(false)
  })

  test('detects self-closing elements', () => {
    const result = renderTemplate('<img src="test.png" />')
    expect(result.hasElement('img')).toBe(true)
  })
})

describe('RenderResult.querySelector', () => {
  test('returns content of matched tag', () => {
    const result = renderTemplate('<h1>Title</h1>')
    expect(result.querySelector('h1')).toBe('Title')
  })

  test('returns null for missing tag', () => {
    const result = renderTemplate('<p>text</p>')
    expect(result.querySelector('h1')).toBeNull()
  })

  test('returns first match for multiple elements', () => {
    const result = renderTemplate('<p>first</p><p>second</p>')
    expect(result.querySelector('p')).toBe('first')
  })

  test('returns empty string for self-closing tags', () => {
    const result = renderTemplate('<br />')
    expect(result.querySelector('br')).toBe('')
  })
})

describe('RenderResult.getAttribute', () => {
  test('extracts attribute value', () => {
    const result = renderTemplate('<a href="/home">Home</a>')
    expect(result.getAttribute('a', 'href')).toBe('/home')
  })

  test('returns null for missing attribute', () => {
    const result = renderTemplate('<a href="/home">Home</a>')
    expect(result.getAttribute('a', 'class')).toBeNull()
  })

  test('returns null for missing tag', () => {
    const result = renderTemplate('<div>text</div>')
    expect(result.getAttribute('a', 'href')).toBeNull()
  })

  test('extracts attribute from self-closing tag', () => {
    const result = renderTemplate('<img src="photo.jpg" />')
    expect(result.getAttribute('img', 'src')).toBe('photo.jpg')
  })
})

describe('renderComponent', () => {
  test('renders a component with no props or slots', () => {
    const result = renderComponent('my-widget')
    expect(result.html).toBe('<my-widget></my-widget>')
  })

  test('renders a component with props', () => {
    const result = renderComponent('card', { title: 'Hello', size: 'lg' })
    expect(result.html).toBe('<card title="Hello" size="lg"></card>')
  })

  test('renders a component with default slot', () => {
    const result = renderComponent('card', {}, { default: '<p>Content</p>' })
    expect(result.html).toBe('<card><p>Content</p></card>')
  })

  test('renders a component with named slots', () => {
    const result = renderComponent('layout', {}, {
      default: 'Main',
      header: '<h1>Head</h1>',
    })
    expect(result.contains('Main')).toBe(true)
    expect(result.contains('<template slot="header"><h1>Head</h1></template>')).toBe(true)
  })
})
