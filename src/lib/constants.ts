import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { Connection, PublicKey } from '@solana/web3.js'

export const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'
export const MYTHIC_L2_RPC = process.env.NEXT_PUBLIC_MYTHIC_RPC || 'https://rpc.mythic.fm'

/**
 * Create a Solana Connection that routes through /api/rpc proxy in the browser
 * to avoid CORS issues with Helius. Uses fetchMiddleware to intercept requests.
 * The Connection is always created with the full Helius URL (valid for SSR),
 * but browser-side fetches are redirected to /api/rpc.
 */
export function createSolanaConnection(): Connection {
  return new Connection(SOLANA_RPC, {
    commitment: 'confirmed',
    fetchMiddleware: (info, init, fetch) => {
      if (typeof window !== 'undefined') {
        // Browser: proxy through /api/rpc to avoid CORS
        fetch('/api/rpc', init)
      } else {
        fetch(info, init)
      }
    },
  })
}

export function createMythicConnection(): Connection {
  return new Connection(MYTHIC_L2_RPC, 'confirmed')
}

export const RENT_PER_TOKEN_ACCOUNT = 0.00203928
export const MAX_CLOSE_PER_TX = 8

export const MYTH_MINT = '7sfazeMxmuoDkuU5fHkDGin8uYuaTkZrRSwJM1CHXvDq'
export const MYTH_DECIMALS = 6
export const LAMPORTS_PER_MYTH = 1_000_000

// Fee collection — 20% of rent reclaimed on Solana goes to buy & burn $CLAIM
export const FEE_WALLET = new PublicKey('4pPDuqj4bJjjti3398MhwUvQgPR4Azo6sEeZAhHhsk6s')
export const FEE_BPS = 2000 // 20% = 2000 basis points
export const CLAIM_MINT = '5KzafU1gnwop71JK8rhkUkoHoZx4c8gUzxKfmsQGpump'
export const CLAIM_TOTAL_SUPPLY = 1_000_000_000 // 1B total supply (pump.fun standard)
export const RENT_LAMPORTS = Math.floor(RENT_PER_TOKEN_ACCOUNT * 1e9) // 2039280

export { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID }
