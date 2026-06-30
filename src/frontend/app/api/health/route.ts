import { NextResponse } from 'next/server';
import packageJson from '../../../package.json';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      service: 'servaan-desktop-sidecar',
      status: 'healthy',
      version: packageJson.version,
      timestamp: new Date().toISOString()
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    }
  );
}
