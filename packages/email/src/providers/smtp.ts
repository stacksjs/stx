import type { MailMessage, MailProvider, SendResult } from '../types'
import { connect } from 'node:net'
import { connect as tlsConnect } from 'node:tls'

interface SmtpConfig {
  host: string
  port: number
  secure?: boolean
  auth?: {
    user: string
    pass: string
  }
}

/**
 * SMTP email provider.
 * Connects to an SMTP server and sends emails using the SMTP protocol.
 */
export function smtpProvider(config: SmtpConfig): MailProvider {
  return {
    name: 'smtp',

    async send(message: MailMessage): Promise<SendResult> {
      if (!config.host || !config.port) {
        return { success: false, error: 'SMTP requires host and port' }
      }

      const to = Array.isArray(message.to) ? message.to : [message.to]
      const from = message.from || ''

      // Build MIME message
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const mimeLines: string[] = []

      mimeLines.push(`From: ${from}`)
      mimeLines.push(`To: ${to.join(', ')}`)

      if (message.cc) {
        const ccList = Array.isArray(message.cc) ? message.cc : [message.cc]
        mimeLines.push(`Cc: ${ccList.join(', ')}`)
      }

      mimeLines.push(`Subject: ${message.subject}`)
      mimeLines.push('MIME-Version: 1.0')

      if (message.replyTo) {
        mimeLines.push(`Reply-To: ${message.replyTo}`)
      }

      if (message.headers) {
        for (const [key, value] of Object.entries(message.headers)) {
          mimeLines.push(`${key}: ${value}`)
        }
      }

      const hasMultipleParts = (message.html && message.text) || (message.attachments && message.attachments.length > 0)

      if (hasMultipleParts) {
        mimeLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
        mimeLines.push('')
        mimeLines.push(`--${boundary}`)

        if (message.text) {
          mimeLines.push('Content-Type: text/plain; charset=UTF-8')
          mimeLines.push('')
          mimeLines.push(message.text)
          mimeLines.push(`--${boundary}`)
        }

        if (message.html) {
          mimeLines.push('Content-Type: text/html; charset=UTF-8')
          mimeLines.push('')
          mimeLines.push(message.html)
          mimeLines.push(`--${boundary}`)
        }

        if (message.attachments) {
          for (const attachment of message.attachments) {
            const contentType = attachment.contentType || 'application/octet-stream'
            const content = typeof attachment.content === 'string'
              ? Buffer.from(attachment.content).toString('base64')
              : attachment.content.toString('base64')

            mimeLines.push(`Content-Type: ${contentType}; name="${attachment.filename}"`)
            mimeLines.push('Content-Transfer-Encoding: base64')
            mimeLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`)
            mimeLines.push('')
            mimeLines.push(content)
            mimeLines.push(`--${boundary}`)
          }
        }

        mimeLines.push(`--${boundary}--`)
      }
      else if (message.html) {
        mimeLines.push('Content-Type: text/html; charset=UTF-8')
        mimeLines.push('')
        mimeLines.push(message.html)
      }
      else if (message.text) {
        mimeLines.push('Content-Type: text/plain; charset=UTF-8')
        mimeLines.push('')
        mimeLines.push(message.text)
      }

      const rawMessage = mimeLines.join('\r\n')

      try {
        const messageId = await sendSmtp(config, from, to, message.bcc, rawMessage)
        return {
          success: true,
          messageId,
        }
      }
      catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        return { success: false, error: `SMTP send failed: ${errorMessage}` }
      }
    },
  }
}

function sendSmtp(
  config: SmtpConfig,
  from: string,
  to: string[],
  bcc: string | string[] | undefined,
  data: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const allRecipients = [...to]
    if (bcc) {
      const bccList = Array.isArray(bcc) ? bcc : [bcc]
      allRecipients.push(...bccList)
    }

    const onConnect = () => {
      const commands: string[] = []

      commands.push(`EHLO ${config.host}`)

      if (config.auth) {
        commands.push('AUTH LOGIN')
        commands.push(Buffer.from(config.auth.user).toString('base64'))
        commands.push(Buffer.from(config.auth.pass).toString('base64'))
      }

      commands.push(`MAIL FROM:<${from}>`)
      for (const recipient of allRecipients) {
        commands.push(`RCPT TO:<${recipient}>`)
      }
      commands.push('DATA')
      commands.push(`${data}\r\n.`)
      commands.push('QUIT')

      let cmdIndex = 0
      const messageId = `smtp-${Date.now()}`

      const sendNext = () => {
        if (cmdIndex < commands.length) {
          socket.write(`${commands[cmdIndex]}\r\n`)
          cmdIndex++
        }
        else {
          socket.end()
          resolve(messageId)
        }
      }

      socket.on('data', () => {
        sendNext()
      })
    }

    const socket = config.secure
      ? tlsConnect({ port: config.port, host: config.host }, onConnect)
      : connect(config.port, config.host, onConnect)

    socket.on('error', (err: Error) => {
      reject(err)
    })

    socket.on('timeout', () => {
      socket.destroy()
      reject(new Error('SMTP connection timeout'))
    })

    socket.setTimeout(30000)
  })
}
