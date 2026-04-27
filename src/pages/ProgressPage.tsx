import { useMemo, useState } from 'react'
import { useDashboardStats } from '../hooks/useWorkouts'
import { useProgressData } from '../hooks/useProgress'

type MetricKey = 'volume' | 'prs' | 'bodyweight'

export function ProgressPage() {
  const [metric, setMetric] = useState<MetricKey>('volume')

  const { data: stats, isLoading: statsLoading, isError: statsIsError, error: statsError } = useDashboardStats()
  const { data: progress, isLoading: progressLoading, isError: progressIsError, error: progressError } = useProgressData(12)

  const trend = useMemo(() => {
    if (!progress || metric !== 'volume') {
      const base = metric === 'volume' ? 65 : metric === 'prs' ? 40 : 55
      return Array.from({ length: 12 }, (_, i) => {
        const wiggle = Math.sin(i / 1.8) * 10 + (i % 3 === 0 ? 6 : -2)
        return Math.max(8, Math.min(100, base + i * 2 + wiggle))
      })
    }

    const keys = Object.keys(progress.weeklyVolume ?? {})
    const vals = keys.map((k) => Number((progress.weeklyVolume as Record<string, unknown>)[k] ?? 0))
    const max = Math.max(1, ...vals)
    return vals.slice(-12).map((v) => Math.max(8, Math.min(100, (v / max) * 100)))
  }, [metric, progress])

  const prs = useMemo(() => {
    const raw = stats?.personalRecords
    return Array.isArray(raw) ? raw : []
  }, [stats?.personalRecords])

  return (
    <div className="page" id="page-progress">
      <div className="page-header">
        <h1>
          Training <em>Progress</em>
        </h1>
        <p>High-signal trends: weekly volume, PR momentum, and consistency.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-label mb-4">Metric</div>
          <div className="pill-row">
            <div
              className={`pill${metric === 'volume' ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setMetric('volume')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setMetric('volume')
              }}
            >
              Weekly Volume
            </div>
            <div
              className={`pill${metric === 'prs' ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setMetric('prs')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setMetric('prs')
              }}
            >
              PR Momentum
            </div>
            <div
              className={`pill${metric === 'bodyweight' ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => setMetric('bodyweight')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setMetric('bodyweight')
              }}
            >
              Bodyweight
            </div>
          </div>

          <div className="section-gap">
            <div className="card-label mb-4">Last 12 Weeks</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                height: 160,
                padding: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
              }}
            >
              {trend.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 10,
                    height: `${h}%`,
                    borderRadius: 10,
                    background:
                      i === trend.length - 1
                        ? 'var(--orange)'
                        : 'rgba(255,255,255,0.08)',
                    border:
                      i === trend.length - 1
                        ? '1px solid rgba(255, 92, 26, 0.35)'
                        : '1px solid var(--border2)',
                  }}
                />
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--mid)' }}>
              Tip: focus on the slope, not single-week noise.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card accent">
            <div className="card-label">AI Summary</div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: 'var(--white)' }}>
              You’ve been consistent for <strong style={{ color: 'var(--orange)' }}>3 weeks</strong>.
              Next step: add <strong style={{ color: 'var(--orange)' }}>1 hard set</strong> to your
              main lifts and keep rest times tight.
            </div>
          </div>

          <div className="card">
            <div className="card-label mb-4">Recent Personal Records</div>
            {statsIsError ? (
              <div style={{ fontSize: 13, color: 'var(--red)' }}>
                {statsError instanceof Error ? statsError.message : 'Could not load PRs.'}
              </div>
            ) : statsLoading ? (
              <div style={{ fontSize: 13, color: 'var(--mid)' }}>Loading PRs…</div>
            ) : prs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mid)' }}>No PRs yet.</div>
            ) : (
              prs.slice(0, 8).map((pr) => {
                const r = pr as Record<string, unknown>
                const nameVal = typeof r.exercise_name === 'string' ? r.exercise_name : typeof r.exercise_id === 'string' ? r.exercise_id : 'PR'
                const muscleVal = typeof r.muscle_group === 'string' ? r.muscle_group : ''
                const weightVal = typeof r.weight_kg === 'number' ? `${r.weight_kg}kg` : '—'
                return (
                  <div className="pr-item" key={String(r.id ?? nameVal)}>
                    <div>
                      <div className="pr-name">{nameVal}</div>
                      <div className="pr-muscle">{muscleVal}</div>
                    </div>
                    <div>
                      <div className="pr-weight">{weightVal}</div>
                      <div className="pr-date" />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {progressIsError ? (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.35)' }}>
              <div className="card-label">Progress data</div>
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--red)' }}>
                {progressError instanceof Error ? progressError.message : 'Could not load progress.'}
              </div>
            </div>
          ) : progressLoading ? null : null}
        </div>
      </div>
    </div>
  )
}
