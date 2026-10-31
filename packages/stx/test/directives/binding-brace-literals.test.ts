/**
 * Braces written inside a binding's JavaScript string are the author's text.
 *
 * `:text="'{{' + name + '}}'"` is how a template draws a variable chip. The
 * server's mustache scan read the string `' + name + '` as the expression
 * between the braces, evaluated it and left `:text="' + name + '"`, so the
 * braces vanished and the binding showed " + name + " instead. A real mustache
 * inside a binding (`onDelete('{{ item.id }}')`) must keep working, and the
 * `@{{` escape works in an attribute as it does in text.
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'

const FIXTURE = path.join(import.meta.dir, 'binding-brace-literals.stx')
const render = (template: string): Promise<string> =>
  processDirectives(template, {}, FIXTURE, { root: import.meta.dir, buildMode: 'serve', cache: false } as never, new Set<string>())

describe('braces inside a binding string literal', () => {
  it('survive a variable chip', async () => {
    const html = await render(`<p :text="'{{' + name + '}}'"></p>`)
    expect(html).toContain(`:text="'{{' + name + '}}'"`)
  })

  it('survive several in one binding, and a double-quoted string', async () => {
    const html = await render(`<p :title='"{{" + a + "}} and {{" + b + "}}"'></p><p :text="'{{' + a + '}}' + '{{' + b + '}}'"></p>`)
    expect(html).toContain(`:title='"{{" + a + "}} and {{" + b + "}}"'`)
    expect(html).toContain(`:text="'{{' + a + '}}' + '{{' + b + '}}'"`)
  })

  it('survive in an event handler', async () => {
    const html = await render(`<script client>\nconst name = state('x')\nfunction insert(t) {}\n</script>\n<button @click="insert('{{' + name() + '}}')">x</button>`)
    expect(html).toContain(`@click="insert('{{' + name() + '}}')"`)
  })

  it('leave a real mustache in a plain attribute alone', async () => {
    const html = await render(`<script server>\nconst id = 7\n</script>\n<a title="Item {{ id }}" :text="'{{' + id + '}}'">x</a>`)
    expect(html).toContain('title="Item 7"')
    expect(html).toContain(`:text="'{{' + id + '}}'"`)
  })

  it('keep the @{{ escape working in a plain attribute', async () => {
    const html = await render(`<input placeholder="Use @{{name}} here">`)
    expect(html).toContain('placeholder="Use {{name}} here"')
  })
})

describe('braces inside a string literal in a client script', () => {
  it('survive a variable chip built in script code', async () => {
    const html = await render(`<script client>\nconst chip = name => '{{' + name + '}}'\nconst other = "{{" + 1 + "}}"\n</script>\n<p>x</p>`)
    expect(html).toContain(`'{{' + name + '}}'`)
    expect(html).toContain(`"{{" + 1 + "}}"`)
  })

  it('still substitute a server value written as a mustache in a string', async () => {
    const html = await render(`<script server>\nconst id = 7\n</script>\n<script client>\nconst url = '/items/{{ id }}'\n</script>\n<p>x</p>`)
    expect(html).toContain('/items/7')
  })
})
