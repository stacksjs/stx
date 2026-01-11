/**
 * useSpeech - Web Speech API wrappers
 *
 * Speech recognition and synthesis for voice-enabled applications.
 *
 * @example
 * ```ts
 * // Speech Recognition
 * const recognition = useSpeechRecognition({
 *   continuous: false,
 *   interimResults: true,
 *   lang: 'en-US'
 * })
 *
 * recognition.subscribe(state => {
 *   console.log('Transcript:', state.transcript)
 *   console.log('Is listening:', state.isListening)
 * })
 *
 * recognition.start()
 *
 * // Speech Synthesis
 * const speech = useSpeechSynthesis()
 * speech.speak('Hello, world!')
 * ```
 */

// ============================================================================
// Speech Recognition
// ============================================================================

export interface SpeechRecognitionOptions {
  /** Whether to continue listening after first result */
  continuous?: boolean
  /** Whether to return interim (in-progress) results */
  interimResults?: boolean
  /** Language code (e.g., 'en-US', 'es-ES') */
  lang?: string
  /** Maximum number of alternative transcriptions */
  maxAlternatives?: number
  /** Grammar list for recognition */
  grammars?: SpeechGrammarList
}

export interface SpeechRecognitionState {
  /** Whether currently listening */
  isListening: boolean
  /** Current transcript (final + interim) */
  transcript: string
  /** Final confirmed transcript */
  finalTranscript: string
  /** Interim (in-progress) transcript */
  interimTranscript: string
  /** Confidence score (0-1) */
  confidence: number
  /** Whether speech recognition is supported */
  isSupported: boolean
  /** Current error, if any */
  error: string | null
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface SpeechRecognitionRef {
  /** Get current state */
  get: () => SpeechRecognitionState
  /** Subscribe to state changes */
  subscribe: (fn: (state: SpeechRecognitionState) => void) => () => void
  /** Start listening */
  start: () => void
  /** Stop listening */
  stop: () => void
  /** Abort listening (immediate stop without final results) */
  abort: () => void
  /** Toggle listening on/off */
  toggle: () => void
  /** Check if supported */
  isSupported: () => boolean
  /** Listen for specific events */
  on: (event: 'result' | 'error' | 'start' | 'end', callback: (data?: any) => void) => () => void
}

// Get the SpeechRecognition constructor
function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

/**
 * Check if Speech Recognition is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null
}

/**
 * Create a speech recognition composable
 */
export function useSpeechRecognition(options: SpeechRecognitionOptions = {}): SpeechRecognitionRef {
  const SpeechRecognitionClass = getSpeechRecognition()
  const supported = SpeechRecognitionClass !== null

  let state: SpeechRecognitionState = {
    isListening: false,
    transcript: '',
    finalTranscript: '',
    interimTranscript: '',
    confidence: 0,
    isSupported: supported,
    error: null,
  }

  let recognition: SpeechRecognition | null = null
  let listeners: Array<(state: SpeechRecognitionState) => void> = []
  const eventListeners: Record<string, Array<(data?: any) => void>> = {
    result: [],
    error: [],
    start: [],
    end: [],
  }

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const emitEvent = (event: string, data?: any) => {
    eventListeners[event]?.forEach(fn => fn(data))
  }

  // Initialize recognition instance
  if (supported && SpeechRecognitionClass) {
    recognition = new SpeechRecognitionClass()
    recognition.continuous = options.continuous ?? false
    recognition.interimResults = options.interimResults ?? true
    recognition.lang = options.lang ?? 'en-US'
    recognition.maxAlternatives = options.maxAlternatives ?? 1

    if (options.grammars) {
      recognition.grammars = options.grammars
    }

    recognition.onstart = () => {
      state = { ...state, isListening: true, error: null }
      notify()
      emitEvent('start')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''
      let confidence = 0

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        confidence = Math.max(confidence, result[0].confidence || 0)

        if (result.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      state = {
        ...state,
        finalTranscript: state.finalTranscript + finalTranscript,
        interimTranscript,
        transcript: state.finalTranscript + finalTranscript + interimTranscript,
        confidence,
      }

      notify()
      emitEvent('result', {
        transcript: state.transcript,
        finalTranscript: state.finalTranscript,
        interimTranscript,
        confidence,
        isFinal: finalTranscript.length > 0,
      })
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = getErrorMessage(event.error)
      state = { ...state, error: errorMessage, isListening: false }
      notify()
      emitEvent('error', { code: event.error, message: errorMessage })
    }

    recognition.onend = () => {
      state = { ...state, isListening: false }
      notify()
      emitEvent('end', { transcript: state.transcript })
    }
  }

  const start = () => {
    if (!supported || !recognition || state.isListening) return

    // Reset transcripts on new session
    state = {
      ...state,
      transcript: '',
      finalTranscript: '',
      interimTranscript: '',
      confidence: 0,
      error: null,
    }

    try {
      recognition.start()
    } catch (err) {
      state = { ...state, error: 'Failed to start speech recognition' }
      notify()
    }
  }

  const stop = () => {
    if (!recognition || !state.isListening) return
    try {
      recognition.stop()
    } catch {
      // Ignore stop errors
    }
  }

  const abort = () => {
    if (!recognition) return
    try {
      recognition.abort()
    } catch {
      // Ignore abort errors
    }
    state = { ...state, isListening: false }
    notify()
  }

  const toggle = () => {
    if (state.isListening) {
      stop()
    } else {
      start()
    }
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)
      return () => {
        listeners = listeners.filter(l => l !== fn)
      }
    },
    start,
    stop,
    abort,
    toggle,
    isSupported: () => supported,
    on: (event, callback) => {
      if (eventListeners[event]) {
        eventListeners[event].push(callback)
        return () => {
          eventListeners[event] = eventListeners[event].filter(fn => fn !== callback)
        }
      }
      return () => {}
    },
  }
}

