'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useClaimStats } from '@/hooks/useClaimStats'
import AreaChart from '@/components/AreaChart'

// ── Animated Counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '' }: {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const animRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const startTimeRef = useRef(0)

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    startRef.current = display
    startTimeRef.current = performance.now()
    const duration = 1200

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(startRef.current + (value - startRef.current) * eased)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <span>
      {prefix}{display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}{suffix}
    </span>
  )
}

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, children, subtitle }: {
  label: string
  children: React.ReactNode
  subtitle?: string
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878] mb-1">
        {label}
      </div>
      <div className="font-display text-2xl font-bold text-white">
        {children}
      </div>
      {subtitle && (
        <div className="font-mono text-[0.55rem] text-[#404050] mt-1">
          {subtitle}
        </div>
      )}
    </div>
  )
}

// ── Placeholder Chart ───────────────────────────────────────────────────────

function PlaceholderChart() {
  return (
    <div className="relative w-full h-[200px] overflow-hidden">
      <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="placeholderGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9945FF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#14F195" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M 0 140 Q 100 80, 200 120 Q 300 160, 400 100 Q 500 40, 600 110 Q 700 160, 800 90"
          fill="none"
          stroke="url(#placeholderGradient)"
          strokeWidth="2"
          className="animate-wave"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-xs text-[#686878]">
          Claim tracking starts soon
        </span>
      </div>
      <style jsx>{`
        @keyframes wave {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        .animate-wave {
          animation: wave 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// ── Live Feed ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr + 'Z')
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  return `${diffDays}d ago`
}

function shortAddr(addr: string): string {
  if (!addr || addr.length < 8) return addr
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

interface ClaimTx {
  id: number
  wallet: string
  accounts_closed: number
  sol_reclaimed: number
  tx_signatures: string
  created_at: string
}

function ClaimFeed({ txs }: { txs: ClaimTx[] }) {
  if (txs.length === 0) {
    return (
      <div className="py-6 text-center">
        <span className="font-mono text-xs text-[#404050]">No claims yet</span>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {txs.map((tx, i) => {
        let firstSig = ''
        try {
          const sigs = JSON.parse(tx.tx_signatures || '[]')
          firstSig = sigs[0] || ''
        } catch {}

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-[#14F195]/10 border border-[#14F195]/20">
                <svg className="w-3.5 h-3.5 text-[#14F195]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#14F195] font-bold">
                    {tx.sol_reclaimed.toFixed(4)} SOL
                  </span>
                  <span className="font-mono text-[0.55rem] text-[#686878]">reclaimed</span>
                </div>
                <div className="font-mono text-[0.55rem] text-[#404050]">
                  {tx.accounts_closed} account{tx.accounts_closed !== 1 ? 's' : ''} closed by {shortAddr(tx.wallet)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-mono text-[0.55rem] text-[#404050]">
                {timeAgo(tx.created_at)}
              </span>
              {firstSig && (
                <a
                  href={`https://solscan.io/tx/${firstSig}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[0.55rem] text-[#14F195]/60 hover:text-[#14F195] transition-colors"
                >
                  TX
                </a>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ClaimTracker() {
  const { stats, loading } = useClaimStats()

  const hasData = stats && stats.totals.total_claims > 0

  const chartData = hasData && stats.intervals
    ? stats.intervals.map(d => ({ date: d.bucket, value: d.sol }))
    : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="glass-card border border-white/[0.06] overflow-hidden">
        {/* Gradient accent line at top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#9945FF] via-[#14F195]/60 to-[#9945FF]" />

        <div className="p-6 md:p-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Total SOL Reclaimed"
              subtitle={hasData ? `${stats.totals.total_claims} claims` : 'Awaiting first claim'}
            >
              <span className="text-[#14F195]">
                {loading ? (
                  <span className="text-[#404050]">--</span>
                ) : hasData ? (
                  <AnimatedNumber value={stats.totals.total_sol} decimals={4} />
                ) : (
                  <span className="text-[#2a2a38]">0.0000</span>
                )}
              </span>
            </StatCard>

            <StatCard
              label="USD Value"
              subtitle={hasData && stats.solPrice ? `SOL @ $${stats.solPrice.toFixed(0)}` : ''}
            >
              {loading ? (
                <span className="text-[#404050]">--</span>
              ) : hasData ? (
                <AnimatedNumber value={stats.totalUsd} decimals={2} prefix="$" />
              ) : (
                <span className="text-[#2a2a38]">$0.00</span>
              )}
            </StatCard>

            <StatCard
              label="Accounts Closed"
              subtitle={hasData ? 'Empty token accounts' : ''}
            >
              {loading ? (
                <span className="text-[#404050]">--</span>
              ) : hasData ? (
                <AnimatedNumber value={stats.totals.total_accounts} decimals={0} />
              ) : (
                <span className="text-[#2a2a38]">0</span>
              )}
            </StatCard>

            <StatCard
              label="Unique Wallets"
              subtitle={hasData ? 'Distinct users' : ''}
            >
              {loading ? (
                <span className="text-[#404050]">--</span>
              ) : hasData ? (
                <AnimatedNumber value={stats.totals.unique_wallets} decimals={0} />
              ) : (
                <span className="text-[#2a2a38]">0</span>
              )}
            </StatCard>
          </div>

          {/* Chart — 3-hour intervals over last 3 days */}
          <div className="bg-white/[0.015] border border-white/[0.04] p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">
                Cumulative SOL Reclaimed
              </span>
              <span className="font-mono text-[0.55rem] text-[#404050]">
                Last 6 hours
              </span>
            </div>

            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#9945FF]/30 border-t-[#9945FF] animate-spin" style={{ borderRadius: 0 }} />
              </div>
            ) : hasData && chartData.length > 0 ? (
              <AreaChart
                id="claim"
                data={chartData}
                padMode="15min"
                cumulative
                tooltipSuffix="SOL"
                tooltipColor="#14F195"
              />
            ) : (
              <PlaceholderChart />
            )}
          </div>

          {/* Live Feed */}
          <div className="bg-white/[0.015] border border-white/[0.04] p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[#14F195] animate-pulse" />
                <span className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">
                  Recent Claims
                </span>
              </div>
              <span className="font-mono text-[0.55rem] text-[#404050]">
                {stats?.recent?.length ?? 0} transactions
              </span>
            </div>

            {loading ? (
              <div className="py-6 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-[#9945FF]/30 border-t-[#9945FF] animate-spin" style={{ borderRadius: 0 }} />
              </div>
            ) : (
              <ClaimFeed txs={stats?.recent ?? []} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
