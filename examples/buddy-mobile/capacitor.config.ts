import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.stacksjs.buddy',
  appName: 'Buddy',
  webDir: 'dist',
  server: {
    // For development, connect to local server
    // url: 'http://localhost:3456',
    // cleartext: true,

    // For production, use bundled assets
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#1a1a2e',
    allowsLinkPreview: false,
  },
  android: {
    backgroundColor: '#1a1a2e',
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1a2e',
    },
  },
}

export default config
