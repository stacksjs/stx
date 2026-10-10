export { default as ChatInbox } from './ChatInbox.stx'
export { default as ChatMessage } from './ChatMessage.stx'
export * from './controller'
export interface ChatInboxProps { store?: string, className?: string }
export interface ChatMessageProps { body?: string, author?: string, time?: string, outgoing?: boolean, className?: string }
export { default as ChatUnreadBadge } from './ChatUnreadBadge.stx'
