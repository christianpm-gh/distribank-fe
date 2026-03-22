import { useNavigate } from 'react-router-dom'
import { useCards } from '@/hooks/useCards'
import Header from '@/components/layout/Header'
import PhysicalCard from '@/components/cards/PhysicalCard'

export default function CardsPage() {
  const navigate = useNavigate()
  const { data: cards, isLoading } = useCards()

  const debitCards = cards?.filter((c) => c.card_type === 'DEBIT') ?? []
  const creditCards = cards?.filter((c) => c.card_type === 'CREDIT') ?? []

  return (
    <div className="min-h-screen bg-surface-base pb-6">
      <Header title="Mis Tarjetas" />

      <main className="space-y-5 px-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-surface-card" />
            ))}
          </div>
        )}

        {debitCards.length > 0 && (
          <div>
            <h2 className="mb-3 font-sora text-sm font-semibold text-text-secondary">
              Tarjetas de Débito
            </h2>
            <div className="space-y-3">
              {debitCards.map((card) => (
                <PhysicalCard
                  key={card.id}
                  card={card}
                  variant="list"
                  onClick={() => navigate(`/cards/${card.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {creditCards.length > 0 && (
          <div>
            <h2 className="mb-3 font-sora text-sm font-semibold text-text-secondary">
              Tarjetas de Crédito
            </h2>
            <div className="space-y-3">
              {creditCards.map((card) => (
                <PhysicalCard
                  key={card.id}
                  card={card}
                  variant="list"
                  onClick={() => navigate(`/cards/${card.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
