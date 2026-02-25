import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const IMAGES = {
  apartment: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  ],
  house: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80',
  ],
  commercial: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  ],
  land: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  ],
}

async function main() {
  console.log('🌱 A criar seed data...')

  const hashed = await bcrypt.hash('demo12345', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@imoradar.pt' },
    update: {},
    create: { email: 'demo@imoradar.pt', password: hashed, name: 'Demo User', role: 'ADMIN' },
  })
  console.log('✓ Utilizador demo:', user.email)

  const listings = [
    {
      title: 'T3 em Alfama com vista para o Tejo',
      businessType: 'buy' as const,
      propertyType: 'apartment' as const,
      typology: 'T3',
      priceEur: 385000,
      areaM2: 95,
      locationText: 'Alfama, Lisboa',
      description: 'Excelente apartamento T3 com vista deslumbrante para o rio Tejo. Completamente remodelado com acabamentos de qualidade. Cozinha equipada, dois quartos com roupeiros embutidos e sala ampla com varanda.',
      dedupeHash: 'seed-hash-1',
      images: IMAGES.apartment,
      sourceName: 'idealista',
    },
    {
      title: 'Moradia V4 com piscina no Estoril',
      businessType: 'buy' as const,
      propertyType: 'house' as const,
      typology: 'T4',
      priceEur: 1250000,
      areaM2: 320,
      locationText: 'Estoril, Cascais',
      description: 'Moradia de luxo com jardim privativo, piscina e garagem para 3 carros. Quatro suites, sala de estar e jantar em open space, cozinha totalmente equipada. A 5 minutos da praia.',
      dedupeHash: 'seed-hash-2',
      images: IMAGES.house,
      sourceName: 'supercasa',
    },
    {
      title: 'T2 remodelado em Cedofeita',
      businessType: 'buy' as const,
      propertyType: 'apartment' as const,
      typology: 'T2',
      priceEur: 215000,
      areaM2: 72,
      locationText: 'Cedofeita, Porto',
      description: 'Apartamento T2 totalmente remodelado em zona nobre do Porto. Perto de transportes, comércio e serviços. Estacionamento na cave incluído.',
      dedupeHash: 'seed-hash-3',
      images: IMAGES.apartment,
      sourceName: 'remax',
    },
    {
      title: 'Loja comercial na Avenida da Liberdade',
      businessType: 'rent' as const,
      propertyType: 'commercial' as const,
      priceEur: 4500,
      areaM2: 150,
      locationText: 'Avenida da Liberdade, Lisboa',
      description: 'Loja em localização prime com montra para a Avenida da Liberdade. Ideal para comércio de luxo, serviços ou restauração.',
      dedupeHash: 'seed-hash-4',
      images: IMAGES.commercial,
      sourceName: 'era',
    },
    {
      title: 'Terreno para construção em Sintra',
      businessType: 'buy' as const,
      propertyType: 'land' as const,
      priceEur: 180000,
      areaM2: 800,
      locationText: 'Sintra, Lisboa',
      description: 'Terreno com viabilidade de construção aprovada para moradia unifamiliar. Vista para a Serra de Sintra. Infra-estruturas de água e luz disponíveis.',
      dedupeHash: 'seed-hash-5',
      images: IMAGES.land,
      sourceName: 'casa-sapo',
    },
    {
      title: 'T1 moderno para arrendar em Gaia',
      businessType: 'rent' as const,
      propertyType: 'apartment' as const,
      typology: 'T1',
      priceEur: 750,
      areaM2: 48,
      locationText: 'Vila Nova de Gaia',
      description: 'Apartamento T1 moderno e totalmente equipado. Cozinha americana, casa de banho renovada. Próximo do metro e do centro do Porto.',
      dedupeHash: 'seed-hash-6',
      images: IMAGES.apartment,
      sourceName: 'imovirtual',
    },
    {
      title: 'T4 de luxo no Príncipe Real',
      businessType: 'buy' as const,
      propertyType: 'apartment' as const,
      typology: 'T4',
      priceEur: 920000,
      areaM2: 180,
      locationText: 'Príncipe Real, Lisboa',
      description: 'Apartamento T4 de luxo num palacete do século XIX completamente recuperado. Tetos altos, soalho original, varandas com vista para o jardim.',
      dedupeHash: 'seed-hash-7',
      images: IMAGES.apartment,
      sourceName: 'idealista',
    },
    {
      title: 'Moradia geminada em Braga',
      businessType: 'buy' as const,
      propertyType: 'house' as const,
      typology: 'T3',
      priceEur: 295000,
      areaM2: 160,
      locationText: 'Braga',
      description: 'Moradia geminada T3 com jardim e garagem. Construção recente de 2020. Perto de escolas, hospitais e vias de acesso rápido.',
      dedupeHash: 'seed-hash-8',
      images: IMAGES.house,
      sourceName: 'remax',
    },
  ]

  for (const l of listings) {
    const { images, sourceName, ...masterData } = l

    const master = await prisma.listingMaster.upsert({
      where: { dedupeHash: masterData.dedupeHash },
      update: {
        title: masterData.title,
        priceEur: masterData.priceEur,
        description: masterData.description,
      },
      create: masterData,
    })

    await prisma.listingSource.upsert({
      where: { sourceUrl: `https://example.com/listing/${masterData.dedupeHash}` },
      update: { images },
      create: {
        listingMasterId: master.id,
        sourceName,
        sourceFamily: 'portals',
        sourceUrl: `https://example.com/listing/${masterData.dedupeHash}`,
        images,
        capturedAt: new Date(),
      },
    })

    await prisma.listingHistory.upsert({
      where: { id: `seed-history-${masterData.dedupeHash}` },
      update: {},
      create: {
        id: `seed-history-${masterData.dedupeHash}`,
        listingMasterId: master.id,
        changeType: 'CREATED',
        note: 'Imóvel criado via seed',
      },
    })
  }

  console.log(`✓ ${listings.length} imóveis criados com fotografias`)
  console.log('\n📋 Credenciais demo:')
  console.log('   Email: demo@imoradar.pt')
  console.log('   Password: demo12345')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
