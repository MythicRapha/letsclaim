# letsclaim.fun

Close empty Solana token accounts and reclaim your rent SOL. Free, open-source, no fees.

**Live at [letsclaim.fun](https://letsclaim.fun)**

## What It Does

Every token account on Solana locks ~0.00203928 SOL in rent. When a token balance hits zero, that SOL stays locked. letsclaim.fun scans your wallet for empty token accounts and batch-closes them, returning the rent SOL directly to your wallet.

- Supports **Solana mainnet** and **Mythic L2**
- Handles both **SPL Token** and **Token-2022** accounts
- Batch closes up to 8 accounts per transaction
- Uses `signAllTransactions` when supported (single approval popup)
- 20% of reclaimed SOL auto-buys and burns **$CLAIM** via PumpFun

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS, zero border-radius, glass-morphism
- **Fonts:** Sora, Inter, JetBrains Mono
- **Chain:** @solana/web3.js, @solana/spl-token
- **Database:** better-sqlite3 (claim/burn tracking)
- **Animations:** Framer Motion

## Development

```bash
npm install
npm run dev
```

Runs on [localhost:3009](http://localhost:3009).

### Environment Variables

```env
NEXT_PUBLIC_SOLANA_RPC=<your-solana-rpc-url>
NEXT_PUBLIC_MYTHIC_RPC=https://rpc.mythic.fm
CRANK_API_KEY=<api-key-for-burn-cranker>
```

## Project Structure

```
src/
├── app/
│   ├── api/          # REST endpoints (claims, burns, feed, rpc)
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # UI components
│   ├── AccountScanner.tsx    # Main claim tool
│   ├── BurnTracker.tsx       # $CLAIM burn dashboard
│   ├── ClaimTracker.tsx      # SOL reclaim dashboard
│   ├── LiveMarquee.tsx       # Real-time tx feed
│   ├── AreaChart.tsx         # Shared SVG chart
│   ├── Navbar.tsx            # Header + marquee
│   └── ...
├── hooks/            # useWallet, useTokenAccounts, useClaimStats
├── lib/              # Constants, DB, close account logic
└── providers/        # Network + wallet context
scripts/
└── claim-burn-cranker.mjs    # Auto buy & burn $CLAIM from fees
```

## Buy & Burn Mechanics

20% of all SOL reclaimed through letsclaim.fun is directed to a fee wallet. A cranker script monitors the fee wallet and, when the balance exceeds 0.05 SOL:

1. Buys **$CLAIM** on PumpFun's bonding curve
2. Burns all purchased tokens via `spl_token::burn`
3. Records the transaction to the burn tracker

All buy and burn transactions are publicly verifiable on Solscan.

## Links

- **Website:** [letsclaim.fun](https://letsclaim.fun)
- **$CLAIM Token:** [pump.fun/coin/5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump](https://pump.fun/coin/5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump)
- **Mythic Network:** [mythic.fm](https://mythic.fm)
- **X:** [@letsclaimfun](https://x.com/letsclaimfun)
- **Telegram:** [@letsclaimfun](https://t.me/letsclaimfun)

## License

[Business Source License 1.1](LICENSE) — converts to MIT on March 13, 2028.
