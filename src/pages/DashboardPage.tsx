import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDashboardStats, useWorkoutSessions } from '../hooks/useWorkouts'

type HeatLevel = '' | 'l1' | 'l2' | 'l3' | 'l4'

function randomHeat(): HeatLevel {
  const r = Math.random()
  if (r < 0.35) return ''
  if (r < 0.55) return 'l1'
  if (r < 0.72) return 'l2'
  if (r < 0.88) return 'l3'
  return 'l4'
}

// Returns a friendly greeting based on hour of day
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Formats a goal value like "build_muscle" → "Build Muscle"
function formatGoal(goal: string | null | undefined) {
  if (!goal) return null
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function DashboardPage() {
  const navigate    = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  // ✅ Use real profile data for display name
  const displayName = useMemo(() => {
    if (profile?.first_name) return profile.first_name
    if (profile?.last_name)  return profile.last_name
    if (user?.displayName)   return user.displayName.split(' ')[0]
    if (user?.email)         return user.email.split('@')[0]
    return 'Athlete'
  }, [profile, user])

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsIsError,
    error: statsError,
  } = useDashboardStats()

  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsIsError,
    error: sessionsError,
  } = useWorkoutSessions()

  const [heat, setHeat] = useState<HeatLevel[][]>([])

  useEffect(() => {
    const weeks = 12
    const days  = 7
    const grid: HeatLevel[][] = []
    for (let d = 0; d < days; d++) {
      const row: HeatLevel[] = []
      for (let w = 0; w < weeks; w++) row.push(randomHeat())
      grid.push(row)
    }
    setHeat(grid)
  }, [])

  const lastSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null
    return sessions[0] as Record<string, unknown>
  }, [sessions])

  const prs = useMemo(() => {
    const raw = stats?.personalRecords
    return Array.isArray(raw) ? raw : []
  }, [stats?.personalRecords])

  // ✅ Pull streak directly from profile as the ground truth (stats also has it but profile is live)
  const streak = profile?.streak ?? stats?.streak ?? 0

  // ✅ Build a personalised "today's plan" label from profile goal
  const goalLabel = formatGoal(profile?.goal)

  // Today's date string
  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div className="page" id="page-dashboard">
      <div className="page-header">
        <h1>
          {greeting()}, <em>{authLoading ? '…' : displayName}</em>
        </h1>
        {/* ✅ Show real goal and date instead of hardcoded text */}
        <p>
          {todayStr}
          {goalLabel ? ` · ${goalLabel} focus` : ''}
        </p>
      </div>

      {/* ── Profile summary strip (only when profile is loaded) ── */}
      {profile && (
        <div style={{
          display: 'flex', gap: 24, padding: '12px 0 4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Experience',  value: profile.experience?.replace(/\b\w/g, c => c.toUpperCase()) },
            { label: 'Goal',        value: goalLabel },
            { label: 'Days / week', value: profile.days_per_week ? `${profile.days_per_week} days` : null },
            { label: 'Equipment',   value: profile.equipment?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
            { label: 'Body weight', value: profile.weight_kg ? `${profile.weight_kg} kg` : null },
          ]
            .filter(s => s.value)
            .map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', textTransform: 'capitalize' }}>
                  {s.value}
                </span>
              </div>
            ))}
        </div>
      )}

      {statsIsError || sessionsIsError ? (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-label">Dashboard data</div>
          <div style={{ marginTop: 8, color: 'var(--red)', fontSize: 13 }}>
            {(statsError instanceof Error ? statsError.message : null) ||
              (sessionsError instanceof Error ? sessionsError.message : null) ||
              'Could not load dashboard data.'}
          </div>
        </div>
      ) : null}

      <div className="stat-cards">
        <div className="card accent">
          <div className="card-label">This Week's Volume</div>
          <div className="card-value orange">
            {statsLoading ? '—' : String(stats?.volumeThisMonth ?? 0)}
            <span style={{ fontSize: 20, color: 'var(--muted)' }}>kg</span>
          </div>
          <div className="card-delta up">↑ 14% vs last week</div>
          <div className="mini-chart">
            <div className="mini-bar" style={{ height: '40%' }} />
            <div className="mini-bar mid" style={{ height: '60%' }} />
            <div className="mini-bar" style={{ height: '50%' }} />
            <div className="mini-bar mid" style={{ height: '70%' }} />
            <div className="mini-bar" style={{ height: '55%' }} />
            <div className="mini-bar hi" style={{ height: '90%' }} />
            <div className="mini-bar hi" style={{ height: '85%' }} />
          </div>
        </div>

        <div className="card">
          <div className="card-label">Workouts This Month</div>
          <div className="card-value">{statsLoading ? '—' : String(stats?.workoutsThisMonth ?? 0)}</div>
          <div className="card-delta up">↑ On track</div>
          <div className="mini-chart">
            <div className="mini-bar hi" style={{ height: '100%' }} />
            <div className="mini-bar hi" style={{ height: '100%' }} />
            <div className="mini-bar" style={{ height: '0%' }} />
            <div className="mini-bar hi" style={{ height: '100%' }} />
            <div className="mini-bar hi" style={{ height: '100%' }} />
            <div className="mini-bar" style={{ height: '0%' }} />
            <div className="mini-bar hi" style={{ height: '100%' }} />
          </div>
        </div>

        <div className="card">
          <div className="card-label">Current Streak</div>
          {/* ✅ Uses real streak from profile */}
          <div className="card-value">
            {authLoading || statsLoading ? '—' : String(streak)}
            <span style={{ fontSize: 20, color: 'var(--muted)' }}>days</span>
          </div>
          <div className="card-delta up">🔥 Keep it going</div>
        </div>

        <div className="card">
          <div className="card-label">PRs This Month</div>
          <div className="card-value orange">{statsLoading ? '—' : String(prs.length)}</div>
          <div className="card-delta up">↑ vs last month</div>
        </div>
      </div>

      <div className="grid-2-1 section-gap">
        <div className="card">
          <div className="card-label mb-4">
            Last Workout
            {sessionsLoading ? ' · Loading…' : lastSession ? '' : ' · None yet'}
          </div>

          {lastSession ? (
            <div className="activity-item" key={String(lastSession.id ?? 'last')}>
              <div className="activity-icon">🏋</div>
              <div>
                <div className="activity-name">
                  {typeof lastSession.name === 'string' && lastSession.name ? lastSession.name : 'Workout'}
                </div>
                <div className="activity-meta">
                  {Array.isArray(lastSession.workout_sets)
                    ? `${lastSession.workout_sets.length} sets`
                    : 'Session'}
                </div>
              </div>
              <div className="activity-value">
                <div className="activity-weight">
                  {typeof lastSession.total_volume_kg === 'number'
                    ? `${Math.round(lastSession.total_volume_kg)}kg`
                    : ''}
                </div>
                <div className="activity-sets" />
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--mid)' }}>
              Log your first workout to see stats here.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="card accent"
            style={{ background: 'var(--orange-dim)', borderColor: 'rgba(255,92,26,0.25)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--orange)',
              }}>
                AI Insight
              </span>
            </div>
            {/* ✅ Personalised message using profile goal */}
            <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--white)' }}>
              {goalLabel
                ? <>Your <strong style={{ color: 'var(--orange)' }}>{goalLabel}</strong> plan is active. Ask your AI coach for today's recommendation.</>
                : <>Complete your profile to get <strong style={{ color: 'var(--orange)' }}>personalised AI coaching</strong> tailored to your goals.</>}
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-orange btn-sm"
                onClick={() => navigate('/app/coach')}
              >
                Ask AI Coach
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-label mb-4">Today's Scheduled Workout</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, marginBottom: 12, color: 'var(--orange)',
            }}>
              {/* ✅ Label adapts to profile goal */}
              {profile?.goal === 'get_stronger' ? 'STRENGTH A'
                : profile?.goal === 'lose_fat'  ? 'CARDIO + LIFT'
                : profile?.goal === 'build_muscle' ? 'HYPERTROPHY A'
                : 'PUSH A'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'Bench Press · 4×5',
                'Incline DB Press · 3×10',
                'Overhead Press · 3×8',
              ].map(t => (
                <div key={t} style={{
                  fontSize: 13, color: 'var(--mid)',
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <span style={{ color: 'var(--orange)', fontSize: 10 }}>→</span>
                  {t}
                </div>
              ))}
              <div style={{
                fontSize: 13, color: 'var(--muted)',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span style={{ color: 'var(--muted)', fontSize: 10 }}>+</span>2 more exercises
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-orange btn-sm"
                onClick={() => navigate('/app/workouts/new')}
              >
                Start Workout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-label mb-4">Workout Calendar — Last 12 Weeks</div>
          <div>
            {heat.map((row, idx) => (
              <div className="heatmap-row" key={idx}>
                {row.map((lvl, i) => (
                  <div key={i} className={`heatmap-cell ${lvl}`} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Less</span>
            <div className="heatmap-cell" />
            <div className="heatmap-cell l1" />
            <div className="heatmap-cell l2" />
            <div className="heatmap-cell l3" />
            <div className="heatmap-cell l4" />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>More</span>
          </div>
        </div>

        <div className="card">
          <div className="card-label mb-4">Personal Records</div>
          {statsLoading ? (
            <div style={{ fontSize: 13, color: 'var(--mid)' }}>Loading PRs…</div>
          ) : prs.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--mid)' }}>No PRs yet.</div>
          ) : (
            prs.slice(0, 6).map(pr => {
              const r        = pr as Record<string, unknown>
              const nameVal  = typeof r.exercise_name === 'string' ? r.exercise_name : typeof r.exercise_id === 'string' ? r.exercise_id : 'PR'
              const weightVal = typeof r.weight_kg === 'number' ? `${r.weight_kg}kg` : '—'
              return (
                <div className="pr-item" key={String(r.id ?? nameVal)}>
                  <div>
                    <div className="pr-name">{nameVal}</div>
                    <div className="pr-muscle">{typeof r.muscle_group === 'string' ? r.muscle_group : ''}</div>
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
      </div>
    </div>
  )
}