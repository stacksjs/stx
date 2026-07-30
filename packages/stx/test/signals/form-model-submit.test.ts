import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('form model submission', () => {
  beforeAll(() => {
    installNodeConstants()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('commits a trimmed text model before a prevented form submit', async () => {
    const searchQuery = window.stx.state('')
    const appliedSearch = window.stx.state('')

    window.__stx_setup_search_form = () => ({
      searchQuery,
      applySearch() {
        appliedSearch.set(searchQuery())
      },
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_search_form">
        <form>
          <input type="search">
          <button type="submit">Search</button>
        </form>
      </main>
    `
    document.querySelector('form').setAttribute('@submit.prevent', 'applySearch()')
    document.querySelector('input').setAttribute('x-model.trim', 'searchQuery')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    const input = document.querySelector('input')
    input.value = '  rejected  '
    input.dispatchEvent(new window.Event('input', { bubbles: true }))

    const form = document.querySelector('form')
    const submit = new window.Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submit)

    expect(submit.defaultPrevented).toBe(true)
    expect(searchQuery()).toBe('rejected')
    expect(appliedSearch()).toBe('rejected')
  })

  it('binds a prevented submit event when a conditional form becomes visible', async () => {
    const editorOpen = window.stx.state(false)
    const submissions = window.stx.state(0)

    window.__stx_setup_conditional_form = () => ({
      editorOpen,
      savePost() {
        submissions.update((count: number) => count + 1)
      },
    })

    document.body.innerHTML = `
      <main data-stx="__stx_setup_conditional_form">
        <div data-editor>
          <form>
            <button type="submit">Create post</button>
          </form>
        </div>
      </main>
    `
    document.querySelector('[data-editor]').setAttribute(':if', 'editorOpen()')
    document.querySelector('form').setAttribute('@submit.prevent', 'savePost()')
    shimAttributes(document.body)
    document.dispatchEvent(new window.Event('DOMContentLoaded'))
    await new Promise(resolve => setTimeout(resolve, 20))

    editorOpen.set(true)
    await new Promise(resolve => setTimeout(resolve, 20))

    const form = document.querySelector('form')
    const submit = new window.Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(submit)

    expect(submit.defaultPrevented).toBe(true)
    expect(submissions()).toBe(1)
  })
})