/**
 * Get human-readable error message
 */
function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    'no-speech': 'No speech was detected',
    'audio-capture': 'No microphone was found or microphone is disabled',
    'not-allowed': 'Microphone permission denied',
    'network': 'Network error - speech recognition requires internet',
    'aborted': 'Speech recognition was aborted',
    'service-not-allowed': 'Speech recognition service not allowed',
    'bad-grammar': 'Speech grammar error',
    'language-not-supported': 'Language not supported',
  }
  return messages[error] || `Speech recognition error: ${error}`
}

// ============================================================================
// Speech Synthesis
// ============================================================================

export interface SpeechSynthesisOptions {
  /** Voice to use (by name or index) */
  voice?: string | number
  /** Speech rate (0.1 to 10, default 1) */
  rate?: number
  /** Pitch (0 to 2, default 1) */
  pitch?: number
  /** Volume (0 to 1, default 1) */
  volume?: number
  /** Language code */
  lang?: string
}

export interface SpeechSynthesisState {
  /** Whether currently speaking */
  isSpeaking: boolean
  /** Whether speech is paused */
  isPaused: boolean
  /** Whether speech synthesis is supported */
  isSupported: boolean
  /** Available voices */
  voices: SpeechSynthesisVoice[]
  /** Current utterance text */
  currentText: string
}

export interface SpeechSynthesisRef {
  /** Get current state */
  get: () => SpeechSynthesisState
  /** Subscribe to state changes */
  subscribe: (fn: (state: SpeechSynthesisState) => void) => () => void
  /** Speak text */
  speak: (text: string, options?: SpeechSynthesisOptions) => void
  /** Stop speaking */
  stop: () => void
  /** Pause speaking */
  pause: () => void
  /** Resume speaking */
  resume: () => void
  /** Toggle pause/resume */
  toggle: () => void
  /** Get available voices */
  getVoices: () => SpeechSynthesisVoice[]
  /** Check if supported */
  isSupported: () => boolean
  /** Listen for events */
  on: (event: 'start' | 'end' | 'pause' | 'resume' | 'error', callback: (data?: any) => void) => () => void
}

