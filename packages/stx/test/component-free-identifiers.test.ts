/**
 * Which names in a binding expression are variables.
 *
 * A prop whose expression evaluates to `undefined` is checked against the
 * server context to decide whether it is a *client* expression — a signal, or
 * a `:for` loop variable — or simply an absent value. That check used to read
 * every identifier in the string, so a property name counted as a variable.
 *
 * The consequence was not cosmetic. `<SidebarSection :label="section.label">`
 * inside a server `@foreach`, where that section has no `label`, evaluated to
 * `undefined`; `label` was then reported as a name the server does not have;
 * the expression shipped to the client as a reactive prop; and there it could
 * never resolve either, because `section` is a server loop variable that does
 * not exist in the browser. Every such page logged stx's own hydration
 * invariant — "expression(s) never evaluated" — once per absent prop, forever.
 */
import { describe, expect, it } from 'bun:test'
import { freeIdentifiers } from '../src/component-renderer'

describe('freeIdentifiers: member access is not a variable', () => {
  it('reads the object, not the property', () => {
    expect(freeIdentifiers('section.label')).toEqual(['section'])
  })

  it('handles a chain', () => {
    expect(freeIdentifiers('a.b.c.d')).toEqual(['a'])
  })

  it('handles optional chaining', () => {
    expect(freeIdentifiers('section?.label')).toEqual(['section'])
  })

  it('keeps a computed key, which really is a variable', () => {
    expect(freeIdentifiers('row[key]').sort()).toEqual(['key', 'row'])
  })
})

describe('freeIdentifiers: strings are not variables', () => {
  it('ignores single-quoted contents', () => {
    expect(freeIdentifiers("active ? 'true' : 'false'")).toEqual(['active'])
  })

  it('ignores double-quoted contents', () => {
    expect(freeIdentifiers('flag ? "yes" : "no"')).toEqual(['flag'])
  })

  it('ignores an escaped quote inside a string', () => {
    expect(freeIdentifiers("label + 'it\\'s'")).toEqual(['label'])
  })
})

describe('freeIdentifiers: object keys are not variables', () => {
  it('reads the value, not the key', () => {
    expect(freeIdentifiers('{ id: itemId }')).toEqual(['itemId'])
  })

  it('handles several keys', () => {
    expect(freeIdentifiers('{ id: a, label: b }').sort()).toEqual(['a', 'b'])
  })

  it('does not mistake a ternary colon for a key', () => {
    expect(freeIdentifiers('ready ? yes : no').sort()).toEqual(['no', 'ready', 'yes'])
  })
})

describe('freeIdentifiers: the ordinary cases still work', () => {
  it('reads a bare name', () => {
    expect(freeIdentifiers('count')).toEqual(['count'])
  })

  it('reads both sides of an operator', () => {
    expect(freeIdentifiers('first + second').sort()).toEqual(['first', 'second'])
  })

  it('reads a call and its argument', () => {
    expect(freeIdentifiers('format(value)').sort()).toEqual(['format', 'value'])
  })

  it('reads a method call receiver but not the method', () => {
    expect(freeIdentifiers('items.filter(pick)').sort()).toEqual(['items', 'pick'])
  })

  it('returns nothing for a literal', () => {
    expect(freeIdentifiers('42')).toEqual([])
  })
})

describe('the misclassification this prevents', () => {
  it('sees a loop variable that IS in the server context as resolved', () => {
    // The exact regression: `section` is in scope, `label` is a key. Nothing
    // here is unresolved, so the prop stays server-dynamic with value
    // `undefined` instead of being shipped to the client.
    const contextKeys = ['section', 'theme', 'sections']
    const unresolved = freeIdentifiers('section.label').filter(v => !contextKeys.includes(v))
    expect(unresolved).toEqual([])
  })

  it('still detects a genuine client-only variable', () => {
    // A `:for` variable that the server really does not have must still be
    // recognised, or client-side loops break.
    const contextKeys = ['sections', 'theme']
    const unresolved = freeIdentifiers('row.label').filter(v => !contextKeys.includes(v))
    expect(unresolved).toEqual(['row'])
  })
})
