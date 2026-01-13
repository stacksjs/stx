/**
 * Native Build System for stx
 *
 * Builds stx templates into native desktop/mobile applications using Craft.
 *
 * @example
 * ```bash
 * stx build:native app.stx --target macos
 * stx build:native app.stx --target windows --output dist/
 * stx build:native app.stx --target linux --format appimage
 * ```
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { spawn, execSync } from 'node:child_process'
import { tmpdir, homedir, platform as osPlatform } from 'node:os'
import { injectCraftBridge } from './craft-bridge'
import { processCraftComponents, CRAFT_COMPONENT_STYLES } from './craft-components'

export type NativeTarget = 'macos' | 'windows' | 'linux' | 'ios' | 'android'
export type NativeFormat = 'app' | 'dmg' | 'pkg' | 'msi' | 'zip' | 'deb' | 'rpm' | 'appimage' | 'ipa' | 'apk'

export interface NativeBuildConfig {
  /** Input stx file */
  input: string

  /** Output directory */
  output?: string

  /** Target platform */
  target?: NativeTarget

  /** Output format (platform-specific) */
  format?: NativeFormat

  /** Application name */
  name?: string

  /** Application version */
  version?: string

  /** Application description */
  description?: string

  /** Author/Maintainer */
  author?: string

  /** Bundle identifier (for macOS/iOS) */
  bundleId?: string

  /** Path to application icon */
  icon?: string

  /** Window configuration */
  window?: {
    title?: string
    width?: number
    height?: number
    resizable?: boolean
    frameless?: boolean
    transparent?: boolean
    alwaysOnTop?: boolean
    fullscreen?: boolean
  }

  /** Native sidebar configuration (macOS only) */
  sidebar?: {
    /** Enable native macOS sidebar */
    enabled?: boolean
    /** Sidebar width in pixels */
    width?: number
    /** Sidebar sections and items */
    config?: {
      sections: Array<{
        id: string
        title: string
        items: Array<{
          id: string
          label: string
          icon?: string
          badge?: string | number
          tintColor?: string
        }>
      }>
      minWidth?: number
      maxWidth?: number
      canCollapse?: boolean
    }
  }

  /** Enable system tray/menubar */
  systemTray?: boolean

  /** Enable hot reload (dev mode) */
  hotReload?: boolean

  /** Enable dev tools */
  devTools?: boolean

  /** Path to Craft binary (auto-detected if not specified) */
  craftPath?: string

  /** Additional environment variables */
  env?: Record<string, string>

  /** Verbose output */
  verbose?: boolean
}

export interface NativeBuildResult {
  success: boolean
  target: NativeTarget
  format: NativeFormat
  outputPath?: string
  error?: string
  duration?: number
}

/**
 * Build an stx template into a native application
 */
