'use client'

import { useState, useCallback } from 'react'
import DocsSidebar from '@/components/DocsSidebar'

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display text-[2rem] sm:text-[2.4rem] font-bold tracking-[-0.02em] text-white mb-6 scroll-mt-32">
      {children}
    </h2>
  )
}

function SubHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="font-display text-[1.1rem] sm:text-[1.2rem] font-semibold text-white mt-8 mb-4 scroll-mt-32">
      {children}
    </h3>
  )
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#A0A0B0] text-[0.88rem] leading-relaxed mb-4">
      {children}
    </p>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-black border border-white/[0.06] p-4 overflow-x-auto mb-6">
      <code className="text-[0.78rem] text-[#9945FF] font-mono">{children}</code>
    </pre>
  )
}

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#9945FF] bg-[#9945FF]/5 p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-[#9945FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[#9945FF] font-mono text-[0.65rem] tracking-[0.1em] uppercase font-medium">{title}</span>
      </div>
      <div className="text-[#A0A0B0] text-[0.82rem] leading-relaxed">{children}</div>
    </div>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-[0.82rem] text-[#A0A0B0]">
      <svg className="w-4 h-4 text-[#9945FF] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </li>
  )
}

/* ========================= SECTIONS ========================= */

function OverviewSection() {
  return (
    <section>
      <SectionHeading id="overview">Introduction</SectionHeading>
      <Paragraph>
        <strong className="text-white">letsclaim.fun</strong> is a free, open-source utility for Solana that helps you recover SOL locked in empty token accounts. Every token account on Solana requires a rent deposit of ~0.00203928 SOL. When a token balance reaches zero, that SOL stays locked unless the account is explicitly closed.
      </Paragraph>
      <Paragraph>
        letsclaim.fun scans your wallet, identifies every empty token account, and batch-closes them in a single approval — returning the rent SOL directly to your wallet. It supports both <strong className="text-white">Solana mainnet</strong> and <strong className="text-white">Mythic L2</strong>, handles SPL Token and Token-2022 programs, and is entirely non-custodial.
      </Paragraph>

      <SubHeading id="overview-how">How It Works</SubHeading>
      <div className="bg-[#08080C] border border-white/[0.06] p-6 mb-6 space-y-4">
        {[
          { step: '1', title: 'Connect Wallet', desc: 'Connect your Phantom or Solflare wallet. No seed phrase, no permissions beyond transaction signing.' },
          { step: '2', title: 'Scan Accounts', desc: 'letsclaim.fun calls getTokenAccountsByOwner for both SPL Token and Token-2022 programs, filtering for zero-balance accounts.' },
          { step: '3', title: 'Select & Claim', desc: 'Select which accounts to close (or select all). Accounts are batched into groups of 8 per transaction for optimal throughput.' },
          { step: '4', title: 'Receive SOL', desc: 'Each closed account returns ~0.00203928 SOL directly to your wallet. The transaction uses closeAccount instructions signed by your wallet.' },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-4">
            <div className="w-8 h-8 bg-[#9945FF]/10 border border-[#9945FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#9945FF] text-sm font-bold">{item.step}</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">{item.title}</h4>
              <p className="text-[#A0A0B0] text-[0.82rem]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <SubHeading id="overview-features">Key Features</SubHeading>
      <ul className="space-y-3 mb-6">
        <CheckItem>Supports both SPL Token and Token-2022 (Token Extensions) programs</CheckItem>
        <CheckItem>Batch closes up to 8 accounts per transaction for efficiency</CheckItem>
        <CheckItem>Uses signAllTransactions when available (single popup for all batches)</CheckItem>
        <CheckItem>Works on Solana mainnet and Mythic L2</CheckItem>
        <CheckItem>Fully non-custodial — your wallet signs every transaction</CheckItem>
        <CheckItem>100% open source under BUSL-1.1 (MIT in 2028)</CheckItem>
        <CheckItem>Real-time activity tracking with live charts and transaction feeds</CheckItem>
        <CheckItem>20% of reclaimed SOL auto-buys and burns $CLAIM token</CheckItem>
      </ul>

      <InfoBox title="Open Source">
        letsclaim.fun is fully open source. View the code, report issues, or contribute at{' '}
        <a href="https://github.com/MythicFoundation/letsclaim" target="_blank" rel="noopener noreferrer" className="text-[#9945FF] hover:underline">
          github.com/MythicFoundation/letsclaim
        </a>
      </InfoBox>
    </section>
  )
}

function QuickStartSection() {
  return (
    <section>
      <SectionHeading id="quickstart">Quick Start</SectionHeading>

      <SubHeading id="qs-connect">1. Connect Wallet</SubHeading>
      <Paragraph>
        Click <strong className="text-white">Connect Wallet</strong> in the top right. letsclaim.fun supports Phantom and Solflare. The connection is read-only until you initiate a claim — no permissions are granted until you sign a transaction.
      </Paragraph>

      <SubHeading id="qs-scan">2. Scan for Empty Accounts</SubHeading>
      <Paragraph>
        Once connected, click <strong className="text-white">Scan for Reclaimable SOL</strong>. The scanner queries your wallet for all token accounts with zero balance across both SPL Token and Token-2022 programs. Results show each account&apos;s mint address, program type, and reclaimable amount.
      </Paragraph>

      <SubHeading id="qs-claim">3. Reclaim Your SOL</SubHeading>
      <Paragraph>
        Select the accounts you want to close (or use <strong className="text-white">Select All</strong>), then click <strong className="text-white">Reclaim</strong>. Accounts are grouped into batches of 8, and each batch is submitted as a single transaction. If your wallet supports <code className="text-[#9945FF] font-mono text-[0.82rem] bg-white/[0.04] px-1.5">signAllTransactions</code>, you&apos;ll only see one approval popup for all batches.
      </Paragraph>

      <InfoBox title="Network Selection">
        Use the network toggle in the header to switch between <strong className="text-white">Solana</strong> (mainnet-beta) and <strong className="text-white">Mythic L2</strong>. Each network is scanned independently.
      </InfoBox>

      <SubHeading>Expected Returns</SubHeading>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Per Account', value: '~0.00204 SOL' },
          { label: '10 Accounts', value: '~0.0204 SOL' },
          { label: '50 Accounts', value: '~0.102 SOL' },
          { label: '100 Accounts', value: '~0.204 SOL' },
          { label: '500 Accounts', value: '~1.02 SOL' },
          { label: '1000 Accounts', value: '~2.04 SOL' },
        ].map((item) => (
          <div key={item.label} className="bg-[#08080C] border border-white/[0.06] p-4">
            <div className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#686878] mb-1">{item.label}</div>
            <div className="text-white font-semibold text-[0.82rem]">{item.value}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TokenAccountsSection() {
  return (
    <section>
      <SectionHeading id="token-accounts">Token Accounts</SectionHeading>

      <SubHeading id="ta-what">What Are Token Accounts?</SubHeading>
      <Paragraph>
        On Solana, holding any SPL token requires a <strong className="text-white">token account</strong> — a separate on-chain account that stores your balance for that specific token mint. Unlike Ethereum where ERC-20 balances are stored in the token contract, Solana stores each user&apos;s balance in their own account.
      </Paragraph>
      <Paragraph>
        Every time you receive a new token (via swap, airdrop, or transfer), a token account is created for that mint. Each of these accounts requires a rent-exempt deposit of <strong className="text-white">0.00203928 SOL</strong> (~$0.30 at current prices). This SOL is locked in the account and cannot be used until the account is closed.
      </Paragraph>

      <SubHeading id="ta-rent">Rent & Exemption</SubHeading>
      <Paragraph>
        Solana charges rent for on-chain data storage. Accounts that maintain a minimum balance (the &quot;rent-exempt&quot; threshold) are exempt from periodic rent deductions. For token accounts, this threshold is exactly <strong className="text-white">0.00203928 SOL</strong> (2,039,280 lamports), which covers the 165-byte token account data.
      </Paragraph>
      <div className="bg-[#08080C] border border-white/[0.06] p-5 mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Parameter</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Value</th>
            </tr>
          </thead>
          <tbody className="text-[0.82rem]">
            {[
              ['Account Size', '165 bytes'],
              ['Rent-Exempt Minimum', '0.00203928 SOL'],
              ['Rent-Exempt (lamports)', '2,039,280'],
              ['Token-2022 Account Size', '165 bytes (base) + extensions'],
              ['Token-2022 Rent', '0.00203928+ SOL (varies by extensions)'],
            ].map(([param, value]) => (
              <tr key={param} className="border-b border-white/[0.04]">
                <td className="py-3 px-4 text-[#A0A0B0] font-mono text-[0.78rem]">{param}</td>
                <td className="py-3 px-4 text-white font-mono text-[0.78rem]">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading id="ta-empty">Empty Accounts</SubHeading>
      <Paragraph>
        An account becomes &quot;empty&quot; when its token balance reaches zero — typically after selling, transferring, or swapping all of a token. The account still exists on-chain, holding your ~0.002 SOL hostage. Active DeFi users, NFT traders, and airdrop recipients often accumulate hundreds of these empty accounts over time, locking up significant SOL.
      </Paragraph>

      <InfoBox title="Common Sources of Empty Accounts">
        Selling tokens on DEXes (Jupiter, Raydium), receiving and selling airdrops, failed token swaps that leave dust, NFT marketplace activity, and interacting with new DeFi protocols that create associated token accounts.
      </InfoBox>

      <SubHeading id="ta-closing">Closing Process</SubHeading>
      <Paragraph>
        Closing a token account is a single instruction: <code className="text-[#9945FF] font-mono text-[0.82rem] bg-white/[0.04] px-1.5">closeAccount</code> from the SPL Token program (or Token-2022). It requires:
      </Paragraph>
      <ul className="space-y-2 mb-6">
        <CheckItem>The token account to close (must have zero balance)</CheckItem>
        <CheckItem>A destination account to receive the rent SOL (your wallet)</CheckItem>
        <CheckItem>The account authority&apos;s signature (your wallet)</CheckItem>
      </ul>
      <Paragraph>
        letsclaim.fun batches up to 8 closeAccount instructions per transaction. This is the optimal number that fits within Solana&apos;s transaction size limits while minimizing the number of signatures required.
      </Paragraph>
      <CodeBlock>{`// Pseudocode for closing a token account
const ix = createCloseAccountInstruction(
  tokenAccountPubkey,  // Account to close
  ownerPubkey,         // Destination for rent SOL
  ownerPubkey,         // Authority (signer)
  [],                  // No multisig signers
  programId            // TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
)`}</CodeBlock>
    </section>
  )
}

function SupportedSection() {
  return (
    <section>
      <SectionHeading id="supported">Supported Programs</SectionHeading>

      <SubHeading id="sp-spl">SPL Token Program</SubHeading>
      <Paragraph>
        The original Solana token program (<code className="text-[#9945FF] font-mono text-[0.82rem] bg-white/[0.04] px-1.5">TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA</code>). This covers the vast majority of tokens on Solana, including SOL wrappers, USDC, USDT, and most DeFi tokens.
      </Paragraph>

      <SubHeading id="sp-t22">Token-2022 (Token Extensions)</SubHeading>
      <Paragraph>
        The newer token program (<code className="text-[#9945FF] font-mono text-[0.82rem] bg-white/[0.04] px-1.5">TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb</code>) that supports extensions like transfer fees, interest-bearing tokens, and confidential transfers. letsclaim.fun detects and closes Token-2022 accounts using the correct program ID.
      </Paragraph>

      <SubHeading id="sp-networks">Supported Networks</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#08080C] border border-white/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <img src="/solana-logo.svg" alt="Solana" className="w-6 h-6" />
            <h4 className="text-white font-semibold">Solana Mainnet</h4>
          </div>
          <ul className="space-y-2">
            <li className="text-[0.82rem] text-[#A0A0B0]">RPC: Helius (via server proxy)</li>
            <li className="text-[0.82rem] text-[#A0A0B0]">SPL Token + Token-2022</li>
            <li className="text-[0.82rem] text-[#A0A0B0]">Full DAS API for token metadata</li>
          </ul>
        </div>
        <div className="bg-[#08080C] border border-white/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <img src="/mythic-mark.svg" alt="Mythic" className="w-6 h-6" />
            <h4 className="text-white font-semibold">Mythic L2</h4>
          </div>
          <ul className="space-y-2">
            <li className="text-[0.82rem] text-[#A0A0B0]">RPC: rpc.mythic.fm</li>
            <li className="text-[0.82rem] text-[#A0A0B0]">SPL Token + Token-2022</li>
            <li className="text-[0.82rem] text-[#A0A0B0]">Known token metadata registry</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function ClaimTokenSection() {
  return (
    <section>
      <SectionHeading id="claim-token">$CLAIM Token</SectionHeading>

      <SubHeading id="ct-details">Token Details</SubHeading>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Token', value: '$CLAIM' },
          { label: 'Platform', value: 'PumpFun' },
          { label: 'Standard', value: 'Token-2022' },
          { label: 'Mechanism', value: 'Buy & Burn' },
        ].map((item) => (
          <div key={item.label} className="bg-[#08080C] border border-white/[0.06] p-4">
            <div className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#686878] mb-1">{item.label}</div>
            <div className="text-white font-semibold text-[0.82rem]">{item.value}</div>
          </div>
        ))}
      </div>

      <Paragraph>
        $CLAIM is a community token launched on PumpFun that is directly tied to letsclaim.fun&apos;s usage. A portion of all SOL reclaimed through the tool is automatically used to buy $CLAIM on the bonding curve and permanently burn it, creating deflationary pressure proportional to platform usage.
      </Paragraph>

      <SubHeading id="ct-utility">Utility</SubHeading>
      <ul className="space-y-3 mb-6">
        <CheckItem>Deflationary asset — supply decreases with every claim on letsclaim.fun</CheckItem>
        <CheckItem>Transparent burns — every buy and burn transaction is publicly verifiable on Solscan</CheckItem>
        <CheckItem>Usage-driven value — more claims = more burns = less supply</CheckItem>
        <CheckItem>Community governance — future feature voting for $CLAIM holders</CheckItem>
      </ul>

      <SubHeading id="ct-supply">Supply & Burn Tracking</SubHeading>
      <Paragraph>
        All burn statistics are tracked in real-time on letsclaim.fun. The Burn Tracker section shows cumulative SOL spent on buybacks, total $CLAIM burned, and individual transaction links. The live marquee at the top of the page shows every buyback and burn as it happens.
      </Paragraph>

      <InfoBox title="Verify Burns">
        Every $CLAIM burn is a real <code className="text-[#9945FF] font-mono text-[0.78rem]">spl_token::burn</code> instruction — tokens are permanently removed from supply. View all burn transactions in the Burn Tracker on letsclaim.fun or verify directly on Solscan.
      </InfoBox>
    </section>
  )
}

function BuyBurnSection() {
  return (
    <section>
      <SectionHeading id="buy-burn">Buy &amp; Burn</SectionHeading>

      <SubHeading id="bb-mechanics">How It Works</SubHeading>
      <Paragraph>
        When users reclaim SOL on letsclaim.fun, 20% of the reclaimed amount is directed to a fee wallet. An automated cranker monitors this wallet and, when the balance exceeds 0.05 SOL, executes a buy-and-burn cycle:
      </Paragraph>
      <div className="bg-[#08080C] border border-white/[0.06] p-6 mb-6 space-y-4">
        {[
          { step: '1', title: 'Fee Accumulation', desc: '20% of reclaimed SOL from each claim is sent to the fee wallet. The remaining 80% goes directly to the user.' },
          { step: '2', title: 'Threshold Check', desc: 'The cranker polls the fee wallet every 60 seconds. When the available balance (minus 0.008 SOL fee reserve) exceeds 0.05 SOL, it triggers.' },
          { step: '3', title: 'Market Buy', desc: 'The cranker buys $CLAIM on PumpFun\'s bonding curve using the available SOL. It caps each buy at 0.15 SOL and uses 5% slippage tolerance.' },
          { step: '4', title: 'Burn', desc: 'All purchased $CLAIM tokens are immediately burned via spl_token::burn. The token account is then closed to recover the rent.' },
          { step: '5', title: 'Record', desc: 'The buy TX, burn TX, SOL spent, and $CLAIM burned are recorded to the API for the dashboard and live feed.' },
        ].map((item) => (
          <div key={item.step} className="flex items-start gap-4">
            <div className="w-8 h-8 bg-[#9945FF]/10 border border-[#9945FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#9945FF] text-sm font-bold">{item.step}</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">{item.title}</h4>
              <p className="text-[#A0A0B0] text-[0.82rem]">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <SubHeading id="bb-fee-flow">Fee Flow</SubHeading>
      <div className="bg-[#08080C] border border-white/[0.06] p-5 mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Destination</th>
              <th className="text-center py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Share</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Description</th>
            </tr>
          </thead>
          <tbody className="text-[0.82rem]">
            <tr className="border-b border-white/[0.04]">
              <td className="py-3.5 px-4 text-[#14F195] font-medium">User Wallet</td>
              <td className="py-3.5 px-4 text-white text-center font-mono">80%</td>
              <td className="py-3.5 px-4 text-[#A0A0B0]">Returned directly to the user</td>
            </tr>
            <tr className="border-b border-white/[0.04]">
              <td className="py-3.5 px-4 text-[#9945FF] font-medium">Buy &amp; Burn</td>
              <td className="py-3.5 px-4 text-white text-center font-mono">20%</td>
              <td className="py-3.5 px-4 text-[#A0A0B0]">Auto-buys $CLAIM and permanently burns it</td>
            </tr>
          </tbody>
        </table>
      </div>

      <SubHeading id="bb-cranker">Burn Cranker</SubHeading>
      <Paragraph>
        The burn cranker is an open-source Node.js script that runs as a PM2 process. It handles the full buy-and-burn lifecycle autonomously. The cranker supports both the PumpFun bonding curve (pre-graduation) and PumpSwap AMM (post-graduation).
      </Paragraph>
      <CodeBlock>{`# Run the cranker
RPC_URL="your-rpc-url" \\
FEE_KEY="./keys/fee-wallet.json" \\
CRANK_API_KEY="your-api-key" \\
node scripts/claim-burn-cranker.mjs

# Or with PM2
pm2 start scripts/claim-burn-cranker.mjs --name claim-burn-cranker`}</CodeBlock>

      <SubHeading id="bb-verify">Verify On-Chain</SubHeading>
      <Paragraph>
        Every buy and burn transaction is recorded and displayed in the Burn Tracker dashboard with Solscan links. You can independently verify:
      </Paragraph>
      <ul className="space-y-2 mb-6">
        <CheckItem>Buy transactions show SOL transferred to PumpFun bonding curve</CheckItem>
        <CheckItem>Burn transactions show spl_token::burn instruction reducing supply</CheckItem>
        <CheckItem>The live marquee shows each transaction in real-time as it confirms</CheckItem>
      </ul>
    </section>
  )
}

function ArchitectureSection() {
  return (
    <section>
      <SectionHeading id="architecture">Architecture</SectionHeading>

      <SubHeading id="arch-stack">Tech Stack</SubHeading>
      <div className="bg-[#08080C] border border-white/[0.06] p-5 mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Layer</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Technology</th>
            </tr>
          </thead>
          <tbody className="text-[0.82rem]">
            {[
              ['Framework', 'Next.js 14 (App Router)'],
              ['Styling', 'Tailwind CSS — zero border-radius, glass-morphism'],
              ['Fonts', 'Sora (display), Inter (body), JetBrains Mono (code)'],
              ['Chain', '@solana/web3.js v1, @solana/spl-token v0.3'],
              ['Database', 'better-sqlite3 (claim + burn tracking)'],
              ['Animations', 'Framer Motion'],
              ['Charts', 'Custom SVG with bezier curves'],
              ['Deployment', 'PM2 + nginx on Azure VM'],
            ].map(([layer, tech]) => (
              <tr key={layer} className="border-b border-white/[0.04]">
                <td className="py-3 px-4 text-white font-mono text-[0.78rem]">{layer}</td>
                <td className="py-3 px-4 text-[#A0A0B0]">{tech}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading id="arch-api">API Endpoints</SubHeading>
      <div className="bg-[#08080C] border border-white/[0.06] p-5 mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Endpoint</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Method</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Description</th>
            </tr>
          </thead>
          <tbody className="text-[0.82rem]">
            {[
              ['/api/claims', 'GET', 'Claim stats: totals, 15-min intervals, recent transactions'],
              ['/api/claims', 'POST', 'Record a new claim (wallet, accounts closed, SOL reclaimed)'],
              ['/api/burns', 'GET', 'Burn stats: totals, intervals, recent burns, supply reduced %'],
              ['/api/burns', 'POST', 'Record a burn (cranker only, requires API key)'],
              ['/api/feed', 'GET', 'Combined live feed of claims, buybacks, and burns (30 most recent)'],
              ['/api/rpc', 'POST', 'RPC proxy to avoid CORS issues with Helius/Solana RPCs'],
            ].map(([endpoint, method, desc]) => (
              <tr key={endpoint + method} className="border-b border-white/[0.04]">
                <td className="py-3 px-4 text-[#9945FF] font-mono text-[0.78rem]">{endpoint}</td>
                <td className="py-3 px-4 text-white font-mono text-[0.78rem]">{method}</td>
                <td className="py-3 px-4 text-[#A0A0B0]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading id="arch-db">Data Layer</SubHeading>
      <Paragraph>
        letsclaim.fun uses <strong className="text-white">better-sqlite3</strong> for local data persistence. The database stores claim records, burn records, and is queried for the dashboard statistics and live feed. SQLite was chosen for simplicity and zero external dependencies — no database server required.
      </Paragraph>
      <CodeBlock>{`-- Claims table
CREATE TABLE claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL,
  accounts_closed INTEGER NOT NULL,
  sol_reclaimed REAL NOT NULL,
  network TEXT NOT NULL DEFAULT 'solana',
  tx_signatures TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Burns table
CREATE TABLE burns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sol_spent REAL NOT NULL,
  claim_bought REAL NOT NULL,
  claim_burned REAL NOT NULL,
  tx_buy TEXT,
  tx_burn TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`}</CodeBlock>

      <SubHeading id="arch-rpc">RPC Proxy</SubHeading>
      <Paragraph>
        The <code className="text-[#9945FF] font-mono text-[0.82rem] bg-white/[0.04] px-1.5">/api/rpc</code> endpoint acts as a server-side proxy for Solana RPC calls. This avoids CORS issues when calling RPCs from the browser and keeps API keys server-side. The proxy forwards JSON-RPC requests to the configured RPC URL and returns the response.
      </Paragraph>
    </section>
  )
}

function SelfHostSection() {
  return (
    <section>
      <SectionHeading id="self-host">Self-Hosting</SectionHeading>

      <SubHeading id="sh-setup">Local Setup</SubHeading>
      <CodeBlock>{`git clone https://github.com/MythicFoundation/letsclaim.git
cd letsclaim
npm install
npm run dev

# Open http://localhost:3009`}</CodeBlock>

      <SubHeading id="sh-env">Environment Variables</SubHeading>
      <div className="bg-[#08080C] border border-white/[0.06] p-5 mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Variable</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Required</th>
              <th className="text-left py-3 px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#686878]">Description</th>
            </tr>
          </thead>
          <tbody className="text-[0.82rem]">
            {[
              ['NEXT_PUBLIC_SOLANA_RPC', 'Yes', 'Solana mainnet RPC URL (Helius recommended)'],
              ['NEXT_PUBLIC_MYTHIC_RPC', 'No', 'Mythic L2 RPC (default: rpc.mythic.fm)'],
              ['CRANK_API_KEY', 'For cranker', 'API key for burn cranker to record burns'],
              ['RPC_URL', 'For cranker', 'Solana RPC for the burn cranker'],
              ['FEE_KEY', 'For cranker', 'Path to fee wallet keypair JSON'],
            ].map(([variable, required, desc]) => (
              <tr key={variable} className="border-b border-white/[0.04]">
                <td className="py-3 px-4 text-[#9945FF] font-mono text-[0.78rem]">{variable}</td>
                <td className="py-3 px-4 text-white text-[0.78rem]">{required}</td>
                <td className="py-3 px-4 text-[#A0A0B0]">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubHeading id="sh-deploy">Production Deploy</SubHeading>
      <CodeBlock>{`# Build
npm run build

# Start with PM2
pm2 start npm --name "letsclaim" -- start

# Or with systemd, Docker, etc.
npm start  # Runs on port 3009`}</CodeBlock>

      <InfoBox title="Database Persistence">
        The SQLite database is stored at <code className="text-[#9945FF] font-mono text-[0.78rem]">data/claims.db</code>. Make sure to exclude this directory from deployments (<code className="text-[#9945FF] font-mono text-[0.78rem]">--exclude data/</code> in rsync) to preserve production data across redeployments.
      </InfoBox>
    </section>
  )
}

function SecuritySection() {
  return (
    <section>
      <SectionHeading id="security">Security</SectionHeading>

      <SubHeading id="sec-model">Security Model</SubHeading>
      <Paragraph>
        letsclaim.fun is designed to be <strong className="text-white">fully non-custodial</strong>. The application never has access to your private keys, seed phrase, or token balances. All transactions are constructed client-side and signed by your wallet extension.
      </Paragraph>
      <ul className="space-y-3 mb-6">
        {[
          { icon: '🔒', text: 'Non-custodial — your wallet signs every transaction. No keys stored server-side.' },
          { icon: '👀', text: 'Read-only scanning — getTokenAccountsByOwner is a read-only RPC call with no on-chain side effects.' },
          { icon: '📝', text: 'Transparent instructions — each transaction contains only closeAccount instructions. No hidden transfers or approvals.' },
          { icon: '🔓', text: 'Open source — all code is publicly auditable on GitHub. No obfuscated logic.' },
          { icon: '🛡️', text: 'Server-side RPC proxy — API keys and RPC URLs are kept server-side, never exposed to the client.' },
        ].map((item) => (
          <li key={item.text} className="flex items-start gap-3 text-[0.82rem] text-[#A0A0B0]">
            <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
            {item.text}
          </li>
        ))}
      </ul>

      <SubHeading id="sec-wallet">Wallet Safety</SubHeading>
      <Paragraph>
        The <code className="text-[#9945FF] font-mono text-[0.82rem] bg-white/[0.04] px-1.5">closeAccount</code> instruction can <em>only</em> close accounts with a zero token balance. It is impossible to close an account that still holds tokens — the SPL Token program enforces this at the runtime level. Your funded token accounts are completely safe.
      </Paragraph>

      <InfoBox title="What Can Go Wrong?">
        The worst case scenario is a failed transaction (no SOL reclaimed, small transaction fee lost). letsclaim.fun cannot drain your wallet, move your tokens, or approve token spending. Each transaction is explicitly shown in your wallet for review before signing.
      </InfoBox>

      <SubHeading id="sec-audit">Open Source Audit</SubHeading>
      <Paragraph>
        The entire codebase is open source under BUSL-1.1 (converts to MIT in March 2028). Anyone can audit the transaction construction logic, verify that only closeAccount instructions are used, and confirm no hidden transfers exist. We encourage security researchers to review the code and report issues via GitHub.
      </Paragraph>
      <div className="flex items-center gap-3 mb-6">
        <a
          href="https://github.com/MythicFoundation/letsclaim"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#9945FF]/10 border border-[#9945FF]/20 text-[#9945FF] font-mono text-[0.78rem] hover:bg-[#9945FF]/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View Source Code
        </a>
      </div>
    </section>
  )
}

function FAQSection() {
  const faqs = [
    { q: 'Is letsclaim.fun free?', a: 'Yes. There are no fees charged by letsclaim.fun. You only pay standard Solana network transaction fees (~0.000005 SOL per transaction). 20% of reclaimed SOL goes to the $CLAIM buy & burn mechanism.' },
    { q: 'Can I lose tokens by using this?', a: 'No. The closeAccount instruction can only close accounts with a zero token balance. The SPL Token program enforces this — it is physically impossible to close an account that still holds tokens.' },
    { q: 'How much SOL can I reclaim?', a: 'Each empty token account holds ~0.00203928 SOL in rent. The total depends on how many empty accounts you have. Active DeFi users often have 50-500+ empty accounts, recovering 0.1-1+ SOL.' },
    { q: 'Why do I need to sign multiple transactions?', a: 'Solana transactions have a size limit. We batch 8 account closures per transaction for optimal efficiency. If you have 80 empty accounts, that\'s 10 transactions. If your wallet supports signAllTransactions, you\'ll only see one popup.' },
    { q: 'What is the 20% fee used for?', a: '20% of reclaimed SOL automatically buys $CLAIM tokens on PumpFun and burns them. This creates deflationary pressure and rewards the community. The remaining 80% goes directly to your wallet.' },
    { q: 'Does it work with Ledger?', a: 'Yes, if your Ledger is connected through Phantom or Solflare. The wallet extension handles the hardware wallet signing.' },
    { q: 'Can I run this myself?', a: 'Yes. letsclaim.fun is fully open source. Clone the repo, set your RPC URL, and run npm run dev. See the Self-Hosting section for details.' },
    { q: 'Why Token-2022 support?', a: 'Many newer tokens (especially those launched via PumpFun) use the Token-2022 program. Without Token-2022 support, these empty accounts would be missed.' },
  ]

  return (
    <section>
      <SectionHeading id="faq">FAQ</SectionHeading>
      <div className="space-y-4 mb-6">
        {faqs.map((faq) => (
          <div key={faq.q} className="bg-[#08080C] border border-white/[0.06] p-5">
            <h4 className="text-white font-semibold text-[0.92rem] mb-2">{faq.q}</h4>
            <p className="text-[#A0A0B0] text-[0.82rem] leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function LinksSection() {
  const links = [
    { label: 'Website', url: 'https://letsclaim.fun', desc: 'Main application' },
    { label: 'GitHub', url: 'https://github.com/MythicFoundation/letsclaim', desc: 'Source code' },
    { label: '$CLAIM on PumpFun', url: 'https://pump.fun/coin/5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump', desc: 'Token page' },
    { label: 'X / Twitter', url: 'https://x.com/letsclaimfun', desc: '@letsclaimfun' },
    { label: 'Telegram', url: 'https://t.me/letsclaimfun', desc: 'Community chat' },
    { label: 'Mythic Network', url: 'https://mythic.fm', desc: 'Parent ecosystem' },
    { label: 'Mythic Docs', url: 'https://mythic.fm/docs', desc: 'Full network documentation' },
  ]

  return (
    <section>
      <SectionHeading id="links">Links &amp; Resources</SectionHeading>
      <div className="space-y-2 mb-6">
        {links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-[#08080C] border border-white/[0.06] hover:border-[#9945FF]/20 transition-colors group"
          >
            <div>
              <div className="text-white font-medium text-[0.88rem] group-hover:text-[#9945FF] transition-colors">{link.label}</div>
              <div className="text-[#686878] text-[0.76rem]">{link.desc}</div>
            </div>
            <svg className="w-4 h-4 text-[#686878] group-hover:text-[#9945FF] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </section>
  )
}

/* ========================= PAGE ========================= */

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview')

  const handleSectionClick = useCallback((id: string) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)]">
      <DocsSidebar activeSection={activeSection} onSectionClick={handleSectionClick} />

      <div className="flex-1 max-w-[960px] mx-auto px-5 sm:px-10 py-16 lg:pl-8">
        <div className="space-y-16">
          <OverviewSection />
          <hr className="border-white/[0.06]" />
          <QuickStartSection />
          <hr className="border-white/[0.06]" />
          <TokenAccountsSection />
          <hr className="border-white/[0.06]" />
          <SupportedSection />
          <hr className="border-white/[0.06]" />
          <ClaimTokenSection />
          <hr className="border-white/[0.06]" />
          <BuyBurnSection />
          <hr className="border-white/[0.06]" />
          <ArchitectureSection />
          <hr className="border-white/[0.06]" />
          <SelfHostSection />
          <hr className="border-white/[0.06]" />
          <SecuritySection />
          <hr className="border-white/[0.06]" />
          <FAQSection />
          <hr className="border-white/[0.06]" />
          <LinksSection />
        </div>
      </div>
    </div>
  )
}
