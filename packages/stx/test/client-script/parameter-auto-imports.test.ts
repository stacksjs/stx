import { describe, expect, test } from 'bun:test'
import { referencesName, transformAutoImports } from '../../src/client-script'

describe('ambient helpers respect function parameter scope', () => {
  test.each([
    'function schedule(delay = options.delay ?? 1500) { setTimeout(save, delay) }',
    'const schedule = (delay = 1500) => setTimeout(save, delay)',
    'const callbacks = values.map(delay => () => delay)',
    'const schedule = ({ delay }, ...rest) => { return delay + rest.length }',
    'const schedule = ([delay]) => ({ result: delay })',
    'const object = { schedule(delay) { return delay } }',
    'try { run() } catch (delay) { log(delay) }',
    'function schedule(delay: number): void { save(delay) }',
  ])('%s does not request a browser delay binding', (source) => {
    expect(referencesName(source, 'delay')).toBe(false)
    expect(transformAutoImports(source).browserImports).not.toContain('delay')
  })

  test('a genuine free use outside the parameter scope still imports', () => {
    const source = 'const schedule = delay => delay * 2; await delay(10)'
    expect(referencesName(source, 'delay')).toBe(true)
    expect(transformAutoImports(source).browserImports).toContain('delay')
  })
  test('a renamed destructuring property is not a binding for that property name', () => {
    expect(referencesName('const schedule = ({delay: wait}) => delay(wait)', 'delay', true)).toBe(true)
    expect(referencesName('const schedule = ({delay: wait}) => wait(10)', 'delay')).toBe(false)
  })
  test('regex braces and nested defaults do not truncate a function scope', () => {
    expect(referencesName('function schedule(delay = create(5)) { const pattern = /[}]/; return () => delay }', 'delay')).toBe(false)
    expect(referencesName('const pattern = /delay{1,2}/; await delay(5)', 'delay', true)).toBe(true)
  })
  test('a scoped state callback does not hide a real state call outside it', () => {
    expect(transformAutoImports('function receive(state) { state(1) }; const count = state(0)').stxImports).toContain('state')
    expect(transformAutoImports('function receive(state) { state(1) }').stxImports).not.toContain('state')
  })
  test('interpolations and non-ASCII source retain correct binding offsets', () => {
    expect(referencesName('const label = `📧 ${delay(5)}`', 'delay', true)).toBe(true)
    expect(referencesName('const label = `📧`; function schedule(delay) { return `${delay}` }', 'delay')).toBe(false)
    expect(referencesName('const 𐐀 = 1; function schedule(delay) { return delay }', 'delay')).toBe(false)
  })
})

describe('method definitions are not references', () => {
  test('does not auto-import a name a class or object only defines as a method', () => {
    // bughq's client, bundled into a page: its own `retry` method, called on `this`.
    const source = 'class Client { send(e) { fetch(e).then(() => this.retry(e, 1)) }\n  retry(e, t, r, s = false) { return s } }'
    expect(referencesName(source, 'retry')).toBe(false)
    expect(transformAutoImports(source).browserImports).not.toContain('retry')
    expect(referencesName('const api = { retry(n) { return n } }', 'retry')).toBe(false)
    expect(referencesName('class A { async retry(n) { return n } }', 'retry')).toBe(false)
  })

  test('still sees a call, and a call that runs into a block on the next line', () => {
    expect(referencesName('retry(load, 3)', 'retry')).toBe(true)
    expect(referencesName('if (ok) retry(load, 3)\n{ done() }', 'retry')).toBe(true)
    expect(referencesName('const x = ok ? retry(load) : {}', 'retry')).toBe(true)
  })
})
