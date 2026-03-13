'use client'

import { useNetwork } from '@/providers/NetworkProvider'

export default function NetworkSelector() {
  const { network, setNetwork } = useNetwork()

  return (
    <div className="inline-flex border border-white/[0.06] bg-white/[0.03]">
      <button
        onClick={() => setNetwork('solana')}
        className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
          network === 'solana'
            ? 'bg-[#9945FF]/20 border border-[#9945FF]/40 text-white'
            : 'text-[#686878] hover:text-[#A0A0B0] border border-transparent'
        }`}
      >
        <img src="/solana-logo.svg" alt="" className="w-3.5 h-3.5 flex-shrink-0" />
        Solana
      </button>
      <button
        onClick={() => setNetwork('mythic')}
        className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
          network === 'mythic'
            ? 'bg-[#9945FF]/20 border border-[#9945FF]/40 text-white'
            : 'text-[#686878] hover:text-[#A0A0B0] border border-transparent'
        }`}
      >
        <img src="/mythic-mark.svg" alt="" className="w-3.5 h-3.5 flex-shrink-0" />
        Mythic
      </button>
    </div>
  )
}