export async function buildNative(config: NativeBuildConfig): Promise<NativeBuildResult> {
  const startTime = Date.now()

  try {
    // Validate input
    if (!existsSync(config.input)) {
      return {
        success: false,
        target: config.target || detectPlatform(),
        format: config.format || 'app',
        error: `Input file not found: ${config.input}`,
      }
    }

    // Determine target platform
    const target = config.target || detectPlatform()
    const format = config.format || getDefaultFormat(target)

    // Setup output directory
    const outputDir = config.output || join(process.cwd(), 'dist', 'native')
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true })
    }

    // Read and process the stx template
    let html = readFileSync(config.input, 'utf-8')

    // Inject Craft bridge
    html = injectCraftBridge(html, { debug: config.verbose })

    // Process Craft components
    html = processCraftComponents(html)

    // Inject component styles if not present
    if (!html.includes('craft-component-styles')) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${CRAFT_COMPONENT_STYLES}\n</head>`)
      }
    }

    // Extract app name from config or filename
    const appName = config.name || basename(config.input, '.stx')
    const appVersion = config.version || '1.0.0'

    // Find Craft binary
    const craftPath = config.craftPath || await findCraftBinary()
    if (!craftPath) {
      return {
        success: false,
        target,
        format,
        error: 'Craft binary not found. Please install Craft or specify craftPath.',
      }
    }

    if (config.verbose) {
      console.log(`📦 Building native app for ${target}...`)
      console.log(`   Input: ${config.input}`)
      console.log(`   Output: ${outputDir}`)
      console.log(`   Craft: ${craftPath}`)
    }

    // Build based on target platform
    let result: NativeBuildResult

    switch (target) {
      case 'macos':
        result = await buildMacOS(html, appName, appVersion, outputDir, format, config, craftPath)
        break
      case 'windows':
        result = await buildWindows(html, appName, appVersion, outputDir, format, config, craftPath)
        break
      case 'linux':
        result = await buildLinux(html, appName, appVersion, outputDir, format, config, craftPath)
        break
      case 'ios':
        result = await buildIOS(html, appName, appVersion, outputDir, config, craftPath)
        break
      case 'android':
        result = await buildAndroid(html, appName, appVersion, outputDir, config, craftPath)
        break
      default:
        result = {
          success: false,
          target,
          format,
          error: `Unsupported target: ${target}`,
        }
    }

    result.duration = Date.now() - startTime
    return result
  }
  catch (error) {
    return {
      success: false,
      target: config.target || detectPlatform(),
      format: config.format || 'app',
      error: (error as Error).message,
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Build for macOS
 */
async function buildMacOS(
  html: string,
  appName: string,
  appVersion: string,
  outputDir: string,
  format: NativeFormat,
  config: NativeBuildConfig,
  craftPath: string,
): Promise<NativeBuildResult> {
  const bundleId = config.bundleId || `com.stx.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`

  // Create app bundle
  const appBundlePath = join(outputDir, `${appName}.app`)
  const contentsDir = join(appBundlePath, 'Contents')
  const macOSDir = join(contentsDir, 'MacOS')
  const resourcesDir = join(contentsDir, 'Resources')

  mkdirSync(macOSDir, { recursive: true })
  mkdirSync(resourcesDir, { recursive: true })

  // Write HTML to resources
  const htmlPath = join(resourcesDir, 'index.html')
  writeFileSync(htmlPath, html)

  // Write sidebar config to resources if enabled
  let sidebarConfigPath = ''
  if (config.sidebar?.enabled && config.sidebar?.config) {
    sidebarConfigPath = join(resourcesDir, 'sidebar-config.json')
    writeFileSync(sidebarConfigPath, JSON.stringify(config.sidebar.config))
  }

  // Create launcher script that uses Craft
  const sidebarFlags = config.sidebar?.enabled
    ? `--native-sidebar --sidebar-width ${config.sidebar?.width || 240} --sidebar-config "$(cat "$RESOURCES/sidebar-config.json")"`
    : ''

  const launcherScript = `#!/bin/bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES="$DIR/../Resources"
"${craftPath}" --html "$(cat "$RESOURCES/index.html")" \\
  --title "${config.window?.title || appName}" \\
  --width ${config.window?.width || 1200} \\
  --height ${config.window?.height || 800} \\
  ${config.systemTray ? '--system-tray' : ''} \\
  ${config.devTools ? '--dev-tools' : ''} \\
  ${config.window?.frameless ? '--frameless' : ''} \\
  ${config.window?.alwaysOnTop ? '--always-on-top' : ''} \\
  ${sidebarFlags}
`
  const launcherPath = join(macOSDir, appName)
  writeFileSync(launcherPath, launcherScript)
  chmodSync(launcherPath, 0o755)

  // Copy Craft binary
  const craftBinaryDest = join(macOSDir, 'craft')
  try {
    copyFileSync(craftPath, craftBinaryDest)
    chmodSync(craftBinaryDest, 0o755)
  }
  catch {
    // Craft might be in PATH, create symlink script instead
    const craftWrapperScript = `#!/bin/bash\nexec "${craftPath}" "$@"`
    writeFileSync(craftBinaryDest, craftWrapperScript)
    chmodSync(craftBinaryDest, 0o755)
  }

  // Create Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${appName}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundleShortVersionString</key>
    <string>${appVersion}</string>
    <key>CFBundleVersion</key>
    <string>${appVersion}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
    <key>LSUIElement</key>
    <${config.systemTray ? 'true' : 'false'}/>
</dict>
</plist>`
  writeFileSync(join(contentsDir, 'Info.plist'), infoPlist)

  // Copy icon if provided
  if (config.icon && existsSync(config.icon)) {
    copyFileSync(config.icon, join(resourcesDir, 'AppIcon.icns'))
  }

  // Create DMG if requested
  if (format === 'dmg') {
    const dmgPath = join(outputDir, `${appName}-${appVersion}.dmg`)
    const dmgResult = await createDMG(appBundlePath, dmgPath, appName)
    if (!dmgResult.success) {
      return { success: false, target: 'macos', format: 'dmg', error: dmgResult.error }
    }
    return { success: true, target: 'macos', format: 'dmg', outputPath: dmgPath }
  }

  return { success: true, target: 'macos', format: 'app', outputPath: appBundlePath }
}

/**
 * Build for Windows
 */
async function buildWindows(
  html: string,
  appName: string,
  appVersion: string,
  outputDir: string,
  format: NativeFormat,
  config: NativeBuildConfig,
  craftPath: string,
): Promise<NativeBuildResult> {
  const appDir = join(outputDir, appName)
  mkdirSync(appDir, { recursive: true })

  // Write HTML
  const htmlPath = join(appDir, 'index.html')
  writeFileSync(htmlPath, html)

  // Create batch launcher
  const launcherBat = `@echo off
