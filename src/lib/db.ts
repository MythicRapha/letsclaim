import Database from 'better-sqlite3'
import path from 'path'

// Store DB in a data directory (persists across rebuilds)
const DB_PATH = path.join(process.cwd(), 'data', 'claims.db')

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs')
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        wallet TEXT NOT NULL,
        accounts_closed INTEGER NOT NULL,
        sol_reclaimed REAL NOT NULL,
        network TEXT NOT NULL DEFAULT 'solana',
        tx_signatures TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_claims_created ON claims(created_at)
    `)

    // Burns table — tracks $CLAIM buy & burn from fees
    db.exec(`
      CREATE TABLE IF NOT EXISTS burns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sol_spent REAL NOT NULL,
        claim_bought REAL NOT NULL,
        claim_burned REAL NOT NULL,
        tx_buy TEXT,
        tx_burn TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `)

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_burns_created ON burns(created_at)
    `)
  }
  return db
}

export function recordClaim(data: {
  wallet: string
  accountsClosed: number
  solReclaimed: number
  network: string
  txSignatures: string[]
}) {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO claims (wallet, accounts_closed, sol_reclaimed, network, tx_signatures) VALUES (?, ?, ?, ?, ?)'
  )
  stmt.run(data.wallet, data.accountsClosed, data.solReclaimed, data.network, JSON.stringify(data.txSignatures))
}

export function recordBurn(data: {
  solSpent: number
  claimBought: number
  claimBurned: number
  txBuy: string
  txBurn: string
}) {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO burns (sol_spent, claim_bought, claim_burned, tx_buy, tx_burn) VALUES (?, ?, ?, ?, ?)'
  )
  stmt.run(data.solSpent, data.claimBought, data.claimBurned, data.txBuy, data.txBurn)
}

export function getBurnStats() {
  const db = getDb()

  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(claim_burned), 0) as total_claim_burned,
      COALESCE(SUM(sol_spent), 0) as total_sol_spent,
      COUNT(*) as total_burn_txns
    FROM burns
  `).get() as any

  const intervals = db.prepare(`
    SELECT
      strftime('%Y-%m-%dT%H:', created_at) ||
        printf('%02d', (CAST(strftime('%M', created_at) AS INTEGER) / 15) * 15) as bucket,
      SUM(claim_burned) as claim_burned,
      SUM(sol_spent) as sol_spent,
      COUNT(*) as txns
    FROM burns
    WHERE created_at >= datetime('now', '-6 hours')
    GROUP BY bucket
    ORDER BY bucket ASC
  `).all() as any[]

  const recent = db.prepare(`
    SELECT id, sol_spent, claim_burned, tx_buy, tx_burn, created_at
    FROM burns ORDER BY created_at DESC LIMIT 20
  `).all() as any[]

  return { totals, intervals, recent }
}

export function getStats() {
  const db = getDb()
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(sol_reclaimed), 0) as total_sol,
      COALESCE(SUM(accounts_closed), 0) as total_accounts,
      COUNT(*) as total_claims,
      COUNT(DISTINCT wallet) as unique_wallets
    FROM claims WHERE network = 'solana'
  `).get() as any

  const intervals = db.prepare(`
    SELECT
      strftime('%Y-%m-%dT%H:', created_at) ||
        printf('%02d', (CAST(strftime('%M', created_at) AS INTEGER) / 15) * 15) as bucket,
      SUM(sol_reclaimed) as sol,
      SUM(accounts_closed) as accounts,
      COUNT(*) as claims
    FROM claims
    WHERE network = 'solana' AND created_at >= datetime('now', '-6 hours')
    GROUP BY bucket ORDER BY bucket ASC
  `).all() as any[]

  const recent = db.prepare(`
    SELECT id, wallet, accounts_closed, sol_reclaimed, tx_signatures, created_at
    FROM claims WHERE network = 'solana' ORDER BY created_at DESC LIMIT 20
  `).all() as any[]

  return { totals, intervals, recent }
}

/** Combined feed of all tx types for the live marquee */
export function getLiveFeed(limit = 30) {
  const db = getDb()

  return db.prepare(`
    SELECT * FROM (
      SELECT
        'claim' as type, id, sol_reclaimed as amount, NULL as claim_amount,
        wallet, tx_signatures as tx, created_at
      FROM claims WHERE network = 'solana'
      UNION ALL
      SELECT
        'buyback' as type, id, sol_spent as amount, claim_bought as claim_amount,
        NULL as wallet, tx_buy as tx, created_at
      FROM burns WHERE tx_buy IS NOT NULL AND tx_buy != ''
      UNION ALL
      SELECT
        'burn' as type, id, NULL as amount, claim_burned as claim_amount,
        NULL as wallet, tx_burn as tx, created_at
      FROM burns WHERE tx_burn IS NOT NULL AND tx_burn != ''
    )
    ORDER BY created_at DESC LIMIT ?
  `).all(limit) as any[]
}
