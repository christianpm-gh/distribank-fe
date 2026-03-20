import type { Transaction } from '@/types/api.types'
import DirectionIndicator from '@/components/ui/DirectionIndicator'
import SignedAmount from '@/components/ui/SignedAmount'
import StatusBadge from '@/components/ui/StatusBadge'
import TransactionTypeChip from '@/components/ui/TransactionTypeChip'
import { maskAccountNumber, formatRelativeDate } from '@/lib/utils'

type Props = {
  transaction: Transaction
  size?: 'full' | 'compact'
  onClick?: () => void
}

export default function TransactionRow({ transaction, size = 'full', onClick }: Props) {
  const statusKey = transaction.status.toLowerCase() as 'completed' | 'pending' | 'failed' | 'rolled_back'

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 border-b border-surface-elevated px-4 py-3 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-surface-elevated' : ''
      }`}
    >
      <DirectionIndicator role={transaction.rol_cuenta} />

      <div className="min-w-0 flex-1">
        {size === 'full' && <TransactionTypeChip type={transaction.transaction_type} />}
        <p className="mt-0.5 truncate text-sm text-text-primary">
          {transaction.description || maskAccountNumber(transaction.counterpart_account)}
        </p>
        <p className="text-xs text-text-muted">
          {formatRelativeDate(transaction.initiated_at)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <SignedAmount amount={transaction.amount} role={transaction.rol_cuenta} size="sm" />
        {size === 'full' && <StatusBadge status={statusKey} />}
      </div>
    </div>
  )
}
