const config = {
  appId: 'com.darion.chat',
  appName: 'Darion Chat',
  webDir: 'public',
  server: {
    url: 'https://darion-chat.vercel.app',
    cleartext: false,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
}

export default config
