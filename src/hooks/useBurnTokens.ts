'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { AccountLayout } from '@solana/spl-token'
import { useWalletContext } from '@/providers/WalletProvider'
import { useNetwork } from '@/providers/NetworkProvider'
import { buildBurnAndCloseTx, MAX_BURNS_PER_TX, type BurnableToken } from '@/lib/burnTokens'
import { fetchTokenMetadata, type TokenMetadata } from '@/lib/tokenMetadata'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, RENT_PER_TOKEN_ACCOUNT, FEE_WALLET, FEE_BPS, RENT_LAMPORTS } from '@/lib/constants'
import { reportClaim } from '@/hooks/useClaimStats'

export interface TokenWithMetadata {
  pubkey: PublicKey
  mint: string
  rawBalance: bigint
  uiBalance: number      // human readable
  decimals: number
  programId: PublicKey
  metadata: TokenMetadata
  selected: boolean
  status: 'pending' | 'burning' | 'burned' | 'failed'
}

export function useBurnTokens() {
  const { publicKey, connected, signAndSendTransaction } = useWalletContext()
  const { connection, network } = useNetwork()

  const [tokens, setTokens] = useState<TokenWithMetadata[]>([])
  const [scanning, setScanning] = useState(false)
  const [burning, setBurning] = useState(false)
  const [txSignatures, setTxSignatures] = useState<string[]>([])
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0 })
  const operationLock = useRef(false)

  // Scan for all token accounts with balance > 0
  const scan = useCallback(async () => {
    if (!publicKey || !connected || operationLock.current) return
    operationLock.current = true
    setScanning(true)
    setTokens([])
    setTxSignatures([])
    setProgress({ total: 0, completed: 0, failed: 0 })

    try {
      const allTokens: { pubkey: PublicKey; mint: string; rawBalance: bigint; decimals: number; programId: PublicKey }[] = []

      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
        connection.getTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
      ])

      for (const { pubkey, account } of tokenAccounts.value) {
        try {
          const decoded = AccountLayout.decode(account.data)
          if (decoded.amount > BigInt(0)) {
            allTokens.push({
              pubkey,
              mint: new PublicKey(decoded.mint).toBase58(),
              rawBalance: decoded.amount,
              decimals: 0, // will be filled by metadata
              programId: TOKEN_PROGRAM_ID,
            })
          }
        } catch {
          // Skip accounts that fail to decode
        }
      }

      for (const { pubkey, account } of token2022Accounts.value) {
        try {
          const decoded = AccountLayout.decode(account.data)
          if (decoded.amount > BigInt(0)) {
            allTokens.push({
              pubkey,
              mint: new PublicKey(decoded.mint).toBase58(),
              rawBalance: decoded.amount,
              decimals: 0,
              programId: TOKEN_2022_PROGRAM_ID,
            })
          }
        } catch {
          // Skip accounts that fail to decode
        }
      }

      // Fetch metadata for all unique mints
      const uniqueMints = Array.from(new Set(allTokens.map(t => t.mint)))
      const metadata = await fetchTokenMetadata(uniqueMints, network)

      // Build TokenWithMetadata list
      const tokensWithMeta: TokenWithMetadata[] = allTokens.map(t => {
        const meta = metadata[t.mint] || { name: 'Unknown', symbol: '???', image: null, decimals: 0 }
        const decimals = meta.decimals || 0
        return {
          ...t,
          decimals,
          uiBalance: Number(t.rawBalance) / Math.pow(10, decimals),
          metadata: meta,
          selected: true,
          status: 'pending' as const,
        }
      })

      // Sort: highest balance first
      tokensWithMeta.sort((a, b) => b.uiBalance - a.uiBalance)

      setTokens(tokensWithMeta)
    } finally {
      setScanning(false)
      operationLock.current = false
    }
  }, [publicKey, connected, connection, network])

  const selectAll = useCallback(() => {
    setTokens(prev => prev.map(t => t.status === 'pending' ? { ...t, selected: true } : t))
  }, [])

  const deselectAll = useCallback(() => {
    setTokens(prev => prev.map(t => t.status === 'pending' ? { ...t, selected: false } : t))
  }, [])

  const toggleSelect = useCallback((pubkey: PublicKey) => {
    const key = pubkey.toBase58()
    setTokens(prev => prev.map(t =>
      t.pubkey.toBase58() === key && t.status === 'pending'
        ? { ...t, selected: !t.selected }
        : t,
    ))
  }, [])

  // Burn selected tokens
  const burnSelected = useCallback(async () => {
    if (!publicKey || !connected || operationLock.current) return
    operationLock.current = true
    setBurning(true)
    setTxSignatures([])

    const selected = tokens.filter(t => t.selected && t.status === 'pending')
    if (selected.length === 0) {
      setBurning(false)
      operationLock.current = false
      return
    }

    setProgress({ total: selected.length, completed: 0, failed: 0 })

    try {
      // Chunk into groups
      const chunks: TokenWithMetadata[][] = []
      for (let i = 0; i < selected.length; i += MAX_BURNS_PER_TX) {
        chunks.push(selected.slice(i, i + MAX_BURNS_PER_TX))
      }

      // Mark all as burning
      const selectedKeys = new Set(selected.map(t => t.pubkey.toBase58()))
      setTokens(prev => prev.map(t =>
        selectedKeys.has(t.pubkey.toBase58()) ? { ...t, status: 'burning' as const } : t,
      ))

      // Send each chunk via wallet's signAndSendTransaction (avoids CORS)
      const signatures: string[] = []
      let completed = 0
      let failed = 0

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const chunkKeys = new Set(chunk.map(t => t.pubkey.toBase58()))

        try {
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          const burnables: BurnableToken[] = chunk.map(t => ({
            pubkey: t.pubkey,
            mint: new PublicKey(t.mint),
            balance: t.rawBalance,
            decimals: t.decimals,
            programId: t.programId,
          }))
          const tx = buildBurnAndCloseTx(burnables, publicKey, blockhash)

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

          const sig = await signAndSendTransaction(tx, connection)
          signatures.push(sig)
          setTxSignatures(prev => [...prev, sig])

          completed += chunk.length
          setTokens(prev => prev.map(t =>
            chunkKeys.has(t.pubkey.toBase58()) ? { ...t, status: 'burned' as const } : t,
          ))
          setProgress({ total: selected.length, completed, failed })
        } catch (err) {
          console.error('[letsclaim] Burn tx failed:', err)
          if (i === 0 && completed === 0) {
            setTokens(prev => prev.map(t =>
              selectedKeys.has(t.pubkey.toBase58()) && t.status === 'burning'
                ? { ...t, status: 'pending' as const } : t,
            ))
            break
          }
          failed += chunk.length
          setTokens(prev => prev.map(t =>
            chunkKeys.has(t.pubkey.toBase58()) && t.status === 'burning'
              ? { ...t, status: 'failed' as const } : t,
          ))
          setProgress({ total: selected.length, completed, failed })
        }
      }

      // Report successful burns to the tracker (best-effort, Solana only)
      if (completed > 0 && publicKey && network === 'solana') {
        reportClaim({
          wallet: publicKey.toBase58(),
          accountsClosed: completed,
          solReclaimed: completed * RENT_PER_TOKEN_ACCOUNT,
          network,
          txSignatures: signatures,
        })
      }
    } finally {
      setBurning(false)
      operationLock.current = false
    }
  }, [publicKey, connected, tokens, connection, signAndSendTransaction, network])

  const selectedCount = useMemo(
    () => tokens.filter(t => t.selected && t.status === 'pending').length,
    [tokens],
  )

  const totalRentReclaimable = useMemo(
    () => selectedCount * RENT_PER_TOKEN_ACCOUNT,
    [selectedCount],
  )

  return {
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
  }
}
