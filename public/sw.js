/**
 * Darion Chat & Meet Background Service Worker
 * Handles real OS push events for incoming video/audio calls and messages even when the app is closed.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for incoming server push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const type = data.type || 'system'
    const title = data.title || 'Darion Chat'

    if (type === 'incoming_call') {
      const callData = data.data || {}
      const callerName = callData.callerName || 'Teammate'
      const callType = callData.callType === 'audio' ? 'Voice' : 'Video'
      const roomCode = callData.roomCode || callData.callId || ''

      event.waitUntil(
        self.registration.showNotification(`📞 Incoming ${callType} Call: ${callerName}`, {
          body: data.body || `${callerName} is calling you. Tap to answer.`,
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: `call-${roomCode || Date.now()}`,
          requireInteraction: true,
          renotify: true,
          vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500],
          data: {
            url: `/?callId=${roomCode}&callType=${callData.callType || 'audio'}&callerName=${encodeURIComponent(callerName)}&action=accept`,
            type: 'incoming_call',
            callId: callData.callId,
            roomCode: roomCode,
          },
          actions: [
            { action: 'accept', title: '📞 Answer' },
            { action: 'decline', title: '❌ Decline' },
          ],
        })
      )
    } else {
      // Standard chat message or notification
      const msgData = data.data || {}
      event.waitUntil(
        self.registration.showNotification(title, {
          body: data.body || 'New message received',
          icon: data.icon || '/icon.svg',
          badge: '/icon.svg',
          tag: msgData.conversationId ? `chat-${msgData.conversationId}` : `notif-${Date.now()}`,
          vibrate: [150, 100, 150],
          data: {
            url: msgData.url || (msgData.conversationId ? `/?convId=${msgData.conversationId}` : '/'),
            type: type,
          },
        })
      )
    }
  } catch (err) {
    console.error('Service Worker push error:', err)
  }
})

// Handle notification click and actions (Accept / Decline / Open)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const targetUrl = data.url || '/'

  if (event.action === 'decline') {
    // Dismissed call
    return
  }

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if (client.url.includes(self.origin)) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
