import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../stx/src/process'
import { bundleClientScript } from '../../stx/src/client-script-bundler'
import { createChat } from '../src/ui/chat/controller'

const root = path.resolve(import.meta.dir, '..')
const contact = { id: 2, name: 'Pawel Athlete', role: 'Athlete' }
const message = { id: 1, sender_id: 1, body: 'Question', client_key: 'key', created_at: '2026-10-10T12:00:00Z', read_at: null }

describe('native chat components and controller', () => {
  it('bundles the published browser entry with native signals', async () => {
    const build = Bun.spawnSync(['bun', 'run', 'build.ts'], { cwd: root, stdout: 'pipe', stderr: 'pipe' })
    expect(build.exitCode).toBe(0)
    expect(await Bun.file(path.join(root, 'dist/ui/chat/controller.d.ts')).exists()).toBe(true)
    const source = "import { createChat } from '../dist/chat/controller.js'\nconst chat = createChat({ selfId: () => 1, scopeKey: () => 'one', request: async () => Response.json({}) })"
    const bundle = await bundleClientScript(source, path.join(root, 'test', 'chat-browser.ts'), { projectRoot: root, externalizeUserModules: false })
    expect(bundle).toContain('function createChat')
    expect(bundle).not.toContain('stream/promises')
    expect(bundle).not.toContain('ts-syntax-highlighter')
  })
  it('escapes message text and coerces outgoing=false', async () => {
    const html = await processDirectives('<ChatMessage body="&lt;img onerror=alert(1)&gt;" author="Athlete" outgoing="false" />', {}, path.join(root, 'chat-test.stx'), { componentsDir: path.join(root, 'src/ui/chat'), root, buildMode: 'serve', cache: false } as any, new Set())
    expect(html).toContain('items-start')
    expect(html).not.toContain('<img onerror')
    expect(html).toContain('Athlete')
  })
  it('renders an accessible inbox with a configurable store and mobile back control', async () => {
    const html = await processDirectives('<ChatInbox store="coaching" />', {}, path.join(root, 'chat-test.stx'), { componentsDir: path.join(root, 'src/ui/chat'), root, buildMode: 'serve', cache: false } as any, new Set())
    expect(html).toContain('Conversation history')
    expect(html).toContain('Back to inbox')
    expect(html).toContain('Write a message')
    expect(html).toContain('coaching')
  })
  it('renders desktop and inline launchers with accessible unread controls', async () => {
    const options = { componentsDir: path.join(root, 'src/ui/chat'), root, buildMode: 'serve', cache: false } as any
    const desktop = await processDirectives('<ChatLauncher store="coaching" href="/coaches/messages" />', {}, path.join(root, 'launcher-test.stx'), options, new Set())
    expect(desktop).toContain('aria-haspopup="dialog"')
    expect(desktop).toContain('Close chat')
    expect(desktop).toContain('bottom-6')
    const phone = await processDirectives('<ChatLauncher placement="inline" href="/m/messages" />', {}, path.join(root, 'launcher-test.stx'), options, new Set())
    expect(phone).toContain('/m/messages')
    expect(phone).not.toContain('aria-haspopup="dialog"')
  })
  it('keeps failed drafts and retries with the same message key', async () => {
    let fail = true
    const keys: string[] = []
    const chat = createChat({ selfId: () => 1, scopeKey: () => 'user:1', request: async (url, init) => {
      if (url.endsWith('/messages') && init?.method === 'POST') {
        keys.push(JSON.parse(String(init.body)).client_key)
        if (fail) return Response.json({ error: 'Connection interrupted' }, { status: 503 })
        return Response.json(message)
      }
      if (url.endsWith('/conversations')) return Response.json({ id: 'thread' })
      if (url.endsWith('/thread')) return Response.json({ messages: [], has_more: false })
      return Response.json({ contacts: [contact], conversations: [], max_length: 4000 })
    } })
    await chat.load(); await chat.open(contact)
    chat.draft.set('Question')
    await chat.send()
    expect(chat.draft()).toBe('Question')
    expect(chat.error()).toBe('Connection interrupted')
    fail = false; await chat.send()
    expect(keys[0]).toBe(keys[1])
    expect(chat.draft()).toBe('')
  })
  it('opens an athlete shortcut after the navigation badge has preloaded the inbox', async () => {
    let person = 0
    const chat = createChat({ selfId: () => 1, scopeKey: () => 'one', initialRecipient: () => person, request: async (url) => {
      if (url.endsWith('/conversations')) return Response.json({ id: 'thread' })
      if (url.endsWith('/thread')) return Response.json({ messages: [], has_more: false })
      return Response.json({ contacts: [contact], conversations: [], max_length: 4000 })
    } })
    await chat.load()
    expect(chat.selected()).toBeNull()
    person = contact.id
    await chat.load()
    expect(chat.selected()?.id).toBe(contact.id)
    chat.back()
    await chat.load()
    expect(chat.selected()).toBeNull()
  })
  it('ignores an earlier contact response and clears account-scoped state', async () => {
    let resolveFirst: (response: Response) => void = () => {}
    let calls = 0, account = 'one'
    const chat = createChat({ selfId: () => 1, scopeKey: () => account, request: async (url) => {
      if (url.endsWith('/conversations')) {
        if (++calls === 1) return new Promise<Response>(resolve => { resolveFirst = resolve })
        return Response.json({ id: 'second' })
      }
      if (url.endsWith('/second')) return Response.json({ messages: [message], has_more: false })
      return Response.json({ contacts: [], conversations: [], max_length: 4000 })
    } })
    const first = chat.open(contact)
    await Promise.resolve()
    await chat.open({ ...contact, id: 3, name: 'Second athlete' })
    resolveFirst(Response.json({ id: 'first' })); await first
    expect(chat.threadId()).toBe('second')
    chat.draft.set('Private draft')
    account = 'two'; await chat.load()
    expect(chat.messages()).toEqual([])
    expect(chat.draft()).toBe('')
    expect(chat.selected()).toBeNull()
  })
})
