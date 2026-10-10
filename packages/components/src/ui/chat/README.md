# Chat

A responsive inbox, conversation history, read receipts and composer for STX.
`ChatMessage` is also available for standalone server-rendered messages.

```ts
// resources/stores/chat.ts
import { createChat } from '@stacksjs/components/chat'
import { defineStore } from '@stacksjs/stx'

defineStore('chat', () => createChat({
  request: authenticatedFetch,
  selfId: () => currentUser().id,
  scopeKey: () => `${currentUser().id}:${currentGym().id}`,
  endpoint: '/messages',
}))
```

```html
<ChatInbox store="chat" />
<ChatUnreadBadge store="chat" />
```

`store` defaults to `chat`. Both components use the same controller. Polling
pauses when the page is hidden; an inbox acknowledges only displayed messages.
Drafts stay per contact until sent and clear when the account or tenant changes.
Failed sends preserve the draft and retry key. Ctrl/Command + Enter sends;
plain Enter starts a new line. Message bodies render as escaped text.

The injected transport returns JSON:

| Request | Response |
| --- | --- |
| GET /messages | `{ contacts: [{ id, name, role }], conversations: [{ id, recipient_id, unread, last_message }], max_length }` |
| POST /messages/conversations `{ recipient_id }` | `{ id, recipient_id }` |
| GET /messages/conversations/:id?before=:messageId | `{ messages, has_more }` |
| POST /messages/conversations/:id/messages `{ body, client_key }` | saved message |
| POST /messages/conversations/:id/read `{ through_id }` | success |

Messages contain `id`, `sender_id`, `body`, `created_at`, `read_at`, and
`client_key`. HTTP failures use `{ error }`. The server owns authorization and
scope selection. Stacks' native `createMessenger` supplies this persistence API.

The browser controller has its own public entry, `@stacksjs/components/chat`,
so pages do not import the library's server syntax-highlighting dependencies.
Run the component build before running its published-entry regression test.
