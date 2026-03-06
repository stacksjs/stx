import type { AIProvider, ChatOptions, ChatResponse, EmbeddingResponse, Message, StreamChunk } from '../types'

interface OpenAIConfig {
  apiKey: string
  model?: string
  baseUrl?: string
}

export function openaiProvider(config: OpenAIConfig): AIProvider {
  const defaultModel = config.model ?? 'gpt-4o'
  const baseUrl = config.baseUrl ?? 'https://api.openai.com/v1'

  return {
    name: 'openai',

    async chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse> {
      if (!config.apiKey) {
        throw new Error('OpenAI API key is required.')
      }

      const model = options?.model ?? defaultModel
      const allMessages = [...messages]

      if (options?.system) {
        allMessages.unshift({ role: 'system', content: options.system })
      }

      const body: Record<string, unknown> = {
        model,
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options?.maxTokens ?? 1024,
      }

      if (options?.temperature !== undefined) {
        body.temperature = options.temperature
      }
      if (options?.topP !== undefined) {
        body.top_p = options.topP
      }
      if (options?.stop) {
        body.stop = options.stop
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string }, finish_reason: string }>
        model: string
        usage: { prompt_tokens: number, completion_tokens: number, total_tokens: number }
      }

      const choice = data.choices[0]

      return {
        content: choice.message.content,
        model: data.model,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: choice.finish_reason,
      }
    },

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk> {
      if (!config.apiKey) {
        throw new Error('OpenAI API key is required.')
      }

      const model = options?.model ?? defaultModel
      const allMessages = [...messages]

      if (options?.system) {
        allMessages.unshift({ role: 'system', content: options.system })
      }

      const body: Record<string, unknown> = {
        model,
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: options?.maxTokens ?? 1024,
        stream: true,
      }

      if (options?.temperature !== undefined) {
        body.temperature = options.temperature
      }
      if (options?.topP !== undefined) {
        body.top_p = options.topP
      }
      if (options?.stop) {
        body.stop = options.stop
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
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
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            yield { content: '', done: true, finishReason: 'stop' }
            return
          }

          try {
            const event = JSON.parse(data) as {
              choices: Array<{ delta: { content?: string }, finish_reason?: string }>
            }
            const choice = event.choices[0]
            if (choice.delta.content) {
              yield { content: choice.delta.content, done: false }
            }
            if (choice.finish_reason) {
              yield { content: '', done: true, finishReason: choice.finish_reason }
              return
            }
          }
          catch {
            // skip malformed JSON
          }
        }
      }
    },

    async embed(text: string, model?: string): Promise<EmbeddingResponse> {
      if (!config.apiKey) {
        throw new Error('OpenAI API key is required.')
      }

      const embeddingModel = model ?? 'text-embedding-3-small'

      const response = await fetch(`${baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: text,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as {
        data: Array<{ embedding: number[] }>
        model: string
        usage: { total_tokens: number }
      }

      return {
        embedding: data.data[0].embedding,
        model: data.model,
        usage: { totalTokens: data.usage.total_tokens },
      }
    },
  }
}
