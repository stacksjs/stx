/**
 * A page action cannot run in a static build, and the build says so (#1847).
 *
 * `action` receives the page's own POST. A static build produces files, so
 * there is no server left to receive one — the form renders, submits, and gets
 * whatever the host does with a POST to a `.html`, which is a 405 or a silent
 * no-op depending on the host. Nothing about the page looks wrong, which is
 * exactly why the build warns rather than leaving it to production.
 *
 * A warning rather than an error on purpose: a page may reasonably be
 * statically built for its GET render and have its action served by something
 * else.
 */

import { describe, expect, it } from 'bun:test'
import { declaresPageAction } from '../../src/ssg'

describe('detecting a page action', () => {
  it('finds the exported function form', () => {
    expect(declaresPageAction(`<script server>
export async function action({ form }) { return { errors: {} } }
</script>`)).toBe(true)
  })

  it('finds it without export, and without async', () => {
    expect(declaresPageAction(`function action() {}`)).toBe(true)
    expect(declaresPageAction(`export const action = async () => {}`)).toBe(true)
  })

  it('says nothing about an ordinary page', () => {
    expect(declaresPageAction(`<script server>
const title = 'Home'
</script>
<h1>{{ title }}</h1>`)).toBe(false)
  })

  it('is not fooled by a property or a similar name', () => {
    // `form.action` is an attribute, `actions` is a different binding, and
    // neither is the export that receives a POST.
    expect(declaresPageAction(`const x = form.action`)).toBe(false)
    expect(declaresPageAction(`const actions = []`)).toBe(false)
    expect(declaresPageAction(`<form action="/api/x" method="POST">`)).toBe(false)
  })
})
