/**
 * Chat Store - Messages and chat persistence
 */
import { createStore } from '../store'

export interface Message {
  type: 'user' | 'assistant' | 'system' | 'error'
  content: string
  header: string
  timestamp: number
  updated?: number
}

export interface Chat {
  id: string
  messages: Message[]
  repoPath: string
  driver: string
  createdAt: number
  updatedAt: number
}

export interface ChatState {
  currentChatId: string | null
  messages: Message[]
  inputText: string
  charCount: number
}

const STORAGE_KEY_CHATS = 'voide:chats'
const STORAGE_KEY_CHAT_COUNTER = 'voide:chat_counter'

export const chatStore = createStore<ChatState>({
  currentChatId: null,
  messages: [],
  inputText: '',
  charCount: 0
}, {
  name: 'chat'
})

// Chat persistence helpers
function getAllChats(): Record<string, Chat> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_CHATS) || '{}')
  } catch {
    return {}
  }
}

function saveAllChats(chats: Record<string, Chat>) {
  localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats))
}

// Actions
export const chatActions = {
  generateChatId: (): string => {
    const counter = parseInt(localStorage.getItem(STORAGE_KEY_CHAT_COUNTER) || '0', 10) + 1
    localStorage.setItem(STORAGE_KEY_CHAT_COUNTER, counter.toString())
    return counter.toString()
  },

  getChatIdFromUrl: (): string | null => {
    const match = window.location.pathname.match(/^\/chat\/(\d+)$/)
    return match ? match[1] : null
  },

  getAllChats,

  startNewChat: (repoPath: string = '', driver: string = 'claude-cli-local'): string => {
    const chatId = chatActions.generateChatId()
    chatStore.update({
      currentChatId: chatId,
      messages: []
    })

    // Save to persistent storage
    const chats = getAllChats()
    chats[chatId] = {
      id: chatId,
      messages: [],
      repoPath,
      driver,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    saveAllChats(chats)

    // Update URL
    history.pushState({ chatId }, '', `/chat/${chatId}`)

    return chatId
  },

  loadChat: (chatId: string): boolean => {
    const chats = getAllChats()
    const chat = chats[chatId]

    if (chat) {
      chatStore.update({
        currentChatId: chatId,
        messages: chat.messages || []
      })
      return true
    }
    return false
  },

  saveCurrentChat: (repoPath: string, driver: string) => {
    const state = chatStore.get()
    if (!state.currentChatId) return

    const chats = getAllChats()
    chats[state.currentChatId] = {
      id: state.currentChatId,
      messages: state.messages,
      repoPath,
      driver,
      createdAt: chats[state.currentChatId]?.createdAt || Date.now(),
      updatedAt: Date.now()
    }
    saveAllChats(chats)
  },

  deleteChat: (chatId: string) => {
    const chats = getAllChats()
    delete chats[chatId]
    saveAllChats(chats)
  },

  addMessage: (type: Message['type'], content: string, header?: string) => {
    const state = chatStore.get()
    const driverName = header || (
      type === 'user' ? 'You' :
      type === 'assistant' ? 'AI' :
      type === 'system' ? 'System' : 'Error'
    )

    const newMessage: Message = {
      type,
      content,
      header: driverName,
      timestamp: Date.now()
    }

    chatStore.update({
      messages: [...state.messages, newMessage]
    })

    return newMessage
  },

  updateLastMessage: (type: Message['type'], content: string) => {
    const state = chatStore.get()
    const messages = [...state.messages]

    if (messages.length > 0 && messages[messages.length - 1].type === type) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
        updated: Date.now()
      }
      chatStore.update({ messages })
    }
  },

  removeLastMessage: () => {
    const state = chatStore.get()
    if (state.messages.length > 0) {
      chatStore.update({
        messages: state.messages.slice(0, -1)
      })
    }
  },

  clearMessages: () => {
    chatStore.update({ messages: [] })
  },

  setInputText: (inputText: string) => {
    chatStore.update({
      inputText,
      charCount: inputText.length
    })
  },

  clearInput: () => {
    chatStore.update({
      inputText: '',
      charCount: 0
    })
  },

  newChat: () => {
    chatStore.update({
      currentChatId: null,
      messages: []
    })
    history.pushState({}, '', '/')
  }
}
