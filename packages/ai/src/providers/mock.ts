import type { AIProvider, ChatOptions, ChatResponse, EmbeddingResponse, Message, StreamChunk } from '../types'

export class MockProvider implements AIProvider {
  name = 'mock'
  responses: string[]
  calls: Array<{ messages: Message[], options?: ChatOptions }> = []
  private index = 0

  constructor(responses?: string[]) {
    this.responses = responses ?? ['Mock response']
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
    this.calls.push({ messages, options })
    const content = this.responses[this.index % this.responses.length]
    this.index++

    return {
      content,
      model: options?.model ?? 'mock-model',
      usage: {
        inputTokens: messages.reduce((sum, m) => sum + m.content.length, 0),
        outputTokens: content.length,
        totalTokens: messages.reduce((sum, m) => sum + m.content.length, 0) + content.length,
      },
      finishReason: 'stop',
    }
  }

  async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk> {
    this.calls.push({ messages, options })
    const content = this.responses[this.index % this.responses.length]
    this.index++

    for (let i = 0; i < content.length; i++) {
      const isLast = i === content.length - 1
      yield {
        content: content[i],
        done: isLast,
        finishReason: isLast ? 'stop' : undefined,
      }
    }
  }

  async embed(text: string, _model?: string): Promise<EmbeddingResponse> {
    const embedding: number[] = []
    for (let i = 0; i < 128; i++) {
      // Deterministic pseudo-random based on text and index
      embedding.push(Math.sin(i * 0.1 + text.length * 0.3) * 0.5)
    }

    return {
      embedding,
      model: _model ?? 'mock-embedding',
      usage: { totalTokens: text.split(/\s+/).length },
    }
  }

  addResponse(content: string): void {
    this.responses.push(content)
  }

  getLastCall(): { messages: Message[], options?: ChatOptions } | undefined {
    return this.calls[this.calls.length - 1]
  }

  reset(): void {
    this.calls = []
    this.index = 0
    this.responses = ['Mock response']
  }
}
