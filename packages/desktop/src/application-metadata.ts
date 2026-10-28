import { isAbsolute } from 'node:path'

export interface ApplicationMetadata {
  displayName: string
  bundleName?: string
  bundleId?: string
}

function openCoreFoundation() {
  const { dlopen } = require('bun:ffi') as typeof import('bun:ffi')
  return dlopen('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation', {
    CFURLCreateFromFileSystemRepresentation: { args: ['ptr', 'ptr', 'i64', 'bool'], returns: 'ptr' },
    CFBundleCreate: { args: ['ptr', 'ptr'], returns: 'ptr' },
    CFStringCreateWithCString: { args: ['ptr', 'ptr', 'u32'], returns: 'ptr' },
    CFBundleGetValueForInfoDictionaryKey: { args: ['ptr', 'ptr'], returns: 'ptr' },
    CFGetTypeID: { args: ['ptr'], returns: 'u64' },
    CFStringGetTypeID: { args: [], returns: 'u64' },
    CFStringGetLength: { args: ['ptr'], returns: 'i64' },
    CFStringGetCString: { args: ['ptr', 'ptr', 'i64', 'u32'], returns: 'bool' },
    CFRelease: { args: ['ptr'], returns: 'void' },
  })
}

// The native library belongs to the host process. Bundle and string objects are released per read.
let coreFoundation: ReturnType<typeof openCoreFoundation> | undefined

/** Read macOS-localized names without executing the application or spawning a metadata command. */
export function readApplicationMetadata(path: string): ApplicationMetadata | null {
  if (!isAbsolute(path) || !/\.app$/i.test(path) || path.includes('\0')) throw new Error('Application metadata requires an absolute .app path.')
  if (process.platform !== 'darwin') throw new Error('Application metadata requires macOS.')
  const { ptr } = require('bun:ffi') as typeof import('bun:ffi')
  const cf = (coreFoundation ??= openCoreFoundation()).symbols
  const bytes = Buffer.from(path)
  const url = cf.CFURLCreateFromFileSystemRepresentation(null, ptr(bytes), bytes.length, true)
  if (!url) return null
  try {
    const bundle = cf.CFBundleCreate(null, url)
    if (!bundle) return null
    try {
      function value(key: string): string | undefined {
        const keyBytes = Buffer.from(`${key}\0`)
        const keyRef = cf.CFStringCreateWithCString(null, ptr(keyBytes), 0x08000100)
        if (!keyRef) return undefined
        try {
          // This public API reads InfoPlist.strings for the user's preferred localization first.
          const result = cf.CFBundleGetValueForInfoDictionaryKey(bundle, keyRef)
          if (!result || cf.CFGetTypeID(result) !== cf.CFStringGetTypeID()) return undefined
          const length = Number(cf.CFStringGetLength(result))
          if (length < 1 || length > 2048) return undefined
          const output = Buffer.alloc(length * 4 + 1)
          if (!cf.CFStringGetCString(result, ptr(output), output.length, 0x08000100)) return undefined
          return output.subarray(0, output.indexOf(0)).toString('utf8').trim() || undefined
        }
        finally { cf.CFRelease(keyRef) }
      }
      const bundleName = value('CFBundleName')
      const displayName = value('CFBundleDisplayName') || bundleName
      if (!displayName) return null
      return { displayName, bundleName, bundleId: value('CFBundleIdentifier') }
    }
    finally { cf.CFRelease(bundle) }
  }
  finally { cf.CFRelease(url) }
}
