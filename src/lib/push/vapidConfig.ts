export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BA50wIE_mCg3L0i5q73PbR6yfxVChegIS5CSwSUJ1F7po-_52ArWS0tTqJyh2K_B9-rw_S-w_vIg2YPATiJPpQQ'

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'nsAgyp_CSRdrsBQr-DQcW2GGMLir3Vb939AfkgMZRLM'

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@darion.com'

/**
 * Utility to convert base64url string to Uint8Array for browser PushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
