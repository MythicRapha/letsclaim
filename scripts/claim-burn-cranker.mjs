#!/usr/bin/env node
/**
 * $CLAIM Buy & Burn Cranker
 *
 * Monitors the fee wallet for accumulated SOL from letsclaim.fun claims (20% fee).
 * When sufficient SOL accumulates:
 *   1. Buys $CLAIM — tries pump.fun bonding curve first, falls back to PumpSwap AMM
 *   2. Burns all purchased $CLAIM tokens
 *   3. Records the burn via the /api/burns endpoint
 *
 * Run once: BURN_INTERVAL_MS=0 node scripts/claim-burn-cranker.mjs
 * PM2: pm2 start scripts/claim-burn-cranker.mjs --name claim-burn-cranker
 */

import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
  SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount, createBurnInstruction, createCloseAccountInstruction,
} from '@solana/spl-token';
import fs from 'fs';

// ── Configuration ────────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const FEE_KEY = process.env.FEE_KEY || './keys/fee-wallet.json';
const API_URL = process.env.API_URL || 'https://letsclaim.fun/api/burns';
const CRANK_API_KEY = process.env.CRANK_API_KEY || '';
const POLL_INTERVAL_MS = parseInt(process.env.BURN_POLL_MS ?? '60000'); // Check every 60s
const TRIGGER_THRESHOLD = parseFloat(process.env.BURN_TRIGGER_SOL || '0.05'); // Trigger buy when balance > 0.05
const MIN_SOL_TO_BUY = parseFloat(process.env.MIN_SOL_TO_BUY || '0.005');
const MAX_SOL_PER_BUY = parseFloat(process.env.MAX_SOL_PER_BUY || '0.15'); // Cap per buy like working bot
const FEE_RESERVE = 0.008; // Always keep ~0.008 SOL for 2 txs with priority fees
const SLIPPAGE_BPS = 500; // 5%

// $CLAIM token
const CLAIM_MINT = new PublicKey('5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump');
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// ═══════════════════════════════════════════════════════════════════════════
// PUMP.FUN BONDING CURVE (pre-graduation)
// ═══════════════════════════════════════════════════════════════════════════

const PUMPFUN_PROGRAM = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
const PF_GLOBAL_PDA = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf');
const PF_EVENT_AUTHORITY = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1');
const PF_GLOBAL_FEE_ACCUMULATOR = new PublicKey('Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y');
const PF_FEE_PROGRAM = new PublicKey('pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ');
const PF_FEE_CONFIG = new PublicKey('8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt');

// Read fee_recipient dynamically from global config (offset 41, 32 bytes after 8-byte disc + 1-byte bool)
let _feeRecipientCache = null;
async function getPfFeeRecipient() {
  if (_feeRecipientCache) return _feeRecipientCache;
  const info = await conn.getAccountInfo(PF_GLOBAL_PDA);
  if (!info) throw new Error('Global PDA not found');
  _feeRecipientCache = new PublicKey(info.data.slice(41, 73));
  console.log(`  Fee recipient (from global): ${_feeRecipientCache.toBase58()}`);
  return _feeRecipientCache;
}

// buy discriminator (Anchor "global:buy" hash)
const PF_BUY_DISC = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);

// ═══════════════════════════════════════════════════════════════════════════
// PUMPSWAP AMM (post-graduation)
// ═══════════════════════════════════════════════════════════════════════════

const PUMP_AMM = new PublicKey('pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA');
const PS_PROTOCOL_FEE_RECIPIENT = new PublicKey('7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ');
const PS_GLOBAL_VOLUME_ACCUMULATOR = new PublicKey('C2aFPdENg4A2HQsmrd5rTw5TaYBX5Ku887cWjbFKtZpw');
const PS_FEE_ACCOUNT = new PublicKey('5PHirr8joyTMp9JMm6nW7hNDVyEYdkzDqazxPD7RaTjx');
const PS_FEE_PROGRAM = new PublicKey('pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ');
const PS_FEE_ACCOUNT_2 = new PublicKey('8wEC9pPDiaohSCEirz5ZDoHz5N7YsDxpvz9JBcqYqaoN');
const PS_BUY_DISC = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);

const [PS_GLOBAL_CONFIG] = PublicKey.findProgramAddressSync([Buffer.from('global_config')], PUMP_AMM);
const [PS_EVENT_AUTHORITY] = PublicKey.findProgramAddressSync([Buffer.from('__event_authority')], PUMP_AMM);

