import type { MailMessage, MailProvider, SendResult } from '../types'

/**
 * In-memory mail provider for testing.
 * Stores all sent messages in an array for assertion.
 */
export class MemoryProvider implements MailProvider {
  name = 'memory'
  sent: MailMessage[] = []
  private idCounter = 0

  async send(message: MailMessage): Promise<SendResult> {
    if (!message.to || (Array.isArray(message.to) && message.to.length === 0)) {
      return { success: false, error: 'Recipient (to) is required' }
    }
    if (!message.subject) {
      return { success: false, error: 'Subject is required' }
    }

    this.idCounter++
    this.sent.push({ ...message })

    return {
      success: true,
      messageId: `memory-${this.idCounter}`,
    }
  }

  clear(): void {
    this.sent = []
    this.idCounter = 0
  }

  getLastMessage(): MailMessage | undefined {
    return this.sent.length > 0 ? this.sent[this.sent.length - 1] : undefined
  }
}
