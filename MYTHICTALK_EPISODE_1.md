# MythicTalk Episode 1 — Let's Claim!

**Title:** Let's Talk! @LetsClaimFun Launch | Mythic's First Talk Podcast
**Time:** 7PM EST
**Project:** https://letsclaim.fun
**Format:** Solo host deep-dive (20–25 min)

---

## COLD OPEN [0:00–0:45]

What's up everyone. Welcome to MythicTalk — this is episode one. The very first podcast from the Mythic Network. I'm your host, and tonight we're breaking down something we just shipped that I think is going to change how people think about wallet hygiene on Solana and beyond.

We're talking about letsclaim.fun — the first cross-chain rent reclaimer built for the SVM. If you've ever swapped a memecoin, aped into a presale, or just used Solana for more than a week — you're leaving money on the table. Literally. And tonight I'm going to explain exactly what that means, how we built this, and why it matters.

Let's get into it.

---

## SEGMENT 1 — THE PROBLEM [0:45–4:00]

So let me set the stage for anyone who doesn't know what rent is on Solana.

Every time you interact with a token on Solana — you swap on Jupiter, you receive an airdrop, you buy something on pump.fun — the network creates what's called a **token account**. That token account is specific to your wallet and that specific token mint. And to create it, the network locks up a small deposit of SOL. It's called **rent**. Think of it like a security deposit on an apartment.

The exact amount is **0.00203928 SOL** per token account. Doesn't sound like much, right? But here's the thing — if you've been active on Solana for any amount of time, you could have **hundreds** of these. Some of you degens out there have thousands. I've seen wallets with 500, 600 empty token accounts just sitting there. Do the math on that — 500 accounts times 0.002 SOL — that's a full SOL just locked up doing absolutely nothing.

And the key word there is **empty**. You already sent the tokens. You already sold. The token account has a zero balance. But it's still there, still holding your SOL hostage.

Now here's where it gets interesting. Most people don't even know this is happening. They don't know they have SOL locked in rent. They've never heard of closing a token account. And even if they have — the existing tools are clunky, they only work on Solana mainnet, and some of them charge fees to give you back your own money. Which is insane.

That's the problem we set out to solve.

---

## SEGMENT 2 — WHAT IS LETSCLAIM.FUN [4:00–8:30]

So what is letsclaim.fun?

At its core, it's a free, no-fee utility tool that lets you scan your wallet, find every empty token account, and close them in bulk to reclaim your rent SOL. Connect wallet. Scan. Claim. Three steps. Done.

But we didn't stop there. We built two modes.

**Mode one: Close Accounts.** This is the classic rent reclaimer. It finds every token account in your wallet with a zero balance — both standard SPL tokens and Token-2022 accounts — and lets you batch close them. We pack up to **eight close instructions per transaction**, so even if you have hundreds of accounts, you're done in a handful of clicks.

**Mode two: Burn Tokens.** This is for the tokens you still hold but don't want. The rugged projects. The honeypots. The airdrop spam. Burn Tokens scans for accounts that actually have a balance, shows you the token name, symbol, image, and lets you select which ones to nuke. For each token, we build a burn instruction to destroy the balance, then a close instruction to reclaim the rent. Two instructions per token, four tokens per transaction. You're not just cleaning house — you're getting paid to do it.

And the UI — I'm proud of this. It's the same design language we use across the entire Mythic ecosystem. Dark glass-morphism. Zero border-radius. Solana gradient — that purple to green. Sora font for display, JetBrains Mono for the data. When you're done, you get this beautiful share card that you can screenshot or post directly to X. It renders your stats, your transaction hash, everything. And it tags @LetsClaimFun so people can find it.

---

## SEGMENT 3 — THE INNOVATION: CROSS-CHAIN SVM [8:30–13:00]

Now here's where we differentiate from every other rent reclaimer out there.

letsclaim.fun is the **first cross-chain rent reclaimer with native SVM support**. What does that mean?

If you look at the existing tools — Sol Incinerator, various others — they only work on Solana mainnet. One chain. One network. That's it.

