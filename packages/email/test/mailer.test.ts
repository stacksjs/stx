import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { configureMailer, createMailer, resetMailer, sendMail } from '../src/mailer'
import { MemoryProvider } from '../src/providers/memory'

const tmpDir = join(import.meta.dir, '.tmp')

afterEach(() => {
  resetMailer()
})

describe('configureMailer', () => {
  test('configures a provider and selects it as default', () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      from: 'test@example.com',
      providers: { memory },
    })

    const mailer = createMailer()
    expect(mailer.name).toBe('memory')
  })

  test('merges providers on successive calls', () => {
    const m1 = new MemoryProvider()
    const m2 = new MemoryProvider()
    configureMailer({ providers: { first: m1 } })
    configureMailer({ providers: { second: m2 } })

    expect(createMailer('first').name).toBe('memory')
    expect(createMailer('second').name).toBe('memory')
  })
})

describe('createMailer', () => {
  test('throws if provider not configured', () => {
    expect(() => createMailer('nonexistent')).toThrow('Mail provider "nonexistent" is not configured')
  })

  test('returns named provider', () => {
    const memory = new MemoryProvider()
    configureMailer({ providers: { memory } })

    const provider = createMailer('memory')
    expect(provider).toBe(memory)
  })
})

describe('sendMail', () => {
  test('sends a basic email', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      from: 'sender@example.com',
      providers: { memory },
    })

    const result = await sendMail({
      to: 'recipient@example.com',
      subject: 'Hello',
      text: 'World',
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toBeDefined()
    expect(memory.sent).toHaveLength(1)
    expect(memory.sent[0].to).toBe('recipient@example.com')
    expect(memory.sent[0].subject).toBe('Hello')
    expect(memory.sent[0].text).toBe('World')
  })

  test('applies global from address when not specified', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      from: 'default@example.com',
      providers: { memory },
    })

    await sendMail({
      to: 'recipient@example.com',
      subject: 'Test',
      text: 'body',
    })

    expect(memory.sent[0].from).toBe('default@example.com')
  })

  test('explicit from overrides global from', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      from: 'default@example.com',
      providers: { memory },
    })

    await sendMail({
      to: 'recipient@example.com',
      from: 'specific@example.com',
      subject: 'Test',
      text: 'body',
    })

    expect(memory.sent[0].from).toBe('specific@example.com')
  })

  test('sends to multiple recipients', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      providers: { memory },
    })

    const result = await sendMail({
      to: ['alice@example.com', 'bob@example.com'],
      subject: 'Group email',
      text: 'Hello everyone',
    })

    expect(result.success).toBe(true)
    const msg = memory.sent[0]
    expect(msg.to).toEqual(['alice@example.com', 'bob@example.com'])
  })

  test('sends with cc and bcc', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      providers: { memory },
    })

    await sendMail({
      to: 'main@example.com',
      cc: 'cc@example.com',
      bcc: ['bcc1@example.com', 'bcc2@example.com'],
      subject: 'CC/BCC test',
      text: 'body',
    })

    const msg = memory.sent[0]
    expect(msg.cc).toBe('cc@example.com')
    expect(msg.bcc).toEqual(['bcc1@example.com', 'bcc2@example.com'])
  })

  test('sends with attachments', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      providers: { memory },
    })

    await sendMail({
      to: 'recipient@example.com',
      subject: 'With attachment',
      text: 'See attached',
      attachments: [
        { filename: 'hello.txt', content: 'Hello, World!' },
        { filename: 'data.bin', content: Buffer.from([0x00, 0x01, 0x02]), contentType: 'application/octet-stream' },
      ],
    })

    const msg = memory.sent[0]
    expect(msg.attachments).toHaveLength(2)
    expect(msg.attachments![0].filename).toBe('hello.txt')
    expect(msg.attachments![1].contentType).toBe('application/octet-stream')
  })

  test('sends with html content', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      providers: { memory },
    })

    await sendMail({
      to: 'recipient@example.com',
      subject: 'HTML email',
      html: '<h1>Hello</h1><p>World</p>',
    })

    expect(memory.sent[0].html).toBe('<h1>Hello</h1><p>World</p>')
  })

  test('sends with custom headers and replyTo', async () => {
    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      providers: { memory },
    })

    await sendMail({
      to: 'recipient@example.com',
      subject: 'Headers test',
      text: 'body',
      replyTo: 'reply@example.com',
      headers: { 'X-Custom-Header': 'value123' },
    })

    const msg = memory.sent[0]
    expect(msg.replyTo).toBe('reply@example.com')
    expect(msg.headers).toEqual({ 'X-Custom-Header': 'value123' })
  })

  test('renders .stx template and sends as html', async () => {
    await mkdir(tmpDir, { recursive: true })
    const templatePath = join(tmpDir, 'welcome.stx')
    await writeFile(templatePath, '<h1>Hello {{ name }}</h1><p>Welcome to {{ company }}</p>')

    const memory = new MemoryProvider()
    configureMailer({
      default: 'memory',
      providers: { memory },
    })

    const result = await sendMail({
      to: 'user@example.com',
      subject: 'Welcome!',
      template: templatePath,
      data: { name: 'Alice', company: 'Acme' },
    })

    expect(result.success).toBe(true)
    expect(memory.sent[0].html).toBe('<h1>Hello Alice</h1><p>Welcome to Acme</p>')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('throws when no provider is configured for default', async () => {
    await expect(
      sendMail({ to: 'test@example.com', subject: 'Test', text: 'body' }),
    ).rejects.toThrow('Mail provider "memory" is not configured')
  })
})
