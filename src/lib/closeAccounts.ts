import { PublicKey, Transaction } from '@solana/web3.js'
import { createCloseAccountInstruction } from '@solana/spl-token'
import { MAX_CLOSE_PER_TX } from '@/lib/constants'

export interface CloseableAccount {
  pubkey: PublicKey
  programId: PublicKey
}

/**
 * Build a transaction that closes up to MAX_CLOSE_PER_TX empty token accounts.
 * Each close instruction sends reclaimed rent SOL to the owner.
 * Handles both TOKEN_PROGRAM_ID and TOKEN_2022_PROGRAM_ID via the per-account programId.
 */
export function buildCloseTx(
  accounts: CloseableAccount[],
  owner: PublicKey,
  recentBlockhash: string,
): Transaction {
  if (accounts.length === 0) {
    throw new Error('No accounts to close')
  }
  if (accounts.length > MAX_CLOSE_PER_TX) {
    throw new Error(`Cannot close more than ${MAX_CLOSE_PER_TX} accounts per transaction`)
  }

  const tx = new Transaction()
  tx.recentBlockhash = recentBlockhash
  tx.feePayer = owner

  for (const account of accounts) {
    tx.add(
      createCloseAccountInstruction(
        account.pubkey,  // account to close
        owner,           // destination (receives rent SOL)
        owner,           // authority (owner of the token account)
        [],              // no multisig signers
        account.programId, // TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
      ),
    )
  }

  return tx
}
