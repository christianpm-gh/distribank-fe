import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useAccounts'
import AccountCard from '@/components/cards/AccountCard'

export default function HomePage() {
  const navigate = useNavigate()
  const { data, isLoading } = useProfile()

  const checking = data?.accounts.find((a) => a.account_type === 'CHECKING')
  const credit = data?.accounts.find((a) => a.account_type === 'CREDIT')

  return (
    <div className="min-h-screen bg-surface-base pb-6 pt-6">
      <main className="space-y-4 px-4">
        {isLoading && (
          <>
            <div className="h-44 animate-pulse rounded-lg bg-surface-card" />
            <div className="h-44 animate-pulse rounded-lg bg-surface-card" />
          </>
        )}

        {checking && (
          <AccountCard
            account={checking}
            size="full"
            onClick={() => navigate('/accounts/debit')}
          />
        )}

        {credit && (
          <AccountCard
            account={credit}
            size="full"
            onClick={() => navigate('/accounts/credit')}
          />
        )}
      </main>
    </div>
  )
}
