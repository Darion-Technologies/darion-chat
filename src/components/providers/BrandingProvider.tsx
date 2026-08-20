'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { BrandingConfig } from '@/lib/branding/types'
import { DEFAULT_BRANDING } from '@/lib/branding/defaults'
import { generateBrandThemeTokens } from '@/lib/branding/palette'

const BrandingContext = createContext<BrandingConfig>(DEFAULT_BRANDING)

export interface BrandingProviderProps {
  children: React.ReactNode
  initialBranding: BrandingConfig
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({
  children,
  initialBranding,
}) => {
  useEffect(() => {
    if (!initialBranding) return

    // Apply dynamic CSS variables to root element
    const { lightTokens, darkTokens } = generateBrandThemeTokens(
      initialBranding.primaryColor,
      initialBranding.secondaryColor,
      initialBranding.accentColor,
      initialBranding.borderRadiusStyle
    )

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const activeTokens = isDarkMode ? { ...lightTokens, ...darkTokens } : lightTokens

    const root = document.documentElement
    Object.entries(activeTokens).forEach(([key, value]) => {
      root.style.setProperty(key, String(value))
    })

    // Dynamically update favicon if provided
    if (initialBranding.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = initialBranding.faviconUrl
    }
  }, [initialBranding])

  return (
    <BrandingContext.Provider value={initialBranding || DEFAULT_BRANDING}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding(): BrandingConfig {
  const context = useContext(BrandingContext)
  return context || DEFAULT_BRANDING
}
