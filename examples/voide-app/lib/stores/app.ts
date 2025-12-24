/**
 * App Store - Core application state
 */
import { createStore } from '../store'

export interface AppState {
  isRecording: boolean
  isProcessing: boolean
  transcript: string
  repoPath: string
  hasChanges: boolean
  speechSupported: boolean
  currentDriver: string
  isNativeApp: boolean
  terminalTitle: string
}

export const appStore = createStore<AppState>({
  isRecording: false,
  isProcessing: false,
  transcript: '',
  repoPath: '',
  hasChanges: false,
  speechSupported: false,
  currentDriver: 'claude-cli-local',
  isNativeApp: false,
  terminalTitle: 'Voide - Ready'
}, {
  name: 'app',
  persist: {
    key: 'voide:app',
    storage: 'local'
  }
})

// Actions
export const appActions = {
  setRecording: (isRecording: boolean) => {
    appStore.update({ isRecording })
  },

  setProcessing: (isProcessing: boolean) => {
    appStore.update({ isProcessing })
  },

  setTranscript: (transcript: string) => {
    appStore.update({ transcript })
  },

  setRepoPath: (repoPath: string) => {
    appStore.update({ repoPath })
  },

  setHasChanges: (hasChanges: boolean) => {
    appStore.update({ hasChanges })
  },

  setTerminalTitle: (terminalTitle: string) => {
    appStore.update({ terminalTitle })
  },

  setDriver: (currentDriver: string) => {
    appStore.update({ currentDriver })
  },

  setNativeApp: (isNativeApp: boolean) => {
    appStore.update({ isNativeApp })
  },

  setSpeechSupported: (speechSupported: boolean) => {
    appStore.update({ speechSupported })
  }
}
