'use client'

import { useState } from 'react'
import Image from 'next/image'
import AccountScanner from '@/components/AccountScanner'
import BurnTokens from '@/components/BurnTokens'
import HowItWorks from '@/components/HowItWorks'
import ClaimTracker from '@/components/ClaimTracker'
import BurnTracker from '@/components/BurnTracker'
import AnimatedSection from '@/components/AnimatedSection'

const PLACEHOLDER_CA = '5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump'

function CopyCA() {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(PLACEHOLDER_CA).catch(() => {
      const el = document.createElement('textarea')
      el.value = PLACEHOLDER_CA
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/[0.08] max-w-max mb-6">
      <span className="font-mono text-[0.55rem] sm:text-[0.65rem] text-[#686878]">CA:</span>
      <code className="font-mono text-[0.5rem] sm:text-[0.6rem] text-[#14F195] select-all">{PLACEHOLDER_CA}</code>
      <button onClick={handleCopy}
        className="ml-1 px-2 py-0.5 border border-white/[0.08] hover:border-[#14F195]/40 hover:bg-[#14F195]/[0.05] transition-colors cursor-pointer"
        title="Copy CA">
        {copied ? (
          <span className="font-mono text-[0.55rem] text-[#14F195]">Copied</span>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#686878]">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'close' | 'burn'>('close')

  return (
    <div className="relative">
      {/* ===== HERO + TOOL (unified) ===== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden py-20">
        {/* Gradient mesh background — fills the entire hero+tool area */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-[#9945FF] opacity-20 blur-[180px] animate-pulse-slow" />
          <div className="absolute top-[5%] right-[10%] w-[500px] h-[500px] bg-[#14F195] opacity-15 blur-[180px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-[10%] left-[40%] w-[400px] h-[400px] bg-[#9945FF] opacity-10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }} />

        <div className="grid-overlay absolute inset-0" />

        {/* Hero text */}
        <div className="relative text-center mb-10 px-5">
          <AnimatedSection delay={0.1}>
            <h1 className="font-display font-bold text-5xl md:text-7xl solana-gradient-text leading-tight">
              Reclaim Your SOL
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-xl text-[#A0A0B0] mt-4">
              Close empty token accounts. Recover rent.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            <p className="text-sm text-[#686878] mt-2">
              Free tool. No fees. Your keys, your SOL.
            </p>
          </AnimatedSection>
        </div>

        {/* Tool card — inside the hero */}
        <div className="relative w-full max-w-2xl px-5 sm:px-10">
          <div className="liquid-glass">
            {/* Inner purple glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#9945FF] opacity-[0.04] blur-[80px]" />
            </div>

            {/* Tab bar */}
            <div className="relative flex border-b border-white/[0.06]">
              <button
                onClick={() => setActiveTab('close')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-mono text-[0.65rem] tracking-[0.1em] uppercase text-center transition-all cursor-pointer ${
                  activeTab === 'close'
                    ? 'text-white border-b-2 border-[#9945FF] bg-white/[0.02]'
                    : 'text-[#686878] hover:text-[#A0A0B0] border-b-2 border-transparent'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Accounts
              </button>
              <button
                onClick={() => setActiveTab('burn')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 font-mono text-[0.65rem] tracking-[0.1em] uppercase text-center transition-all cursor-pointer ${
                  activeTab === 'burn'
                    ? 'text-white border-b-2 border-[#9945FF] bg-white/[0.02]'
                    : 'text-[#686878] hover:text-[#A0A0B0] border-b-2 border-transparent'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                </svg>
                Burn Tokens
              </button>
            </div>

            {/* Active tool */}
            <div className="relative">
              {activeTab === 'close' ? <AccountScanner /> : <BurnTokens />}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CLAIM TRACKER ===== */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-10">
          <AnimatedSection>
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
                Community Reclaims
              </h2>
              <p className="font-mono text-xs text-[#686878] mt-2 tracking-wide">
                Total SOL recovered through letsclaim.fun
              </p>
            </div>
            <ClaimTracker />
          </AnimatedSection>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <AnimatedSection>
        <HowItWorks />
      </AnimatedSection>

      {/* ===== INFO CARDS ===== */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-5 sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection delay={0}>
              <div className="glass-card p-6 border-t-2 border-[#9945FF]/30 h-full">
                <h3 className="font-display text-white font-semibold text-lg mb-3">
                  What are empty accounts?
                </h3>
                <p className="text-[#A0A0B0] text-sm leading-relaxed">
                  When you swap or receive tokens on Solana, a token account is created with rent deposited. When you send all tokens away, the empty account remains — locking up your SOL.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <div className="glass-card p-6 border-t-2 border-[#9945FF]/30 h-full">
                <h3 className="font-display text-white font-semibold text-lg mb-3">
                  How much can I get back?
                </h3>
                <p className="text-[#A0A0B0] text-sm leading-relaxed">
                  Each empty token account holds ~0.00204 SOL in rent. Power users with hundreds of accounts can reclaim 0.5+ SOL.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="glass-card p-6 border-t-2 border-[#9945FF]/30 h-full">
                <h3 className="font-display text-white font-semibold text-lg mb-3">
                  Is this safe?
                </h3>
                <p className="text-[#A0A0B0] text-sm leading-relaxed">
                  100% safe. We only close accounts with zero balance. Your SOL goes directly to your wallet. The transaction is signed by you — we never touch your keys.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== $CLAIM TOKEN ===== */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle purple glow behind section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9945FF] opacity-[0.04] blur-[200px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-5 sm:px-10 relative">
          <AnimatedSection>
            <div className="glass-card p-8 md:p-12 border border-white/[0.06]">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Token icon */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#8B5CF6] opacity-20 blur-[40px]" />
                    <Image
                      src="/claimtoken.png"
                      alt="$CLAIM Token"
                      width={160}
                      height={160}
                      className="relative w-32 h-32 md:w-40 md:h-40"
                    />
                  </div>
                </div>

                {/* Token info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                    <h2 className="font-display font-bold text-3xl md:text-4xl text-white">
                      LetsClaimFun
                    </h2>
                    <span className="font-mono text-[0.6rem] tracking-[0.12em] uppercase px-2 py-1 bg-[#9945FF]/20 border border-[#9945FF]/30 text-[#B06FFF]">
                      $CLAIM
                    </span>
                  </div>

                  <p className="text-[#A0A0B0] text-sm leading-relaxed mb-4">
                    The native utility token powering the letsclaim ecosystem. $CLAIM fuels governance,
                    staking rewards, and premium features across the platform. Built on Solana for instant,
                    low-cost transactions.
                  </p>

                  <p className="text-[#14F195] text-sm font-medium mb-6">
                    20% of every claim auto market buys $CLAIM and burns it on PumpFun.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/[0.03] border border-white/[0.06] p-4">
                      <div className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-[#686878] mb-1">
                        Utility
                      </div>
                      <div className="text-white text-sm font-medium">
                        Governance & Rewards
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] p-4">
                      <div className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-[#686878] mb-1">
                        Network
                      </div>
                      <div className="text-white text-sm font-medium">
                        Solana
                      </div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/[0.06] p-4">
                      <div className="font-mono text-[0.6rem] tracking-[0.12em] uppercase text-[#686878] mb-1">
                        Standard
                      </div>
                      <div className="text-white text-sm font-medium">
                        SPL Token
                      </div>
                    </div>
                  </div>

                  <CopyCA />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href="https://pump.fun/coin/5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-5 py-3 bg-[#9945FF] hover:bg-[#B06FFF] transition-colors text-white font-mono text-xs tracking-[0.08em] uppercase cursor-pointer"
                    >
                      <Image src="/pumpfun-logo.png" alt="PumpFun" width={20} height={20} className="w-5 h-5 flex-shrink-0" />
                      Buy on PumpFun
                    </a>
                    <a
                      href="https://dexscreener.com/solana/5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-5 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] transition-colors text-white font-mono text-xs tracking-[0.08em] uppercase cursor-pointer"
                    >
                      <Image src="/dexscreener-logo.webp" alt="DexScreener" width={20} height={20} className="w-5 h-5 flex-shrink-0" />
                      View on DexScreener
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Buy/Burn Tracker */}
          <div className="mt-8">
            <AnimatedSection>
              <div className="text-center mb-8">
                <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
                  Buy & Burn
                </h2>
                <p className="font-mono text-xs text-[#686878] mt-2 tracking-wide">
                  $CLAIM auto-bought and burned from claim fees
                </p>
              </div>
              <BurnTracker />
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  )
}