// ── Shared ───────────────────────────────────────────────────────────────────

function ts() { return new Date().toISOString(); }

const feeWallet = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(FEE_KEY, 'utf8')))
);
const conn = new Connection(RPC_URL, 'confirmed');

console.log(`[${ts()}] $CLAIM Buy & Burn Cranker starting`);
console.log(`  Fee wallet: ${feeWallet.publicKey.toBase58()}`);
console.log(`  CLAIM mint: ${CLAIM_MINT.toBase58()}`);
console.log(`  Trigger threshold: ${TRIGGER_THRESHOLD} SOL`);
console.log(`  Fee reserve: ${FEE_RESERVE} SOL`);
console.log(`  Poll interval: ${POLL_INTERVAL_MS / 1000}s`);

// ── Token program detection ──────────────────────────────────────────────────

let claimTokenProgram = null;
async function getClaimTokenProgram() {
  if (claimTokenProgram) return claimTokenProgram;
  const mintInfo = await conn.getAccountInfo(CLAIM_MINT);
  if (!mintInfo) throw new Error('CLAIM mint not found on-chain');
  claimTokenProgram = mintInfo.owner;
  const isT22 = claimTokenProgram.equals(TOKEN_2022_PROGRAM_ID);
  console.log(`  CLAIM token program: ${isT22 ? 'Token-2022' : 'SPL Token'}`);
  return claimTokenProgram;
}

// ═══════════════════════════════════════════════════════════════════════════
// BONDING CURVE BUY
// ═══════════════════════════════════════════════════════════════════════════

// Bonding curve account layout:
//  0-7:  discriminator (8)
//  8-15: virtualTokenReserves (u64)
// 16-23: virtualSolReserves (u64)
// 24-31: realTokenReserves (u64)
// 32-39: realSolReserves (u64)
// 40-47: tokenTotalSupply (u64)
// 48:    complete (bool)
// 49-80: creator (pubkey)

function parseBondingCurve(data) {
  return {
    virtualTokenReserves: data.readBigUInt64LE(8),
    virtualSolReserves: data.readBigUInt64LE(16),
    realTokenReserves: data.readBigUInt64LE(24),
    realSolReserves: data.readBigUInt64LE(32),
    tokenTotalSupply: data.readBigUInt64LE(40),
    complete: data[48] === 1,
    creator: new PublicKey(data.slice(49, 81)),
  };
}