We support **Solana mainnet** and **Mythic L2** out of the box. Same interface. Same wallet connection. You toggle a switch at the top of the page and you're on a completely different network. Solana or Mythic. Your wallet works on both because Mythic L2 is SVM-compatible — it runs the Solana Virtual Machine natively. Same wallet. Same keypair. Same token programs. Different chain.

Under the hood, this is a custom dual-connection architecture. When you're on Solana, your RPC calls go through our Helius-powered proxy to avoid CORS issues in the browser. When you toggle to Mythic, it connects directly to rpc.mythic.fm — our production L2 validator running Frankendancer. The wallet's signAndSendTransaction handles the actual submission, so the transaction goes straight from your wallet extension to the correct RPC. No middleman. No custody.

And this is where it gets philosophically important. As SVM proliferates — and it is proliferating, you've got Eclipse, you've got Sonic, you've got us with Mythic — the tooling layer needs to be chain-agnostic. The whole promise of SVM is that your Solana skills, your Solana wallet, your Solana mental model translates across chains. But if all the utility tools are hardcoded to one RPC endpoint, that promise breaks.

We're building for the multi-chain SVM future. letsclaim.fun is the proof of concept. Today it's Solana and Mythic. Tomorrow it could be any SVM chain. The architecture is there.

And let me be clear — on Mythic L2, when you reclaim rent, you get back **MYTH**, not SOL. The UI reflects that. The share card reflects that. The tweet text reflects that. We're not just slapping a network toggle on a Solana-only tool. We built it from the ground up to understand which chain you're on and behave accordingly.

---

## SEGMENT 4 — THE TECH DEEP-DIVE [13:00–17:00]

Let me get into the weeds for the builders listening.

The stack is **Next.js 14** with the app router, **Tailwind CSS**, **TypeScript**, and **@solana/web3.js v1** for all the on-chain interaction. We're using @solana/spl-token for the close and burn instruction builders.

**Transaction batching.** For close accounts, we pack 8 closeAccount instructions per transaction. For burn tokens, it's 4 per transaction — because each token needs a burn instruction AND a close instruction, so that's 8 instructions total, which keeps us well under Solana's compute budget.

**Wallet integration.** We support Phantom and Solflare. The key architectural decision was using **signAndSendTransaction** instead of signAllTransactions plus sendRawTransaction. Why? Because signAndSendTransaction has the wallet extension itself send the transaction directly to the RPC. This completely bypasses CORS restrictions. If you use signAllTransactions, you sign locally but then your frontend has to call sendRawTransaction, which hits CORS issues with third-party RPCs. We learned this the hard way during development and it was a game-changer for reliability.

**Token metadata.** In burn mode, we fetch metadata for every token mint so you can see names, symbols, and images. This helps you make informed decisions about what to burn. We batch the metadata fetches and cache them per session.

**The share card.** When you complete a claim or burn, we generate a 1200 by 630 PNG using the **Canvas 2D API** directly. No html2canvas, no puppeteer, no external dependencies. We draw the gradient background, the orbs, the text, the stats — everything — pixel by pixel on a canvas element. Then we convert it to a blob and either share it via the Web Share API on mobile, or download it as a PNG and open the tweet composer on desktop. The whole thing happens in milliseconds, client-side, zero server calls.

**Persistent analytics.** Every successful claim on Solana gets recorded to a SQLite database on the server. We track total SOL reclaimed, accounts closed, unique wallets, and daily aggregates. This powers the Community Reclaims dashboard on the homepage — the chart, the counters, all of it. We specifically only track Solana claims in the stats, not Mythic, because the community tracker is denominated in SOL.

**Both token programs.** We scan for and handle both the original Token Program and the newer Token-2022 program. These have different program IDs but the close and burn instruction format is compatible. We tag each account with its program ID and pass it through to the instruction builder.

---

## SEGMENT 5 — THE $CLAIM TOKEN [17:00–20:30]

Now let's talk about the token.

