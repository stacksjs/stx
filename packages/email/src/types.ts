export interface MailProvider {
  name: string
  send(message: MailMessage): Promise<SendResult>
}

export interface MailMessage {
  to: string | string[]
  from?: string
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  attachments?: MailAttachment[]
  headers?: Record<string, string>
}

export interface MailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface MailConfig {
  default: string
  from: string
  providers: Record<string, MailProvider>
}

export interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SendMailOptions extends MailMessage {
  template?: string
  data?: Record<string, unknown>
}
