import type { MailConfig, MailProvider, SendMailOptions, SendResult } from './types'
import { renderEmailTemplate } from './template'

let globalConfig: MailConfig = {
  default: 'memory',
  from: '',
  providers: {},
}

/**
 * Configure the global mailer with providers and defaults.
 */
export function configureMailer(config: Partial<MailConfig>): void {
  globalConfig = {
    ...globalConfig,
    ...config,
    providers: {
      ...globalConfig.providers,
      ...(config.providers || {}),
    },
  }
}

/**
 * Create a mailer (provider) by name. Falls back to the default provider.
 */
export function createMailer(provider?: string): MailProvider {
  const name = provider || globalConfig.default

  const p = globalConfig.providers[name]
  if (!p) {
    throw new Error(`Mail provider "${name}" is not configured. Available providers: ${Object.keys(globalConfig.providers).join(', ') || 'none'}`)
  }

  return p
}

/**
 * Send an email. Supports raw html/text content or .stx template rendering.
 *
 * If `template` is provided, the template file is rendered with `data` and used as the html body.
 */
export async function sendMail(options: SendMailOptions): Promise<SendResult> {
  const { template, data, ...message } = options

  // Apply global from if not specified
  if (!message.from && globalConfig.from) {
    message.from = globalConfig.from
  }

  // Render template if provided
  if (template) {
    message.html = await renderEmailTemplate(template, data || {})
  }

  const provider = createMailer()
  return provider.send(message)
}

/**
 * Reset the global mailer configuration (useful for testing).
 */
export function resetMailer(): void {
  globalConfig = {
    default: 'memory',
    from: '',
    providers: {},
  }
}
