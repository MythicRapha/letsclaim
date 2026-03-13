'use client'

import { createContext, useContext, useState, useMemo, useCallback, type ReactNode } from 'react'
import { Connection } from '@solana/web3.js'
import { SOLANA_RPC, MYTHIC_L2_RPC, createSolanaConnection, createMythicConnection } from '@/lib/constants'

export type Network = 'solana' | 'mythic'

interface NetworkContextValue {
  network: Network
  setNetwork: (network: Network) => void
  connection: Connection
  rpcUrl: string
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<Network>('solana')

  const solanaConnection = useMemo(() => createSolanaConnection(), [])
  const mythicConnection = useMemo(() => createMythicConnection(), [])

  const connection = network === 'solana' ? solanaConnection : mythicConnection
  const rpcUrl = network === 'solana' ? SOLANA_RPC : MYTHIC_L2_RPC

  const setNetwork = useCallback((n: Network) => {
    setNetworkState(n)
  }, [])

  const value = useMemo<NetworkContextValue>(
    () => ({ network, setNetwork, connection, rpcUrl }),
    [network, setNetwork, connection, rpcUrl],
  )

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext)
  if (!ctx) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return ctx
}
