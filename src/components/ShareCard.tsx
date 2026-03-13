'use client'

import { useCallback } from 'react'

interface ShareCardProps {
  type: 'claim' | 'burn'
  solAmount: number
  accountCount: number
  txSignatures: string[]
  network: 'solana' | 'mythic'
}

// Draw the share card directly on a Canvas element (no html2canvas dependency)
function drawCard(
  canvas: HTMLCanvasElement,
  props: ShareCardProps,
) {
  const { type, solAmount, accountCount, txSignatures, network } = props
  const W = 1200
  const H = 630
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0a0014')
  bg.addColorStop(0.4, '#0d001a')
  bg.addColorStop(1, '#000d0a')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Purple orb (top-left)
  const purpleOrb = ctx.createRadialGradient(80, 80, 0, 80, 80, 350)
  purpleOrb.addColorStop(0, 'rgba(153, 69, 255, 0.12)')
  purpleOrb.addColorStop(1, 'rgba(153, 69, 255, 0)')
  ctx.fillStyle = purpleOrb
  ctx.fillRect(0, 0, 500, 500)

  // Green orb (bottom-right)
  const greenOrb = ctx.createRadialGradient(W - 100, H - 100, 0, W - 100, H - 100, 300)
  greenOrb.addColorStop(0, 'rgba(20, 241, 149, 0.08)')
  greenOrb.addColorStop(1, 'rgba(20, 241, 149, 0)')
  ctx.fillStyle = greenOrb
  ctx.fillRect(W - 450, H - 450, 450, 450)

  const pad = 60

  // Header: letsclaim.fun
  ctx.font = '600 22px "Sora", "Inter", system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.fillText('letsclaim', pad, pad + 20)
  const letW = ctx.measureText('letsclaim').width
  ctx.fillStyle = '#686878'
  ctx.fillText('.fun', pad + letW, pad + 20)

  // Label
  ctx.font = '500 13px "JetBrains Mono", "SF Mono", monospace'
  ctx.fillStyle = '#686878'
  ctx.letterSpacing = '2px'
  const sym = network === 'solana' ? 'SOL' : 'MYTH'
  const label = type === 'claim' ? `${sym} RECLAIMED` : `TOKENS BURNED & ${sym} RECLAIMED`
  ctx.fillText(label, pad, pad + 90)
  ctx.letterSpacing = '0px'

  // Big SOL amount with gradient text
  const solText = solAmount.toFixed(6)
  ctx.font = '700 72px "Sora", "Inter", system-ui, sans-serif'
  const solGrad = ctx.createLinearGradient(pad, 0, pad + 500, 0)
  solGrad.addColorStop(0, '#9945FF')
  solGrad.addColorStop(1, '#14F195')
  ctx.fillStyle = solGrad
  ctx.fillText(solText, pad, pad + 170)
  const solW = ctx.measureText(solText).width

  // "SOL" suffix
  ctx.font = '600 32px "Sora", "Inter", system-ui, sans-serif'
  ctx.fillStyle = '#686878'
  ctx.fillText(sym, pad + solW + 16, pad + 170)

  // Stats row
  const statsY = pad + 240
  const statLabels = [
    { label: type === 'claim' ? 'ACCOUNTS CLOSED' : 'TOKENS BURNED', value: String(accountCount) },
    { label: 'TRANSACTIONS', value: String(txSignatures.length) },
    { label: 'NETWORK', value: network === 'solana' ? 'Solana' : 'Mythic' },
  ]

  let statX = pad
  for (const stat of statLabels) {
    ctx.font = '500 11px "JetBrains Mono", "SF Mono", monospace'
    ctx.fillStyle = '#686878'
    ctx.letterSpacing = '1.5px'
    ctx.fillText(stat.label, statX, statsY)
    ctx.letterSpacing = '0px'

    ctx.font = '700 24px "JetBrains Mono", "SF Mono", monospace'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(stat.value, statX, statsY + 32)

    statX += 220
  }

  // TX hash
  const firstSig = txSignatures[0] || ''
  if (firstSig) {
    const shortSig = `${firstSig.slice(0, 8)}...${firstSig.slice(-8)}`
    const txY = statsY + 80
    ctx.font = '500 11px "JetBrains Mono", "SF Mono", monospace'
    ctx.fillStyle = '#686878'
    ctx.letterSpacing = '1.5px'
    ctx.fillText('TX:', pad, txY)
    ctx.letterSpacing = '0px'

    ctx.font = '500 14px "JetBrains Mono", "SF Mono", monospace'
    ctx.fillStyle = '#9945FF'
    ctx.fillText(shortSig, pad + 35, txY)
  }

  // Bottom divider
  const bottomY = H - 60
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, bottomY - 20)
  ctx.lineTo(W - pad, bottomY - 20)
  ctx.stroke()

  // Bottom left text
  ctx.font = '500 11px "JetBrains Mono", "SF Mono", monospace'
  ctx.fillStyle = '#404050'
  ctx.letterSpacing = '1.5px'
  ctx.fillText(`LETSCLAIM.FUN  —  RECLAIM YOUR ${sym}`, pad, bottomY + 5)
  ctx.letterSpacing = '0px'

  // Bottom right: CONFIRMED indicator
  const confirmText = 'CONFIRMED'
  ctx.font = '600 11px "JetBrains Mono", "SF Mono", monospace'
  ctx.fillStyle = '#14F195'
  const confirmW = ctx.measureText(confirmText).width
  ctx.fillText(confirmText, W - pad - confirmW, bottomY + 5)

  // Green dot
  ctx.fillStyle = '#14F195'
  ctx.fillRect(W - pad - confirmW - 14, bottomY - 1, 8, 8)
}

