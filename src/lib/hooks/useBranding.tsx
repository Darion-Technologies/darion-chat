'use client'

import { createContext, useContext, ReactNode } from 'react'

export interface BrandingConfig {
  companyName: string
  logoUrl?: string
  faviconUrl?: string
  primaryColor?: string
  accentColor?: string
  loginBgUrl?: string
}

const defaultBranding: BrandingConfig = {
  companyName: 'Darion Chat',
  primaryColor: '#2563eb',
}

const BrandingContext = createContext<BrandingConfig>(defaultBranding)

export const BrandingProvider = ({ children }: { children: ReactNode }) => {
  return (
    <BrandingContext.Provider value={defaultBranding}>
      {children}
    </BrandingContext.Provider>
  )
}

export const useBranding = () => useContext(BrandingContext)
