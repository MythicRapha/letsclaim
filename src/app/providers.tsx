'use client'

import { Buffer } from 'buffer'
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer
}

import { NetworkProvider } from '@/providers/NetworkProvider'
import { WalletProvider } from '@/providers/WalletProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NetworkProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </NetworkProvider>
  )
}
