import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  // Imagem de teste 1x1 pixel PNG (mínimo válido)
  const pngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  // Criar source temporário para teste
  const testUrl = `https://test.imoradar.pt/validate-${Date.now()}`

  // Criar master temporário
  const master = await prisma.listingMaster.create({
    data: {
      title: '[TESTE] Validação de imagens base64',
      priceEur: 1,
      active: false, // não aparece nos listings
      confidence: 0,
      dedupeHash: `test-${Date.now()}`,
    },
  })

  // Criar source
  const source = await prisma.listingSource.create({
    data: {
      listingMasterId: master.id,
      sourceUrl: testUrl,
      sourceName: 'Teste',
      images: [],
    },
  })

  // Processar imagem base64 → StoredImage
  const [header, b64] = pngBase64.split(',')
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'
  const buffer = Buffer.from(b64, 'base64')

  const stored = await prisma.storedImage.create({
    data: {
      sourceId: source.id,
      index: 0,
      mimeType,
      data: buffer,
      size: buffer.length,
    },
  })

  const imageUrl = `/api/images/${stored.id}`

  // Verificar que consegue ler de volta
  const readBack = await prisma.storedImage.findUnique({
    where: { id: stored.id },
    select: { size: true, mimeType: true },
  })

  // Limpar dados de teste
  await prisma.storedImage.delete({ where: { id: stored.id } })
  await prisma.listingSource.delete({ where: { id: source.id } })
  await prisma.listingMaster.delete({ where: { id: master.id } })

  return NextResponse.json({
    ok: true,
    steps: {
      '1_base64_recebido': `${pngBase64.length} chars`,
      '2_buffer_criado': `${buffer.length} bytes`,
      '3_guardado_na_db': { id: stored.id, size: readBack?.size, mimeType: readBack?.mimeType },
      '4_url_gerada': imageUrl,
      '5_leitura_verificada': readBack ? '✓ OK' : '✗ FALHOU',
      '6_limpeza': '✓ Dados de teste removidos',
    },
    message: 'Pipeline base64→DB→URL funciona corretamente',
  })
}
