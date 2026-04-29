import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDashboardStats, useWorkoutSessions } from '../hooks/useWorkouts'

type HeatLevel = '' | 'l1' | 'l2' | 'l3' | 'l4'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatGoal(goal: string | null | undefined) {
  if (!goal) return null
  return goal.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Calculate volume intensity level for heatmap
function getHeatLevel(volume: number): HeatLevel {
  if (volume === 0) return ''
  if (volume < 500) return 'l1'
  if (volume < 1000) return 'l2'
  if (volume < 2000) return 'l3'
  return 'l4'
}

// Get week number from date

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  const displayName = useMemo(() => {
    if (profile?.first_name) return profile.first_name
    if (profile?.last_name) return profile.last_name
    if (user?.displayName) return user.displayName.split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
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

  // Build real heatmap from actual workout data
  const heatmapData = useMemo(() => {
    // Create a map of date -> total volume
    const workoutMap = new Map<string, number>()
    
    if (sessions && sessions.length > 0) {
      sessions.forEach((session: any) => {
        if (session.finished_at && session.total_volume_kg) {
          const date = session.finished_at?.toDate?.() || new Date(session.finished_at)
          if (!isNaN(date.getTime())) {
            const dateKey = date.toISOString().split('T')[0]
            const currentVolume = workoutMap.get(dateKey) || 0
            workoutMap.set(dateKey, currentVolume + (session.total_volume_kg || 0))
          }
        }
      })
    }
    
    // Build 12 weeks of data (84 days)
    const weeks = 12
    const days = 7
    const grid: HeatLevel[][] = []
    
    // Start from 12 weeks ago
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (weeks * 7))
    
    for (let d = 0; d < days; d++) {
      const row: HeatLevel[] = []
      const dayOffset = d // 0 = Sunday, 1 = Monday, etc.
      
      for (let w = 0; w < weeks; w++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + (w * 7) + dayOffset)
        
        const dateKey = currentDate.toISOString().split('T')[0]
        const volume = workoutMap.get(dateKey) || 0
        
        row.push(getHeatLevel(volume))
      }
      grid.push(row)
    }
    
    return grid
  }, [sessions])

  const lastSession = useMemo(() => {
    if (!sessions || sessions.length === 0) return null
    return sessions[0] as Record<string, unknown>
  }, [sessions])

  const prs = useMemo(() => {
    const raw = stats?.personalRecords
    return Array.isArray(raw) ? raw : []
  }, [stats?.personalRecords])

  const streak = profile?.streak ?? stats?.streak ?? 0
  const goalLabel = formatGoal(profile?.goal)

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  // Calculate volume trend (compare last 2 weeks to previous 2 weeks)
  const volumeTrend = useMemo(() => {
    if (!sessions) return 0
    
    const last4Weeks = sessions
      .filter((s: any) => s.finished_at)
      .sort((a: any, b: any) => {
        const dateA = a.finished_at?.toDate?.() || new Date(a.finished_at)
        const dateB = b.finished_at?.toDate?.() || new Date(b.finished_at)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 28) // Last 28 days
      .reduce((sum: number, s: any) => sum + (s.total_volume_kg || 0), 0)
    
    const prev4Weeks = sessions
      .filter((s: any) => s.finished_at)
      .slice(28, 56)
      .reduce((sum: number, s: any) => sum + (s.total_volume_kg || 0), 0)
    
    if (prev4Weeks === 0) return 14
    return Math.round(((last4Weeks - prev4Weeks) / prev4Weeks) * 100)
  }, [sessions])

  // Get month names for labels
  const monthLabels = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (12 * 7))
    
    const months: string[] = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + (i * 7) + 3)
      months.push(date.toLocaleDateString('en-US', { month: 'short' }))
    }
    // Remove duplicates and return unique months
    return [...new Set(months)]
  }, [])

  return (
    <div className="page" id="page-dashboard">
      <div className="page-header">
        <h1>
          {greeting()}, <em>{authLoading ? '…' : displayName}</em>
        </h1>
        <p>
          {todayStr}
          {goalLabel ? ` · ${goalLabel} focus` : ''}
        </p>
      </div>

      {/* Profile summary strip */}
      {profile && (
        <div style={{
          display: 'flex', gap: 24, padding: '12px 0 4px',
          borderBottom: '1px solid var(--border)',
          marginBottom: 4, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Experience', value: profile.experience?.replace(/\b\w/g, c => c.toUpperCase()) },
            { label: 'Goal', value: goalLabel },
            { label: 'Days / week', value: profile.days_per_week ? `${profile.days_per_week} days` : null },
            { label: 'Equipment', value: profile.equipment?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
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
          <div className="card-label">This Month's Volume</div>
          <div className="card-value orange">
            {statsLoading ? '—' : String(stats?.volumeThisMonth ?? 0).toLocaleString()}
            <span style={{ fontSize: 20, color: 'var(--muted)' }}>kg</span>
          </div>
          <div className={`card-delta ${volumeTrend >= 0 ? 'up' : 'down'}`}>
            {volumeTrend >= 0 ? '↑' : '↓'} {Math.abs(volumeTrend)}% vs last month
          </div>
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
          <div className="card-delta up">↑ {stats?.workoutsThisMonth ? 'Keep going' : 'Start today'}</div>
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
          <div className="card-value">
            {authLoading || statsLoading ? '—' : String(streak)}
            <span style={{ fontSize: 20, color: 'var(--muted)' }}>days</span>
          </div>
          <div className="card-delta up">🔥 {streak === 0 ? 'Log a workout to start' : 'Keep it going'}</div>
        </div>

        <div className="card">
          <div className="card-label">PRs This Month</div>
          <div className="card-value orange">{statsLoading ? '—' : String(prs.length)}</div>
          <div className="card-delta up">{prs.length === 0 ? 'Break a record' : '↑ New achievements'}</div>
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
                    ? `${Math.round(lastSession.total_volume_kg).toLocaleString()}kg`
                    : ''}
                </div>
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
            <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--white)' }}>
              {goalLabel
                ? <>Your <strong style={{ color: 'var(--orange)' }}>{goalLabel}</strong> plan is active. {stats?.workoutsThisMonth === 0 ? 'Complete your first workout to get personalized feedback!' : 'Ask your AI coach for today\'s recommendation.'}</>
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
            <div className="card-label mb-4">Today's Goal</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, marginBottom: 12, color: 'var(--orange)',
            }}>
              {stats?.workoutsThisMonth === 0 
                ? 'LOG YOUR FIRST WORKOUT' 
                : streak === 0 
                  ? 'START A NEW STREAK'
                  : `MAINTAIN YOUR ${streak} DAY STREAK`}
            </div>
            <div style={{ fontSize: 13, color: 'var(--mid)' }}>
              {stats?.workoutsThisMonth === 0 
                ? 'Click below to log your first workout and start tracking your progress.'
                : streak === 0 
                  ? `You've completed ${stats?.workoutsThisMonth} workouts this month. Log one today to start your streak!`
                  : `You're crushing it with a ${streak} day streak! Don't break the chain today.`}
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-orange btn-sm"
                onClick={() => navigate('/app/workouts/new')}
              >
                {stats?.workoutsThisMonth === 0 ? 'Start First Workout' : 'Log Workout'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 section-gap">
        <div className="card">
          <div className="card-label mb-4">Workout Calendar — Last 12 Weeks</div>
          {sessionsLoading ? (
            <div style={{ fontSize: 13, color: 'var(--mid)', textAlign: 'center', padding: 20 }}>
              Loading workout history...
            </div>
          ) : (
            <>
              {/* Month labels */}
              <div style={{ display: 'flex', marginBottom: 8, marginLeft: 28 }}>
                {monthLabels.map((month, idx) => (
                  <div key={idx} style={{ flex: 1, fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
                    {month}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div>
                {heatmapData.map((row, rowIdx) => {
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                  return (
                    <div className="heatmap-row" key={rowIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 28, fontSize: 10, color: 'var(--muted)' }}>{dayNames[rowIdx]}</div>
                      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                        {row.map((lvl, colIdx) => (
                          <div 
                            key={colIdx} 
                            className={`heatmap-cell ${lvl}`} 
                            style={{ flex: 1 }}
                            title={`Week ${colIdx + 1} ${dayNames[rowIdx]}`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Less</span>
                <div className="heatmap-cell" />
                <div className="heatmap-cell l1" />
                <div className="heatmap-cell l2" />
                <div className="heatmap-cell l3" />
                <div className="heatmap-cell l4" />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>More</span>
              </div>
              
              {sessions && sessions.filter((s: any) => s.finished_at).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--mid)', textAlign: 'center', marginTop: 16 }}>
                  No workouts logged yet. Complete a workout to see your calendar light up!
                </div>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-label mb-4">Personal Records</div>
          {statsLoading ? (
            <div style={{ fontSize: 13, color: 'var(--mid)' }}>Loading PRs…</div>
          ) : prs.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--mid)', textAlign: 'center', padding: 20 }}>
              No PRs yet.<br />
              <span style={{ fontSize: 12 }}>Push your limits to set new records!</span>
            </div>
          ) : (
            prs.slice(0, 6).map(pr => {
              const r = pr as Record<string, unknown>
              const nameVal = typeof r.exercise_name === 'string' ? r.exercise_name : typeof r.exercise_id === 'string' ? r.exercise_id : 'PR'
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