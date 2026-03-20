import { useState, useEffect, useRef, useCallback } from 'react'
import type { TransactionLogEvent, LogEventType } from '@/types/api.types'
import { formatDate } from '@/lib/utils'

const eventConfig: Record<LogEventType, { icon: string; label: string; color: string }> = {
  INITIATED: { icon: '🕐', label: 'Operación iniciada', color: 'var(--color-brand-primary)' },
  DEBIT_APPLIED: { icon: '↑', label: 'Débito aplicado', color: 'var(--color-status-rollback)' },
  CREDIT_APPLIED: { icon: '↓', label: 'Crédito aplicado', color: 'var(--color-status-success)' },
  COMPLETED: { icon: '✓✓', label: 'Completada', color: 'var(--color-status-success)' },
  COMPENSATED: { icon: '↺', label: 'Revertida — monto restaurado', color: 'var(--color-status-rollback)' },
  FAILED: { icon: '✕', label: 'Error en procesamiento', color: 'var(--color-status-error)' },
}

type PlayerState = 'idle' | 'playing' | 'paused' | 'completed'

export default function TransactionTimeline({ events }: { events: TransactionLogEvent[] }) {
  const [playerState, setPlayerState] = useState<PlayerState>('idle')
  const [visibleCount, setVisibleCount] = useState(events.length)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return clearTimer
  }, [clearTimer])

  const play = () => {
    if (playerState === 'completed' || playerState === 'idle') {
      setVisibleCount(0)
    }
    setPlayerState('playing')

    let count = playerState === 'paused' ? visibleCount : 0
    clearTimer()

    intervalRef.current = setInterval(() => {
      count++
      setVisibleCount(count)
      if (count >= events.length) {
        clearTimer()
        setPlayerState('completed')
      }
    }, 600)
  }

  const pause = () => {
    clearTimer()
    setPlayerState('paused')
  }

  const buttonLabel = {
    idle: '▶ Reproducir',
    playing: '⏸ Pausar',
    paused: '▶ Continuar',
    completed: '↺ Reproducir de nuevo',
  }[playerState]

  const handleClick = () => {
    if (playerState === 'playing') pause()
    else play()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="font-sora text-sm font-semibold text-text-primary">Línea de tiempo</h3>
        <button
          onClick={handleClick}
          className="rounded-sm border border-surface-elevated px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-elevated"
        >
          {buttonLabel}
        </button>
      </div>

      <div className="mt-3 space-y-0">
        {events.map((event, i) => {
          const cfg = eventConfig[event.event_type]
          const isVisible = i < visibleCount
          const isTerminalError = event.event_type === 'FAILED' || event.event_type === 'COMPENSATED'
          const isLast = i === events.length - 1

          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-surface-elevated text-sm transition-opacity duration-300 ${
                    isVisible ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{
                    borderColor: isVisible ? cfg.color : 'var(--color-surface-elevated)',
                    boxShadow: isVisible && isTerminalError ? `0 0 8px ${cfg.color}` : undefined,
                  }}
                >
                  {cfg.icon}
                </div>
                {!isLast && (
                  <div
                    className="w-0.5 transition-all duration-500"
                    style={{
                      height: '24px',
                      backgroundColor: isVisible
                        ? cfg.color
                        : 'var(--color-surface-elevated)',
                    }}
                  />
                )}
              </div>

              <div className={`pb-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-30'}`}>
                <p className="text-sm text-text-primary" style={{ color: isVisible ? cfg.color : undefined }}>
                  {cfg.label}
                </p>
                <p className="text-xs text-text-muted">{formatDate(event.occurred_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