**$CLAIM** is the native utility token of the letsclaim ecosystem. It launched on pump.fun on Solana.

Here's the tokenomics model that makes this interesting. **5% of every rent claim gets auto market-bought into $CLAIM and burned on pump.fun.** So every time someone uses letsclaim.fun to reclaim their SOL, a portion of that flows directly into buying $CLAIM off the market and permanently destroying it.

Think about what that means from a flywheel perspective. More users using the tool means more SOL being reclaimed, which means more buy pressure on $CLAIM, which means more burns, which means decreasing supply with increasing demand. It's a deflationary utility token that gets more scarce the more useful the underlying product becomes.

And the product IS useful. This isn't a token looking for a use case. This is a working product — live right now at letsclaim.fun — that happens to have a token with built-in demand mechanics. You can go use it right now. Connect your wallet. See how much SOL you have locked up. Reclaim it. It's free.

$CLAIM fuels governance over the protocol's future direction. It enables staking rewards for long-term holders. And it unlocks premium features as the platform evolves. But the core product — scanning and closing accounts — that's free forever. No fees. No paywall. Your keys, your SOL.

---

## SEGMENT 6 — WHY THIS MATTERS FOR MYTHIC [20:30–23:00]

I want to zoom out for a second and talk about why we built this and what it signals.

Mythic Network is an AI-optimized Solana L2. We've built bridge infrastructure, a DEX, a launchpad, governance, staking — a full ecosystem. But ecosystems aren't just about DeFi primitives. They're about utility. They're about making the everyday experience of using crypto better.

letsclaim.fun is a utility play. It's the kind of tool that doesn't need a 40-page whitepaper to explain. You use it once and you get it. And in that one interaction, you've touched the Mythic ecosystem. You've seen what we build. You've seen how we ship.

This is also the first product to demonstrate native cross-chain SVM support in the tooling layer. When you toggle to Mythic L2 in letsclaim.fun, you're using the same wallet to interact with our Frankendancer-powered L2 validator. Same UX. Different chain. That's the future of SVM — and we're building the tools to make it real.

We shipped letsclaim.fun in days, not months. Live product. Real utility. Open to everyone. And this is just episode one — for MythicTalk AND for the tools we're building.

---

## CLOSE [23:00–24:00]

That's the show. Episode one of MythicTalk in the books.

If you haven't tried it yet — go to **letsclaim.fun** right now. Connect your wallet. See how much SOL you're leaving on the table. Close those empty accounts. Burn those dead tokens. Get your money back.

Follow **@LetsClaimFun** on X for updates. Follow **@MythicNetwork** for everything we're building.

And if you reclaim some SOL tonight, share it. Hit that Share on X button. Post your card. Let people know there's money sitting in their wallet that they didn't even know about.

This has been MythicTalk. I'll see you on the next one.

---

## PRODUCTION NOTES

**Total runtime:** ~24 minutes
**Tone:** Confident, technical but accessible, builder energy — not hype, not salesy
**Music:** Lo-fi ambient intro/outro, subtle under transitions
**Graphics (if video):** Screen share of letsclaim.fun during Segments 2 and 4, share card mockup during Segment 2, network toggle demo during Segment 3

### Key Talking Points Checklist
- [ ] Rent = 0.00203928 SOL per token account
- [ ] Two modes: Close Accounts (empty) + Burn Tokens (with balance)
- [ ] 8 close instructions per TX, 4 burn+close per TX
- [ ] First cross-chain SVM rent reclaimer
- [ ] Solana mainnet + Mythic L2 toggle
- [ ] signAndSendTransaction architecture (no CORS)
- [ ] Canvas 2D share card generation (no html2canvas)
- [ ] SPL Token + Token-2022 support
- [ ] $CLAIM token — 5% auto buy & burn from claims
- [ ] Free forever, no fees
- [ ] Persistent SQLite tracking (Solana only)
- [ ] Frankendancer-powered L2

### Hashtags for Promotion
`#MythicTalk #LetsClaim #Solana #SVM #ReclaimYourSOL #MythicNetwork #Web3`
