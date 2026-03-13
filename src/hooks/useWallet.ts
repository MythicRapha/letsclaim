'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { AccountLayout } from '@solana/spl-token'
import { useNetwork } from '@/providers/NetworkProvider'
import { MYTH_MINT, LAMPORTS_PER_MYTH, createSolanaConnection, createMythicConnection } from '@/lib/constants'

// ── Wallet provider interface (raw window.solana / window.solflare) ──────────

interface WalletProvider {
  publicKey: PublicKey | null
  connect: () => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions?: (txs: Transaction[]) => Promise<Transaction[]>
  signAndSendTransaction: (tx: Transaction) => Promise<{ signature: string }>
  on: (event: string, callback: (...args: unknown[]) => void) => void
  off: (event: string, callback: (...args: unknown[]) => void) => void
}

export type WalletType = 'mythic' | 'phantom' | 'solflare' | null

function getProvider(type: WalletType): WalletProvider | null {
  if (typeof window === 'undefined' || !type) return null

  if (type === 'mythic') {
    const mythic = (window as any).mythic
    if (!mythic?.isMythicWallet) return null
    return {
      get publicKey() {
        if (!mythic.publicKey) return null
        if (typeof mythic.publicKey === 'string') {
          try { return new PublicKey(mythic.publicKey) } catch { return null }
        }
        return mythic.publicKey
      },
      async connect() {
        const result = await mythic.connect()
        const pk = typeof result.publicKey === 'string'
          ? new PublicKey(result.publicKey)
          : result.publicKey
        return { publicKey: pk }
      },
      disconnect: () => mythic.disconnect(),
      signTransaction: (tx: Transaction) => mythic.signTransaction(tx),
      signAllTransactions: mythic.signAllTransactions ? (txs: Transaction[]) => mythic.signAllTransactions(txs) : undefined,
      signAndSendTransaction: (tx: Transaction) => mythic.signAndSendTransaction(tx),
      on: (event: string, cb: (...args: unknown[]) => void) => mythic.on(event, cb),
      off: (event: string, cb: (...args: unknown[]) => void) => mythic.off(event, cb),
    } as WalletProvider
  }
  if (type === 'phantom') {
    const solana = (window as any).phantom?.solana ?? (window as any).solana
    return solana?.isPhantom ? (solana as WalletProvider) : null
  }
  if (type === 'solflare') {
    const solflare = (window as any).solflare
    return solflare?.isSolflare ? (solflare as WalletProvider) : null
  }
  return null
}

export function detectAvailableWallets(): { mythic: boolean; phantom: boolean; solflare: boolean } {
  if (typeof window === 'undefined') return { mythic: false, phantom: false, solflare: false }
  const solana = (window as any).phantom?.solana ?? (window as any).solana
  return {
    mythic: !!(window as any).mythic?.isMythicWallet,
    phantom: !!solana?.isPhantom,
    solflare: !!(window as any).solflare?.isSolflare,
  }
}

// ── Public interface ─────────────────────────────────────────────────────────

export function detectAvailableWalletsAsync(): Promise<{ mythic: boolean; phantom: boolean; solflare: boolean }> {
  return new Promise(resolve => {
    const check = () => resolve(detectAvailableWallets())
    if (typeof document === 'undefined') return check()
    if (document.readyState === 'complete') {
      setTimeout(check, 200)
    } else {
      window.addEventListener('load', () => setTimeout(check, 200), { once: true })
    }
  })
}

export interface WalletState {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  walletType: WalletType
  balance: number | null
  mythBalance: number | null
  mythicDetected: boolean
  phantomDetected: boolean
  solflareDetected: boolean
  showWalletModal: boolean
  shortAddress: string
  l2Connection: Connection
  openWalletModal: () => void
  closeWalletModal: () => void
  connect: (type: 'mythic' | 'phantom' | 'solflare') => Promise<void>
  disconnect: () => Promise<void>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  signAndSendTransaction: (tx: Transaction, connection: Connection) => Promise<string>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'letsclaim_wallet'

function isMessagePortError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.toLowerCase().includes('message port closed') ||
    msg.toLowerCase().includes('message channel closed')
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet(connectionOverride?: Connection): WalletState {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [walletType, setWalletType] = useState<WalletType>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [mythBalance, setMythBalance] = useState<number | null>(null)
  const [mythicDetected, setMythicDetected] = useState(false)
  const [phantomDetected, setPhantomDetected] = useState(false)
  const [solflareDetected, setSolflareDetected] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Detect wallets on mount
  useEffect(() => {
    detectAvailableWalletsAsync().then(w => {
      setMythicDetected(w.mythic)
      setPhantomDetected(w.phantom)
      setSolflareDetected(w.solflare)
    })
  }, [])

  // Re-detect when modal opens
  useEffect(() => {
    if (showWalletModal) {
      detectAvailableWalletsAsync().then(w => {
        setMythicDetected(w.mythic)
        setPhantomDetected(w.phantom)
        setSolflareDetected(w.solflare)
      })
    }
  }, [showWalletModal])

  const openWalletModal = useCallback(() => setShowWalletModal(true), [])
  const closeWalletModal = useCallback(() => setShowWalletModal(false), [])

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : ''

  // Use network context if available, fall back to override
  let networkConnection: Connection | undefined
  try {
    const network = useNetwork()
    networkConnection = network.connection
  } catch {
    // NetworkProvider not mounted yet (e.g. during SSR or before providers wrap)
  }
  const connection = connectionOverride ?? networkConnection

  // ── Dedicated L1 connection for SOL balance (always Solana mainnet) ─────
  const l1Connection = useMemo(() => createSolanaConnection(), [])

  // ── Dedicated L2 connection for MYTH balance (always Mythic L2 RPC) ─────
  const l2Connection = useMemo(() => createMythicConnection(), [])

  // ── Balance fetching ───────────────────────────────────────────────────────

  const refreshMythBalance = useCallback(async (pubkey: PublicKey) => {
    try {
      const mythMint = new PublicKey(MYTH_MINT)
      const resp = await l2Connection.getTokenAccountsByOwner(pubkey, { mint: mythMint })
      if (resp.value.length === 0) {
        setMythBalance(0)
        return
      }
      let total = BigInt(0)
      for (const { account } of resp.value) {
        const decoded = AccountLayout.decode(account.data)
        total += decoded.amount
      }
      setMythBalance(Number(total) / LAMPORTS_PER_MYTH)
    } catch (err) {
      console.warn('[letsclaim] MYTH balance fetch failed:', err)
    }
  }, [l2Connection])

  const refreshBalance = useCallback(async (pubkey: PublicKey) => {
    // Always fetch SOL balance from L1 (Solana mainnet)
    try {
      const lamports = await l1Connection.getBalance(pubkey, 'confirmed')
      setBalance(lamports / LAMPORTS_PER_SOL)
    } catch (err) {
      console.warn('[letsclaim] SOL balance fetch failed:', err)
    }
    // Always fetch MYTH balance from L2
    refreshMythBalance(pubkey)
  }, [l1Connection, refreshMythBalance])

  // ── Auto-reconnect from localStorage ───────────────────────────────────────

  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY) as WalletType
      : null
    if (!stored) return

