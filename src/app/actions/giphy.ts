'use server'

export interface GiphyGifItem {
  id: string
  title: string
  url: string
  previewUrl: string
  width: number
  height: number
}

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'

/**
 * Server Action to search or fetch trending GIFs directly from GIPHY
 */
export async function searchGiphyAction(query = '', limit = 30): Promise<GiphyGifItem[]> {
  try {
    const trimmed = query.trim()
    let endpoint = ''

    if (!trimmed || trimmed.toLowerCase() === 'trending') {
      endpoint = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
    } else {
      endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(trimmed)}&limit=${limit}&rating=g`
    }

    const res = await fetch(endpoint, {
      next: { revalidate: 60 }, // Cache for 60 seconds for high performance
    })

    if (!res.ok) {
      console.error('Giphy API response error:', res.status, res.statusText)
      return []
    }

    const json = await res.json()
    if (!json.data || !Array.isArray(json.data)) {
      return []
    }

    return json.data.map((item: any) => {
      const images = item.images || {}
      const fixedHeight = images.fixed_height || images.downsized_medium || images.original || {}
      const preview = images.fixed_height_small || images.preview_gif || images.fixed_height || fixedHeight

      return {
        id: item.id || `gif-${Math.random().toString(36).substring(7)}`,
        title: item.title?.trim() || 'GIPHY GIF',
        url: fixedHeight.url || images.original?.url || item.url,
        previewUrl: preview.url || fixedHeight.url || images.original?.url,
        width: parseInt(fixedHeight.width || '200', 10),
        height: parseInt(fixedHeight.height || '200', 10),
      }
    })
  } catch (err) {
    console.error('Failed to fetch from Giphy:', err)
    return []
  }
}
