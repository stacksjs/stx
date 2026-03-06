import type { ChatOptions, Message, StreamChunk } from './types'
import { useAI } from './ai'

export async function* streamChat(
  messages: Message[],
  options?: ChatOptions & { provider?: string },
): AsyncGenerator<StreamChunk> {
  const { provider: providerName, ...chatOptions } = options ?? {}
  const provider = useAI(providerName)

  if (!provider.stream) {
    throw new Error(`Provider "${provider.name}" does not support streaming.`)
  }

  yield* provider.stream(messages, chatOptions)
}

export async function collectStream(stream: AsyncIterable<StreamChunk>): Promise<string> {
  let result = ''
  for await (const chunk of stream) {
    result += chunk.content
  }
  return result
}