/**
 * Check if Speech Synthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Create a speech synthesis composable
 */
export function useSpeechSynthesis(defaultOptions: SpeechSynthesisOptions = {}): SpeechSynthesisRef {
  const supported = isSpeechSynthesisSupported()

  let state: SpeechSynthesisState = {
    isSpeaking: false,
    isPaused: false,
    isSupported: supported,
    voices: [],
    currentText: '',
  }

  let listeners: Array<(state: SpeechSynthesisState) => void> = []
  const eventListeners: Record<string, Array<(data?: any) => void>> = {
    start: [],
    end: [],
    pause: [],
    resume: [],
    error: [],
  }
  let currentUtterance: SpeechSynthesisUtterance | null = null

  const notify = () => {
    listeners.forEach(fn => fn(state))
  }

  const emitEvent = (event: string, data?: any) => {
    eventListeners[event]?.forEach(fn => fn(data))
  }

  // Load voices
  const loadVoices = () => {
    if (!supported) return
    state = { ...state, voices: window.speechSynthesis.getVoices() }
    notify()
  }

  if (supported) {
    // Voices may load asynchronously
    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }

  const findVoice = (voiceOption: string | number | undefined): SpeechSynthesisVoice | null => {
    if (voiceOption === undefined) return null

    if (typeof voiceOption === 'number') {
      return state.voices[voiceOption] || null
    }

    return state.voices.find(v =>
      v.name.toLowerCase().includes(voiceOption.toLowerCase()) ||
      v.lang.toLowerCase().includes(voiceOption.toLowerCase())
    ) || null
  }

  const speak = (text: string, options: SpeechSynthesisOptions = {}) => {
    if (!supported || !text.trim()) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const opts = { ...defaultOptions, ...options }

    utterance.rate = opts.rate ?? 1
    utterance.pitch = opts.pitch ?? 1
    utterance.volume = opts.volume ?? 1

    if (opts.lang) utterance.lang = opts.lang

    const voice = findVoice(opts.voice)
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      state = { ...state, isSpeaking: true, isPaused: false, currentText: text }
      notify()
      emitEvent('start', { text })
    }

    utterance.onend = () => {
      state = { ...state, isSpeaking: false, isPaused: false, currentText: '' }
      notify()
      emitEvent('end', { text })
    }

    utterance.onpause = () => {
      state = { ...state, isPaused: true }
      notify()
      emitEvent('pause')
    }

    utterance.onresume = () => {
      state = { ...state, isPaused: false }
      notify()
      emitEvent('resume')
    }

    utterance.onerror = (event) => {
      state = { ...state, isSpeaking: false, isPaused: false }
      notify()
      emitEvent('error', { error: event.error })
    }

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stop = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    state = { ...state, isSpeaking: false, isPaused: false, currentText: '' }
    notify()
  }

  const pause = () => {
    if (!supported || !state.isSpeaking) return
    window.speechSynthesis.pause()
  }

  const resume = () => {
    if (!supported || !state.isPaused) return
    window.speechSynthesis.resume()
  }

  const toggle = () => {
    if (state.isPaused) {
      resume()
    } else if (state.isSpeaking) {
      pause()
    }
  }

  return {
    get: () => state,
    subscribe: (fn) => {
      listeners.push(fn)
      fn(state)
      return () => {
        listeners = listeners.filter(l => l !== fn)
      }
    },
    speak,
    stop,
    pause,
    resume,
    toggle,
    getVoices: () => state.voices,
    isSupported: () => supported,
    on: (event, callback) => {
      if (eventListeners[event]) {
        eventListeners[event].push(callback)
        return () => {
          eventListeners[event] = eventListeners[event].filter(fn => fn !== callback)
        }
      }
      return () => {}
    },
  }
}

/**
 * Simple speak function
 */
export function speak(text: string, options?: SpeechSynthesisOptions): void {
  useSpeechSynthesis(options).speak(text)
}

/**
 * Stop all speech
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Get available voices
 */
export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return []
  return window.speechSynthesis.getVoices()
}
