'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletContext } from '@/providers/WalletProvider'
import { useNetwork } from '@/providers/NetworkProvider'
import { useBurnTokens, type TokenWithMetadata } from '@/hooks/useBurnTokens'
import { TOKEN_2022_PROGRAM_ID, RENT_PER_TOKEN_ACCOUNT, FEE_BPS } from '@/lib/constants'
import ShareCard from '@/components/ShareCard'

// ── Icons ────────────────────────────────────────────────────────────────────

function FireIcon() {
  return (
    <svg className="w-12 h-12 text-claim-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-12 h-12 text-[#14F195]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ScanningSpinner() {
  return (
    <motion.div
      className="w-12 h-12 border-2 border-[#9945FF] border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  )
}

// ── Checkbox ─────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
        checked
          ? 'bg-[#9945FF] border-[#9945FF]'
          : 'border-white/[0.15] bg-transparent hover:border-white/[0.3]'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

// ── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: TokenWithMetadata['status'] }) {
  switch (status) {
    case 'pending':
      return <div className="w-2 h-2 bg-claim-text-dim" />
    case 'burning':
      return (
        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      )
    case 'burned':
      return (
        <svg className="w-3.5 h-3.5 text-[#14F195]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'failed':
      return (
        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
  }
}

// ── Token Image with Fallback ────────────────────────────────────────────────

function TokenImage({ token }: { token: TokenWithMetadata }) {
  const [imgError, setImgError] = useState(false)
  const letter = (token.metadata.symbol || token.metadata.name || '?')[0].toUpperCase()

  if (token.metadata.image && !imgError) {
    return (
      <img
        src={token.metadata.image}
        alt={token.metadata.symbol}
        width={32}
        height={32}
        className="w-8 h-8 flex-shrink-0"
        onError={() => setImgError(true)}
      />
    )
  }

  // Fallback: colored circle with first letter
  return (
    <div className="w-8 h-8 flex-shrink-0 bg-[#9945FF]/20 border border-[#9945FF]/30 flex items-center justify-center">
      <span className="font-mono text-xs text-[#B06FFF] font-bold">{letter}</span>
    </div>
  )
}

// ── Burn Progress ────────────────────────────────────────────────────────────

function BurnProgress({ progress, txSignatures }: {
  progress: { total: number; completed: number; failed: number }
  txSignatures: string[]
}) {
  const { network } = useNetwork()
  const percent = progress.total > 0
    ? ((progress.completed + progress.failed) / progress.total) * 100
    : 0

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-red-600 to-red-400"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-claim-text-dim">
          Burning {progress.completed + progress.failed} of {progress.total} tokens...
        </p>
        {progress.failed > 0 && (
          <p className="font-mono text-xs text-red-400">
            {progress.failed} failed
          </p>
        )}
      </div>

      {/* Transaction Signatures */}
      {txSignatures.length > 0 && (
        <div className="space-y-1 mt-4">
          <p className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim mb-2">
            Transactions
          </p>
          {txSignatures.map((sig, i) => {
            const shortSig = `${sig.slice(0, 8)}...${sig.slice(-8)}`
            const explorerUrl =
              network === 'solana'
                ? `https://solscan.io/tx/${sig}`
                : `https://mythicscan.com/tx/${sig}`
            return (
              <a
                key={i}
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-1 font-mono text-xs text-[#9945FF] hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3 text-[#14F195] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{shortSig}</span>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── State Machine ────────────────────────────────────────────────────────────

type BurnState = 'disconnected' | 'ready' | 'scanning' | 'results' | 'empty' | 'burning' | 'complete'

// ── Main Component ───────────────────────────────────────────────────────────

export default function BurnTokens() {
  const { publicKey, connected, shortAddress } = useWalletContext()
  const { network } = useNetwork()
  const {
    tokens,
    scanning,
    burning,
    scan,
    burnSelected,
    selectAll,
    deselectAll,
    toggleSelect,
    selectedCount,
    totalRentReclaimable,
    progress,
    txSignatures,
  } = useBurnTokens()

  // Track whether a scan has been performed
  const [hasScanned, setHasScanned] = useState(false)

  const handleScan = async () => {
    setHasScanned(true)
    await scan()
  }

  const state = (() => {
    if (!connected) return 'disconnected' as BurnState
    if (burning) return 'burning' as BurnState
    if (scanning) return 'scanning' as BurnState
    if (txSignatures.length > 0 && !burning) return 'complete' as BurnState
    if (tokens.length > 0) return 'results' as BurnState
    if (hasScanned && tokens.length === 0 && !scanning) return 'empty' as BurnState
    return 'ready' as BurnState
  })()

  const networkLabel = network === 'solana' ? 'Solana Mainnet' : 'Mythic L2'
  const tokenSymbol = network === 'solana' ? 'SOL' : 'MYTH'

  const burnedCount = tokens.filter(t => t.status === 'burned').length
  const failedCount = tokens.filter(t => t.status === 'failed').length

  // Format balance for display
  const formatBalance = (balance: number, decimals: number) => {
    if (balance === 0) return '0'
    if (balance < 0.001) return '<0.001'
    if (balance >= 1_000_000) return (balance / 1_000_000).toFixed(2) + 'M'
    if (balance >= 1_000) return (balance / 1_000).toFixed(2) + 'K'
    return balance.toFixed(Math.min(decimals, 4))
  }

  return (
      <div className="p-8">
        <AnimatePresence mode="wait">
          {/* State 1: Not Connected */}
          {state === 'disconnected' && (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-12"
            >
              <FireIcon />
              <p className="mt-6 font-sans text-sm text-claim-text-dim">
                Connect your wallet to manage tokens
              </p>
            </motion.div>
          )}

          {/* State 2: Ready to Scan */}
          {state === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-8"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-[#14F195]" />
                <span className="font-mono text-xs text-claim-text-dim tracking-wide">
                  {shortAddress}
                </span>
                <span className="font-mono text-[0.6rem] text-claim-text-dim tracking-[0.1em] uppercase">
                  on {networkLabel}
                </span>
              </div>

              <button
                onClick={handleScan}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-red-600 to-red-400 text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity cursor-pointer"
              >
                Scan for Tokens
              </button>

              <p className="mt-4 font-sans text-xs text-claim-text-dim">
                Find tokens with balance to burn on {networkLabel}
              </p>
            </motion.div>
          )}

          {/* State 3: Scanning */}
          {state === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-12"
            >
              <ScanningSpinner />
              <p className="mt-6 font-sans text-sm text-white">
                Scanning token accounts...
              </p>
              <p className="mt-2 font-mono text-xs text-claim-text-dim">
                Checking {networkLabel}
              </p>
            </motion.div>
          )}

          {/* State 4: Results Found */}
          {state === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              {/* Summary Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Found {tokens.length} token{tokens.length !== 1 ? 's' : ''} with balance
                  </h3>
                  <p className="font-mono text-sm text-[#14F195] mt-1">
                    {(tokens.length * RENT_PER_TOKEN_ACCOUNT).toFixed(6)} {tokenSymbol} reclaimable from rent
                  </p>
                </div>

                {/* Select controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={selectAll}
                    className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#9945FF] hover:text-white transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-claim-text-dim">|</span>
                  <button
                    onClick={deselectAll}
                    className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-claim-text-dim hover:text-white transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Token List */}
              <div className="border border-white/[0.06]">
                {/* Header Row */}
                <div className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                  <Checkbox
                    checked={tokens.filter(t => t.status === 'pending').every(t => t.selected)}
                    onChange={tokens.filter(t => t.status === 'pending').every(t => t.selected) ? deselectAll : selectAll}
                  />
                  <span className="flex-1 font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
                    Token
                  </span>
                  <span className="w-24 text-right font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
                    Balance
                  </span>
                  <span className="w-12 text-center font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
                    Program
                  </span>
                  <span className="w-8 text-center font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
                    Status
                  </span>
                </div>

                {/* Scrollable Token Rows */}
                <div className="max-h-80 overflow-y-auto">
                  {tokens.map((token) => {
                    const isBurned = token.status === 'burned'
                    const isToken2022 = token.programId.equals(TOKEN_2022_PROGRAM_ID)
                    const programLabel = isToken2022 ? 'T22' : 'SPL'
                    const programColor = isToken2022 ? 'bg-[#14F195]/20 text-[#14F195]' : 'bg-[#9945FF]/20 text-[#9945FF]'

                    return (
                      <div
                        key={token.pubkey.toBase58()}
                        className={`flex items-center gap-3 border-b border-white/[0.03] py-3 px-3 hover:bg-white/[0.02] transition-colors ${
                          isBurned ? 'opacity-30' : ''
                        }`}
                      >
                        <Checkbox
                          checked={token.selected}
                          onChange={() => toggleSelect(token.pubkey)}
                          disabled={token.status !== 'pending'}
                        />

                        {/* Token Image + Name */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <TokenImage token={token} />
                          <div className="min-w-0">
                            <p className="font-sans text-sm text-white truncate">
                              {token.metadata.name}
                            </p>
                            <p className="font-mono text-[0.6rem] text-[#686878] truncate">
                              {token.metadata.symbol}
                            </p>
                          </div>
                        </div>

                        {/* Balance */}
                        <span className="w-24 text-right font-mono text-xs text-white flex-shrink-0">
                          {formatBalance(token.uiBalance, token.decimals)}
                        </span>

                        {/* Program Badge */}
                        <span className={`w-12 text-center font-mono text-[0.5rem] tracking-[0.1em] uppercase px-1.5 py-0.5 flex-shrink-0 ${programColor}`}>
                          {programLabel}
                        </span>

                        {/* Status */}
                        <span className="w-8 flex items-center justify-center flex-shrink-0">
                          <StatusIcon status={token.status} />
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Warning */}
              <p className="mt-4 font-sans text-xs text-[#FBBF24]/80">
                Burning tokens is irreversible. Only burn tokens you don&apos;t want.
              </p>

              {/* Burn Button */}
              <button
                onClick={burnSelected}
                disabled={selectedCount === 0}
                className={`mt-4 w-full py-3 font-mono text-xs tracking-widest uppercase transition-opacity cursor-pointer ${
                  selectedCount > 0
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-white/[0.06] text-claim-text-dim cursor-not-allowed'
                }`}
              >
                {selectedCount > 0
                  ? `Burn ${selectedCount} Token${selectedCount !== 1 ? 's' : ''} & Reclaim ${totalRentReclaimable.toFixed(6)} ${tokenSymbol}`
                  : 'Select tokens to burn'}
              </button>
              {selectedCount > 0 && network === 'solana' && (
                <p className="font-mono text-[0.5rem] text-[#686878] text-center mt-2">
                  {FEE_BPS / 100}% ({(selectedCount * RENT_PER_TOKEN_ACCOUNT * FEE_BPS / 10000).toFixed(6)} SOL) funds $CLAIM buy & burn
                </p>
              )}
            </motion.div>
          )}

          {/* State 5: No Results */}
          {state === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-12"
            >
              <CheckIcon />
              <h3 className="mt-6 font-display text-lg font-bold text-white">
                No tokens found
              </h3>
              <p className="mt-2 font-sans text-sm text-[#14F195]">
                No token accounts with balance found on {networkLabel}.
              </p>
              <button
                onClick={handleScan}
                className="mt-6 px-6 py-2 border border-white/[0.06] text-[#686878] font-mono text-xs tracking-widest uppercase hover:text-white hover:border-white/[0.12] transition-colors cursor-pointer"
              >
                Scan Again
              </button>
            </motion.div>
          )}

          {/* State 6: Burning in Progress */}
          {state === 'burning' && (
            <motion.div
              key="burning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <h3 className="font-display text-lg font-bold text-white mb-6">
                Burning tokens...
              </h3>
              <BurnProgress progress={progress} txSignatures={txSignatures} />
            </motion.div>
          )}

          {/* State 7: Complete */}
          {state === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center py-8"
            >
              <CheckIcon />
              <h3 className="mt-6 font-display text-lg font-bold text-white">
                Burned {burnedCount} token{burnedCount !== 1 ? 's' : ''}
              </h3>
              {failedCount > 0 && (
                <p className="mt-1 font-sans text-sm text-red-400">
                  {failedCount} token{failedCount !== 1 ? 's' : ''} failed
                </p>
              )}

              <ShareCard
                type="burn"
                solAmount={burnedCount * RENT_PER_TOKEN_ACCOUNT}
                accountCount={burnedCount}
                txSignatures={txSignatures}
                network={network}
              />

              {/* Scan Again */}
              <button
                onClick={handleScan}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-red-600 to-red-400 text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity cursor-pointer"
              >
                Scan Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
