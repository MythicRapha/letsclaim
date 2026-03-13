'use client'

import { useWalletContext } from '@/providers/WalletProvider'
import { createPortal } from 'react-dom'

function ExternalLinkIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#404050] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

export default function WalletButton() {
  const {
    connected, shortAddress, balance, mythBalance, connecting,
    openWalletModal, closeWalletModal, connect, disconnect,
    mythicDetected, phantomDetected, solflareDetected, showWalletModal,
  } = useWalletContext()

  // Connecting state
  if (connecting) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-[#08080C] border border-white/[0.06] text-[#686878] font-mono text-[0.65rem] tracking-[0.1em] uppercase"
      >
        <span className="inline-block w-3.5 h-3.5 border-2 border-[#9945FF] border-t-transparent rounded-full animate-spin" />
        Connecting
      </button>
    )
  }

  // Connected state
  if (connected) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* SOL Balance */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-[#08080C] border border-white/[0.06] whitespace-nowrap flex-shrink-0">
          <img src="/solana-logo.svg" alt="SOL" width={13} height={13} className="flex-shrink-0" />
          <span className="font-mono text-[0.6rem] tracking-[0.04em] text-[#686878] font-medium leading-none">
            {balance !== null ? balance.toFixed(2) : '—'}
          </span>
        </div>
        {/* MYTH Balance */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-[#08080C] border border-[#7B2FFF]/15 whitespace-nowrap flex-shrink-0">
          <img src="/mythic-mark.svg" alt="MYTH" width={13} height={13} className="flex-shrink-0" />
          <span className="font-mono text-[0.6rem] tracking-[0.04em] text-[#7B2FFF] font-medium leading-none">
            {mythBalance !== null ? (mythBalance >= 1_000_000 ? `${(mythBalance / 1_000_000).toFixed(1)}M` : mythBalance >= 1_000 ? `${(mythBalance / 1_000).toFixed(1)}K` : mythBalance.toFixed(2)) : '—'}
          </span>
        </div>

        {/* Address + disconnect */}
        <button
          onClick={disconnect}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08080C] border border-white/[0.06] hover:border-red-500/30 transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer group"
        >
          <span className="font-mono text-[0.65rem] tracking-[0.04em] text-white font-bold leading-none">
            {shortAddress}
          </span>
          <svg className="w-3.5 h-3.5 text-red-500/60 group-hover:text-red-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    )
  }

  // Disconnected — connect button
  return (
    <>
      <button
        onClick={openWalletModal}
        className="px-4 py-2 bg-[#9945FF] text-white font-display text-[0.75rem] font-semibold tracking-[0.04em] hover:bg-[#B06FFF] transition-colors cursor-pointer"
      >
        Connect Wallet
      </button>

      {showWalletModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={closeWalletModal}
        >
          <div
            className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-[#08080C] border border-white/[0.06] p-6 sm:p-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button onClick={closeWalletModal} className="absolute top-4 right-4 text-[#404050] hover:text-white transition-colors cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="font-mono text-sm font-bold text-white mb-1 tracking-[0.08em] uppercase">
              Connect Wallet
            </h3>
            <p className="font-mono text-[0.7rem] text-[#404050] mb-6">
              Choose a wallet to scan for reclaimable SOL.
            </p>

            <div className="space-y-2">
              {/* Phantom */}
              {phantomDetected ? (
                <button
                  onClick={() => { connect('phantom'); closeWalletModal() }}
                  className="flex items-center gap-4 w-full px-4 py-3.5 bg-[#AB9FF2]/5 border border-[#AB9FF2]/20 hover:border-[#AB9FF2]/50 transition-colors text-left cursor-pointer"
                >
                  <img src="/phantom.jpeg" alt="Phantom" width={32} height={32} className="w-8 h-8 flex-shrink-0" style={{ borderRadius: '8px' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.75rem] text-white font-medium">Phantom</div>
                    <div className="font-mono text-[0.6rem] text-[#AB9FF2]">Detected</div>
                  </div>
                </button>
              ) : (
                <a
                  href="https://phantom.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 w-full px-4 py-3.5 bg-[#0F0F15] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <img src="/phantom.jpeg" alt="Phantom" width={32} height={32} className="w-8 h-8 flex-shrink-0" style={{ borderRadius: '8px' }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.75rem] text-white font-medium">Phantom</div>
                    <div className="font-mono text-[0.6rem] text-[#404050]">Install</div>
                  </div>
                  <ExternalLinkIcon />
                </a>
              )}

              {/* Solflare */}
              {solflareDetected ? (
                <button
                  onClick={() => { connect('solflare'); closeWalletModal() }}
                  className="flex items-center gap-4 w-full px-4 py-3.5 bg-[#FC9936]/5 border border-[#FC9936]/20 hover:border-[#FC9936]/50 transition-colors text-left cursor-pointer"
                >
                  <img src="/solflare.svg" alt="Solflare" width={32} height={32} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.75rem] text-white font-medium">Solflare</div>
                    <div className="font-mono text-[0.6rem] text-[#FC9936]">Detected</div>
                  </div>
                </button>
              ) : (
                <a
                  href="https://solflare.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 w-full px-4 py-3.5 bg-[#0F0F15] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <img src="/solflare.svg" alt="Solflare" width={32} height={32} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.75rem] text-white font-medium">Solflare</div>
                    <div className="font-mono text-[0.6rem] text-[#404050]">Install</div>
                  </div>
                  <ExternalLinkIcon />
                </a>
              )}

              {/* Mythic Wallet */}
              {mythicDetected ? (
                <button
                  onClick={() => { connect('mythic'); closeWalletModal() }}
                  className="flex items-center gap-4 w-full px-4 py-3.5 bg-[#7B2FFF]/10 border border-[#7B2FFF]/30 hover:border-[#7B2FFF]/60 transition-colors text-left cursor-pointer"
                >
                  <img src="/mythic-mark.svg" alt="Mythic" width={32} height={32} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.75rem] text-white font-medium">Mythic Wallet</div>
                    <div className="font-mono text-[0.6rem] text-[#7B2FFF]">Detected</div>
                  </div>
                </button>
              ) : (
                <a
                  href="https://mythicwallet.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 w-full px-4 py-3.5 bg-[#7B2FFF]/5 border border-[#7B2FFF]/10 hover:border-[#7B2FFF]/30 transition-colors"
                >
                  <img src="/mythic-mark.svg" alt="Mythic" width={32} height={32} className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[0.75rem] text-white font-medium">Mythic Wallet</div>
                    <div className="font-mono text-[0.6rem] text-[#7B2FFF]">Install</div>
                  </div>
                  <ExternalLinkIcon />
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