set DIR=%~dp0
"${craftPath}" --html-file "%DIR%index.html" ^
  --title "${config.window?.title || appName}" ^
  --width ${config.window?.width || 1200} ^
  --height ${config.window?.height || 800} ^
  ${config.systemTray ? '--system-tray' : ''} ^
  ${config.devTools ? '--dev-tools' : ''}
`
  writeFileSync(join(appDir, `${appName}.bat`), launcherBat)

  // Create ZIP if requested
  if (format === 'zip') {
    const zipPath = join(outputDir, `${appName}-${appVersion}-windows.zip`)
    const zipResult = await createZip(appDir, zipPath)
    if (!zipResult.success) {
      return { success: false, target: 'windows', format: 'zip', error: zipResult.error }
    }
    return { success: true, target: 'windows', format: 'zip', outputPath: zipPath }
  }

  return { success: true, target: 'windows', format: 'app', outputPath: appDir }
}

/**
 * Build for Linux
 */
async function buildLinux(
  html: string,
  appName: string,
  appVersion: string,
  outputDir: string,
  format: NativeFormat,
  config: NativeBuildConfig,
  craftPath: string,
): Promise<NativeBuildResult> {
  const appDir = join(outputDir, appName)
  mkdirSync(appDir, { recursive: true })

  // Write HTML
  const htmlPath = join(appDir, 'index.html')
  writeFileSync(htmlPath, html)

  // Create launcher script
  const launcherScript = `#!/bin/bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
"${craftPath}" --html-file "$DIR/index.html" \\
  --title "${config.window?.title || appName}" \\
  --width ${config.window?.width || 1200} \\
  --height ${config.window?.height || 800} \\
  ${config.systemTray ? '--system-tray' : ''} \\
  ${config.devTools ? '--dev-tools' : ''}
`
  const launcherPath = join(appDir, appName.toLowerCase())
  writeFileSync(launcherPath, launcherScript)
  chmodSync(launcherPath, 0o755)

  // Create .desktop file
  const desktopFile = `[Desktop Entry]