async function tryBondingCurveBuy(solIn) {
  console.log(`\n  [BONDING CURVE] Checking...`);

  // Get current fee recipient from global config
  const PF_FEE_RECIPIENT = await getPfFeeRecipient();

  // Derive bonding curve PDA
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from('bonding-curve'), CLAIM_MINT.toBuffer()],
    PUMPFUN_PROGRAM
  );

  const bcInfo = await conn.getAccountInfo(bondingCurve);
  if (!bcInfo) {
    console.log(`  Bonding curve not found — token may have graduated`);
    return null;
  }

  const bc = parseBondingCurve(bcInfo.data);
  if (bc.complete) {
    console.log(`  Bonding curve complete — token graduated to PumpSwap`);
    return null;
  }

  console.log(`  Virtual SOL reserves: ${Number(bc.virtualSolReserves) / 1e9}`);
  console.log(`  Virtual token reserves: ${Number(bc.virtualTokenReserves) / 1e6}`);
  console.log(`  Creator: ${bc.creator.toBase58()}`);

  const claimProgram = await getClaimTokenProgram();

  // Calculate expected tokens using exact getBuyPrice formula from working pumpfun-bot
  // n = vSol * vToken, i = vSol + solIn, r = n / i + 1, tokens = vToken - r
  const n = bc.virtualSolReserves * bc.virtualTokenReserves;
  const i = bc.virtualSolReserves + solIn;
  const r = n / i + 1n;
  let tokensOut = bc.virtualTokenReserves - r;
  if (tokensOut > bc.realTokenReserves) tokensOut = bc.realTokenReserves;
  // 50% slippage (matching working pumpfun-bot: getBuyPrice / 2)
  const minTokensOut = tokensOut / 2n;

  console.log(`  Expected tokens: ~${Number(tokensOut) / 1e6}`);
  console.log(`  Min tokens (50% slippage): ${Number(minTokensOut) / 1e6}`);

  // Derive all required accounts
  const associatedBondingCurve = getAssociatedTokenAddressSync(
    CLAIM_MINT, bondingCurve, true, claimProgram
  );
  const userClaimATA = getAssociatedTokenAddressSync(
    CLAIM_MINT, feeWallet.publicKey, false, claimProgram
  );
  const [creatorVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('creator-vault'), bc.creator.toBuffer()],
    PUMPFUN_PROGRAM
  );
  const userVolumeSeed = Buffer.from([
    117, 115, 101, 114, 95, 118, 111, 108, 117, 109, 101, 95, 97, 99, 99,
    117, 109, 117, 108, 97, 116, 111, 114 // "user_volume_accumulator"
  ]);
  const [userVolumeAccumulator] = PublicKey.findProgramAddressSync(
    [userVolumeSeed, feeWallet.publicKey.toBuffer()],
    PUMPFUN_PROGRAM
  );

  // Build buy instruction
  // Data: 8 disc + 8 amount (min tokens out) + 8 max_sol_cost + 1 track_volume (OptionBool)
  const data = Buffer.alloc(25);
  PF_BUY_DISC.copy(data, 0);
  data.writeBigUInt64LE(minTokensOut, 8);  // amount = min tokens to receive
  data.writeBigUInt64LE(solIn, 16);        // max_sol_cost = SOL willing to spend
  data[24] = 1; // OptionBool { val: true } — must match working pumpfun-bot (track_volume=true)

  const buyIx = new TransactionInstruction({
    programId: PUMPFUN_PROGRAM,
    keys: [
      { pubkey: PF_GLOBAL_PDA, isSigner: false, isWritable: false },             // global
      { pubkey: PF_FEE_RECIPIENT, isSigner: false, isWritable: true },           // fee_recipient
      { pubkey: CLAIM_MINT, isSigner: false, isWritable: false },                // mint
      { pubkey: bondingCurve, isSigner: false, isWritable: true },               // bonding_curve
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },     // associated_bonding_curve
      { pubkey: userClaimATA, isSigner: false, isWritable: true },               // associated_user
      { pubkey: feeWallet.publicKey, isSigner: true, isWritable: true },         // user
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },   // system_program
      { pubkey: claimProgram, isSigner: false, isWritable: false },              // token_program
      { pubkey: creatorVault, isSigner: false, isWritable: true },               // creator_vault
      { pubkey: PF_EVENT_AUTHORITY, isSigner: false, isWritable: false },        // event_authority
      { pubkey: PUMPFUN_PROGRAM, isSigner: false, isWritable: false },           // program
      { pubkey: PF_GLOBAL_FEE_ACCUMULATOR, isSigner: false, isWritable: true },  // global_volume_accumulator (must be writable per IDL)
      { pubkey: userVolumeAccumulator, isSigner: false, isWritable: true },      // user_volume_accumulator
      { pubkey: PF_FEE_CONFIG, isSigner: false, isWritable: false },             // fee_config
      { pubkey: PF_FEE_PROGRAM, isSigner: false, isWritable: false },            // fee_program
      { pubkey: new PublicKey('HxFZqV3cnUbZQ3zc4gkkayLR4EMKm1BKusxVSfs7PmnH'), isSigner: false, isWritable: false },  // unknown 17th account (from successful tx)
    ],
    data,
  });

  // Build transaction
  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }));

  // Create CLAIM ATA if needed
  tx.add(createAssociatedTokenAccountIdempotentInstruction(
    feeWallet.publicKey, userClaimATA, feeWallet.publicKey, CLAIM_MINT, claimProgram
  ));

  tx.add(buyIx);

  console.log(`  Sending bonding curve buy...`);
  let sig;
  try {
    sig = await sendAndConfirmTransaction(conn, tx, [feeWallet], {
      commitment: 'confirmed',
      skipPreflight: true,
    });
  } catch (e) {
    if (e.logs) console.log(`  Program logs:\n    ${e.logs.join('\n    ')}`);
    throw e;
  }
  console.log(`  [OK] Bonding curve buy TX: ${sig}`);
  return { sig, userClaimATA };
}

// ═══════════════════════════════════════════════════════════════════════════
// PUMPSWAP AMM BUY
// ═══════════════════════════════════════════════════════════════════════════

