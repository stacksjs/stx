#!/usr/bin/env bun
/**
 * Build Buddy as a macOS .app bundle
 * Uses native macOS WebKit via Swift wrapper
 */

import { $ } from 'bun'
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

const APP_NAME = 'Buddy'
const BUNDLE_ID = 'com.stacksjs.buddy'
const VERSION = '1.0.0'

const rootDir = join(import.meta.dir, '../..')
const examplesDir = join(rootDir, 'examples')
const outputDir = join(import.meta.dir, 'dist')

async function buildMacOSApp() {
  console.log('🔨 Building Buddy.app for macOS...\n')

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Create app bundle structure
  const appBundle = join(outputDir, `${APP_NAME}.app`)
  const contentsDir = join(appBundle, 'Contents')
  const macOSDir = join(contentsDir, 'MacOS')
  const resourcesDir = join(contentsDir, 'Resources')

  mkdirSync(macOSDir, { recursive: true })
  mkdirSync(resourcesDir, { recursive: true })

  // Read and inline the voice-buddy.stx HTML
  const stxPath = join(examplesDir, 'voice-buddy.stx')
  let html = readFileSync(stxPath, 'utf-8')

  // Write HTML to resources
  writeFileSync(join(resourcesDir, 'index.html'), html)
  console.log('✅ Embedded voice-buddy.stx')

  // Create Swift-based WebKit launcher
  const swiftLauncher = `
import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create main window
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1200, height: 800),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Buddy - Voice AI Assistant"
        window.center()

        // Create WebView with modern configuration
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        config.mediaTypesRequiringUserActionForPlayback = []

        // Enable microphone access
        if #available(macOS 10.15, *) {
            config.preferences.setValue(true, forKey: "javaScriptCanAccessAudioEnabled")
        }

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]

        // Load the embedded HTML
        let resourcePath = Bundle.main.resourcePath!
        let htmlPath = resourcePath + "/index.html"
        let htmlURL = URL(fileURLWithPath: htmlPath)
        webView.loadFileURL(htmlURL, allowingReadAccessTo: URL(fileURLWithPath: resourcePath))

        window.contentView?.addSubview(webView)
        window.makeKeyAndOrderFront(nil)

        // Activate app
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

// Create and run the application
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
`

  const swiftPath = join(macOSDir, 'main.swift')
  writeFileSync(swiftPath, swiftLauncher)

  // Compile Swift to native binary
  console.log('🔧 Compiling Swift launcher...')
  const binaryPath = join(macOSDir, APP_NAME)

  try {
    await $`swiftc -o ${binaryPath} ${swiftPath} -framework Cocoa -framework WebKit`.quiet()
    chmodSync(binaryPath, 0o755)
    console.log('✅ Compiled native binary')

    // Remove Swift source after compilation
    await $`rm ${swiftPath}`.quiet()
  } catch (error) {
    console.error('❌ Swift compilation failed:', error)
    console.log('\n💡 Falling back to shell-based launcher...')

    // Fallback: Create a shell script launcher that opens in browser
    const shellLauncher = `#!/bin/bash
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES="$DIR/../Resources"
open "$RESOURCES/index.html"
`
    writeFileSync(binaryPath, shellLauncher)
    chmodSync(binaryPath, 0o755)
    await $`rm -f ${swiftPath}`.quiet()
  }

  // Create Info.plist
  const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${APP_NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleName</key>
    <string>${APP_NAME}</string>
    <key>CFBundleDisplayName</key>
    <string>Buddy</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
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
    <key>NSMicrophoneUsageDescription</key>
    <string>Buddy needs microphone access for voice commands</string>
    <key>NSSpeechRecognitionUsageDescription</key>
    <string>Buddy uses speech recognition for voice control</string>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
        <key>NSAllowsLocalNetworking</key>
        <true/>
    </dict>
</dict>
</plist>`
  writeFileSync(join(contentsDir, 'Info.plist'), infoPlist)
  console.log('✅ Created Info.plist')

  // Create PkgInfo
  writeFileSync(join(contentsDir, 'PkgInfo'), 'APPL????')

  console.log(`\n✨ Built: ${appBundle}`)
  console.log('\n📦 Creating DMG...')

  // Create DMG
  const dmgPath = join(outputDir, `${APP_NAME}-${VERSION}.dmg`)
  try {
    // Remove old DMG if exists
    await $`rm -f ${dmgPath}`.quiet()

    // Create DMG using hdiutil
    await $`hdiutil create -volname ${APP_NAME} -srcfolder ${appBundle} -ov -format UDZO ${dmgPath}`.quiet()

    console.log(`✅ Created DMG: ${dmgPath}`)
    console.log(`\n🎉 Build complete! Your DMG is ready at:\n   ${dmgPath}`)
  } catch (dmgError) {
    console.log(`⚠️  DMG creation failed, but .app bundle is ready`)
    console.log(`   You can manually create a DMG or run the .app directly`)
  }

  return { appBundle, dmgPath }
}

// Run the build
buildMacOSApp().catch(console.error)
