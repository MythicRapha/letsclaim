import { NextRequest, NextResponse } from 'next/server'
import { recordBurn, getBurnStats } from '@/lib/db'
import { CLAIM_TOTAL_SUPPLY } from '@/lib/constants'

// GET — public burn stats
export async function GET() {
  try {
    const stats = getBurnStats()

    const supplyReduced = stats.totals.total_claim_burned > 0
      ? ((stats.totals.total_claim_burned / CLAIM_TOTAL_SUPPLY) * 100).toFixed(4)
      : '0'

    return NextResponse.json({
      ...stats,
      supplyReduced,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch burn stats' }, { status: 500 })
  }
}

// POST — cranker records a burn (API key protected)
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.CRANK_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (!body.solSpent || !body.claimBought || !body.claimBurned) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    recordBurn({
      solSpent: body.solSpent,
      claimBought: body.claimBought,
      claimBurned: body.claimBurned,
      txBuy: body.txBuy || '',
      txBurn: body.txBurn || '',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to record burn' }, { status: 500 })
  }
}
