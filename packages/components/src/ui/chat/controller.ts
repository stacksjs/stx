import type { Signal, DerivedSignal } from '@stacksjs/stx'
import { derived, state } from '@stacksjs/stx'

export interface ChatContact { id: number, name: string, role: string }
export interface ChatMessage { id: number, sender_id: number, body: string, created_at: string, read_at: string | null, client_key: string }
export interface ChatConversation { id: string, recipient_id: number, unread: number, last_message: ChatMessage | null }
export interface ChatOptions {
  request: (path: string, init?: RequestInit) => Promise<Response>
  selfId: () => number
  /** Include both the account and selected tenant. Clears private state when either changes. */
  scopeKey: () => string
  initialRecipient?: () => number
  endpoint?: string
}

export interface ChatController {
  contacts: Signal<ChatContact[]>
  conversations: Signal<ChatConversation[]>
  selected: Signal<ChatContact | null>
  threadId: Signal<string>
  messages: Signal<ChatMessage[]>
  loading: Signal<boolean>
  threadLoading: Signal<boolean>
  sending: Signal<boolean>
  error: Signal<string>
  draft: Signal<string>
  search: Signal<string>
  unreadOnly: Signal<boolean>
  hasMore: Signal<boolean>
  maxLength: Signal<number>
  rows: DerivedSignal<Array<ChatContact & { conversation: ChatConversation | undefined }>>
  unread: DerivedSignal<number>
  canSend: DerivedSignal<boolean>
  selfId: DerivedSignal<number>
  load: () => Promise<void>
  open: (contact: ChatContact) => Promise<void>
  back: () => void
  send: () => Promise<void>
  older: () => Promise<void>
  refresh: (markRead?: boolean) => Promise<void>
  reset: () => void
}

