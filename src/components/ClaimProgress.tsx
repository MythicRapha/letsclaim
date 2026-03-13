'use client'

import { motion } from 'framer-motion'
import { useNetwork } from '@/providers/NetworkProvider'
import { RENT_PER_TOKEN_ACCOUNT } from '@/lib/constants'

interface ClaimProgressProps {
  progress: { total: number; completed: number; failed: number }
  txSignatures: string[]
}

export default function ClaimProgress({ progress, txSignatures }: ClaimProgressProps) {
  const { network } = useNetwork()
  const percent = progress.total > 0 ? ((progress.completed + progress.failed) / progress.total) * 100 : 0
  const solReclaimed = progress.completed * RENT_PER_TOKEN_ACCOUNT

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#9945FF] to-[#14F195]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-[#686878]">
          Closing {progress.completed + progress.failed} of {progress.total} accounts...
        </p>
        <p className="font-mono text-xs text-[#14F195]">
          {solReclaimed.toFixed(6)} SOL reclaimed
        </p>
      </div>

      {/* Transaction Signatures */}
      {txSignatures.length > 0 && (
        <div className="space-y-1 mt-4">
          <p className="font-mono text-[0.55rem] tracking-[0.12em] uppercase text-[#686878] mb-2">
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

      {/* Failed indicator */}
      {progress.failed > 0 && (
        <div className="flex items-center gap-2 py-2 px-3 border border-red-500/20 bg-red-500/5 mt-2">
          <span className="font-mono text-xs text-red-400">
            {progress.failed} account{progress.failed !== 1 ? 's' : ''} failed to close
          </span>
        </div>
      )}
    </div>
  )
}
