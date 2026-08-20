/**
 * Dynamic Material Design 3 Color & Palette Engine
 * Generates harmonious light & dark mode tokens from any brand primary hex.
 */

// Helper: Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace(/^#/, '')
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('')
  }
  const num = parseInt(cleaned, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

// Helper: RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    '#' +
    [r, g, b]
      .map((x) => clamp(x).toString(16).padStart(2, '0'))
      .join('')
  )
}

// Helper: Lighten color (factor between 0 and 1)
export function lighten(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    r + (255 - r) * factor,
    g + (255 - g) * factor,
    b + (255 - b) * factor
  )
}

// Helper: Darken color (factor between 0 and 1)
export function darken(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r * (1 - factor), g * (1 - factor), b * (1 - factor))
}

// Helper: Calculate relative luminance for contrast ratio checking
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

/**
 * Generate full CSS Variable mapping for light and dark modes
 */
export function generateBrandThemeTokens(
  primaryHex: string = '#0B57D0',
  secondaryHex: string = '#4F46E5',
  accentHex: string = '#0284C7',
  borderRadiusStyle: 'sharp' | 'compact' | 'medium' | 'modern' | 'pill' = 'medium'
): { lightTokens: Record<string, string>; darkTokens: Record<string, string> } {
  // Validate hex format fallback
  const validPrimary = /^#[0-9A-Fa-f]{6}$/.test(primaryHex) ? primaryHex : '#0B57D0'
  const validSecondary = /^#[0-9A-Fa-f]{6}$/.test(secondaryHex) ? secondaryHex : '#4F46E5'
  const validAccent = /^#[0-9A-Fa-f]{6}$/.test(accentHex) ? accentHex : '#0284C7'

  // Radius definitions
  const radiusMap: Record<string, { sm: string; md: string; lg: string; xl: string }> = {
    sharp: { sm: '2px', md: '4px', lg: '6px', xl: '8px' },
    compact: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
    medium: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
    modern: { sm: '10px', md: '16px', lg: '24px', xl: '32px' },
    pill: { sm: '12px', md: '20px', lg: '28px', xl: '9999px' },
  }
  const rad = radiusMap[borderRadiusStyle] || radiusMap.medium

  // Light Mode Tokens
  const lightTokens: Record<string, string> = {
    '--md-sys-color-primary': validPrimary,
    '--md-sys-color-on-primary': getLuminance(validPrimary) > 0.45 ? '#000000' : '#FFFFFF',
    '--md-sys-color-primary-container': lighten(validPrimary, 0.88),
    '--md-sys-color-on-primary-container': darken(validPrimary, 0.70),

    '--md-sys-color-secondary': validSecondary,
    '--md-sys-color-on-secondary': getLuminance(validSecondary) > 0.45 ? '#000000' : '#FFFFFF',
    '--md-sys-color-secondary-container': lighten(validSecondary, 0.90),
    '--md-sys-color-on-secondary-container': darken(validSecondary, 0.70),

    '--md-sys-color-tertiary': validAccent,
    '--md-sys-color-on-tertiary': getLuminance(validAccent) > 0.45 ? '#000000' : '#FFFFFF',
    '--md-sys-color-tertiary-container': lighten(validAccent, 0.88),
    '--md-sys-color-on-tertiary-container': darken(validAccent, 0.70),

    // Dynamic MD3 Shapes
    '--md-sys-shape-corner-small': rad.sm,
    '--md-sys-shape-corner-medium': rad.md,
    '--md-sys-shape-corner-large': rad.lg,
    '--md-sys-shape-corner-extra-large': rad.xl,
  }

  // Dark Mode Tokens
  const darkPrimary = lighten(validPrimary, 0.35)
  const darkSecondary = lighten(validSecondary, 0.35)
  const darkAccent = lighten(validAccent, 0.35)

  const darkTokens: Record<string, string> = {
    '--md-sys-color-primary': darkPrimary,
    '--md-sys-color-on-primary': darken(validPrimary, 0.80),
    '--md-sys-color-primary-container': darken(validPrimary, 0.40),
    '--md-sys-color-on-primary-container': lighten(validPrimary, 0.85),

    '--md-sys-color-secondary': darkSecondary,
    '--md-sys-color-on-secondary': darken(validSecondary, 0.80),
    '--md-sys-color-secondary-container': darken(validSecondary, 0.45),
    '--md-sys-color-on-secondary-container': lighten(validSecondary, 0.85),

    '--md-sys-color-tertiary': darkAccent,
    '--md-sys-color-on-tertiary': darken(validAccent, 0.80),
    '--md-sys-color-tertiary-container': darken(validAccent, 0.45),
    '--md-sys-color-on-tertiary-container': lighten(validAccent, 0.85),
  }

  return { lightTokens, darkTokens }
}

/**
 * Generate CSS stylesheet text for zero-flicker HTML <head> injection
 */
export function generateThemeCssString(
  primaryHex: string = '#0B57D0',
  secondaryHex: string = '#4F46E5',
  accentHex: string = '#0284C7',
  borderRadiusStyle: 'sharp' | 'compact' | 'medium' | 'modern' | 'pill' = 'medium',
  fontFamily: string = 'Google Sans'
): string {
  const { lightTokens, darkTokens } = generateBrandThemeTokens(
    primaryHex,
    secondaryHex,
    accentHex,
    borderRadiusStyle
  )

  const lightCss = Object.entries(lightTokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')

  const darkCss = Object.entries(darkTokens)
    .map(([k, v]) => `    ${k}: ${v};`)
    .join('\n')

  const fontCss = fontFamily && fontFamily !== 'System'
    ? `  --brand-font-family: '${fontFamily}', system-ui, -apple-system, sans-serif;\n`
    : ''

  return `
:root {
${fontCss}${lightCss}
}

@media (prefers-color-scheme: dark) {
  :root {
${darkCss}
  }
}
`.trim()
}