/** Transport-injected messaging state shared by any STX app. */
export function createChat(options: ChatOptions): ChatController {
  const endpoint = options.endpoint ?? '/messages'
  const contacts = state<ChatContact[]>([])
  const conversations = state<ChatConversation[]>([])
  const selected = state<ChatContact | null>(null)
  const threadId = state('')
  const messages = state<ChatMessage[]>([])
  const loading = state(false)
  const threadLoading = state(false)
  const sending = state(false)
  const error = state('')
  const draft = state('')
  const search = state('')
  const unreadOnly = state(false)
  const hasMore = state(false)
  const maxLength = state(4000)
  let scope = ''
  let version = 0
  let drafts = new Map<number, string>()
  let retry: { body: string, key: string, thread: string } | null = null
  let refreshing = false
  let initialOpened = false

  function reset() {
    version++
    contacts.set([]); conversations.set([]); selected.set(null); threadId.set(''); messages.set([])
    draft.set(''); error.set(''); loading.set(false); threadLoading.set(false); sending.set(false)
    drafts = new Map(); retry = null; initialOpened = false; hasMore.set(false)
  }
  function checkScope() {
    const key = options.scopeKey()
    if (key !== scope) { reset(); scope = key }
    return version
  }
  async function json(path: string, init?: RequestInit) {
    const response = await options.request(`${endpoint}${path}`, init)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.error || 'Could not load messages. Try again.')
    return body
  }
  const rows = derived(() => {
    const q = search().toLowerCase().trim()
    return contacts().map(contact => ({ ...contact, conversation: conversations().find(c => c.recipient_id === contact.id) }))
      .filter(row => (!q || `${row.name} ${row.role}`.toLowerCase().includes(q)) && (!unreadOnly() || (row.conversation?.unread ?? 0) > 0))
      .sort((a, b) => (b.conversation?.last_message?.id ?? 0) - (a.conversation?.last_message?.id ?? 0) || a.name.localeCompare(b.name))
  })
  const unread = derived(() => conversations().reduce((sum, c) => sum + c.unread, 0))
  const canSend = derived(() => !!threadId() && !!draft().trim() && draft().trim().length <= maxLength() && !sending() && !threadLoading())
  const selfId = derived(options.selfId)
  function failure(cause: unknown) { error.set(cause instanceof Error ? cause.message : 'Could not load messages. Try again.') }

  async function refreshThread(token: number, id: string, mark = true) {
    const data = await json(`/conversations/${id}`)
    if (token !== version || id !== threadId() || options.scopeKey() !== scope) return
    // Keep older history the person already loaded while refreshing the latest page.
    const first = data.messages[0]?.id
    messages.set([...messages().filter(m => first && m.id < first), ...data.messages])
    if (messages().length === data.messages.length) hasMore.set(data.has_more)
    const last = data.messages.at(-1)
    if (mark && last) {
      await json(`/conversations/${id}/read`, { method: 'POST', body: JSON.stringify({ through_id: last.id }) })
      if (token === version && id === threadId()) conversations.update(list => list.map(c => c.id === id ? { ...c, unread: 0 } : c))
    }
  }
  async function load() {
    const token = checkScope()
    loading.set(true); error.set('')
    try {
      const data = await json('')
      if (token !== version || options.scopeKey() !== scope) return
      contacts.set(data.contacts); conversations.set(data.conversations); maxLength.set(data.max_length); loading.set(false)
      if (!initialOpened && options.initialRecipient) {
        initialOpened = true
        const person = data.contacts.find((c: ChatContact) => c.id === options.initialRecipient!())
        if (person) await open(person)
      }
    }
    catch (cause) { if (token === version) failure(cause) }
    finally { if (token === version) loading.set(false) }
  }
  async function open(contact: ChatContact) {
    checkScope()
    if (selected()) drafts.set(selected()!.id, draft())
    const token = ++version
    sending.set(false); selected.set(contact); draft.set(drafts.get(contact.id) ?? ''); threadId.set(''); messages.set([]); hasMore.set(false)
    error.set(''); threadLoading.set(true)
    try {
      const data = await json('/conversations', { method: 'POST', body: JSON.stringify({ recipient_id: contact.id }) })
      if (token !== version || options.scopeKey() !== scope) return
      threadId.set(data.id)
      await refreshThread(token, data.id)
    }
    catch (cause) { if (token === version) failure(cause) }
    finally { if (token === version) threadLoading.set(false) }
  }
  function back() {
    if (selected()) drafts.set(selected()!.id, draft())
    version++; sending.set(false); threadLoading.set(false); selected.set(null); threadId.set(''); messages.set([]); error.set('')
  }
  async function send() {
    checkScope()
    if (!canSend()) return
    const id = threadId(), body = draft().trim(), token = version
    const key = retry?.body === body && retry.thread === id ? retry.key : crypto.randomUUID()
    retry = { body, key, thread: id }
    sending.set(true); error.set('')
    try {
      await json(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ body, client_key: key }) })
      if (token !== version || options.scopeKey() !== scope) return
      if (draft().trim() === body) draft.set('')
      drafts.delete(selected()!.id); retry = null
      await refreshThread(token, id)
      await load()
    }
    catch (cause) { if (token === version) failure(cause) }
    finally { if (token === version) sending.set(false) }
  }
  async function older() {
    const id = threadId(), before = messages()[0]?.id, token = version
    if (!id || !before || threadLoading()) return
    threadLoading.set(true)
    try {
      const data = await json(`/conversations/${id}?before=${before}`)
      if (token === version && id === threadId()) { messages.set([...data.messages, ...messages()]); hasMore.set(data.has_more) }
    }
    catch (cause) { if (token === version) failure(cause) }
    finally { if (token === version) threadLoading.set(false) }
  }
  async function refresh(markRead = false) {
    if (refreshing || sending() || threadLoading()) return
    refreshing = true
    try {
      await load()
      if (markRead && threadId()) await refreshThread(version, threadId())
    }
    catch (cause) { failure(cause) }
    finally { refreshing = false }
  }
  return { contacts, conversations, selected, threadId, messages, loading, threadLoading, sending, error, draft, search, unreadOnly, hasMore, maxLength, rows, unread, canSend, selfId, load, open, back, send, older, refresh, reset }
}
