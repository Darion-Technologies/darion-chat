import { cache } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BrandingConfig, Organization, OrganizationBranding } from './types'
import { DEFAULT_BRANDING } from './defaults'
import { generateBrandThemeTokens } from './palette'

/**
 * Server-side cached branding resolver
 */
export const getTenantBranding = cache(
  async (options?: {
    organizationId?: string | null
    slug?: string | null
    customDomain?: string | null
  }): Promise<BrandingConfig> => {
    try {
      const supabase = await createClient()

      let org: Organization | null = null

      // Determine host from headers if available
      let host = options?.customDomain
      if (!host && !options?.organizationId && !options?.slug) {
        try {
          const reqHeaders = await headers()
          const headerHost = reqHeaders.get('x-tenant-host') || reqHeaders.get('host')
          if (headerHost && !headerHost.includes('localhost') && !headerHost.includes('127.0.0.1')) {
            host = headerHost.split(':')[0]
          }
        } catch {
          // Headers not available in this context
        }
      }

      // 1. By Organization ID
      if (options?.organizationId) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', options.organizationId)
          .eq('is_active', true)
          .maybeSingle()
        org = data
      }

      // 2. By Custom Domain / Host
      if (!org && host) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .or(`custom_domain.eq.${host},slug.eq.${host.split('.')[0]}`)
          .eq('is_active', true)
          .maybeSingle()
        org = data
      }

      // 3. By Slug
      if (!org && options?.slug) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', options.slug)
          .eq('is_active', true)
          .maybeSingle()
        org = data
      }

      // 4. Fallback to default organization
      if (!org) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()
        org = data
      }

      if (!org) {
        return DEFAULT_BRANDING
      }

      // Fetch branding associated with this organization
      const { data: brandingData } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', org.id)
        .maybeSingle()

      const b: Partial<OrganizationBranding> = brandingData || {}

      const primaryColor = b.primary_color || DEFAULT_BRANDING.primaryColor
      const secondaryColor = b.secondary_color || DEFAULT_BRANDING.secondaryColor
      const accentColor = b.accent_color || DEFAULT_BRANDING.accentColor
      const borderRadiusStyle = b.border_radius_style || DEFAULT_BRANDING.borderRadiusStyle
      const fontFamily = b.font_family || DEFAULT_BRANDING.fontFamily

      const { lightTokens } = generateBrandThemeTokens(
        primaryColor,
        secondaryColor,
        accentColor,
        borderRadiusStyle
      )

      return {
        organizationId: org.id,
        organizationName: org.name || DEFAULT_BRANDING.organizationName,
        legalName: org.legal_name || org.name || DEFAULT_BRANDING.legalName,
        slug: org.slug || DEFAULT_BRANDING.slug,
        appTitle: b.app_title || org.name || DEFAULT_BRANDING.appTitle,
        tagline: b.tagline || DEFAULT_BRANDING.tagline,
        logoLightUrl: b.logo_light_url || null,
        logoDarkUrl: b.logo_dark_url || null,
        iconUrl: b.icon_url || null,
        faviconUrl: b.favicon_url || null,
        loginBannerUrl: b.login_banner_url || null,
        loginHeroTitle: b.login_hero_title || DEFAULT_BRANDING.loginHeroTitle,
        loginHeroSubtitle: b.login_hero_subtitle || DEFAULT_BRANDING.loginHeroSubtitle,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        borderRadiusStyle,
        supportEmail: b.support_email || DEFAULT_BRANDING.supportEmail,
        supportPhone: b.support_phone || null,
        termsUrl: b.terms_url || null,
        privacyUrl: b.privacy_url || null,
        payslip: {
          legalName: org.legal_name || org.name || DEFAULT_BRANDING.payslip.legalName,
          taxId: b.tax_id || DEFAULT_BRANDING.payslip.taxId,
          cinNumber: b.cin_number || DEFAULT_BRANDING.payslip.cinNumber,
          addressLine1: b.address_line1 || DEFAULT_BRANDING.payslip.addressLine1,
          addressLine2: b.address_line2 || null,
          signatoryName: b.signatory_name || DEFAULT_BRANDING.payslip.signatoryName,
          signatoryTitle: b.signatory_title || DEFAULT_BRANDING.payslip.signatoryTitle,
          signatureUrl: b.signature_url || null,
          stampUrl: b.stamp_url || null,
          disclaimer: b.payslip_footer_disclaimer || DEFAULT_BRANDING.payslip.disclaimer,
        },
        mfaIssuerName: b.mfa_issuer_name || org.name || DEFAULT_BRANDING.mfaIssuerName,
        featureFlags: {
          ...DEFAULT_BRANDING.featureFlags,
          ...(b.feature_flags || {}),
        },
        cssVariables: lightTokens,
      }
    } catch {
      return DEFAULT_BRANDING
    }
  }
)
