const PROXY_DOMAINS = [
  'img3.idealista.com',
  'img4.idealista.com',
  'cdn.idealista.com',
  'cdn.supercasa.pt',
  'cdn.imovirtual.com',
  'media.imovirtual.com',
  'cdn.casasapo.pt',
  'static.remax.pt',
  'media.remax.eu',
  'photos.zome.pt',
  'media.era.pt',
]

export function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const needsProxy = PROXY_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d))
    if (needsProxy) {
      return `/api/image-proxy?url=${encodeURIComponent(url)}`
    }
    return url
  } catch {
    return null
  }
}

export function proxyImageUrls(urls: string[]): string[] {
  return urls.map(u => proxyImageUrl(u)).filter(Boolean) as string[]
}
