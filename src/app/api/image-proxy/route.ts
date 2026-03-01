import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ALLOWED_DOMAINS = [
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

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url obrigatório' }, { status: 400 })

  // Validar domínio
  let parsed: URL
  try { parsed = new URL(url) }
  catch { return NextResponse.json({ error: 'URL inválido' }, { status: 400 }) }

  const allowed = ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d))
  if (!allowed) return NextResponse.json({ error: 'Domínio não permitido' }, { status: 403 })

  try {
    const response = await fetch(url, {
      headers: {
        // Simular browser para evitar bloqueios de hotlink
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': `https://${parsed.hostname}/`,
        'Accept': 'image/webp,image/avif,image/*,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream ${response.status}` }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Não é uma imagem' }, { status: 400 })
    }

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // cache 1 dia
        'X-Proxy': 'imoradar',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro ao buscar imagem', detail: err.message }, { status: 502 })
  }
}