// Pool layout offsets (Anchor):
// 43: baseMint, 75: quoteMint, 139: poolBaseTA, 171: poolQuoteTA, 211: coinCreator

let poolCache = null;

async function findPumpSwapPool() {
  if (poolCache) return poolCache;

  console.log(`  [PUMPSWAP] Finding pool...`);

  // Try baseMint = CLAIM, quoteMint = wSOL (both filters to avoid "too many accounts" error)
  let pools = await conn.getProgramAccounts(PUMP_AMM, {
    filters: [
      { dataSize: 300 },
      { memcmp: { offset: 43, bytes: CLAIM_MINT.toBase58() } },
      { memcmp: { offset: 75, bytes: WSOL_MINT.toBase58() } },
    ],
  });
  let isClaimBase = true;

  if (pools.length === 0) {
    // Try reversed: baseMint = wSOL, quoteMint = CLAIM
    pools = await conn.getProgramAccounts(PUMP_AMM, {
      filters: [
        { dataSize: 300 },
        { memcmp: { offset: 43, bytes: WSOL_MINT.toBase58() } },
        { memcmp: { offset: 75, bytes: CLAIM_MINT.toBase58() } },
      ],
    });
    isClaimBase = false;
  }

  if (pools.length === 0) throw new Error('No PumpSwap pool found for $CLAIM');

  const d = pools[0].account.data;
  poolCache = {
    address: pools[0].pubkey,
    baseMint: new PublicKey(d.slice(43, 75)),
    quoteMint: new PublicKey(d.slice(75, 107)),
    poolBaseTA: new PublicKey(d.slice(139, 171)),
    poolQuoteTA: new PublicKey(d.slice(171, 203)),
    coinCreator: new PublicKey(d.slice(211, 243)),
    isClaimBase,
  };

  console.log(`  Pool: ${poolCache.address.toBase58()}`);
  console.log(`  CLAIM is ${isClaimBase ? 'base' : 'quote'}`);
  return poolCache;
}

