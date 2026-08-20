export interface Organization {
  id: string
  name: string
  legal_name?: string | null
  slug: string
  custom_domain?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationFeatureFlags {
  video_meets?: boolean
  daily_tasks?: boolean
  payroll?: boolean
  qr_verification?: boolean
  live_tab_counter?: boolean
  [key: string]: boolean | undefined
}

export interface OrganizationBranding {
  id?: string
  organization_id: string
  app_title: string
  tagline?: string | null
  logo_light_url?: string | null
  logo_dark_url?: string | null
  icon_url?: string | null
  favicon_url?: string | null
  login_banner_url?: string | null
  login_hero_title?: string | null
  login_hero_subtitle?: string | null
  primary_color: string
  secondary_color?: string | null
  accent_color?: string | null
  font_family: string
  border_radius_style: 'sharp' | 'compact' | 'medium' | 'modern' | 'pill'
  support_email?: string | null
  support_phone?: string | null
  terms_url?: string | null
  privacy_url?: string | null
  tax_id?: string | null
  cin_number?: string | null
  address_line1?: string | null
  address_line2?: string | null
  signatory_name?: string | null
  signatory_title?: string | null
  signature_url?: string | null
  stamp_url?: string | null
  payslip_footer_disclaimer?: string | null
  mfa_issuer_name: string
  feature_flags: OrganizationFeatureFlags
  created_at?: string
  updated_at?: string
}

export interface BrandingConfig {
  organizationId: string
  organizationName: string
  legalName: string
  slug: string
  appTitle: string
  tagline: string
  logoLightUrl: string | null
  logoDarkUrl: string | null
  iconUrl: string | null
  faviconUrl: string | null
  loginBannerUrl: string | null
  loginHeroTitle: string
  loginHeroSubtitle: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  borderRadiusStyle: 'sharp' | 'compact' | 'medium' | 'modern' | 'pill'
  supportEmail: string
  supportPhone: string | null
  termsUrl: string | null
  privacyUrl: string | null
  payslip: {
    legalName: string
    taxId: string
    cinNumber: string
    addressLine1: string
    addressLine2: string | null
    signatoryName: string
    signatoryTitle: string
    signatureUrl: string | null
    stampUrl: string | null
    disclaimer: string
  }
  mfaIssuerName: string
  featureFlags: OrganizationFeatureFlags
  cssVariables: Record<string, string>
}
