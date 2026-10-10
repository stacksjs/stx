export { default as ChatInbox } from './ChatInbox.stx'
export { default as ChatMessage } from './ChatMessage.stx'
export * from './controller'
export interface ChatInboxProps { store?: string, compact?: boolean, active?: boolean, className?: string }
export interface ChatMessageProps { body?: string, author?: string, time?: string, outgoing?: boolean, className?: string }
export { default as ChatUnreadBadge } from './ChatUnreadBadge.stx'

export { default as ChatLauncher } from './ChatLauncher.stx'
export interface ChatLauncherProps { store?: string, href?: string, placement?: 'floating' | 'inline', className?: string }
