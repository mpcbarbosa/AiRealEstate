import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const image = await prisma.storedImage.findUnique({
    where: { id: params.id },
    select: { data: true, mimeType: true },
  })

  if (!image) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(image.data, {
    headers: {
      'Content-Type': image.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
