import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { MemoryProvider } from '../src/providers/memory'
import { resendProvider } from '../src/providers/resend'
import { sesProvider } from '../src/providers/ses'
import { smtpProvider } from '../src/providers/smtp'
import { renderEmailTemplate } from '../src/template'

const tmpDir = join(import.meta.dir, '.tmp')

describe('MemoryProvider', () => {
  test('sends and stores messages', async () => {
    const provider = new MemoryProvider()

    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
    })

    expect(result.success).toBe(true)
    expect(result.messageId).toBe('memory-1')
    expect(provider.sent).toHaveLength(1)
  })

  test('increments message IDs', async () => {
    const provider = new MemoryProvider()

    await provider.send({ to: 'a@test.com', subject: 'First', text: '1' })
    const result = await provider.send({ to: 'b@test.com', subject: 'Second', text: '2' })

    expect(result.messageId).toBe('memory-2')
    expect(provider.sent).toHaveLength(2)
  })

  test('getLastMessage returns the most recent message', async () => {
    const provider = new MemoryProvider()

    await provider.send({ to: 'a@test.com', subject: 'First', text: '1' })
    await provider.send({ to: 'b@test.com', subject: 'Second', text: '2' })

    const last = provider.getLastMessage()
    expect(last?.subject).toBe('Second')
    expect(last?.to).toBe('b@test.com')
  })

  test('getLastMessage returns undefined when no messages sent', () => {
    const provider = new MemoryProvider()
    expect(provider.getLastMessage()).toBeUndefined()
  })

  test('clear removes all stored messages', async () => {
    const provider = new MemoryProvider()

    await provider.send({ to: 'a@test.com', subject: 'First', text: '1' })
    await provider.send({ to: 'b@test.com', subject: 'Second', text: '2' })

    provider.clear()

    expect(provider.sent).toHaveLength(0)
    expect(provider.getLastMessage()).toBeUndefined()
  })

  test('clear resets ID counter', async () => {
    const provider = new MemoryProvider()

    await provider.send({ to: 'a@test.com', subject: 'First', text: '1' })
    provider.clear()

    const result = await provider.send({ to: 'b@test.com', subject: 'After clear', text: '2' })
    expect(result.messageId).toBe('memory-1')
  })

  test('fails when to is empty', async () => {
    const provider = new MemoryProvider()

    const result = await provider.send({ to: '', subject: 'Test', text: 'body' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Recipient')
  })

  test('fails when to is empty array', async () => {
    const provider = new MemoryProvider()

    const result = await provider.send({ to: [], subject: 'Test', text: 'body' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Recipient')
  })

  test('fails when subject is empty', async () => {
    const provider = new MemoryProvider()

    const result = await provider.send({ to: 'test@example.com', subject: '', text: 'body' })
    expect(result.success).toBe(false)
    expect(result.error).toContain('Subject')
  })

  test('stores a copy of the message, not a reference', async () => {
    const provider = new MemoryProvider()
    const message = { to: 'test@example.com', subject: 'Test', text: 'body' }

    await provider.send(message)
    message.subject = 'Modified'

    expect(provider.sent[0].subject).toBe('Test')
  })

  test('handles multiple recipients', async () => {
    const provider = new MemoryProvider()

    const result = await provider.send({
      to: ['a@test.com', 'b@test.com', 'c@test.com'],
      subject: 'Group',
      text: 'Hello all',
    })

    expect(result.success).toBe(true)
    expect(provider.sent[0].to).toEqual(['a@test.com', 'b@test.com', 'c@test.com'])
  })

  test('stores attachments', async () => {
    const provider = new MemoryProvider()

    await provider.send({
      to: 'test@example.com',
      subject: 'Attachment test',
      text: 'See attached',
      attachments: [
        { filename: 'report.pdf', content: 'pdf-data', contentType: 'application/pdf' },
      ],
    })

    const msg = provider.getLastMessage()
    expect(msg?.attachments).toHaveLength(1)
    expect(msg?.attachments![0].filename).toBe('report.pdf')
  })
})

describe('resendProvider', () => {
  test('creates provider with correct name', () => {
    const provider = resendProvider({ apiKey: 'test-key' })
    expect(provider.name).toBe('resend')
  })

  test('fails without API key', async () => {
    const provider = resendProvider({ apiKey: '' })
    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      text: 'body',
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('API key')
  })
})

describe('sesProvider', () => {
  test('creates provider with correct name', () => {
    const provider = sesProvider({
      region: 'us-east-1',
      accessKeyId: 'AKID',
      secretAccessKey: 'secret',
    })
    expect(provider.name).toBe('ses')
  })

  test('fails without required config', async () => {
    const provider = sesProvider({ region: '', accessKeyId: '', secretAccessKey: '' })
    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      text: 'body',
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('region')
  })
})

describe('smtpProvider', () => {
  test('creates provider with correct name', () => {
    const provider = smtpProvider({ host: 'localhost', port: 587 })
    expect(provider.name).toBe('smtp')
  })

  test('fails without required config', async () => {
    const provider = smtpProvider({ host: '', port: 0 })
    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      text: 'body',
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('SMTP requires host and port')
  })
})

describe('renderEmailTemplate', () => {
  test('interpolates simple variables', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'simple.stx')
    await writeFile(tpl, '<p>Hello {{ name }}, welcome to {{ place }}!</p>')

    const result = await renderEmailTemplate(tpl, { name: 'Bob', place: 'Wonderland' })
    expect(result).toBe('<p>Hello Bob, welcome to Wonderland!</p>')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('handles nested dot-path variables', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'nested.stx')
    await writeFile(tpl, '<p>{{ user.name }} ({{ user.email }})</p>')

    const result = await renderEmailTemplate(tpl, {
      user: { name: 'Alice', email: 'alice@test.com' },
    })
    expect(result).toBe('<p>Alice (alice@test.com)</p>')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('replaces undefined variables with empty string', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'missing.stx')
    await writeFile(tpl, '<p>Hello {{ unknown }}</p>')

    const result = await renderEmailTemplate(tpl, {})
    expect(result).toBe('<p>Hello </p>')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('escapes HTML in variable values', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'escape.stx')
    await writeFile(tpl, '<p>{{ content }}</p>')

    const result = await renderEmailTemplate(tpl, { content: '<script>alert("xss")</script>' })
    expect(result).toBe('<p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('handles template with no variables', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'static.stx')
    await writeFile(tpl, '<h1>No variables here</h1>')

    const result = await renderEmailTemplate(tpl, {})
    expect(result).toBe('<h1>No variables here</h1>')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('handles multiple occurrences of same variable', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'repeat.stx')
    await writeFile(tpl, '{{ name }} is {{ name }}')

    const result = await renderEmailTemplate(tpl, { name: 'Alice' })
    expect(result).toBe('Alice is Alice')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('handles whitespace variations in expressions', async () => {
    await mkdir(tmpDir, { recursive: true })
    const tpl = join(tmpDir, 'whitespace.stx')
    await writeFile(tpl, '{{name}} {{ name}} {{name }} {{  name  }}')

    const result = await renderEmailTemplate(tpl, { name: 'X' })
    expect(result).toBe('X X X X')

    await rm(tmpDir, { recursive: true, force: true })
  })

  test('throws for nonexistent template file', async () => {
    await expect(
      renderEmailTemplate('/nonexistent/template.stx', {}),
    ).rejects.toThrow()
  })
})
