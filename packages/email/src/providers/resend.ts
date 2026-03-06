import type { MailMessage, MailProvider, SendResult } from '../types'

interface ResendConfig {
  apiKey: string
}

/**
 * Resend email provider.
 * Sends emails via the Resend API (https://api.resend.com/emails).
 */
export function resendProvider(config: ResendConfig): MailProvider {
  return {
    name: 'resend',

    async send(message: MailMessage): Promise<SendResult> {
      if (!config.apiKey) {
        return { success: false, error: 'Resend API key is required' }
      }

      const to = Array.isArray(message.to) ? message.to : [message.to]

      const payload: Record<string, unknown> = {
        from: message.from,
        to,
        subject: message.subject,
      }

      if (message.html)
        payload.html = message.html
      if (message.text)
        payload.text = message.text
      if (message.cc)
        payload.cc = Array.isArray(message.cc) ? message.cc : [message.cc]
      if (message.bcc)
        payload.bcc = Array.isArray(message.bcc) ? message.bcc : [message.bcc]
      if (message.replyTo)
        payload.reply_to = message.replyTo
      if (message.headers)
        payload.headers = message.headers
      if (message.attachments) {
        payload.attachments = message.attachments.map(a => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          content_type: a.contentType,
        }))
      }

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorBody = await response.text()
          return { success: false, error: `Resend API error (${response.status}): ${errorBody}` }
        }

        const result = (await response.json()) as { id?: string }
        return {
          success: true,
          messageId: result.id,
        }
      }
      catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        return { success: false, error: `Resend request failed: ${errorMessage}` }
      }
    },
  }
}