async function tryPumpSwapBuy(solIn) {
  console.log(`\n  [PUMPSWAP] Trying AMM buy...`);

  const pool = await findPumpSwapPool();
  const claimProgram = await getClaimTokenProgram();

  // Read reserves
  const baseInfo = await conn.getAccountInfo(pool.poolBaseTA);
  const quoteInfo = await conn.getAccountInfo(pool.poolQuoteTA);
  const baseReserve = baseInfo.data.readBigUInt64LE(64);
  const quoteReserve = quoteInfo.data.readBigUInt64LE(64);

  const claimReserve = pool.isClaimBase ? baseReserve : quoteReserve;
  const solReserve = pool.isClaimBase ? quoteReserve : baseReserve;

  console.log(`  CLAIM reserve: ${Number(claimReserve) / 1e6}`);
  console.log(`  SOL reserve: ${Number(solReserve) / 1e9}`);

  // Constant product calculation
  const feeEstBps = 200n;
  const solAfterFee = solIn * (10000n - feeEstBps) / 10000n;
  const product = solReserve * claimReserve;
  const newSolReserve = solReserve + solAfterFee;
  const expectedClaimOut = claimReserve - (product / newSolReserve + 1n);
  const minClaimOut = expectedClaimOut * BigInt(10000 - SLIPPAGE_BPS) / 10000n;

  console.log(`  Expected $CLAIM: ~${Number(expectedClaimOut) / 1e6}`);
  console.log(`  Min $CLAIM: ${Number(minClaimOut) / 1e6}`);

  // Derive accounts
  const userClaimATA = getAssociatedTokenAddressSync(CLAIM_MINT, feeWallet.publicKey, false, claimProgram);
  const userWsolATA = getAssociatedTokenAddressSync(WSOL_MINT, feeWallet.publicKey, false, TOKEN_PROGRAM_ID);

  const baseTokenProgram = pool.isClaimBase ? claimProgram : TOKEN_PROGRAM_ID;
  const quoteTokenProgram = pool.isClaimBase ? TOKEN_PROGRAM_ID : claimProgram;

  const protocolFeeRecipientTA = getAssociatedTokenAddressSync(
    WSOL_MINT, PS_PROTOCOL_FEE_RECIPIENT, true, TOKEN_PROGRAM_ID
  );
  const coinCreatorVaultAta = getAssociatedTokenAddressSync(
    WSOL_MINT, pool.coinCreator, true, TOKEN_PROGRAM_ID
  );
  const [userVolumeAccumulator] = PublicKey.findProgramAddressSync(
    [Buffer.from('user_volume_accumulator'), feeWallet.publicKey.toBuffer()],
    PUMP_AMM
  );

  // Buy instruction data: 8 disc + 8 baseAmountOut + 8 maxQuoteAmountIn = 24 bytes
  const data = Buffer.alloc(24);
  PS_BUY_DISC.copy(data, 0);
  data.writeBigUInt64LE(pool.isClaimBase ? minClaimOut : solIn, 8);
  data.writeBigUInt64LE(pool.isClaimBase ? solIn : minClaimOut, 16);

  const buyIx = new TransactionInstruction({
    programId: PUMP_AMM,
    keys: [
      { pubkey: pool.address, isSigner: false, isWritable: true },
      { pubkey: feeWallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: PS_GLOBAL_CONFIG, isSigner: false, isWritable: false },
      { pubkey: pool.baseMint, isSigner: false, isWritable: false },
      { pubkey: pool.quoteMint, isSigner: false, isWritable: false },
      { pubkey: pool.isClaimBase ? userClaimATA : userWsolATA, isSigner: false, isWritable: true },
      { pubkey: pool.isClaimBase ? userWsolATA : userClaimATA, isSigner: false, isWritable: true },
      { pubkey: pool.poolBaseTA, isSigner: false, isWritable: true },
      { pubkey: pool.poolQuoteTA, isSigner: false, isWritable: true },
      { pubkey: PS_PROTOCOL_FEE_RECIPIENT, isSigner: false, isWritable: false },
      { pubkey: protocolFeeRecipientTA, isSigner: false, isWritable: true },
      { pubkey: baseTokenProgram, isSigner: false, isWritable: false },
      { pubkey: quoteTokenProgram, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PS_EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_AMM, isSigner: false, isWritable: false },
      { pubkey: coinCreatorVaultAta, isSigner: false, isWritable: true },
      { pubkey: pool.coinCreator, isSigner: false, isWritable: false },
      { pubkey: PS_GLOBAL_VOLUME_ACCUMULATOR, isSigner: false, isWritable: true },
      { pubkey: userVolumeAccumulator, isSigner: false, isWritable: true },
      { pubkey: PS_FEE_ACCOUNT, isSigner: false, isWritable: true },
      { pubkey: PS_FEE_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: PS_FEE_ACCOUNT_2, isSigner: false, isWritable: true },
    ],
    data,
  });

  // Build transaction
  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

  // Create ATAs
  tx.add(createAssociatedTokenAccountIdempotentInstruction(
    feeWallet.publicKey, userClaimATA, feeWallet.publicKey, CLAIM_MINT, claimProgram
  ));
  tx.add(createAssociatedTokenAccountIdempotentInstruction(
    feeWallet.publicKey, userWsolATA, feeWallet.publicKey, WSOL_MINT, TOKEN_PROGRAM_ID
  ));

  // Wrap SOL → wSOL
  tx.add(SystemProgram.transfer({
    fromPubkey: feeWallet.publicKey,
    toPubkey: userWsolATA,
    lamports: Number(solIn),
  }));
  tx.add(new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [{ pubkey: userWsolATA, isSigner: false, isWritable: true }],
    data: Buffer.from([17]), // SyncNative
  }));

  tx.add(buyIx);

  // Close wSOL account to recover remaining SOL
  tx.add(createCloseAccountInstruction(
    userWsolATA, feeWallet.publicKey, feeWallet.publicKey, [], TOKEN_PROGRAM_ID
  ));

  console.log(`  Sending PumpSwap buy...`);
  const sig = await sendAndConfirmTransaction(conn, tx, [feeWallet], {
    commitment: 'confirmed',
    skipPreflight: true,
  });
  console.log(`  [OK] PumpSwap buy TX: ${sig}`);
  return { sig, userClaimATA };
}

// ═══════════════════════════════════════════════════════════════════════════
// BURN + RECORD
// ═══════════════════════════════════════════════════════════════════════════

