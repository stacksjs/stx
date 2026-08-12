/**
 * Components navigate through the router and render their content (stacksjs/stx#1930).
 *
 * Two properties, reported together because they have the same shape: the
 * component was deciding something that belongs to the host app.
 *
 * **Raw anchors.** Eight components rendered `<a href>` and none used
 * `<StxLink>`. The router only intercepts `[data-stx-link]`, so a raw anchor in
 * an SPA is a full page reload — adopting `<SidebarItem>` or `<Breadcrumb>`
 * silently opted that part of the app out of client-side navigation, losing
 * stores and scroll position. It bit hardest exactly where it is most visible:
 * `Sidebar*`, `Breadcrumb`, `Navigator` and the auth family are the navigation
 * surfaces an app adopts first.
 *
 * Not every one of those anchors was navigation, and that distinction is the
 * interesting half. Four of them were `href="#"` — a link an app could not wire
 * and that goes nowhere. Converting those to `<StxLink to="#">` would have been
 * theatre: the router excludes hash targets, so nothing would change. The ones
 * that navigate now take an href prop and route through `StxLink`; the ones that
 * only ran a handler are buttons, which is what they always were.
 *
 * **RadioGroup's hydration shell.** `<RadioGroup :options="[…]" />` emitted a
 * scope wrapper with the labels reachable only inside `data-stx-props`, so the
 * choices were invisible without JavaScript and to a crawler. Nine comparable
 * components server-render a prop array, so this was the odd one out.
 *
 * Rendered through `processDirectives` rather than asserted against source
 * text: the question is what an app receives, and a source-text check would
 * pass on markup that never rendered. The injected crosswind <style> is not
 * evidence of a render either, so it is stripped first.
 */

import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../stx/src/config'
import { processDirectives } from '../../stx/src/process'

const UI = join(import.meta.dir, '..', 'src', 'ui')

async function render(template: string): Promise<string> {
  const options = { ...defaultConfig, componentsDir: UI } as any
  const out = await processDirectives(template, {}, join(UI, 'probe.stx'), options, new Set<string>())
  return out
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
}

/** Every `<a …>` opening tag in the output. */
function anchors(html: string): string[] {
  return html.match(/<a\s[^>]*>/g) ?? []
}

describe('navigation components route through the router', () => {
  it('Breadcrumb marks its links, inside the loop that renders them', async () => {
    const out = await render(
      `<Breadcrumb :items="[{label:'Home',href:'/'},{label:'Docs',href:'/docs'},{label:'Now',href:'/docs/now'}]" />`,
    )
    const links = anchors(out)

    // Two links; the last item is the current page and is not a link.
    expect(links).toHaveLength(2)
    expect(links.every(a => a.includes('data-stx-link'))).toBe(true)
    // The href still resolves per iteration — components are processed before
    // loops, so this is the part a naive conversion gets wrong.
    expect(links[0]).toContain('href="/"')
    expect(links[1]).toContain('href="/docs"')
  })

  it('SidebarItem marks its row and keeps the active attributes conditional', async () => {
    const out = await render(
      '<SidebarItem label="Inbox" href="/inbox" :active="true" /><SidebarItem label="Sent" href="/sent" />',
    )
    const [active, inactive] = anchors(out)

    expect(active).toContain('data-stx-link')
    expect(inactive).toContain('data-stx-link')
    // `aria-current` on every row would tell a screen reader that every page is
    // the current one. This is the case an inline @if inside a component tag
    // gets wrong — only its first attribute stays inside the conditional.
    expect(active).toContain('aria-current="page"')
    expect(active).toContain('data-active="true"')
    expect(inactive).not.toContain('aria-current')
    expect(inactive).not.toContain('data-active')
  })

  it('SidebarItem still renders a button when there is no href', async () => {
    const out = await render('<SidebarItem label="Nothing" />')

    expect(anchors(out)).toHaveLength(0)
    expect(out).toContain('data-sidebar-item')
  })

  it('SidebarPinned marks its tiles', async () => {
    const out = await render(
      `<SidebarPinned :items="[{id:'a',label:'A',href:'/a',icon:'i-x'}]" />`,
    )
    const links = anchors(out)

    expect(links).toHaveLength(1)
    expect(links[0]).toContain('data-stx-link')
    expect(links[0]).toContain('href="/a"')
  })

  it('Navigator marks its items and keeps its reactive bindings', async () => {
    const out = await render(
      `<Navigator :items="[{key:'a',label:'Home',href:'/'},{key:'b',label:'Off',href:'/off',disabled:true}]" />`,
    )
    const [first, second] = anchors(out)

    expect(first).toContain('data-stx-link')
    // The click handler and the reactive class survive the move onto a
    // component tag — dropping them would turn a styled, interactive nav into
    // a list of plain links with no visible regression in a source-text check.
    expect(first).toContain('@click=')
    expect(first).toContain(':class=')
    // Disabled state is server-rendered, with explicit enabled-state values
    // rather than a conditional group inside the tag.
    expect(first).toContain('aria-disabled="false"')
    expect(first).toContain('tabindex="0"')
    expect(second).toContain('aria-disabled="true"')
    expect(second).toContain('tabindex="-1"')
  })
})

