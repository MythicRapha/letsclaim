'use client'

import { useState, useEffect, useCallback } from 'react'

interface ClaimTx {
  id: number
  wallet: string
  accounts_closed: number
  sol_reclaimed: number
  tx_signatures: string
  created_at: string
}

interface ClaimStats {
  totals: {
    total_sol: number
    total_accounts: number
    total_claims: number
    unique_wallets: number
  }
  intervals: Array<{
    bucket: string
    sol: number
    accounts: number
    claims: number
  }>
  recent: ClaimTx[]
  solPrice: number
  totalUsd: number
}

export function useClaimStats() {
  const [stats, setStats] = useState<ClaimStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/claims')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 60_000) // refresh every minute
    return () => clearInterval(interval)
  }, [refresh])

  return { stats, loading, refresh }
}

export async function reportClaim(data: {
  wallet: string
  accountsClosed: number
  solReclaimed: number
  network: string
  txSignatures: string[]
}) {
  try {
    await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch {
    // Best effort -- don't block the user
  }
}
