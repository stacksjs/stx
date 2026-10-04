import { afterEach, describe, expect, it } from 'bun:test'
import { sidebar } from '../src/sidebar'

/** A Craft window whose runtime reports picks: records what the page asks, and can pick a row. */
function installSidebarBridge(options: { reportsPicks?: boolean } = {}) {
  const calls: Array<{ method: string, args: unknown[] }> = []
  let pick: ((itemId: string) => void) | null = null
  const previous = (window as any).craft
  ;(window as any).craft = {
    nativeUI: {
      ...(options.reportsPicks === false ? {} : { _emitSidebarSelect() {} }),
      createSidebar(opts: unknown) {
        calls.push({ method: 'createSidebar', args: [opts] })
        return {
          id: 'sidebar-1',
          setSections: (...args: unknown[]) => calls.push({ method: 'setSections', args }),
          updateItem: (...args: unknown[]) => calls.push({ method: 'updateItem', args }),
          setSelectedItem: (...args: unknown[]) => calls.push({ method: 'setSelectedItem', args }),
          onSelect: (cb: (id: string) => void) => { pick = cb },
          destroy: () => calls.push({ method: 'destroy', args: [] }),
        }
      },
    },
  }
  return {
    calls,
    pick: (itemId: string) => pick?.(itemId),
    uninstall: () => { (window as any).craft = previous },
  }
}

const sections = [
  { id: 'mail', items: [{ id: 'inbox', label: 'Inbox', icon: 'tray', badge: 12 }, { id: 'archived', label: 'Archived', icon: 'archivebox', badge: 0 }] },
  { id: 'sources', header: 'Sources', items: [{ id: 'imessage', label: 'iMessage', icon: 'message' }] },
]

describe('sidebar', () => {
  let bridge: ReturnType<typeof installSidebarBridge> | null = null
  afterEach(() => {
    bridge?.uninstall()
    bridge = null
  })

  it('is unavailable outside Craft and on a runtime that never reports picks', () => {
    expect(sidebar.available()).toBe(false)
    expect(sidebar.create({ sections })).toBeNull()
    bridge = installSidebarBridge({ reportsPicks: false })
    expect(sidebar.available()).toBe(false)
  })

  it('creates the native list with badges as text, and no badge for zero', () => {
    bridge = installSidebarBridge()
    const nav = sidebar.create({ sections, selected: 'inbox' })!
    expect(nav.id).toBe('sidebar-1')
    const sent = bridge.calls[0]!.args[0] as any
    expect(sent.selected).toBe('inbox')
    expect(sent.sections[0].items).toEqual([
      { id: 'inbox', label: 'Inbox', icon: 'tray', badge: '12' },
      { id: 'archived', label: 'Archived', icon: 'archivebox', badge: undefined },
    ])
    expect(sent.sections[1].header).toBe('Sources')
  })

  it('patches only the badges that changed, and rebuilds when anything else did', () => {
    bridge = installSidebarBridge()
    const nav = sidebar.create({ sections })!
    nav.update([{ ...sections[0]!, items: [{ ...sections[0]!.items[0]!, badge: 13 }, sections[0]!.items[1]!] }, sections[1]!])
    expect(bridge.calls.slice(1)).toEqual([{ method: 'updateItem', args: ['inbox', { badge: '13' }] }])

    nav.update([...sections, { id: 'more', items: [{ id: 'slack', label: 'Slack' }] }])
    expect(bridge.calls.at(-1)!.method).toBe('setSections')
  })

  it('hands picks to every listener until it unsubscribes, and selects without echoing', () => {
    bridge = installSidebarBridge()
    const nav = sidebar.create({ sections })!
    const picked: string[] = []
    const stop = nav.onSelect(id => picked.push(id))
    bridge.pick('archived')
    stop()
    bridge.pick('inbox')
    expect(picked).toEqual(['archived'])

    nav.select('imessage')
    expect(bridge.calls.at(-1)).toEqual({ method: 'setSelectedItem', args: ['imessage'] })
    nav.updateItem('inbox', { badge: null })
    expect(bridge.calls.at(-1)).toEqual({ method: 'updateItem', args: ['inbox', { badge: '' }] })
  })
})