describe('the auth family', () => {
  it('Login links to targets an app can supply', async () => {
    const out = await render('<Login />')
    const links = anchors(out)

    expect(links).toHaveLength(2)
    expect(links.every(a => a.includes('data-stx-link'))).toBe(true)
    expect(out).toContain('href="/forgot-password"')
    expect(out).toContain('href="/register"')
    // No dead ends left.
    expect(out).not.toContain('href="#"')
  })

  it('…and the app can override them', async () => {
    const out = await render('<Login forgotPasswordHref="/auth/reset" signupHref="/auth/join" />')

    expect(out).toContain('href="/auth/reset"')
    expect(out).toContain('href="/auth/join"')
  })

  it('turns the social sign-in placeholders into real buttons', async () => {
    // These were `<a href="#">`: not navigation, and not wireable. Emitting the
    // provider is what lets an app start its own OAuth flow.
    const login = await render('<Login />')
    const signup = await render('<Signup />')

    for (const out of [login, signup]) {
      expect(out).toContain(`onSocial('google')`)
      expect(out).toContain(`onSocial('github')`)
      expect(out).not.toContain('href="#"')
    }
  })

  it('TwoFactorChallenge uses a button for the recovery-code action', async () => {
    const out = await render('<TwoFactorChallenge />')

    expect(out).toContain('onRecoveryCode($event)')
    expect(anchors(out)).toHaveLength(0)
  })
})

describe('SubscriptionCheckout', () => {
  it('links a product only when it has a target', async () => {
    const linked = await render(
      `<SubscriptionCheckout :products="[{id:1,name:'Pro',href:'/plans/pro',price:9}]" />`,
    )
    const plain = await render(
      `<SubscriptionCheckout :products="[{id:1,name:'Pro',price:9}]" />`,
    )

    expect(anchors(linked).some(a => a.includes('href="/plans/pro"') && a.includes('data-stx-link'))).toBe(true)
    // Not a link at all rather than a link to nowhere: `<a href="#">` announces
    // itself to a screen reader as a link and then does nothing.
    expect(anchors(plain)).toHaveLength(0)
    expect(plain).toContain('Pro')
  })
})

describe('no component ships a raw internal anchor', () => {
  it('renders nothing that the router would ignore', async () => {
    // The property the issue is actually about, asserted over every component
    // it named at once. An anchor with no `data-stx-link` is a full page reload.
    const samples = [
      `<Breadcrumb :items="[{label:'A',href:'/a'},{label:'B',href:'/b'}]" />`,
      '<SidebarItem label="A" href="/a" />',
      `<SidebarPinned :items="[{id:'a',label:'A',href:'/a',icon:'i-x'}]" />`,
      `<Navigator :items="[{key:'a',label:'A',href:'/a'}]" />`,
      '<Login />',
      '<Signup />',
      '<TwoFactorChallenge />',
      `<SubscriptionCheckout :products="[{id:1,name:'Pro',href:'/p',price:9}]" />`,
    ]

    for (const sample of samples) {
      const unmarked = anchors(await render(sample)).filter(a => !a.includes('data-stx-link'))
      expect({ sample, unmarked }).toEqual({ sample, unmarked: [] })
    }
  })
})

describe('RadioGroup renders its options on the server', () => {
  it('puts the labels in the markup, not only in data-stx-props', async () => {
    const out = await render(
      `<RadioGroup value="a" :options="[{label:'Alpha',value:'a'},{label:'Beta',value:'b',description:'second'}]" />`,
    )
    // Attribute values stripped first: the labels used to appear ONLY inside
    // `data-stx-props`, which is exactly what this has to be able to tell apart.
    const withoutAttrs = out.replace(/="[^"]*"/g, '')

    expect(withoutAttrs).toContain('Alpha')
    expect(withoutAttrs).toContain('Beta')
    expect(withoutAttrs).toContain('second')
  })

  it('marks the selected option without JavaScript', async () => {
    const out = await render(
      `<RadioGroup value="b" :options="[{label:'Alpha',value:'a'},{label:'Beta',value:'b'}]" />`,
    )
    const options = out.match(/<div\s[^>]*data-stx-radio-option[^>]*>/g) ?? []

    expect(options).toHaveLength(2)
    expect(options[0]).toContain('aria-checked="false"')
    expect(options[1]).toContain('aria-checked="true"')
  })

  it('keeps the option value as exact JSON, so a number stays a number', async () => {
    // The reason the options are emitted here rather than delegated to
    // <RadioGroupOption>: a loop variable cannot cross a component boundary as
    // a `:` binding, and interpolating it would make 1 and "1" the same value.
    const out = await render(
      `<RadioGroup :value="2" :options="[{label:'One',value:1},{label:'Two',value:2}]" />`,
    )

    expect(out).toContain('data-option-value="1"')
    expect(out).toContain('data-option-value="2"')
    expect(out).not.toContain('data-option-value="&quot;1&quot;"')
  })

  it('renders the disabled state', async () => {
    const out = await render(
      `<RadioGroup :options="[{label:'Alpha',value:'a',disabled:true}]" />`,
    )
    const [option] = out.match(/<div\s[^>]*data-stx-radio-option[^>]*>/g) ?? []

    expect(option).toContain('aria-disabled="true"')
    expect(option).toContain('tabindex="-1"')
  })

  it('still renders slot content when no options prop is given', async () => {
    // The compositional API is the one that already worked; adding the prop
    // array must not take it away.
    //
    // Asserted with a plain child rather than a nested <RadioGroupOption>
    // because that component's own `<slot :disabled="disabled" />` does not
    // fill — a scoped slot on a component emits a literal `<slot / />`. That is
    // a separate defect, untouched by this change, and pinning it here would
    // make this test fail for a reason it is not about.
    const out = await render('<RadioGroup><span data-child>Alpha</span></RadioGroup>')

    expect(out.replace(/="[^"]*"/g, '')).toContain('Alpha')
    expect(out).toContain('data-stx-radio-group')
    // No prop array, so nothing is generated from one.
    expect(out).not.toContain('data-stx-radio-delegated')
  })
})
