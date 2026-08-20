/**
 * Beta Access Control Helper for Darion Video Meets
 */

export interface BetaAccessResult {
  hasAccess: boolean
  reason: 'admin' | 'whitelisted_email' | 'beta_profile' | 'public_enabled' | 'not_authorized'
}

export function checkUserMeetsBetaAccess(params: {
  role?: string | null
  email?: string | null
  isBetaTester?: boolean | null
}): BetaAccessResult {
  const { role, email, isBetaTester } = params

  // 1. Admins always have access
  if (role === 'admin') {
    return { hasAccess: true, reason: 'admin' }
  }

  // 2. Global public access flag
  if (process.env.NEXT_PUBLIC_ENABLE_MEETS_ALL === 'true') {
    return { hasAccess: true, reason: 'public_enabled' }
  }

  // 3. Email whitelist check
  const rawAllowedEmails = process.env.MEETS_BETA_ALLOWED_EMAILS || ''
  if (email && rawAllowedEmails) {
    const allowedList = rawAllowedEmails
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (allowedList.includes(email.toLowerCase())) {
      return { hasAccess: true, reason: 'whitelisted_email' }
    }
  }

  // 4. Database profile flag
  if (isBetaTester === true) {
    return { hasAccess: true, reason: 'beta_profile' }
  }

  return { hasAccess: false, reason: 'not_authorized' }
}
