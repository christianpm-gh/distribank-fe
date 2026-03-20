import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/useAccounts'
import { useAuthStore } from '@/store/authStore'
import AccountCard from '@/components/cards/AccountCard'
import BottomNav from '@/components/layout/BottomNav'
import { getFirstName } from '@/lib/utils'

export default function HomePage() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const { data, isLoading } = useProfile()

  const checking = data?.accounts.find((a) => a.account_type === 'CHECKING')
  const credit = data?.accounts.find((a) => a.account_type === 'CREDIT')
  const firstName = data?.customer.name ? getFirstName(data.customer.name) : ''
  const initial = firstName.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-lg font-bold text-white">
            {initial}
          </div>
          <div>
            <p className="text-xs text-text-secondary">Bienvenida,</p>
            <p className="font-sora text-lg font-semibold text-text-primary">{firstName}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          Salir
        </button>
      </header>

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

      <BottomNav />
    </div>
  )
}
