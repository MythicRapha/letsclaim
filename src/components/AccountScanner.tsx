'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletContext } from '@/providers/WalletProvider'
import { useTokenAccounts, type TokenAccountInfo } from '@/hooks/useTokenAccounts'
import { useNetwork } from '@/providers/NetworkProvider'
import ClaimProgress from '@/components/ClaimProgress'
import { RENT_PER_TOKEN_ACCOUNT, TOKEN_2022_PROGRAM_ID, FEE_BPS } from '@/lib/constants'
import ShareCard from '@/components/ShareCard'

function WalletIcon() {
  return (
    <svg className="w-12 h-12 text-[#686878]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
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

function StatusIcon({ status }: { status: TokenAccountInfo['status'] }) {
  switch (status) {
    case 'pending':
      return <div className="w-2 h-2 bg-[#686878]" />
    case 'closing':
      return (
        <div className="w-3.5 h-3.5 border-2 border-[#9945FF] border-t-transparent rounded-full animate-spin" />
      )
    case 'closed':
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

type ScanState = 'disconnected' | 'ready' | 'scanning' | 'results' | 'empty' | 'closing' | 'complete'

function getScanState(
  connected: boolean,
  scanning: boolean,
  closing: boolean,
  accounts: TokenAccountInfo[],
  txSignatures: string[],
): ScanState {
  if (!connected) return 'disconnected'
  if (closing) return 'closing'
  if (scanning) return 'scanning'
  if (txSignatures.length > 0 && !closing) return 'complete'
  if (accounts.length > 0) return 'results'
  if (accounts.length === 0 && !scanning) return 'ready'
  return 'ready'
}

export default function AccountScanner() {
  const { publicKey, connected, shortAddress } = useWalletContext()
  const { network } = useNetwork()
  const {
    accounts,
    scanning,
    closing,
    scan,
    closeSelected,
    selectAll,
    deselectAll,
    toggleSelect,
    totalReclaimable,
    selectedCount,
    progress,
    txSignatures,
  } = useTokenAccounts()

  const [hasScanned, setHasScanned] = useState(false)

  const handleScan = async () => {
    setHasScanned(true)
    await scan()
  }

  const state: ScanState = !connected
    ? 'disconnected'
    : closing
      ? 'closing'
      : scanning
        ? 'scanning'
        : txSignatures.length > 0 && !closing
          ? 'complete'
          : hasScanned && accounts.length > 0
            ? 'results'
            : hasScanned && accounts.length === 0
              ? 'empty'
              : 'ready'

  const networkLabel = network === 'solana' ? 'Solana Mainnet' : 'Mythic L2'
  const tokenSymbol = network === 'solana' ? 'SOL' : 'MYTH'

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
              <WalletIcon />
              <p className="mt-6 font-sans text-sm text-[#686878]">
                Connect your wallet to scan for reclaimable {tokenSymbol}
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
                <span className="font-mono text-xs text-[#686878] tracking-wide">
                  {shortAddress}
                </span>
                <span className="font-mono text-[0.6rem] text-[#686878] tracking-[0.1em] uppercase">
                  on {networkLabel}
                </span>
              </div>

              <button
                onClick={handleScan}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity cursor-pointer"
              >
                Scan for Reclaimable {tokenSymbol}
              </button>

              <p className="mt-4 font-sans text-xs text-[#686878]">
                We&apos;ll check for empty token accounts on {networkLabel}
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
              <p className="mt-2 font-mono text-xs text-[#686878]">
                Checking {networkLabel}
              </p>
            </motion.div>
          )}

          {/* State 4: Results Found */}
          {state === 'results' && accounts.length > 0 && (
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
                    Found {accounts.length} empty account{accounts.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="font-mono text-sm text-[#14F195] mt-1">
                    {(accounts.length * RENT_PER_TOKEN_ACCOUNT).toFixed(6)} {tokenSymbol} reclaimable
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
                  <span className="text-[#404050]">|</span>
                  <button
                    onClick={deselectAll}
                    className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#686878] hover:text-white transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Inline Account List */}
              <div className="border border-white/[0.06]">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                  <Checkbox
                    checked={accounts.filter(a => a.status === 'pending').every(a => a.selected)}
                    onChange={() => {
                      const pending = accounts.filter(a => a.status === 'pending')
                      pending.every(a => a.selected) ? deselectAll() : selectAll()
                    }}
                  />
                  <span className="flex-1 font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">Mint</span>
                  <span className="w-12 text-center font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">Type</span>
                  <span className="w-28 text-right font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">Rent</span>
                  <span className="w-8 text-center font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878]">Status</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {accounts.map((account) => {
                    const shortMint = `${account.mint.slice(0, 6)}...${account.mint.slice(-4)}`
                    const isT22 = account.programId.equals(TOKEN_2022_PROGRAM_ID)
                    const isClosed = account.status === 'closed'
                    return (
                      <div
                        key={account.pubkey.toBase58()}
                        className={`flex items-center gap-3 border-b border-white/[0.03] py-2 px-3 hover:bg-white/[0.02] transition-colors ${isClosed ? 'opacity-30' : ''}`}
                      >
                        <Checkbox
                          checked={account.selected}
                          onChange={() => toggleSelect(account.pubkey)}
                          disabled={account.status !== 'pending'}
                        />
                        <span className="flex-1 font-mono text-xs text-[#A0A0B0] truncate">{shortMint}</span>
                        <span className={`w-12 text-center font-mono text-[0.5rem] tracking-[0.1em] uppercase px-1.5 py-0.5 ${isT22 ? 'bg-[#14F195]/20 text-[#14F195]' : 'bg-[#9945FF]/20 text-[#9945FF]'}`}>
                          {isT22 ? 'T22' : 'SPL'}
                        </span>
                        <span className="w-28 text-right font-mono text-xs text-[#14F195]">
                          {RENT_PER_TOKEN_ACCOUNT.toFixed(8)} {tokenSymbol}
                        </span>
                        <span className="w-8 flex items-center justify-center">
                          <StatusIcon status={account.status} />
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Reclaim Button */}
              <button
                onClick={closeSelected}
                disabled={selectedCount === 0}
                className={`mt-6 w-full py-3 font-mono text-xs tracking-widest uppercase transition-opacity cursor-pointer ${
                  selectedCount > 0
                    ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white hover:opacity-90'
                    : 'bg-white/[0.06] text-[#686878] cursor-not-allowed'
                }`}
              >
                {selectedCount > 0
                  ? `Reclaim ${(selectedCount * RENT_PER_TOKEN_ACCOUNT).toFixed(6)} ${tokenSymbol} (${selectedCount} accounts)`
                  : 'Select accounts to reclaim'}
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
                All clean!
              </h3>
              <p className="mt-2 font-sans text-sm text-[#14F195]">
                No empty token accounts found on {networkLabel}.
              </p>
              <button
                onClick={handleScan}
                className="mt-6 px-6 py-2 border border-white/[0.06] text-[#686878] font-mono text-xs tracking-widest uppercase hover:text-white hover:border-white/[0.12] transition-colors cursor-pointer"
              >
                Scan Again
              </button>
            </motion.div>
          )}

          {/* State 6: Closing in Progress */}
          {state === 'closing' && (
            <motion.div
              key="closing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col"
            >
              <h3 className="font-display text-lg font-bold text-white mb-6">
                Reclaiming {tokenSymbol}...
              </h3>
              <ClaimProgress progress={progress} txSignatures={txSignatures} />
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
                Recovered {(progress.completed * RENT_PER_TOKEN_ACCOUNT).toFixed(6)} {tokenSymbol}
              </h3>
              <p className="mt-2 font-sans text-sm text-[#686878]">
                {progress.completed} account{progress.completed !== 1 ? 's' : ''} closed in {txSignatures.length} transaction{txSignatures.length !== 1 ? 's' : ''}
                {progress.failed > 0 && <span className="text-red-400"> ({progress.failed} failed)</span>}
              </p>

              <ShareCard
                type="claim"
                solAmount={progress.completed * RENT_PER_TOKEN_ACCOUNT}
                accountCount={progress.completed}
                txSignatures={txSignatures}
                network={network}
              />

              {/* Scan Again */}
              <button
                onClick={handleScan}
                className="mt-6 px-8 py-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-mono text-xs tracking-widest uppercase hover:opacity-90 transition-opacity cursor-pointer"
              >
                Scan Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  )
}
