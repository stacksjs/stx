/**
 * `$bool` reads a prop as a boolean, the way an author means it.
 *
 * A prop written as a plain attribute arrives as a STRING, so the idiom every
 * component used - `$props.disabled || false` - left the string "false",
 * which is truthy. `<Radio disabled="false">` was disabled,
 * `<Video muted="false">` was muted, and `<Dialog open="false">` opened over
 * the page and locked its scroll. 103 of the 104 boolean props in
 * @stacksjs/components behaved that way (stacksjs/stx#2006).
 *
 * Nothing reported it, and the symptom misdirects: a prop that turns something
 * ON when you ask for it OFF reads as the component ignoring the prop, so you
 * go looking at the component rather than at the coercion.
 *
 * HTML's own rule for `disabled="false"` is the opposite - any value, even
 * "false", means the attribute is present - but these are component props, not
 * HTML attributes, and nobody writing `open="false"` means open. Vue reaches
 * the same answer by declaring a Boolean prop type; a stx server script has no
 * declared types, so the coercion is asked for by name.
 */
import { describe, expect, it } from 'bun:test'
import { renderTemplate } from '../src/render'

async function renderWithComponent(component: string, page: string): Promise<string> {
  const dir = `${import.meta.dir}/.tmp-bool-${crypto.randomUUID()}`
  await Bun.write(`${dir}/components/Widget.stx`, component)
  await Bun.write(`${dir}/page.stx`, page)

  try {
    return await renderTemplate(`${dir}/page.stx`, { context: {} } as any)
  }
  finally {
    await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
  }
}

const WIDGET = `<script server>
export const flag = $bool($props.flag)
export const withDefault = $bool($props.withDefault, true)
</script>
<p>flag:{{ flag ? 'on' : 'off' }} default:{{ withDefault ? 'on' : 'off' }}</p>
`

/** Just the paragraph, so the assertion reads as the question it is asking. */
function state(html: string): string {
  return html.match(/<p>([^<]*)<\/p>/)?.[1] ?? html
}

describe('$bool in a server script', () => {
  it('reads "false" as false, which is the whole point', async () => {
    expect(state(await renderWithComponent(WIDGET, '<Widget flag="false" />'))).toContain('flag:off')
  })

  it('reads "true" as true', async () => {
    expect(state(await renderWithComponent(WIDGET, '<Widget flag="true" />'))).toContain('flag:on')
  })

  it('reads a bare attribute as true, which is what HTML sends', async () => {
    // `<Widget flag />` arrives as the empty string.
    expect(state(await renderWithComponent(WIDGET, '<Widget flag />'))).toContain('flag:on')
  })

  it('reads the other spellings an author reaches for', async () => {
    for (const off of ['0', 'off', 'no', 'FALSE', ' false '])
      expect(state(await renderWithComponent(WIDGET, `<Widget flag="${off}" />`))).toContain('flag:off')

    for (const on of ['1', 'on', 'yes', 'TRUE'])
      expect(state(await renderWithComponent(WIDGET, `<Widget flag="${on}" />`))).toContain('flag:on')
  })

  it('falls back when the prop is not passed at all', async () => {
    const html = state(await renderWithComponent(WIDGET, '<Widget />'))

    expect(html).toContain('flag:off')
    expect(html).toContain('default:on')
  })

  it('lets an explicit value beat a true default', async () => {
    expect(state(await renderWithComponent(WIDGET, '<Widget withDefault="false" />'))).toContain('default:off')
  })

  /*
   * A server-evaluated prop is already a real value, so it must pass through
   * unjudged - `:flag="1 > 2"` is false, not the string "false".
   */
  it('leaves a non-string value to ordinary truthiness', async () => {
    const widget = `<script server>
export const flag = $bool($props.flag)
export const kind = $props.flag === false ? 'boolean' : typeof $props.flag
</script>
<p>flag:{{ flag ? 'on' : 'off' }} kind:{{ kind }}</p>
`
    const html = state(await renderWithComponent(widget, '<Widget :flag="1 > 2" />'))

    expect(html).toContain('flag:off')
    expect(html).toContain('kind:boolean')
  })
})