Type=Application
Name=${appName}
Exec=${launcherPath}
Terminal=false
Categories=Utility;
`
  writeFileSync(join(appDir, `${appName.toLowerCase()}.desktop`), desktopFile)

  // Create DEB if requested
  if (format === 'deb') {
    const debPath = join(outputDir, `${appName.toLowerCase()}_${appVersion}_amd64.deb`)
    const debResult = await createDEB(appDir, debPath, appName, appVersion, config)
    if (!debResult.success) {
      return { success: false, target: 'linux', format: 'deb', error: debResult.error }
    }
    return { success: true, target: 'linux', format: 'deb', outputPath: debPath }
  }

  // Create AppImage if requested
  if (format === 'appimage') {
    const appImagePath = join(outputDir, `${appName}-${appVersion}-x86_64.AppImage`)
    const appImageResult = await createAppImage(appDir, appImagePath, appName, config)
    if (!appImageResult.success) {
      return { success: false, target: 'linux', format: 'appimage', error: appImageResult.error }
    }
    return { success: true, target: 'linux', format: 'appimage', outputPath: appImagePath }
  }

  return { success: true, target: 'linux', format: 'app', outputPath: appDir }
}

/**
 * Build for iOS (placeholder - requires Xcode)
 */
async function buildIOS(
  _html: string,
  appName: string,
  _appVersion: string,
  _outputDir: string,
  _config: NativeBuildConfig,
  _craftPath: string,
): Promise<NativeBuildResult> {
  return {
    success: false,
    target: 'ios',
    format: 'ipa',
    error: `iOS build requires Xcode and additional setup. Use 'stx init:ios ${appName}' to create an iOS project.`,
  }
}

/**
 * Build for Android (placeholder - requires Android SDK)
 */
async function buildAndroid(
  _html: string,
  appName: string,
  _appVersion: string,
  _outputDir: string,
  _config: NativeBuildConfig,
  _craftPath: string,
): Promise<NativeBuildResult> {
  return {
    success: false,
    target: 'android',
    format: 'apk',
    error: `Android build requires Android SDK and additional setup. Use 'stx init:android ${appName}' to create an Android project.`,
  }
}

/**
 * Find Craft binary in common locations
 */
async function findCraftBinary(): Promise<string | null> {
  const possiblePaths = [
    // Monorepo locations
    join(process.cwd(), '../../craft/packages/zig/zig-out/bin/craft-minimal'),
    join(process.cwd(), '../craft/packages/zig/zig-out/bin/craft-minimal'),
    join(homedir(), 'Code/craft/packages/zig/zig-out/bin/craft-minimal'),
    // Installed locations
    '/usr/local/bin/craft',
    '/usr/bin/craft',
    join(homedir(), '.local/bin/craft'),
    // Windows
    join(process.env.LOCALAPPDATA || '', 'craft', 'craft.exe'),
    join(process.env.PROGRAMFILES || '', 'craft', 'craft.exe'),
  ]

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path
    }
  }

  // Try to find in PATH
  try {
    const result = execSync('which craft 2>/dev/null || where craft 2>nul', { encoding: 'utf-8' })
    const craftPath = result.trim().split('\n')[0]
    if (craftPath && existsSync(craftPath)) {
      return craftPath
    }
  }
  catch {
    // Not found in PATH
  }

  return null
}

/**
 * Detect current platform
 */
function detectPlatform(): NativeTarget {
  switch (osPlatform()) {
    case 'darwin':
      return 'macos'
    case 'win32':
      return 'windows'
    default:
      return 'linux'
  }
}

/**
 * Get default format for platform
 */
function getDefaultFormat(target: NativeTarget): NativeFormat {
  switch (target) {
    case 'macos':
      return 'app'
    case 'windows':
      return 'zip'
    case 'linux':
      return 'appimage'
    case 'ios':
      return 'ipa'
    case 'android':
      return 'apk'
    default:
      return 'app'
  }
}

/**
 * Create macOS DMG
 */
async function createDMG(
  appBundlePath: string,
  outputPath: string,
  volumeName: string,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn('hdiutil', [
      'create',
      '-volname', volumeName,
      '-srcfolder', appBundlePath,
      '-ov',
      '-format', 'UDZO',
      outputPath,
    ])

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      }
      else {
        resolve({ success: false, error: `hdiutil exited with code ${code}` })
      }
    })

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })
  })
}

/**
 * Create ZIP archive
 */
async function createZip(
  sourceDir: string,
  outputPath: string,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn('zip', ['-r', outputPath, '.'], { cwd: sourceDir })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      }
      else {
        resolve({ success: false, error: `zip exited with code ${code}` })
      }
    })

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })
  })
}

/**
 * Create Linux DEB package
 */
async function createDEB(
  appDir: string,
  outputPath: string,
  appName: string,
  appVersion: string,
  config: NativeBuildConfig,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const tempDir = join(tmpdir(), `stx-deb-${Date.now()}`)
      const debianDir = join(tempDir, 'DEBIAN')
      const binDir = join(tempDir, 'usr', 'bin')
      const shareDir = join(tempDir, 'usr', 'share', 'applications')
      const dataDir = join(tempDir, 'usr', 'share', appName.toLowerCase())

      mkdirSync(debianDir, { recursive: true })
      mkdirSync(binDir, { recursive: true })
      mkdirSync(shareDir, { recursive: true })
      mkdirSync(dataDir, { recursive: true })

      // Copy app files
      const files = require('fs').readdirSync(appDir)
      for (const file of files) {
        copyFileSync(join(appDir, file), join(dataDir, file))
      }

      // Create launcher
      const launcherScript = `#!/bin/bash\nexec /usr/share/${appName.toLowerCase()}/${appName.toLowerCase()} "$@"`
      writeFileSync(join(binDir, appName.toLowerCase()), launcherScript)
      chmodSync(join(binDir, appName.toLowerCase()), 0o755)

      // Create control file
      const control = `Package: ${appName.toLowerCase()}
Version: ${appVersion}
Section: utils
Priority: optional
Architecture: amd64
Depends: libgtk-3-0, libwebkit2gtk-4.0-37
Maintainer: ${config.author || 'Unknown'}
Description: ${config.description || appName}
`
      writeFileSync(join(debianDir, 'control'), control)

      // Build DEB
      const proc = spawn('dpkg-deb', ['--build', tempDir, outputPath])

      proc.on('close', (code) => {
        // Cleanup
        require('fs').rmSync(tempDir, { recursive: true, force: true })

        if (code === 0) {
          resolve({ success: true })
        }
        else {
          resolve({ success: false, error: `dpkg-deb exited with code ${code}` })
        }
      })

      proc.on('error', (err) => {
        require('fs').rmSync(tempDir, { recursive: true, force: true })
        resolve({ success: false, error: err.message })
      })
    }
    catch (error) {
      resolve({ success: false, error: (error as Error).message })
    }
  })
}

