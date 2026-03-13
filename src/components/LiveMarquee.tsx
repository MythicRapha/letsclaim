'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface FeedItem {
  type: 'claim' | 'buyback' | 'burn'
  id: number
  amount: number | null
  claim_amount: number | null
  wallet: string | null
  tx: string | null
  created_at: string
}

function formatClaimNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toFixed(0)
}

function getTxUrl(tx: string | null, type: string): string | null {
  if (!tx) return null
  // For claims, tx_signatures is JSON array
  if (type === 'claim') {
    try {
      const arr = JSON.parse(tx)
      if (Array.isArray(arr) && arr[0]) return `https://solscan.io/tx/${arr[0]}`
    } catch {}
    return null
  }
  return `https://solscan.io/tx/${tx}`
}

// Inline PumpFun SVG icon (simplified from their logo)
function PumpFunIcon() {
  return (
    <Image
      src="/pumpfun-logo.png"
      alt=""
      width={14}
      height={14}
      className="w-3.5 h-3.5 flex-shrink-0 opacity-80"
    />
  )
}

function ExternalLinkIcon() {
  return (
    <svg className="w-2.5 h-2.5 opacity-40 group-hover:opacity-80 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function MarqueeItem({ item, solPrice }: { item: FeedItem; solPrice: number }) {
  const txUrl = getTxUrl(item.tx, item.type)

  const inner = (() => {
    switch (item.type) {
      case 'buyback': {
        const sol = item.amount ?? 0
        const usd = sol * solPrice
        return (
          <>
            <PumpFunIcon />
            <span className="text-[#9945FF]">{sol.toFixed(4)} SOL</span>
            <span className="text-[#686878]">bought back</span>
            <span className="text-[#404050]">(${usd.toFixed(2)})</span>
          </>
        )
      }
      case 'burn': {
        const amount = item.claim_amount ?? 0
        return (
          <>
            <span className="text-sm leading-none">🔥</span>
            <span className="text-[#FF6B35]">{formatClaimNum(amount)} $CLAIM</span>
            <span className="text-[#686878]">burned</span>
          </>
        )
      }
      case 'claim': {
        const sol = item.amount ?? 0
        return (
          <>
            <span className="text-sm leading-none">💸</span>
            <span className="text-[#14F195]">{sol.toFixed(4)} SOL</span>
            <span className="text-[#686878]">claimed</span>
          </>
        )
      }
    }
  })()

  if (txUrl) {
    return (
      <a
        href={txUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 font-mono text-[0.6rem] whitespace-nowrap hover:opacity-100 transition-opacity"
      >
        {inner}
        <ExternalLinkIcon />
      </a>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] whitespace-nowrap">
      {inner}
    </span>
  )
}

export default function LiveMarquee() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [solPrice, setSolPrice] = useState(150)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/feed')
        if (res.ok) {
          const data = await res.json()
          setFeed(data)
        }
      } catch {}
    }
    load()
    const iv = setInterval(load, 30_000)
    return () => clearInterval(iv)
  }, [])

  // Get SOL price from claims API (it already fetches it)
  useEffect(() => {
    fetch('/api/claims')
      .then(r => r.json())
      .then(d => { if (d.solPrice) setSolPrice(d.solPrice) })
      .catch(() => {})
  }, [])

  if (feed.length === 0) return null

  // Duplicate items for seamless loop
  const items = [...feed, ...feed]
  const separator = (
    <span className="inline-block w-1 h-1 bg-white/[0.08] flex-shrink-0 mx-4" />
  )

  return (
    <div className="w-full h-7 overflow-hidden border-b border-white/[0.04] bg-black/40 backdrop-blur-sm relative">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div
        ref={containerRef}
        className="marquee-track flex items-center h-full"
      >
        {items.map((item, i) => (
          <span key={`${item.type}-${item.id}-${i}`} className="inline-flex items-center">
            {i > 0 && separator}
            <MarqueeItem item={item} solPrice={solPrice} />
          </span>
        ))}
      </div>

      <style jsx>{`
        .marquee-track {
          animation: marquee-scroll ${Math.max(feed.length * 4, 30)}s linear infinite;
          width: max-content;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