export default function ShareCard({ type, solAmount, accountCount, txSignatures, network }: ShareCardProps) {
  const tokenSymbol = network === 'solana' ? 'SOL' : 'MYTH'

  const tweetText = type === 'claim'
    ? `I just reclaimed ${solAmount.toFixed(6)} ${tokenSymbol} by closing ${accountCount} empty token account${accountCount !== 1 ? 's' : ''} on @LetsClaimFun!\n\nReclaim yours → letsclaim.fun`
    : `I just burned ${accountCount} token${accountCount !== 1 ? 's' : ''} and reclaimed ${solAmount.toFixed(6)} ${tokenSymbol} on @LetsClaimFun!\n\nBurn yours → letsclaim.fun`

  const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

  const generatePng = useCallback((): Blob | null => {
    try {
      const canvas = document.createElement('canvas')
      drawCard(canvas, { type, solAmount, accountCount, txSignatures, network })
      // Synchronous toBlob workaround: use toDataURL → convert to blob
      const dataUrl = canvas.toDataURL('image/png')
      const byteString = atob(dataUrl.split(',')[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
      }
      return new Blob([ab], { type: 'image/png' })
    } catch (e) {
      console.error('[letsclaim] PNG generation failed:', e)
      return null
    }
  }, [type, solAmount, accountCount, txSignatures, network])

  const shareOnX = useCallback(() => {
    // Download the card image first so user can attach it to their tweet
    const blob = generatePng()
    if (blob) {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `letsclaim-${type}-${Date.now()}.png`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
    // Open tweet composer (image auto-saved to downloads for attaching)
    setTimeout(() => window.open(tweetUrl, '_blank'), 300)
  }, [generatePng, type, tweetUrl])

  const downloadCard = useCallback(() => {
    const blob = generatePng()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `letsclaim-${type}-${Date.now()}.png`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }, [generatePng, type])

  const firstSig = txSignatures[0] || ''
  const shortSig = firstSig ? `${firstSig.slice(0, 8)}...${firstSig.slice(-8)}` : ''
  const explorerUrl = network === 'solana'
    ? `https://solscan.io/tx/${firstSig}`
    : `https://mythicscan.com/tx/${firstSig}`

  return (
    <div className="mt-8 w-full">
      {/* Visual preview card (display only) */}
      <div
        className="relative overflow-hidden border border-white/[0.08] p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, #0a0014 0%, #0d001a 40%, #000d0a 100%)' }}
      >
        {/* Gradient orbs */}
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#9945FF] opacity-[0.08] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-[#14F195] opacity-[0.06] blur-[100px]" />

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="letsclaim" className="w-8 h-8" />
            <div>
              <span className="font-display text-sm font-semibold text-white">letsclaim</span>
              <span className="font-display text-sm text-[#686878]">.fun</span>
            </div>
          </div>

          {/* Main stat */}
          <div className="mb-6">
            <p className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878] mb-2">
              {type === 'claim' ? `${tokenSymbol} Reclaimed` : `Tokens Burned & ${tokenSymbol} Reclaimed`}
            </p>
            <p className="font-display text-4xl sm:text-5xl font-bold">
              <span className="bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
                {solAmount.toFixed(6)}
              </span>
              <span className="text-[#686878] text-2xl ml-2">{tokenSymbol}</span>
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mb-6">
            <div>
              <p className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">
                Accounts {type === 'claim' ? 'Closed' : 'Burned'}
              </p>
              <p className="font-mono text-lg text-white font-bold">{accountCount}</p>
            </div>
            <div>
              <p className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">
                Transactions
              </p>
              <p className="font-mono text-lg text-white font-bold">{txSignatures.length}</p>
            </div>
            <div>
              <p className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">
                Network
              </p>
              <p className="font-mono text-lg text-white font-bold">
                {network === 'solana' ? 'Solana' : 'Mythic'}
              </p>
            </div>
          </div>

          {/* TX hash */}
          {shortSig && (
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#686878]">TX:</span>
              <span className="font-mono text-xs text-[#9945FF]">{shortSig}</span>
            </div>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
            <p className="font-mono text-[0.55rem] text-[#404050] tracking-[0.1em] uppercase">
              letsclaim.fun — Reclaim Your {tokenSymbol}
            </p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-[#14F195]" />
              <span className="font-mono text-[0.55rem] text-[#14F195]">CONFIRMED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={shareOnX}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black font-mono text-xs tracking-[0.08em] uppercase font-bold hover:bg-white/90 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </button>
        <button
          onClick={downloadCard}
          className="flex items-center justify-center gap-2 px-5 py-3 border border-white/[0.08] text-[#686878] font-mono text-xs tracking-[0.08em] uppercase hover:text-white hover:border-white/[0.16] transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Save PNG
        </button>
        {firstSig && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 border border-white/[0.08] text-[#686878] font-mono text-xs tracking-[0.08em] uppercase hover:text-white hover:border-white/[0.16] transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View TX
          </a>
        )}
      </div>
    </div>
  )
}
