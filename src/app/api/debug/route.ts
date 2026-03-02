import { NextResponse, NextRequest } from 'next/server'
import { existsSync, readdirSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const distDir = path.join(process.cwd(), '.next')
  const appDir = path.join(distDir, 'server', 'app')
  
  const manifests = existsSync(appDir) 
    ? readdirSync(appDir, {recursive: true})
        .filter((f: any) => f.toString().includes('client-reference-manifest'))
        .map((f: any) => f.toString())
    : []

  return NextResponse.json({
    cwd: process.cwd(),
    manifests,
    appDirExists: existsSync(appDir),
  })
}
