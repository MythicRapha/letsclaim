'use client'

interface TokenAccount {
  address: string
  mint: string
  program: 'spl-token' | 'token-2022'
  rent: number
  selected: boolean
  status: 'pending' | 'closing' | 'closed' | 'failed'
}

interface AccountListProps {
  accounts: TokenAccount[]
  onToggle: (address: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
}

function StatusIcon({ status }: { status: TokenAccount['status'] }) {
  switch (status) {
    case 'pending':
      return <div className="w-2 h-2 bg-claim-text-dim" />
    case 'closing':
      return (
        <div className="w-3.5 h-3.5 border-2 border-[#9945FF] border-t-transparent rounded-full animate-spin" />
      )
    case 'closed':
      return (
        <svg className="w-3.5 h-3.5 text-[#14F195]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'failed':
      return (
        <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
  }
}

function Checkbox({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
        checked
          ? 'bg-[#9945FF] border-[#9945FF]'
          : 'border-white/[0.15] bg-transparent hover:border-white/[0.3]'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

export default function AccountList({ accounts, onToggle, onSelectAll, onDeselectAll }: AccountListProps) {
  const allSelected = accounts.every(a => a.selected || a.status === 'closed')

  return (
    <div className="border border-white/[0.06]">
      {/* Header Row */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <Checkbox
          checked={allSelected}
          onChange={allSelected ? onDeselectAll : onSelectAll}
        />
        <span className="flex-1 font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
          Mint
        </span>
        <span className="w-12 text-center font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
          Program
        </span>
        <span className="w-28 text-right font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
          Rent
        </span>
        <span className="w-8 text-center font-mono text-[0.55rem] tracking-[0.12em] uppercase text-claim-text-dim">
          Status
        </span>
      </div>

      {/* Scrollable Account Rows */}
      <div className="max-h-80 overflow-y-auto">
        {accounts.map((account) => {
          const shortMint = `${account.mint.slice(0, 6)}...${account.mint.slice(-4)}`
          const isClosed = account.status === 'closed'
          const programLabel = account.program === 'spl-token' ? 'SPL' : 'T22'
          const programColor = account.program === 'spl-token' ? 'bg-[#9945FF]/20 text-[#9945FF]' : 'bg-[#14F195]/20 text-[#14F195]'

          return (
            <div
              key={account.address}
              className={`flex items-center gap-3 border-b border-white/[0.03] py-2 px-3 hover:bg-white/[0.02] transition-colors ${
                isClosed ? 'opacity-30' : ''
              }`}
            >
              <Checkbox
                checked={account.selected}
                onChange={() => onToggle(account.address)}
                disabled={isClosed}
              />

              {/* Mint */}
              <span className="flex-1 font-mono text-xs text-claim-text truncate">
                {shortMint}
              </span>

              {/* Program Badge */}
              <span className={`w-12 text-center font-mono text-[0.5rem] tracking-[0.1em] uppercase px-1.5 py-0.5 ${programColor}`}>
                {programLabel}
              </span>

              {/* Rent */}
              <span className="w-28 text-right font-mono text-xs text-[#14F195]">
                {account.rent.toFixed(8)} SOL
              </span>

              {/* Status */}
              <span className="w-8 flex items-center justify-center">
                <StatusIcon status={account.status} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
