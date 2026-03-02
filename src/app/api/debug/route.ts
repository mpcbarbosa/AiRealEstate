import { NextResponse } from 'next/server'
import { existsSync, readFileSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  const distDir = path.join(process.cwd(), '.next')
  const manifestPath = path.join(distDir, 'server', 'app', 'page_client-reference-manifest.js')
  
  return NextResponse.json({
    cwd: process.cwd(),
    manifestExists: existsSync(manifestPath),
    manifestSize: existsSync(manifestPath) ? readFileSync(manifestPath).length : 0,
    buildId: existsSync(path.join(distDir, 'BUILD_ID')) ? readFileSync(path.join(distDir, 'BUILD_ID'), 'utf8').trim() : null,
    nodeEnv: process.env.NODE_ENV,
  })
}
