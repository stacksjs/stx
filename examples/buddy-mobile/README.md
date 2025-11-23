# Buddy Mobile

Voice AI Code Assistant for iOS and Android.

## Prerequisites

- **macOS** with Xcode installed (for iOS builds)
- **Bun** runtime
- **CocoaPods** (`sudo gem install cocoapods`)
- An Apple Developer account (for device deployment)

## Quick Start

### 1. Install Dependencies

```bash
cd examples/buddy-mobile
bun install
```

### 2. Add iOS Platform

```bash
npx cap add ios
```

### 3. Build and Open in Xcode

```bash
bun run build
```

This will:
1. Build the web assets from `voice-buddy.stx`
2. Sync to the iOS project
3. Open Xcode

### 4. Run on Your iPhone

In Xcode:
1. Connect your iPhone via USB
2. Select your device from the device dropdown (top left)
3. Click the **Run** button (▶️)
4. Trust the developer certificate on your iPhone if prompted
   - Go to Settings > General > VPN & Device Management

## Development Mode

For live reload during development:

```bash
# Start the backend server
bun ../buddy-service.ts &

# Run with live reload on device
bun run dev
```

## Project Structure

```
buddy-mobile/
├── capacitor.config.ts   # Capacitor configuration
├── package.json          # Dependencies
├── scripts/
│   └── build-web.ts      # Web asset builder
├── dist/                 # Built web assets (generated)
└── ios/                  # iOS project (generated)
```

## Features on Mobile

- **Voice Input** - Uses native iOS speech recognition
- **Text Input** - Fallback for quiet environments
- **GitHub Integration** - Connect your account
- **Haptic Feedback** - Native tactile responses
- **Safe Area Support** - Works with notches and home indicators
- **Dark Mode** - Native dark theme

## Troubleshooting

### "Unable to verify app"
Go to Settings > General > VPN & Device Management and trust your developer certificate.

### Speech Recognition Not Working
Ensure microphone permissions are granted in Settings > Buddy > Microphone.

### Build Fails
1. Run `pod install` in the `ios/App` directory
2. Ensure you have the latest Xcode Command Line Tools

## Backend Connection

By default, the mobile app uses the bundled static assets. For development with the full backend:

1. Edit `capacitor.config.ts`
2. Uncomment the `server.url` line
3. Set it to your Mac's local IP (e.g., `http://192.168.1.100:3456`)
4. Run `bun run sync`

## Building for Release

1. In Xcode, select **Product > Archive**
2. Follow the distribution wizard
3. Upload to App Store Connect or export for Ad Hoc distribution
