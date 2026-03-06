export type Role = 'system' | 'user' | 'assistant'

export interface Message {
  role: Role
  content: string
}

export interface ChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stop?: string[]
  system?: string
}

export interface ChatResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  finishReason?: string
}

export interface StreamChunk {
  content: string
  done: boolean
  finishReason?: string
}

export interface EmbeddingResponse {
  embedding: number[]
  model: string
  usage?: { totalTokens: number }
}

export interface AIProvider {
  name: string
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>
  stream?(messages: Message[], options?: ChatOptions): AsyncIterable<StreamChunk>
  embed?(text: string, model?: string): Promise<EmbeddingResponse>
}

export interface AIConfig {
  default: string
  providers: Record<string, AIProvider>
}