    const provider = getProvider(stored)
    if (provider?.publicKey) {
      setPublicKey(provider.publicKey)
      setConnected(true)
      setWalletType(stored)
      refreshBalance(provider.publicKey)
    }
  }, [refreshBalance])

  // ── Periodic balance refresh ───────────────────────────────────────────────

  useEffect(() => {
    if (!publicKey) return
    refreshBalance(publicKey)
    const interval = setInterval(() => refreshBalance(publicKey), 15_000)
    return () => clearInterval(interval)
  }, [publicKey, refreshBalance])

  // ── Connect ────────────────────────────────────────────────────────────────

  const connect = useCallback(async (type: 'mythic' | 'phantom' | 'solflare') => {
    const provider = getProvider(type)
    if (!provider) throw new Error(`${type} wallet not found`)

    setConnecting(true)
    try {
      const { publicKey: pk } = await provider.connect()
      setPublicKey(pk)
      setConnected(true)
      setWalletType(type)
      localStorage.setItem(STORAGE_KEY, type)
      refreshBalance(pk)
    } finally {
      setConnecting(false)
    }
  }, [refreshBalance])

  // ── Disconnect ─────────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    if (walletType) {
      const provider = getProvider(walletType)
      try { await provider?.disconnect() } catch { /* ignore */ }
    }
    setPublicKey(null)
    setConnected(false)
    setWalletType(null)
    setBalance(null)
    setMythBalance(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [walletType])

  // ── Sign transaction ───────────────────────────────────────────────────────

  const signTransaction = useCallback(async (tx: Transaction): Promise<Transaction> => {
    const provider = getProvider(walletType)
    if (!provider) throw new Error('Wallet not connected')

    try {
      return await provider.signTransaction(tx)
    } catch (err) {
      if (isMessagePortError(err)) {
        await new Promise(r => setTimeout(r, 500))
        const retry = getProvider(walletType)
        if (retry) return await retry.signTransaction(tx)
      }
      throw err
    }
  }, [walletType])

  // ── Sign all transactions (batch — single popup) ──────────────────────────

  const signAllTransactions = useCallback(async (txs: Transaction[]): Promise<Transaction[]> => {
    const provider = getProvider(walletType)
    if (!provider) throw new Error('Wallet not connected')

    // Use native signAllTransactions if the wallet supports it
    if (provider.signAllTransactions) {
      try {
        return await provider.signAllTransactions(txs)
      } catch (err) {
        if (isMessagePortError(err)) {
          await new Promise(r => setTimeout(r, 500))
          const retry = getProvider(walletType)
          if (retry?.signAllTransactions) return await retry.signAllTransactions(txs)
        }
        throw err
      }
    }

    // Fallback: sign one at a time
    const signed: Transaction[] = []
    for (const tx of txs) {
      signed.push(await signTransaction(tx))
    }
    return signed
  }, [walletType, signTransaction])

  // ── Sign and send transaction ──────────────────────────────────────────────

  const signAndSendTransaction = useCallback(async (tx: Transaction, conn: Connection): Promise<string> => {
    const provider = getProvider(walletType)
    if (!provider) throw new Error('Wallet not connected')

    try {
      const { signature } = await provider.signAndSendTransaction(tx)
      return signature
    } catch (err) {
      if (isMessagePortError(err)) {
        await new Promise(r => setTimeout(r, 500))
        const retry = getProvider(walletType)
        if (retry) {
          const { signature } = await retry.signAndSendTransaction(tx)
          return signature
        }
      }
      // Fallback: sign locally then send via provided connection
      try {
        const signed = await signTransaction(tx)
        const sig = await conn.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        return sig
      } catch (fallbackErr) {
        throw fallbackErr
      }
    }
  }, [walletType, signTransaction])

  return {
    publicKey,
    connected,
    connecting,
    walletType,
    balance,
    mythBalance,
    mythicDetected,
    phantomDetected,
    solflareDetected,
    showWalletModal,
    shortAddress,
    l2Connection,
    openWalletModal,
    closeWalletModal,
    connect,
    disconnect,
    signTransaction,
    signAllTransactions,
    signAndSendTransaction,
  }
}
