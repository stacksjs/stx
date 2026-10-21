import type { CaffeinateOptions } from './power'

/** Acquire native assertions in the host process, independent of popup visibility. */
export function createPowerAssertion(options: CaffeinateOptions): () => void {
  if (typeof process === 'undefined' || process.platform !== 'darwin')
    throw new Error('Caffeinate requires macOS')

  // Load lazily: importing desktop APIs on other platforms must remain safe.
  const { dlopen, ptr } = require('bun:ffi') as typeof import('bun:ffi')
  const cf = dlopen('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation', {
    CFStringCreateWithCString: { args: ['ptr', 'ptr', 'u32'], returns: 'ptr' },
    CFRelease: { args: ['ptr'], returns: 'void' },
  })
  const io = dlopen('/System/Library/Frameworks/IOKit.framework/IOKit', {
    IOPMAssertionCreateWithName: { args: ['ptr', 'u32', 'ptr', 'ptr'], returns: 'i32' },
    IOPMAssertionRelease: { args: ['u32'], returns: 'i32' },
    IOPMAssertionDeclareUserActivity: { args: ['ptr', 'u32', 'ptr'], returns: 'i32' },
  })
  const ids: number[] = []
  let closed = false
  function release() {
    if (closed) return
    closed = true
    for (const id of ids) io.symbols.IOPMAssertionRelease(id)
    io.close()
    cf.close()
  }
  function string(value: string) {
    const bytes = Buffer.from(`${value}\0`)
    const result = cf.symbols.CFStringCreateWithCString(null, ptr(bytes), 0x08000100)
    if (!result) throw new Error('Could not create power assertion name')
    return result
  }
  try {
    const types = [
      [options.preventDisplaySleep ?? true, 'PreventUserIdleDisplaySleep'],
      [options.preventIdleSleep ?? true, 'PreventUserIdleSystemSleep'],
      [options.preventSystemSleep ?? true, 'PreventSystemSleep'],
      [options.preventDiskSleep ?? false, 'PreventDiskIdle'],
    ] as const
    for (const [enabled, type] of types) {
      if (!enabled) continue
      const name = string(options.reason || 'stx: keeping your Mac awake')
      const assertionType = string(type)
      const id = new Uint32Array(1)
      try {
        const result = io.symbols.IOPMAssertionCreateWithName(assertionType, 255, name, ptr(id))
        if (result !== 0) throw new Error(`Could not acquire ${type} (${result})`)
        ids.push(id[0])
      }
      finally {
        cf.symbols.CFRelease(name)
        cf.symbols.CFRelease(assertionType)
      }
    }
    if (!ids.length) throw new Error('At least one sleep prevention option must be enabled')
    if (options.assertUserActivity ?? true) {
      const name = string('stx: user activity')
      const id = new Uint32Array(1)
      try {
        const result = io.symbols.IOPMAssertionDeclareUserActivity(name, 0, ptr(id))
        if (result !== 0) throw new Error(`Could not declare user activity (${result})`)
        ids.push(id[0])
      }
      finally {
        cf.symbols.CFRelease(name)
      }
    }
    return release
  }
  catch (error) {
    release()
    throw error
  }
}
