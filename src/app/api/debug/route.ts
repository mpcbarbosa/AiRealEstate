import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { evalManifest } from 'next/dist/server/load-manifest'

export const dynamic = 'force-dynamic'

export async function GET() {
  const distDir = path.join(process.cwd(), '.next')
  const manifestPath = path.join(distDir, 'server', 'app', 'page_client-reference-manifest.js')
  
  try {
    const context = evalManifest(manifestPath, false)
    const manifest = (context as any).__RSC_MANIFEST?.['/page']
    const clientModuleKeys = manifest?.clientModules ? Object.keys(manifest.clientModules) : []
    
    return NextResponse.json({
      cwd: process.cwd(),
      manifestExists: existsSync(manifestPath),
      hasRSCManifest: !!(context as any).__RSC_MANIFEST,
      hasPageEntry: !!manifest,
      clientModulesCount: clientModuleKeys.length,
      firstClientModuleKey: clientModuleKeys[0] || null,
    })
  } catch(e: any) {
    return NextResponse.json({ error: e.message, cwd: process.cwd() })
  }
}
