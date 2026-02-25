import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 A criar seed data...')

  // Create demo user
  const hashed = await bcrypt.hash('demo12345', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@imoradar.pt' },
    update: {},
    create: { email: 'demo@imoradar.pt', password: hashed, name: 'Demo User', role: 'ADMIN' },
  })
  console.log('✓ Utilizador demo:', user.email)

  // Create sample listings
  const listings = [
    {
      title: 'T3 em Alfama com vista para o Tejo',
      businessType: 'buy' as const,
      propertyType: 'apartment' as const,
      typology: 'T3',
      priceEur: 385000,
      areaM2: 95,
      locationText: 'Alfama, Lisboa',
      description: 'Excelente apartamento T3 com vista para o rio Tejo. Completamente remodelado, com acabamentos de qualidade.',
      dedupeHash: 'seed-hash-1',
    },
    {
      title: 'Moradia V4 com piscina no Estoril',
      businessType: 'buy' as const,
      propertyType: 'house' as const,
      typology: 'T4',
      priceEur: 1250000,
      areaM2: 320,
      locationText: 'Estoril, Cascais',
      description: 'Moradia de luxo com jardim privativo, piscina e garagem para 3 carros.',
      dedupeHash: 'seed-hash-2',
    },
    {
      title: 'T2 no Bairro de Cedofeita',
      businessType: 'buy' as const,
      propertyType: 'apartment' as const,
      typology: 'T2',
      priceEur: 215000,
      areaM2: 72,
      locationText: 'Cedofeita, Porto',
      description: 'Apartamento T2 em zona nobre do Porto, perto de transportes e serviços.',
      dedupeHash: 'seed-hash-3',
    },
    {
      title: 'Loja comercial na Avenida da Liberdade',
      businessType: 'rent' as const,
      propertyType: 'commercial' as const,
      priceEur: 4500,
      areaM2: 150,
      locationText: 'Avenida da Liberdade, Lisboa',
      description: 'Loja em localização prime com grande visibilidade.',
      dedupeHash: 'seed-hash-4',
    },
    {
      title: 'Terreno para construção em Sintra',
      businessType: 'buy' as const,
      propertyType: 'land' as const,
      priceEur: 180000,
      areaM2: 800,
      locationText: 'Sintra, Lisboa',
      description: 'Terreno com viabilidade de construção aprovada para moradia unifamiliar.',
      dedupeHash: 'seed-hash-5',
    },
    {
      title: 'T1 para arrendar em Gaia',
      businessType: 'rent' as const,
      propertyType: 'apartment' as const,
      typology: 'T1',
      priceEur: 750,
      areaM2: 48,
      locationText: 'Vila Nova de Gaia',
      description: 'Apartamento T1 moderno, totalmente equipado.',
      dedupeHash: 'seed-hash-6',
    },
  ]

  for (const l of listings) {
    const master = await prisma.listingMaster.upsert({
      where: { dedupeHash: l.dedupeHash },
      update: {},
      create: l,
    })

    await prisma.listingSource.upsert({
      where: { sourceUrl: `https://example.com/listing/${l.dedupeHash}` },
      update: {},
      create: {
        listingMasterId: master.id,
        sourceName: ['idealista', 'supercasa', 'remax', 'era', 'casa-sapo', 'imovirtual'][Math.floor(Math.random() * 6)],
        sourceFamily: 'portals',
        sourceUrl: `https://example.com/listing/${l.dedupeHash}`,
        capturedAt: new Date(),
      },
    })

    await prisma.listingHistory.create({
      data: {
        listingMasterId: master.id,
        changeType: 'CREATED',
        note: 'Imóvel criado via seed',
      },
    })
  }

  console.log(`✓ ${listings.length} imóveis criados`)
  console.log('\n📋 Credenciais demo:')
  console.log('   Email: demo@imoradar.pt')
  console.log('   Password: demo12345')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
