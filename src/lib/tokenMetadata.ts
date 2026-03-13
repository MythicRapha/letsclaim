export interface TokenMetadata {
  name: string
  symbol: string
  image: string | null
  decimals: number
}

// Known tokens on Mythic L2
const L2_KNOWN_TOKENS: Record<string, TokenMetadata> = {
  '7sfazeMxmuoDkuU5fHkDGin8uYuaTkZrRSwJM1CHXvDq': { name: 'MYTH', symbol: 'MYTH', image: '/mythic-mark.svg', decimals: 6 },
  'FEJa8wGyhXu9Hic1jNTg76Atb57C7jFkmDyDTQZkVwy3': { name: 'Wrapped SOL', symbol: 'wSOL', image: '/solana-logo.svg', decimals: 9 },
  '6QTVHn4TUPQSpCH1uGmAK1Vd6JhuSEeKMKSi1F1SZMN': { name: 'USD Coin', symbol: 'USDC', image: null, decimals: 6 },
  '8Go32n5Pv4HYdML9DNr8ePh4UHunqS9ZgjKMurz1vPSw': { name: 'Wrapped BTC', symbol: 'wBTC', image: null, decimals: 8 },
  '4zmzPzkexJRCVKSrYCHpmP8TVX6kMobjiFu8dVKtuXGT': { name: 'Wrapped ETH', symbol: 'wETH', image: null, decimals: 8 },
}

/**
 * Fetch metadata for a list of mints.
 * For Solana: uses Helius DAS API getAssetBatch.
 * For Mythic: uses known token list, falls back to "Unknown Token".
 */
export async function fetchTokenMetadata(
  mints: string[],
  network: 'solana' | 'mythic',
): Promise<Record<string, TokenMetadata>> {
  const result: Record<string, TokenMetadata> = {}

  if (network === 'mythic') {
    for (const mint of mints) {
      result[mint] = L2_KNOWN_TOKENS[mint] || {
        name: 'Unknown Token',
        symbol: mint.slice(0, 4) + '...',
        image: null,
        decimals: 0,
      }
    }
    return result
  }

  // Solana mainnet — try Helius DAS API via proxy (avoids CORS)
  const rpcUrl = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com')
    : '/api/rpc'

  try {
    const batchSize = 20
    for (let i = 0; i < mints.length; i += batchSize) {
      const batch = mints.slice(i, i + batchSize)
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'getAssetBatch',
          method: 'getAssetBatch',
          params: { ids: batch },
        }),
      })
      const data = await response.json()
      if (data.result) {
        for (const asset of data.result) {
          if (!asset || !asset.id) continue
          const meta = asset.content?.metadata
          const imgUri = asset.content?.links?.image || asset.content?.files?.[0]?.uri || null
          result[asset.id] = {
            name: meta?.name || 'Unknown Token',
            symbol: meta?.symbol || asset.id.slice(0, 4) + '...',
            image: imgUri,
            decimals: asset.token_info?.decimals ?? 0,
          }
        }
      }
    }
  } catch {
    // Silently fail — will have missing metadata
  }

  // Fill in any missing mints
  for (const mint of mints) {
    if (!result[mint]) {
      result[mint] = {
        name: 'Unknown Token',
        symbol: mint.slice(0, 4) + '...',
        image: null,
        decimals: 0,
      }
    }
  }

  return result
}
