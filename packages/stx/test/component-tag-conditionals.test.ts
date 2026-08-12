/**
 * An inline `@if(…)…@endif` inside a COMPONENT tag applies to all of it
 * (stacksjs/stx#1931).
 *
 * A conditional attribute group works on a plain element and was silently
 * broken on a component tag: only the FIRST attribute stayed inside the
 * conditional, and every attribute after it was emitted unconditionally.
 *
 *     <StxLink to="/x" @if(active)data-active="true" aria-current="page"@endif>
 *
 * With `active === false` that produced an `<a>` carrying `aria-current="page"`.
 * Two separate groups was worse still: the second survived into the output as a
 * literal attribute named `@if(off)b`.
 *
 * ## Why it broke
 *
 * Directives run AFTER component processing, so on a plain element the group is
 * still intact in the raw markup when `processConditionals` reaches it. A
 * component tag is consumed first, and attribute parsing splits the group:
 * `@if(active)data-active="true"` parses as one `@`-prefixed attribute whose
 * name happens to carry the condition, and `aria-current="page"` parses as an
 * ordinary static attribute. The first is re-emitted onto the root element still
 * spelled `@if(…)…`, so the later conditional pass handles it; the second was
 * separated from the group and simply forwarded.
 *
 * ## Why the failure direction matters
 *
 * It is silent and it fails OPEN. `aria-current="page"` on every row tells a
 * screen reader that every page is the current one; a leaked `tabindex="-1"`
 * takes a whole nav out of tab order. Those are exactly the attributes people
 * put in these groups — the conditional ones.
 *
 * The fix resolves the group against the server context before the attributes
 * are parsed, using the same `processConditionals` a plain element goes
 * through, so the two cannot drift.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../src/config'
import { processDirectives } from '../src/process'

const dir = join(import.meta.dir, 'fixtures')

async function renderRaw(template: string): Promise<string> {
  const options = { ...defaultConfig, componentsDir: dir } as any
  const out = await processDirectives(template, {}, join(dir, 'probe.stx'), options, new Set<string>())
  return out.replace(/<style[\s\S]*?<\/style>/g, '')
}

/** Markup only. Scripts are stripped: the injected runtime is not the subject. */
async function render(template: string): Promise<string> {
  return (await renderRaw(template)).replace(/<script[\s\S]*?<\/script>/g, '').trim()
}

/** The opening `<a …>` a builtin emitted. */
function anchor(html: string): string {
  return html.match(/<a\s[^>]*>/)?.[0] ?? ''
}

describe('a conditional attribute group on a component tag', () => {
  it('drops every attribute in the group when the condition is false', async () => {
    const out = await render([
      '<script server>const active = false</script>',
      '<StxLink to="/x" class="row" @if(active)data-active="true" aria-current="page"@endif>Go</StxLink>',
    ].join('\n'))

    expect(anchor(out)).toContain('href="/x"')
    // The bug: `data-active` was dropped and `aria-current` leaked.
    expect(anchor(out)).not.toContain('data-active')
    expect(anchor(out)).not.toContain('aria-current')
  })

  it('keeps every attribute in the group when the condition is true', async () => {
    const out = await render([
      '<script server>const active = true</script>',
      '<StxLink to="/x" class="row" @if(active)data-active="true" aria-current="page"@endif>Go</StxLink>',
    ].join('\n'))

    expect(anchor(out)).toContain('data-active="true"')
    expect(anchor(out)).toContain('aria-current="page"')
  })

  it('handles two separate groups without leaking one as a literal attribute', async () => {
    // The second group used to survive into the output spelled `@if(off)b="2"`,
    // an attribute name no browser knows, on every render.
    const out = await render([
      '<script server>const off = false; const on = true</script>',
      '<StxLink to="/x" @if(off)a="1"@endif @if(on)b="2"@endif>Go</StxLink>',
    ].join('\n'))

    expect(anchor(out)).not.toContain('@if')
    expect(anchor(out)).not.toContain('a="1"')
    expect(anchor(out)).toContain('b="2"')
  })

  it('supports @else, like the plain-element form does', async () => {
    const out = await render([
      '<script server>const compact = false</script>',
      '<StxLink to="/x" @if(compact)data-size="sm"@else data-size="lg"@endif>Go</StxLink>',
    ].join('\n'))

    expect(anchor(out)).toContain('data-size="lg"')
    expect(anchor(out)).not.toContain('data-size="sm"')
  })

  it('supports @elseif', async () => {
    const out = await render([
      '<script server>const size = "md"</script>',
      `<StxLink to="/x" @if(size === 'sm')data-a="1"@elseif(size === 'md')data-b="2"@else data-c="3"@endif>Go</StxLink>`,
    ].join('\n'))

    expect(anchor(out)).toContain('data-b="2"')
    expect(anchor(out)).not.toContain('data-a')
    expect(anchor(out)).not.toContain('data-c')
  })

  it('leaves a bare @event attribute alone', async () => {
    // `@click` is an ordinary event binding and starts with the same character.
    // Mistaking it for a directive would silently unbind every handler on every
    // component in the codebase — a far worse failure than the one being fixed.
    const out = await renderRaw('<StxLink to="/x" @click="go($event)">Go</StxLink>')

    // Read from the raw output: an event on a component tag is hoisted into the
    // event registry keyed by a generated id, so the handler lives in a script
    // rather than on the element. Either way it must still be there.
    expect(out).toContain('go($event)')
    expect(anchor(out)).toContain('href="/x"')
  })

  it('leaves an attribute VALUE that merely mentions the directive alone', async () => {
    // A handler whose argument is the literal text `@if(` is not a directive.
    // Nothing special protects this: `processConditionals` needs a closing token
    // before it touches anything, which is also how the identical string behaves
    // on a plain element. Pinned because "resolve conditionals here" is the kind
    // of change that grows an eager matcher later.
    const out = await renderRaw(`<StxLink to="/x" @click="say('@if(x)')">Go</StxLink>`)

    expect(out).toContain('@if(x)')
    expect(anchor(out)).toContain('href="/x"')
  })

  it('still resolves the group on a user component, not only a builtin', async () => {
    // Builtins and `.stx` components take the same props path, so this would be
    // an odd place to diverge — but the group is resolved before the two split,
    // and that is worth pinning.
    const out = await render([
      '<script server>const flagged = true</script>',
      '<StxImage src="/a.png" alt="A" width="10" height="10" @if(flagged)data-flag="yes" data-extra="also"@endif />',
    ].join('\n'))

    expect(out).toContain('data-flag="yes"')
    expect(out).toContain('data-extra="also"')
  })
})
