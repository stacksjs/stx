import type { SpeechGrammarList } from '../../src/composables/use-speech'
import { expect, test } from 'bun:test'
import { useSpeechRecognition } from '../../src/composables/use-speech'

test.each(['SpeechRecognition', 'webkitSpeechRecognition'])('runs recognition through %s', (property) => {
  const keys = ['SpeechRecognition', 'webkitSpeechRecognition']
  const descriptors = keys.map(key => Object.getOwnPropertyDescriptor(window, key))
  const grammar = { src: 'grammar.xml', weight: 1 }
  const grammars: SpeechGrammarList = { 0: grammar, length: 1, item: () => grammar, addFromString() {}, addFromURI() {} }
  let instance: Recognition | undefined

  class Recognition {
    grammars?: SpeechGrammarList
    onstart?: () => void
    onend?: () => void
    onresult?: (event: { results: Array<readonly [{ transcript: string, confidence: number }] & { isFinal: boolean }> }) => void

    constructor() {
      instance = this
    }

    start(): void {
      this.onstart?.()
      this.onresult?.({ results: [Object.assign([{ transcript: 'Hello', confidence: 0.9 }] as const, { isFinal: true })] })
    }

    stop(): void {
      this.onend?.()
    }
  }

  try {
    for (const key of keys)
      Object.defineProperty(window, key, { configurable: true, value: key === property ? Recognition : undefined })

    const recognition = useSpeechRecognition({ grammars, lang: 'en-GB' })
    expect(recognition.isSupported()).toBe(true)
    expect(instance?.grammars).toBe(grammars)
    recognition.start()
    expect(recognition.get()).toMatchObject({ isListening: true, finalTranscript: 'Hello', confidence: 0.9 })
    recognition.stop()
    expect(recognition.get().isListening).toBe(false)
  }
  finally {
    for (const [index, key] of keys.entries()) {
      const descriptor = descriptors[index]
      if (descriptor)
        Object.defineProperty(window, key, descriptor)
      else
        Reflect.deleteProperty(window, key)
    }
  }
})