/**
 * Create Linux AppImage
 */
async function createAppImage(
  appDir: string,
  outputPath: string,
  appName: string,
  config: NativeBuildConfig,
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const tempDir = join(tmpdir(), `stx-appimage-${Date.now()}`)
      const appDirPath = join(tempDir, `${appName}.AppDir`)
      const usrDir = join(appDirPath, 'usr')
      const binDir = join(usrDir, 'bin')
      const shareDir = join(usrDir, 'share')

      mkdirSync(binDir, { recursive: true })
      mkdirSync(shareDir, { recursive: true })

      // Copy app files
      const dataDir = join(shareDir, appName.toLowerCase())
      mkdirSync(dataDir, { recursive: true })
      const files = require('fs').readdirSync(appDir)
      for (const file of files) {
        copyFileSync(join(appDir, file), join(dataDir, file))
      }

      // Create AppRun
      const appRun = `#!/bin/bash
SELF=$(readlink -f "$0")
HERE=\${SELF%/*}
export PATH="\${HERE}/usr/bin:\${PATH}"
exec "\${HERE}/usr/share/${appName.toLowerCase()}/${appName.toLowerCase()}" "$@"
`
      writeFileSync(join(appDirPath, 'AppRun'), appRun)
      chmodSync(join(appDirPath, 'AppRun'), 0o755)

      // Create .desktop file
      const desktop = `[Desktop Entry]
Type=Application
Name=${appName}
Exec=${appName.toLowerCase()}
Terminal=false
Categories=Utility;
Icon=${appName.toLowerCase()}
`
      writeFileSync(join(appDirPath, `${appName.toLowerCase()}.desktop`), desktop)

      // Create placeholder icon
      const placeholderPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
        0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
        0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ])
      writeFileSync(join(appDirPath, `${appName.toLowerCase()}.png`), placeholderPng)

      // Copy icon if provided
      if (config.icon && existsSync(config.icon)) {
        copyFileSync(config.icon, join(appDirPath, `${appName.toLowerCase()}.png`))
      }

      // Build AppImage
      const proc = spawn('appimagetool', [appDirPath, outputPath], {
        env: { ...process.env, ARCH: 'x86_64' },
      })

      proc.on('close', (code) => {
        require('fs').rmSync(tempDir, { recursive: true, force: true })

        if (code === 0) {
          chmodSync(outputPath, 0o755)
          resolve({ success: true })
        }
        else {
          resolve({
            success: false,
            error: `appimagetool exited with code ${code}. Install from https://appimage.github.io/appimagetool/`,
          })
        }
      })

      proc.on('error', (err) => {
        require('fs').rmSync(tempDir, { recursive: true, force: true })
        resolve({ success: false, error: `appimagetool not found: ${err.message}` })
      })
    }
    catch (error) {
      resolve({ success: false, error: (error as Error).message })
    }
  })
}

/**
 * Get available targets for current platform
 */
export function getAvailableTargets(): NativeTarget[] {
  const current = detectPlatform()
  // Can only build for current platform without cross-compilation tools
  return [current]
}

/**
 * Get available formats for a target
 */
export function getAvailableFormats(target: NativeTarget): NativeFormat[] {
  switch (target) {
    case 'macos':
      return ['app', 'dmg', 'pkg']
    case 'windows':
      return ['app', 'zip', 'msi']
    case 'linux':
      return ['app', 'deb', 'rpm', 'appimage']
    case 'ios':
      return ['ipa']
    case 'android':
      return ['apk']
    default:
      return ['app']
  }
}

const nativeBuild: {
  buildNative: typeof buildNative
  getAvailableTargets: typeof getAvailableTargets
  getAvailableFormats: typeof getAvailableFormats
  detectPlatform: typeof detectPlatform
} = {
  buildNative,
  getAvailableTargets,
  getAvailableFormats,
  detectPlatform,
}

export default nativeBuild
