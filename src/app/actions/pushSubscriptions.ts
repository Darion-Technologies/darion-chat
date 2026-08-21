'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export interface StoredPushSubscription {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
  userAgent?: string
  updatedAt: string
}

/**
 * Save / Upsert a user's browser or device PushSubscription
 */
export async function savePushSubscriptionAction(subscriptionData: {
  endpoint: string
  expirationTime?: number | null
  keys?: {
    p256dh: string
    auth: string
  }
  userAgent?: string
}) {
  try {
    if (!subscriptionData || !subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
      return { success: false, error: 'Invalid subscription payload' }
    }

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const admin = createAdminClient()
    const nowIso = new Date().toISOString()

    // 1. Try upserting into `push_subscriptions` table if available
    try {
      const { error: tableError } = await admin.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
          user_agent: subscriptionData.userAgent || 'web',
          updated_at: nowIso,
        },
        { onConflict: 'user_id,endpoint' }
      )

      if (!tableError) {
        return { success: true }
      }
    } catch {
      // Fallback to storing in profile metadata
    }

    // 2. Storage fallback in profile metadata array
    const { data: profile } = await admin
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle()

    const meta = profile?.metadata || {}
    const existingSubs: StoredPushSubscription[] = Array.isArray(meta.push_subscriptions)
      ? meta.push_subscriptions
      : []

    const filtered = existingSubs.filter((s) => s.endpoint !== subscriptionData.endpoint)
    filtered.push({
      endpoint: subscriptionData.endpoint,
      expirationTime: subscriptionData.expirationTime || null,
      keys: {
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
      },
      userAgent: subscriptionData.userAgent || 'web',
      updatedAt: nowIso,
    })

    // Keep last 5 active devices per user
    const capped = filtered.slice(-5)

    await admin
      .from('profiles')
      .update({
        metadata: {
          ...meta,
          push_subscriptions: capped,
        },
        updated_at: nowIso,
      })
      .eq('id', userId)

    return { success: true }
  } catch (err: any) {
    console.error('Error saving push subscription:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Retrieve all registered active push subscriptions for a target user
 */
export async function getPushSubscriptionsForUser(userId: string): Promise<StoredPushSubscription[]> {
  try {
    const admin = createAdminClient()

    // 1. Try querying `push_subscriptions` table
    try {
      const { data: rows, error } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth, user_agent, updated_at')
        .eq('user_id', userId)

      if (!error && rows && rows.length > 0) {
        return rows.map((r: any) => ({
          endpoint: r.endpoint,
          keys: {
            p256dh: r.p256dh,
            auth: r.auth,
          },
          userAgent: r.user_agent,
          updatedAt: r.updated_at,
        }))
      }
    } catch {}

    // 2. Query fallback from profiles metadata
    const { data: profile } = await admin
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.metadata?.push_subscriptions && Array.isArray(profile.metadata.push_subscriptions)) {
      return profile.metadata.push_subscriptions
    }

    return []
  } catch (err) {
    console.error('Error fetching push subscriptions for user:', err)
    return []
  }
}

/**
 * Remove / Clean up expired or unsubscribed push endpoints
 */
export async function removePushSubscriptionAction(endpoint: string) {
  try {
    const admin = createAdminClient()
    try {
      await admin.from('push_subscriptions').delete().eq('endpoint', endpoint)
    } catch {}

    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    if (userId) {
      const { data: profile } = await admin
        .from('profiles')
        .select('metadata')
        .eq('id', userId)
        .maybeSingle()

      if (profile?.metadata?.push_subscriptions) {
        const remaining = profile.metadata.push_subscriptions.filter(
          (s: StoredPushSubscription) => s.endpoint !== endpoint
        )
        await admin
          .from('profiles')
          .update({
            metadata: { ...profile.metadata, push_subscriptions: remaining },
          })
          .eq('id', userId)
      }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
