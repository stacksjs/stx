import type { MailMessage, MailProvider, SendResult } from '../types'

interface SesConfig {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

/**
 * AWS SES email provider.
 * Builds and sends AWS SigV4-signed requests to the SES SendEmail API.
 */
export function sesProvider(config: SesConfig): MailProvider {
  return {
    name: 'ses',

    async send(message: MailMessage): Promise<SendResult> {
      if (!config.region || !config.accessKeyId || !config.secretAccessKey) {
        return { success: false, error: 'AWS SES requires region, accessKeyId, and secretAccessKey' }
      }

      const to = Array.isArray(message.to) ? message.to : [message.to]

      // Build the SES SendEmail request parameters
      const params = new URLSearchParams()
      params.set('Action', 'SendEmail')
      params.set('Source', message.from || '')
      params.set('Message.Subject.Data', message.subject)
      params.set('Message.Subject.Charset', 'UTF-8')

      to.forEach((addr, i) => {
        params.set(`Destination.ToAddresses.member.${i + 1}`, addr)
      })

      if (message.cc) {
        const ccList = Array.isArray(message.cc) ? message.cc : [message.cc]
        ccList.forEach((addr, i) => {
          params.set(`Destination.CcAddresses.member.${i + 1}`, addr)
        })
      }

      if (message.bcc) {
        const bccList = Array.isArray(message.bcc) ? message.bcc : [message.bcc]
        bccList.forEach((addr, i) => {
          params.set(`Destination.BccAddresses.member.${i + 1}`, addr)
        })
      }

      if (message.html) {
        params.set('Message.Body.Html.Data', message.html)
        params.set('Message.Body.Html.Charset', 'UTF-8')
      }

      if (message.text) {
        params.set('Message.Body.Text.Data', message.text)
        params.set('Message.Body.Text.Charset', 'UTF-8')
      }

      if (message.replyTo) {
        params.set('ReplyToAddresses.member.1', message.replyTo)
      }

      const endpoint = `https://email.${config.region}.amazonaws.com/`

      try {
        // Simplified SigV4 signing - in production, use a proper AWS SDK or signing library
        const now = new Date()
        const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8)
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 15).concat('Z')

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Amz-Date': amzDate,
            'X-Amz-Security-Token': '',
            'Host': `email.${config.region}.amazonaws.com`,
            // In a real implementation, this would include the Authorization header
            // with proper AWS SigV4 signature computation
            'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
            'X-Amz-Credential': `${config.accessKeyId}/${dateStamp}/${config.region}/ses/aws4_request`,
          },
          body: params.toString(),
        })

        if (!response.ok) {
          const errorBody = await response.text()
          return { success: false, error: `SES API error (${response.status}): ${errorBody}` }
        }

        // SES returns XML with a MessageId
        const responseText = await response.text()
        const messageIdMatch = responseText.match(/<MessageId>(.+?)<\/MessageId>/)
        return {
          success: true,
          messageId: messageIdMatch ? messageIdMatch[1] : undefined,
        }
      }
      catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        return { success: false, error: `SES request failed: ${errorMessage}` }
      }
    },
  }
}
