export { default as ChatInbox } from './ChatInbox.stx'
export { default as ChatMessage } from './ChatMessage.stx'
export { default as ConversationListItem } from './ConversationListItem.stx'
export { default as MessageBubble } from './MessageBubble.stx'
export interface ConversationListItemData { title?: string, preview?: string, avatar?: string | null, initials?: string, timestamp?: string, unread?: number, sourceSymbol?: string, sourceColor?: string }
export interface ConversationListItemProps { item: ConversationListItemData, selected?: boolean, palette?: Record<string, string> }
export interface MessageBubbleProps { body?: string, outgoing?: boolean, quote?: string, reactions?: string, unsent?: boolean, edited?: boolean, retained?: boolean, background?: string, color?: string, metadataColor?: string, joined?: boolean }
export * from './contact-link'
export * from './controller'
export interface ChatInboxProps { store?: string, compact?: boolean, active?: boolean, className?: string, contactHref?: string }
export interface ChatMessageProps { body?: string, author?: string, time?: string, outgoing?: boolean, className?: string }
export { default as ChatUnreadBadge } from './ChatUnreadBadge.stx'

export { default as ChatLauncher } from './ChatLauncher.stx'
export interface ChatLauncherProps { store?: string, href?: string, placement?: 'floating' | 'inline', className?: string }
