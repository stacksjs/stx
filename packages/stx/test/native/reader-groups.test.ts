/**
 * A named group of controls stays a group a screen reader can enter.
 *
 * A browser reads `<div role="group" aria-label="Pages">` as a name for what
 * is inside. A native host has no such thing for a plain box: a view with a
 * label is one stop, and nothing inside it can be reached. Run on a simulator
 * (stacksjs/stx#2184), the shared Pager was a single stop called "Tour". Its
 * pages and its page dots were on screen and could be touched, and VoiceOver
 * could reach none of them.
 *
 * Also here, since they came out of the same run: the page a pager is on and
 * the link someone is on are said to be so, a tooltip's words reach a reader
 * as the trigger's hint, and a line of text loses the indentation its template
 * put around it.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { projectAccessibility, READER_GROUP } from '../../src/native/accessibility'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import type { STXNode } from '../../src/native/compiler/ir'

const ui = join(import.meta.dir, '../../../components/src/ui')

afterEach(unmountAllNativeScreens)

function find(node: STXNode, match: (node: STXNode) => boolean): STXNode | undefined {
  if (match(node)) return node
  for (const child of node.children) {
    const found = typeof child === 'string' ? undefined : find(child, match)
    if (found) return found
  }
  return undefined
}
const byTestID = (root: STXNode, id: string): STXNode => find(root, node => node.props.testID === id)!

describe('a labelled box around controls', () => {
  it('is not sent its label, so the controls inside stay reachable', async () => {
    const { root } = await translateHtmlToIR(`<div>
      <div testID="dots" role="group" aria-label="Pages"><button aria-label="Go to page 1"></button></div>
      <section testID="region" aria-label="Filters"><a href="/people">People</a></section>
      <div testID="deep" aria-label="Sign in"><div><div><input /></div></div></div>
      <div testID="bound" :aria-label="title()"><button>Save</button></div>
      <div testID="panel" role="dialog" aria-modal="true" aria-label="Filters"><button aria-label="Close panel"></button></div>
    </div>`)
    for (const id of ['dots', 'region', 'deep', 'bound', 'panel']) {
      expect(byTestID(root, id).props[READER_GROUP]).toBe('')
      expect(byTestID(root, id).props.accessibilityLabel).toBeUndefined()
    }
    // The controls keep their own names.
    expect(find(root, node => node.props['aria-label'] === 'Go to page 1')!.props.accessibilityLabel).toBe('Go to page 1')
  })

  it('keeps its label when it holds only words or pictures, takes the press itself, or says what it is', async () => {
    const { root } = await translateHtmlToIR(`<div>
      <div testID="rating" role="group" aria-label="Rated 4 of 5"><i class="i-lucide-star"></i><span>4</span></div>
      <div testID="card" aria-label="Open order 12" @click="open()"><button>Details</button></div>
      <div testID="tabs" role="tablist" aria-label="Sections"><button role="tab">One</button></div>
      <div testID="pills" role="list" aria-label="Exercises"><div role="listitem"><button aria-label="Remove squats"></button></div></div>
      <div testID="scroller" data-native="ScrollView" aria-label="Tour"><button>Next</button></div>
      <div testID="native" accessibilityLabel="Toolbar"><button>Bold</button></div>
    </div>`)
    for (const [id, label] of [['rating', 'Rated 4 of 5'], ['card', 'Open order 12'], ['tabs', 'Sections'], ['pills', 'Exercises'], ['scroller', 'Tour'], ['native', 'Toolbar']] as const) {
      expect(byTestID(root, id).props[READER_GROUP]).toBeUndefined()
      expect(byTestID(root, id).props.accessibilityLabel).toBe(label)
    }
  })

  it('is a list a host can name and still enter, when it says it is one', async () => {
    const { root } = await translateHtmlToIR('<div testID="pills" role="list" aria-label="Exercises"><div role="listitem"><button aria-label="Remove squats"></button></div></div>')
    // Both hosts treat a list as a container: named, and open to a reader.
    expect(byTestID(root, 'pills').props).toMatchObject({ accessibilityRole: 'list', accessibilityLabel: 'Exercises' })
    // An item is not a stop of its own: what is inside it is.
    const item = find(root, node => node.props.role === 'listitem')!
    expect(item.props.accessibilityRole).toBeUndefined()
    expect(find(root, node => node.props['aria-label'] === 'Remove squats')!.props.accessibilityLabel).toBe('Remove squats')
  })

  it('stays unnamed when its label is written again later', () => {
    // What the runtime does on a bound aria-label: project the node's props.
    expect(projectAccessibility({ 'aria-label': 'Pages', [READER_GROUP]: '' })).toEqual({})
    expect(projectAccessibility({ 'aria-label': 'Pages', 'role': 'tablist', [READER_GROUP]: '' })).toEqual({ accessibilityRole: 'tablist' })
    // An authored native label is a decision, not a translation.
    expect(projectAccessibility({ accessibilityLabel: 'Pages', [READER_GROUP]: '' })).toEqual({ accessibilityLabel: 'Pages' })
  })
})

describe('aria-current', () => {
  it('is the selected one, whatever kind of current it is', () => {
    for (const value of ['page', 'step', 'true', 'date', ''])
      expect(projectAccessibility({ 'aria-current': value })).toEqual({ accessibilityState: { selected: true } })
    expect(projectAccessibility({ 'aria-current': 'false' })).toEqual({ accessibilityState: { selected: false } })
    expect(projectAccessibility({ 'aria-current': null })).toEqual({})
  })
})

describe('text', () => {
  it('loses the indentation a template put around it, and keeps the spaces inside', async () => {
    const { root } = await translateHtmlToIR(`<div>
      <span testID="title">
        Second   issue
      </span>
      <span testID="bound">
        {{ title() }}
      </span>
    </div>`)
    expect(byTestID(root, 'title').children).toEqual(['Second issue'])
    expect(byTestID(root, 'bound').children).toEqual([])
    expect(byTestID(root, 'bound').bindings?.text).toBe('title()')
  })
})

describe.each(['ios', 'android'] as const)('the shared components on %s', (platform) => {
  it('name the pager on its scroller and leave its box and its dots unnamed', async () => {
    const { code } = await compileNativeScreen(`@import('Pager', '${ui}/pager/Pager.stx')
<script client>
const page = state(0)
</script>
<Pager testID="tour" v-model:index="page" label="Tour">
  <section><span>One</span></section><section><span>Two</span></section>
</Pager>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const scroller = phone.ofType('ScrollView')[0]!
    expect(scroller.props.accessibilityLabel).toBe('Tour')
    const boxes = phone.all().filter(node => node.type === 'View' && node.props['aria-label'] !== undefined)
    expect(boxes.map(node => node.props['aria-label'])).toEqual(['Tour', 'Pages'])
    expect(boxes.map(node => node.props.accessibilityLabel)).toEqual([undefined, undefined])

    // The host reports its pages; the dot for the one showing is the selected one.
    phone.press(scroller, 'onPageSelected', { index: 1, count: 2 })
    await phone.settle()
    const dots = phone.all().filter(node => String(node.props.accessibilityLabel ?? '').startsWith('Go to page'))
    expect(dots.map(node => [node.props.accessibilityLabel, node.props.accessibilityState?.selected === true])).toEqual([['Go to page 1', false], ['Go to page 2', true]])
  }, 30_000)

  it('leave an open drawer\'s panel unnamed, so its close button can be reached', async () => {
    const { code } = await compileNativeScreen(`@import('Drawer', '${ui}/drawer/Drawer.stx')
@import('Button', '${ui}/button/Button.stx')
<script client>
const open = state(true)
</script>
<section><Drawer :open="open" title="Filters" @close="open.set(false)"><Button testID="apply">Apply</Button></Drawer></section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const panel = phone.all().find(node => node.props['aria-label'] === 'Filters' && node.type === 'View')!
    expect(panel.props.accessibilityLabel).toBeUndefined()
    // The title is drawn inside it, so a reader still hears what it is.
    expect(phone.all().some(node => node.type === 'Text' && node.children.includes('Filters'))).toBe(true)
    expect(phone.all().find(node => node.props.accessibilityLabel === 'Close panel')).toBeDefined()
  }, 30_000)

  it('give a tooltip\'s words to its trigger as a hint, and follow them', async () => {
    const { code } = await compileNativeScreen(`@import('Tooltip', '${ui}/tooltip/Tooltip.stx')
@import('Button', '${ui}/button/Button.stx')
<script client>
const words = state('Saves a draft')
const off = state(false)
window.probe = { words, off }
</script>
<section><Tooltip :content="words()" :disabled="off()"><Button testID="save">Save</Button></Tooltip></section>`)
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    // The wrapper that takes the press is the stop a reader makes.
    const trigger = phone.all().find(node => node.type === 'Pressable' && node.props.testID === undefined)!
    expect(trigger.props.accessibilityHint).toBe('Saves a draft')
    phone.context.probe.words.set('Saves and closes')
    await phone.settle()
    expect(trigger.props.accessibilityHint).toBe('Saves and closes')
    phone.context.probe.off.set(true)
    await phone.settle()
    expect(trigger.props.accessibilityHint ?? null).toBeNull()
  }, 30_000)
})
