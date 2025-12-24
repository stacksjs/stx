/**
 * Settings Store - API keys and configuration (persisted)
 */
import { createStore } from '../store'

export interface SettingsState {
  apiKeys: {
    anthropic: string | null
    openai: string | null
    claudeCliHost: string | null
  }
  github: {
    connected: boolean
    token: string | null
    username: string | null
    name: string | null
    email: string | null
    avatarUrl: string | null
  }
  lastRepoPath: string | null
}

export const settingsStore = createStore<SettingsState>({
  apiKeys: {
    anthropic: null,
    openai: null,
    claudeCliHost: null
  },
  github: {
    connected: false,
    token: null,
    username: null,
    name: null,
    email: null,
    avatarUrl: null
  },
  lastRepoPath: null
}, {
  name: 'settings',
  persist: {
    key: 'voide:settings',
    storage: 'local'
  }
})

// Actions
export const settingsActions = {
  setApiKey: (provider: 'anthropic' | 'openai' | 'claudeCliHost', key: string | null) => {
    const state = settingsStore.get()
    settingsStore.update({
      apiKeys: {
        ...state.apiKeys,
        [provider]: key
      }
    })
  },

  setAllApiKeys: (keys: SettingsState['apiKeys']) => {
    settingsStore.update({ apiKeys: keys })
  },

  setGithub: (github: Partial<SettingsState['github']>) => {
    const state = settingsStore.get()
    settingsStore.update({
      github: { ...state.github, ...github }
    })
  },

  connectGithub: (data: {
    token: string
    username: string
    name?: string
    email?: string
    avatarUrl?: string
  }) => {
    settingsStore.update({
      github: {
        connected: true,
        token: data.token,
        username: data.username,
        name: data.name || null,
        email: data.email || null,
        avatarUrl: data.avatarUrl || null
      }
    })
  },

  disconnectGithub: () => {
    settingsStore.update({
      github: {
        connected: false,
        token: null,
        username: null,
        name: null,
        email: null,
        avatarUrl: null
      }
    })
  },

  setLastRepoPath: (path: string | null) => {
    settingsStore.update({ lastRepoPath: path })
  }
}
