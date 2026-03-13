import { Transaction, PublicKey } from '@solana/web3.js'
import { createBurnInstruction, createCloseAccountInstruction } from '@solana/spl-token'

export interface BurnableToken {
  pubkey: PublicKey          // token account address
  mint: PublicKey
  balance: bigint            // raw amount
  decimals: number
  programId: PublicKey
}

export const MAX_BURNS_PER_TX = 4  // burn + close = 2 instructions per token

/**
 * Build a transaction that burns all tokens in the given accounts and closes them.
 * For each token: burn the full balance, then close the account to reclaim rent.
 */
export function buildBurnAndCloseTx(
  tokens: BurnableToken[],
  owner: PublicKey,
  recentBlockhash: string,
): Transaction {
  const tx = new Transaction()
  tx.recentBlockhash = recentBlockhash
  tx.feePayer = owner

  for (const token of tokens.slice(0, MAX_BURNS_PER_TX)) {
    // Burn all tokens
    if (token.balance > BigInt(0)) {
      tx.add(createBurnInstruction(
        token.pubkey,
        token.mint,
        owner,
        token.balance,
        [],
        token.programId,
      ))
    }
    // Close the now-empty account to reclaim rent
    tx.add(createCloseAccountInstruction(
      token.pubkey,
      owner,
      owner,
      [],
      token.programId,
    ))
  }

  return tx
}
