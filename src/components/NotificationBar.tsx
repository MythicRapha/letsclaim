'use client'

import { useState } from 'react'

const PLACEHOLDER_CA = '5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump'
const PUMP_FUN_URL = `https://pump.fun/coin/${PLACEHOLDER_CA}`

export default function NotificationBar() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(PLACEHOLDER_CA).catch(() => {
      const el = document.createElement('textarea')
      el.value = PLACEHOLDER_CA
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shortCA = `${PLACEHOLDER_CA.slice(0, 6)}...${PLACEHOLDER_CA.slice(-4)}`

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] solana-gradient">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-10 h-10 flex items-center justify-between">
        {/* Left: icon + text */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-2 h-2 bg-white animate-pulse flex-shrink-0" />
          <img src="/pumpfun-logo.png" alt="PumpFun" width={16} height={16} className="w-4 h-4 flex-shrink-0" />
          <span className="font-mono text-[0.6rem] sm:text-[0.75rem] text-black font-bold tracking-wide">
            $CLAIM IS LIVE ON PUMPFUN!
          </span>
        </div>

        {/* Right: CA + copy + link */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.55rem] sm:text-[0.65rem] text-black/60 hidden sm:inline">CA:</span>
          <code className="font-mono text-[0.5rem] sm:text-[0.6rem] text-black/80 font-bold select-all">
            <span className="hidden md:inline">{PLACEHOLDER_CA}</span>
            <span className="md:hidden">{shortCA}</span>
          </code>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-black/10 transition-colors cursor-pointer flex-shrink-0"
            title="Copy CA"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/60">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
          <a
            href={PUMP_FUN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-black/10 transition-colors flex-shrink-0"
            title="View on PumpFun"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/60">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
