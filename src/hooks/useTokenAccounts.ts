'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { AccountLayout } from '@solana/spl-token'
import { useWalletContext } from '@/providers/WalletProvider'
import { useNetwork } from '@/providers/NetworkProvider'
import { buildCloseTx, type CloseableAccount } from '@/lib/closeAccounts'
import { reportClaim } from '@/hooks/useClaimStats'
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  RENT_PER_TOKEN_ACCOUNT,
  MAX_CLOSE_PER_TX,
  FEE_WALLET,
  FEE_BPS,
  RENT_LAMPORTS,
} from '@/lib/constants'

// ── Types ────────────────────────────────────────────────────────────────────

export interface TokenAccountInfo {
  pubkey: PublicKey
  mint: string
  balance: number
  programId: PublicKey
  selected: boolean
  status: 'pending' | 'closing' | 'closed' | 'failed'
}

export interface UseTokenAccountsReturn {
  accounts: TokenAccountInfo[]
  scanning: boolean
  closing: boolean
  scan: () => Promise<void>
  closeSelected: () => Promise<void>
  selectAll: () => void
  deselectAll: () => void
  toggleSelect: (pubkey: PublicKey) => void
  totalReclaimable: number
  selectedCount: number
  progress: { total: number; completed: number; failed: number }
  txSignatures: string[]
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTokenAccounts(): UseTokenAccountsReturn {
  const { publicKey, connected, signAndSendTransaction } = useWalletContext()
  const { connection, network } = useNetwork()

  const [accounts, setAccounts] = useState<TokenAccountInfo[]>([])
  const [scanning, setScanning] = useState(false)
  const [closing, setClosing] = useState(false)
  const [txSignatures, setTxSignatures] = useState<string[]>([])
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0 })

  // Prevent concurrent scan/close operations
  const operationLock = useRef(false)

  // ── Scan for empty token accounts ──────────────────────────────────────────

  const scan = useCallback(async () => {
    if (!publicKey || !connected) throw new Error('Wallet not connected')
    if (operationLock.current) return
    operationLock.current = true

    setScanning(true)
    setAccounts([])
    setTxSignatures([])
    setProgress({ total: 0, completed: 0, failed: 0 })

    try {
      const emptyAccounts: TokenAccountInfo[] = []

      // Fetch from both token programs in parallel
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
        connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
      ])

      // Parse TOKEN_PROGRAM accounts
      for (const { pubkey, account } of tokenAccounts.value) {
        try {
          const decoded = AccountLayout.decode(account.data)
          if (decoded.amount === 0n) {
            emptyAccounts.push({
              pubkey,
              mint: new PublicKey(decoded.mint).toBase58(),
              balance: 0,
              programId: TOKEN_PROGRAM_ID,
              selected: true,
              status: 'pending',
            })
          }
        } catch {
          // Skip accounts that fail to decode
        }
      }

      // Parse TOKEN_2022 accounts
      for (const { pubkey, account } of token2022Accounts.value) {
        try {
          const decoded = AccountLayout.decode(account.data)
          if (decoded.amount === 0n) {
            emptyAccounts.push({
              pubkey,
              mint: new PublicKey(decoded.mint).toBase58(),
              balance: 0,
              programId: TOKEN_2022_PROGRAM_ID,
              selected: true,
              status: 'pending',
            })
          }
        } catch {
          // Skip accounts that fail to decode
        }
      }

      setAccounts(emptyAccounts)
    } finally {
      setScanning(false)
      operationLock.current = false
    }
  }, [publicKey, connected, connection])

  // ── Selection management ───────────────────────────────────────────────────

  const selectAll = useCallback(() => {
    setAccounts(prev =>
      prev.map(a => a.status === 'pending' ? { ...a, selected: true } : a),
    )
  }, [])

  const deselectAll = useCallback(() => {
    setAccounts(prev =>
      prev.map(a => a.status === 'pending' ? { ...a, selected: false } : a),
    )
  }, [])

  const toggleSelect = useCallback((pubkey: PublicKey) => {
    const key = pubkey.toBase58()
    setAccounts(prev =>
      prev.map(a =>
        a.pubkey.toBase58() === key && a.status === 'pending'
          ? { ...a, selected: !a.selected }
          : a,
      ),
    )
  }, [])

  // ── Close selected accounts ────────────────────────────────────────────────

  const closeSelected = useCallback(async () => {
    if (!publicKey || !connected) throw new Error('Wallet not connected')
    if (operationLock.current) return
    operationLock.current = true

    setClosing(true)
    setTxSignatures([])

    const selected = accounts.filter(a => a.selected && a.status === 'pending')
    if (selected.length === 0) {
      setClosing(false)
      operationLock.current = false
      return
    }

    setProgress({ total: selected.length, completed: 0, failed: 0 })

    try {
      // Chunk into groups of MAX_CLOSE_PER_TX
      const chunks: TokenAccountInfo[][] = []
      for (let i = 0; i < selected.length; i += MAX_CLOSE_PER_TX) {
        chunks.push(selected.slice(i, i + MAX_CLOSE_PER_TX))
      }

      // Mark all selected as 'closing'
      const selectedKeys = new Set(selected.map(a => a.pubkey.toBase58()))
      setAccounts(prev =>
        prev.map(a =>
          selectedKeys.has(a.pubkey.toBase58()) ? { ...a, status: 'closing' as const } : a,
        ),
      )

      // Send each transaction one at a time via wallet's signAndSendTransaction
      // This avoids CORS issues since the wallet extension sends the tx directly
      const signatures: string[] = []
      let completed = 0
      let failed = 0

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const chunkKeys = new Set(chunk.map(a => a.pubkey.toBase58()))

        try {
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          const closeableAccounts: CloseableAccount[] = chunk.map(a => ({
            pubkey: a.pubkey,
            programId: a.programId,
          }))
          const tx = buildCloseTx(closeableAccounts, publicKey, blockhash)

          // Add 20% fee transfer on Solana mainnet (funds $CLAIM buy & burn)
          if (network === 'solana') {
            const feeLamports = Math.floor(chunk.length * RENT_LAMPORTS * FEE_BPS / 10_000)
            if (feeLamports > 0) {
              tx.add(SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: FEE_WALLET,
                lamports: feeLamports,
              }))
            }
          }

          // Use wallet's signAndSendTransaction — wallet sends directly to RPC (no CORS)
          const sig = await signAndSendTransaction(tx, connection)
          signatures.push(sig)
          setTxSignatures(prev => [...prev, sig])

          // Mark chunk accounts as closed
          completed += chunk.length
          setAccounts(prev =>
            prev.map(a =>
              chunkKeys.has(a.pubkey.toBase58()) ? { ...a, status: 'closed' as const } : a,
            ),
          )
          setProgress({ total: selected.length, completed, failed })
        } catch (err) {
          console.error('[letsclaim] Close tx failed:', err)
          // If user rejected first tx, revert all and bail
          if (i === 0 && completed === 0) {
            setAccounts(prev =>
              prev.map(a =>
                selectedKeys.has(a.pubkey.toBase58()) && a.status === 'closing'
                  ? { ...a, status: 'pending' as const }
                  : a,
              ),
            )
            break
          }
          failed += chunk.length
          setAccounts(prev =>
            prev.map(a =>
              chunkKeys.has(a.pubkey.toBase58()) && a.status === 'closing'
                ? { ...a, status: 'failed' as const }
                : a,
            ),
          )
          setProgress({ total: selected.length, completed, failed })
        }
      }

      // Report successful claims to the tracker (best-effort, Solana only)
      if (completed > 0 && network === 'solana') {
        reportClaim({
          wallet: publicKey.toBase58(),
          accountsClosed: completed,
          solReclaimed: completed * RENT_PER_TOKEN_ACCOUNT,
          network,
          txSignatures: signatures,
        })
      }
    } finally {
      setClosing(false)
      operationLock.current = false
    }
  }, [publicKey, connected, accounts, connection, signAndSendTransaction, network])

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedCount = useMemo(
    () => accounts.filter(a => a.selected && a.status === 'pending').length,
    [accounts],
  )

  const totalReclaimable = useMemo(
    () => selectedCount * RENT_PER_TOKEN_ACCOUNT,
    [selectedCount],
  )

  return {
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
  }
}
