import type { AIProvider, ChatOptions, ChatResponse, Message, StreamChunk } from '../types'

interface AnthropicConfig {
  apiKey: string
  model?: string
}

export function anthropicProvider(config: AnthropicConfig): AIProvider {
  const defaultModel = config.model ?? 'claude-sonnet-4-20250514'

  return {
    name: 'anthropic',

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
      if (!config.apiKey) {
        throw new Error('Anthropic API key is required.')
      }

      const model = options?.model ?? defaultModel
      const systemMessages = messages.filter(m => m.role === 'system')
      const nonSystemMessages = messages.filter(m => m.role !== 'system')

      const systemText = options?.system
        ?? (systemMessages.length > 0
          ? systemMessages.map(m => m.content).join('\n')
          : undefined)

      const body: Record<string, unknown> = {
        model,
        messages: nonSystemMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options?.maxTokens ?? 1024,
      }

      if (systemText) {
        body.system = systemText
      }
      if (options?.temperature !== undefined) {
        body.temperature = options.temperature
      }
      if (options?.topP !== undefined) {
        body.top_p = options.topP
      }
      if (options?.stop) {
        body.stop_sequences = options.stop
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as {
        content: Array<{ type: string, text: string }>
        model: string
        usage: { input_tokens: number, output_tokens: number }
        stop_reason: string
      }

      return {
        content: data.content.map(c => c.text).join(''),
        model: data.model,
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason: data.stop_reason,
      }
    },

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk> {
      if (!config.apiKey) {
        throw new Error('Anthropic API key is required.')
      }

      const model = options?.model ?? defaultModel
      const systemMessages = messages.filter(m => m.role === 'system')
      const nonSystemMessages = messages.filter(m => m.role !== 'system')

      const systemText = options?.system
        ?? (systemMessages.length > 0
          ? systemMessages.map(m => m.content).join('\n')
          : undefined)

      const body: Record<string, unknown> = {
        model,
        messages: nonSystemMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options?.maxTokens ?? 1024,
        stream: true,
      }

      if (systemText) {
        body.system = systemText
      }
      if (options?.temperature !== undefined) {
        body.temperature = options.temperature
      }
      if (options?.topP !== undefined) {
        body.top_p = options.topP
      }
      if (options?.stop) {
        body.stop_sequences = options.stop
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: '))
            continue
          const data = line.slice(6)
          if (data === '[DONE]') {
            yield { content: '', done: true, finishReason: 'stop' }
            return
          }

          try {
            const event = JSON.parse(data) as { type: string, delta?: { type: string, text: string }, stop_reason?: string }
            if (event.type === 'content_block_delta' && event.delta?.text) {
              yield { content: event.delta.text, done: false }
            }
            else if (event.type === 'message_stop') {
              yield { content: '', done: true, finishReason: 'stop' }
              return
            }
          }
          catch {
            // skip malformed JSON
          }
        }
      }
    },
  }
}
