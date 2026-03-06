import type { ChatOptions, ChatResponse, Message } from './types'
import { useAI } from './ai'

export async function chat(
  messages: Message[],
  options?: ChatOptions & { provider?: string },
): Promise<ChatResponse> {
  const { provider: providerName, ...chatOptions } = options ?? {}
  const provider = useAI(providerName)
  return provider.chat(messages, chatOptions)
}

export async function ask(
  prompt: string,
  options?: ChatOptions & { provider?: string; system?: string },
): Promise<string> {
  const { system, ...rest } = options ?? {}
  const messages: Message[] = []

  if (system) {
    messages.push({ role: 'system', content: system })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await chat(messages, rest)
  return response.content
}
