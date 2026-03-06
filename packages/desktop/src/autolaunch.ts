/**
 * Auto-Launch / Login Items API
 *
 * Manages application auto-start behavior on system login.
 * Uses platform-appropriate mechanisms:
 * - macOS: LaunchAgents plist files
 * - Linux: XDG autostart .desktop files
 * - Windows: Registry entries
 *
 * @example
 * ```typescript
 * import { setAutoLaunch, isAutoLaunchEnabled } from '@stacksjs/desktop'
 *
 * // Enable auto-launch
 * await setAutoLaunch(true, { appName: 'Barista' })
 *
 * // Check status
 * const enabled = await isAutoLaunchEnabled('Barista')
 *
 * // Disable
 * await setAutoLaunch(false, { appName: 'Barista' })
 * ```
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir, platform } from 'node:os'

// ============================================================================
// Types
// ============================================================================

export interface AutoLaunchOptions {
  /** Application name for the login item */
  appName?: string
  /** Path to the application executable. Defaults to process.execPath */
  appPath?: string
  /** Arguments to pass when launching */
  args?: string[]
  /** Start the app hidden/minimized */
  isHidden?: boolean
}

// ============================================================================
// Platform Implementations
// ============================================================================

function getLaunchAgentPath(appName: string): string {
  const identifier = appName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return join(homedir(), 'Library', 'LaunchAgents', `com.${identifier}.plist`)
}

function getLinuxAutostartPath(appName: string): string {
  const configDir = process.env.XDG_CONFIG_HOME || join(homedir(), '.config')
  return join(configDir, 'autostart', `${appName.toLowerCase()}.desktop`)
}

async function setAutoLaunchMacOS(enabled: boolean, options: AutoLaunchOptions): Promise<void> {
  const appName = options.appName || 'StxApp'
  const plistPath = getLaunchAgentPath(appName)
  const launchAgentsDir = join(homedir(), 'Library', 'LaunchAgents')

  if (enabled) {
    const appPath = options.appPath || process.execPath
    const args = options.args || []
    const programArgs = [appPath, ...args]

    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}</string>
    <key>ProgramArguments</key>
    <array>
${programArgs.map(arg => `        <string>${escapeXml(arg)}</string>`).join('\n')}
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
${options.isHidden ? `    <key>ProcessType</key>
    <string>Background</string>` : ''}
</dict>
</plist>`

    if (!existsSync(launchAgentsDir)) {
      mkdirSync(launchAgentsDir, { recursive: true })
    }

    writeFileSync(plistPath, plist, 'utf-8')
  }
  else {
    if (existsSync(plistPath)) {
      unlinkSync(plistPath)
    }
  }
}

async function setAutoLaunchLinux(enabled: boolean, options: AutoLaunchOptions): Promise<void> {
  const appName = options.appName || 'StxApp'
  const desktopPath = getLinuxAutostartPath(appName)
  const autostartDir = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'autostart')

  if (enabled) {
    const appPath = options.appPath || process.execPath
    const args = options.args || []
    const exec = [appPath, ...args].join(' ')

    const desktopEntry = `[Desktop Entry]
Type=Application
Name=${appName}
Exec=${exec}
Terminal=false
StartupNotify=false
${options.isHidden ? 'X-GNOME-Autostart-enabled=true\nNoDisplay=true' : ''}
`

    if (!existsSync(autostartDir)) {
      mkdirSync(autostartDir, { recursive: true })
    }

    writeFileSync(desktopPath, desktopEntry, 'utf-8')
  }
  else {
    if (existsSync(desktopPath)) {
      unlinkSync(desktopPath)
    }
  }
}

async function isAutoLaunchEnabledMacOS(appName: string): Promise<boolean> {
  return existsSync(getLaunchAgentPath(appName))
}

async function isAutoLaunchEnabledLinux(appName: string): Promise<boolean> {
  const path = getLinuxAutostartPath(appName)
  if (!existsSync(path))
    return false

  try {
    const content = readFileSync(path, 'utf-8')
    // Check for explicit disable
    if (content.includes('X-GNOME-Autostart-enabled=false'))
      return false
    if (content.includes('Hidden=true'))
      return false
    return true
  }
  catch {
    return false
  }
}

// ============================================================================
// Helpers
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Enable or disable auto-launch on system login.
 *
 * On macOS, creates/removes a LaunchAgent plist.
 * On Linux, creates/removes an XDG autostart .desktop file.
 */
export async function setAutoLaunch(enabled: boolean, options: AutoLaunchOptions = {}): Promise<void> {
  const os = platform()

  switch (os) {
    case 'darwin':
      return setAutoLaunchMacOS(enabled, options)
    case 'linux':
      return setAutoLaunchLinux(enabled, options)
    default:
      throw new Error(`Auto-launch is not yet supported on ${os}`)
  }
}

/**
 * Check if auto-launch is enabled for the given app.
 */
export async function isAutoLaunchEnabled(appName?: string): Promise<boolean> {
  const name = appName || 'StxApp'
  const os = platform()

  switch (os) {
    case 'darwin':
      return isAutoLaunchEnabledMacOS(name)
    case 'linux':
      return isAutoLaunchEnabledLinux(name)
    default:
      return false
  }
}
