import { NextRequest, NextResponse } from 'next/server'
import { recordClaim, getStats } from '@/lib/db'

// GET - fetch stats
export async function GET() {
  try {
    const stats = getStats()

    // Approximate USD value (SOL price, fetched or hardcoded fallback)
    let solPrice = 150 // fallback
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
        next: { revalidate: 300 } // cache 5 min
      })
      const data = await res.json()
      if (data?.solana?.usd) solPrice = data.solana.usd
    } catch {}

    return NextResponse.json({
      ...stats,
      solPrice,
      totalUsd: stats.totals.total_sol * solPrice,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

// POST - record a new claim
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate
    if (!body.wallet || !body.accountsClosed || !body.solReclaimed) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    recordClaim({
      wallet: body.wallet,
      accountsClosed: body.accountsClosed,
      solReclaimed: body.solReclaimed,
      network: body.network || 'solana',
      txSignatures: body.txSignatures || [],
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to record claim' }, { status: 500 })
  }
}