async function burnTokens(userClaimATA) {
  const claimProgram = await getClaimTokenProgram();
  let claimBalance = 0n;
  try {
    const acct = await getAccount(conn, userClaimATA, 'confirmed', claimProgram);
    claimBalance = acct.amount;
  } catch { }

  if (claimBalance <= 0n) {
    console.log(`  No CLAIM tokens to burn`);
    return { burned: 0, sig: '' };
  }

  const ui = Number(claimBalance) / 1e6;
  console.log(`  Burning ${ui.toFixed(2)} $CLAIM...`);

  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));
  tx.add(createBurnInstruction(
    userClaimATA, CLAIM_MINT, feeWallet.publicKey, claimBalance, [], claimProgram,
  ));

  const sig = await sendAndConfirmTransaction(conn, tx, [feeWallet], {
    commitment: 'confirmed',
    skipPreflight: true,
  });
  console.log(`  [OK] Burn TX: ${sig}`);
  return { burned: ui, sig };
}

async function recordBurnToAPI(solSpent, claimBought, claimBurned, txBuy, txBurn) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CRANK_API_KEY },
      body: JSON.stringify({ solSpent, claimBought, claimBurned, txBuy, txBurn }),
    });
    if (!res.ok) console.error(`  [WARN] API record failed: ${res.status}`);
    else console.log(`  [OK] Burn recorded to API`);
  } catch (e) {
    console.error(`  [WARN] API record failed: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CRANK CYCLE
// ═══════════════════════════════════════════════════════════════════════════

async function crank() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${ts()}] Starting buy & burn cycle`);

  try {
    const balance = await conn.getBalance(feeWallet.publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;
    console.log(`  Fee wallet SOL: ${solBalance.toFixed(6)}`);

    const availableSol = solBalance - FEE_RESERVE;
    if (availableSol < TRIGGER_THRESHOLD) {
      console.log(`  Below threshold (need ${TRIGGER_THRESHOLD}, have ${availableSol.toFixed(6)} available after ${FEE_RESERVE} fee reserve)`);
      return;
    }

    const cappedSol = Math.min(availableSol, MAX_SOL_PER_BUY);
    const solInLamports = BigInt(Math.floor(cappedSol * LAMPORTS_PER_SOL));

    // Try bonding curve first, fall back to PumpSwap
    let buyResult = null;
    try {
      buyResult = await tryBondingCurveBuy(solInLamports);
    } catch (e) {
      console.log(`  Bonding curve buy failed: ${e.message?.substring(0, 200) || e}`);
    }

    if (!buyResult) {
      try {
        buyResult = await tryPumpSwapBuy(solInLamports);
      } catch (e) {
        console.error(`  PumpSwap buy also failed: ${e.message?.substring(0, 200) || e}`);
        if (e.logs) console.error('  Logs:', e.logs.slice(0, 5).join('\n  '));
        return;
      }
    }

    // Wait briefly for RPC to propagate the buy before checking balance
    await new Promise(r => setTimeout(r, 2000));

    // Burn purchased tokens
    const { burned, sig: burnSig } = await burnTokens(buyResult.userClaimATA);

    // Record
    const solSpent = Number(solInLamports) / LAMPORTS_PER_SOL;
    await recordBurnToAPI(solSpent, burned, burned, buyResult.sig, burnSig);

    console.log(`\n  Bought and burned ${burned.toFixed(2)} $CLAIM for ${solSpent.toFixed(6)} SOL`);
    console.log(`    Buy:  https://solscan.io/tx/${buyResult.sig}`);
    if (burnSig) console.log(`    Burn: https://solscan.io/tx/${burnSig}`);

  } catch (e) {
    console.error(`[${ts()}] Crank error:`, e.message || e.toString());
    if (e.logs) console.error('  Logs:', e.logs.slice(0, 10).join('\n  '));
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────

// Poll loop: check balance every POLL_INTERVAL_MS, trigger instantly when above threshold
async function pollLoop() {
  while (true) {
    await crank();
    console.log(`[${ts()}] Next check in ${POLL_INTERVAL_MS / 1000}s`);
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
}

if (POLL_INTERVAL_MS > 0) {
  pollLoop().catch(e => {
    console.error(`[${ts()}] Fatal poll loop error:`, e);
    process.exit(1);
  });
} else {
  await crank();
  console.log(`\n[${ts()}] Single run mode, exiting`);
  process.exit(0);
}
