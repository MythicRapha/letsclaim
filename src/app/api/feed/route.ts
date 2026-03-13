import { NextResponse } from 'next/server'
import { getLiveFeed } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const feed = getLiveFeed(30)
    return NextResponse.json(feed)
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
