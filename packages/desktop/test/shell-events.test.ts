import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { shell } from '../src/shell'
import { installMockBridge } from './_mock-bridge'

describe('shell event surface', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['shell'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('onStdout fires on craft:shell:stdout events', () => {
    let chunk: any = null
    const off = shell.onStdout((e) => { chunk = e })
    window.dispatchEvent(new CustomEvent('craft:shell:stdout', {
      detail: { id: 'p1', data: 'hello\n' },
    }))
    expect(chunk).toEqual({ id: 'p1', data: 'hello\n' })
    off()
  })

  it('onStderr fires on craft:shell:stderr events', () => {
    let chunk: any = null
    const off = shell.onStderr((e) => { chunk = e })
    window.dispatchEvent(new CustomEvent('craft:shell:stderr', {
      detail: { id: 'p1', data: 'err\n' },
    }))
    expect(chunk?.data).toBe('err\n')
    off()
  })

  it('onExit fires on craft:shell:exit events', () => {
    let exit: any = null
    const off = shell.onExit((e) => { exit = e })
    window.dispatchEvent(new CustomEvent('craft:shell:exit', {
      detail: { id: 'p1', exitCode: 0 },
    }))
    expect(exit).toEqual({ id: 'p1', exitCode: 0 })
    off()
  })

  it('subscribers are independent — unsubscribing one leaves others', () => {
    const seen: string[] = []
    const offA = shell.onStdout(() => { seen.push('a') })
    const offB = shell.onStdout(() => { seen.push('b') })
    window.dispatchEvent(new CustomEvent('craft:shell:stdout', { detail: { id: '', data: '' } }))
    expect(seen).toEqual(['a', 'b'])
    offA()
    seen.length = 0
    window.dispatchEvent(new CustomEvent('craft:shell:stdout', { detail: { id: '', data: '' } }))
    expect(seen).toEqual(['b'])
    offB()
  })
})

describe('shell.openExternal URL validation', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['shell'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('rejects javascript: URLs', async () => {
    await expect(shell.openExternal('javascript:alert(1)')).rejects.toThrow(/blocked/)
  })

  it('rejects data: URLs', async () => {
    await expect(shell.openExternal('data:text/html,<script>x</script>')).rejects.toThrow(/blocked/)
  })

  it('rejects file: URLs', async () => {
    await expect(shell.openExternal('file:///etc/passwd')).rejects.toThrow(/blocked/)
  })

  it('rejects vbscript: URLs', async () => {
    await expect(shell.openExternal('vbscript:msgbox')).rejects.toThrow(/blocked/)
  })

  it('rejection is case-insensitive', async () => {
    await expect(shell.openExternal('JavaScript:alert(1)')).rejects.toThrow(/blocked/)
    await expect(shell.openExternal('FILE:///x')).rejects.toThrow(/blocked/)
  })

  it('accepts https URLs', async () => {
    await expect(shell.openExternal('https://example.com')).resolves.toBeUndefined()
  })

  it('accepts mailto: URLs', async () => {
    await expect(shell.openExternal('mailto:test@example.com')).resolves.toBeUndefined()
  })
})
