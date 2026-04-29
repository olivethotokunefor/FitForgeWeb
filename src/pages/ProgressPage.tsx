import { useMemo, useState } from 'react'
import { useDashboardStats } from '../hooks/useWorkouts'
import { useProgressData } from '../hooks/useProgress'

type MetricKey = 'volume' | 'prs' | 'muscle' | 'strength'

export function ProgressPage() {
  const [metric, setMetric] = useState<MetricKey>('volume')

  const { data: stats, isLoading: statsLoading, isError: statsIsError, error: statsError } = useDashboardStats()
  const { data: progress, isLoading: progressLoading} = useProgressData(12)

  // Get weekly volume data from real progress
  const weeklyVolumeData = useMemo(() => {
    if (!progress?.weeklyVolume) return []
    const weeks = Object.values(progress.weeklyVolume)
    return weeks.slice(-12) // Last 12 weeks
  }, [progress?.weeklyVolume])

  // Get muscle group distribution
  const muscleData = useMemo(() => {
    if (!progress?.muscleVolume) return []
    const muscles = Object.entries(progress.muscleVolume)
      .map(([name, volume]) => ({ name, volume: volume as number }))
      .sort((a, b) => b.volume - a.volume)
    return muscles
  }, [progress?.muscleVolume])

  // Get strength progression for top lifts
  const strengthData = useMemo(() => {
    if (!progress?.liftData) return []
    
    // Find the most frequently trained exercises
    const exercises = Object.keys(progress.liftData)
      .map(name => ({
        name,
        maxWeight: Math.max(...(progress.liftData[name]?.map(l => l.weight).filter(w => w !== null) as number[]) || [0]),
        data: progress.liftData[name] || []
      }))
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 5) // Top 5 exercises
    
    return exercises
  }, [progress?.liftData])

  // Calculate volume trend
  const volumeTrend = weeklyVolumeData.slice(-4)
  const volumeChange = volumeTrend.length === 4 && volumeTrend[0] > 0
    ? ((volumeTrend[3] - volumeTrend[0]) / volumeTrend[0]) * 100
    : 0

  // PRs from dashboard stats
  const prs = useMemo(() => {
    const raw = stats?.personalRecords
    return Array.isArray(raw) ? raw : []
  }, [stats?.personalRecords])

  // Recent PRs (last 30 days)
  const recentPRs = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    return prs.filter((pr: any) => {
      const date = pr.achieved_at?.toDate?.()
      return date && date.getTime() > thirtyDaysAgo
    }).length
  }, [prs])

  const totalVolume = weeklyVolumeData.reduce((sum, v) => sum + v, 0)
  const avgWeeklyVolume = weeklyVolumeData.length ? Math.round(totalVolume / weeklyVolumeData.length) : 0

  const maxWeeklyVolume = Math.max(...weeklyVolumeData, 1)
  const normalizedVolumeData = weeklyVolumeData.map(v => (v / maxWeeklyVolume) * 100)

  // Get chart data based on selected metric
  const getChartData = () => {
    switch(metric) {
      case 'volume':
        return normalizedVolumeData
      case 'prs':
        // Mock PR progression based on actual PR count
        return generatePRProgression(prs.length)
      case 'muscle':
        return muscleData.slice(0, 6).map(m => (m.volume / (muscleData[0]?.volume || 1)) * 100)
      case 'strength':
        return strengthData.map(e => (e.maxWeight / (strengthData[0]?.maxWeight || 1)) * 100)
      default:
        return normalizedVolumeData
    }
  }

  const getChartLabels = () => {
    switch(metric) {
      case 'volume':
        return weeklyVolumeData.map((_, i) => `W${i + 1}`)
      case 'prs':
        return ['Month 1', 'Month 2', 'Month 3']
      case 'muscle':
        return muscleData.slice(0, 6).map(m => m.name)
      case 'strength':
        return strengthData.map(e => e.name.split(' ').slice(0, 2).join(' '))
      default:
        return weeklyVolumeData.map((_, i) => `W${i + 1}`)
    }
  }

  const chartData = getChartData()
  const chartLabels = getChartLabels()

  return (
    <div className="page" id="page-progress">
      <div className="page-header">
        <h1>
          Training <em>Progress</em>
        </h1>
        <p>Track your volume, PR momentum, muscle development, and strength gains</p>
      </div>

      {/* Stats Overview Cards */}
      <div className="stats-grid">
        <div className="card">
          <div className="stat-icon">🏋️</div>
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">{Math.round(totalVolume).toLocaleString()}<span className="stat-unit">kg</span></div>
          <div className={`stat-trend ${volumeChange >= 0 ? 'up' : 'down'}`}>
            {volumeChange >= 0 ? '↑' : '↓'} {Math.abs(volumeChange).toFixed(1)}% vs last period
          </div>
        </div>

        <div className="card">
          <div className="stat-icon">🏆</div>
          <div className="stat-label">Personal Records</div>
          <div className="stat-value">{prs.length}<span className="stat-unit">total</span></div>
          <div className="stat-trend up">+{recentPRs} in last 30 days</div>
        </div>

        <div className="card">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Weekly Avg</div>
          <div className="stat-value">{avgWeeklyVolume.toLocaleString()}<span className="stat-unit">kg</span></div>
          <div className="stat-sub">per workout week</div>
        </div>

        <div className="card">
          <div className="stat-icon">💪</div>
          <div className="stat-label">Top Exercise</div>
          <div className="stat-value">{strengthData[0]?.name?.split(' ').slice(0, 2).join(' ') || '—'}</div>
          <div className="stat-sub">{strengthData[0]?.maxWeight || 0} kg max</div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="card chart-card">
        <div className="chart-header">
          <div className="metric-selector">
            <button 
              className={`metric-btn ${metric === 'volume' ? 'active' : ''}`}
              onClick={() => setMetric('volume')}
            >
              📊 Weekly Volume
            </button>
            <button 
              className={`metric-btn ${metric === 'prs' ? 'active' : ''}`}
              onClick={() => setMetric('prs')}
            >
              🏆 PR Momentum
            </button>
            <button 
              className={`metric-btn ${metric === 'muscle' ? 'active' : ''}`}
              onClick={() => setMetric('muscle')}
            >
              🎯 Muscle Focus
            </button>
            <button 
              className={`metric-btn ${metric === 'strength' ? 'active' : ''}`}
              onClick={() => setMetric('strength')}
            >
              💪 Strength Ladder
            </button>
          </div>
        </div>

        {progressLoading || statsLoading ? (
          <div className="loading-state">
            <div className="loader"></div>
            <p>Loading your progress data...</p>
          </div>
        ) : (
          <>
            <div className="chart-container">
              <svg className="chart-svg" viewBox="0 0 800 300" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(y => (
                  <line 
                    key={y} 
                    x1="0" 
                    y1={300 - (y / 100) * 260} 
                    x2="800" 
                    y2={300 - (y / 100) * 260} 
                    stroke="#2a2a2a" 
                    strokeWidth="1" 
                    strokeDasharray="4,4" 
                  />
                ))}
                
                {/* Area fill */}
                {chartData.length > 0 && (
                  <path
                    d={`M 0 ${300 - (chartData[0] || 0) * 2.6} ${chartData.map((value, i) => 
                      `L ${(i / (chartData.length - 1)) * 800} ${300 - value * 2.6}`
                    ).join(' ')} L 800 300 L 0 300 Z`}
                    fill="url(#gradient)"
                  />
                )}
                
                {/* Line */}
                {chartData.length > 0 && (
                  <path
                    d={`M 0 ${300 - (chartData[0] || 0) * 2.6} ${chartData.map((value, i) => 
                      `L ${(i / (chartData.length - 1)) * 800} ${300 - value * 2.6}`
                    ).join(' ')}`}
                    fill="none"
                    stroke="#ff5c1a"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                
                {/* Data points */}
                {chartData.map((value, i) => (
                  <circle
                    key={i}
                    cx={(i / (chartData.length - 1)) * 800}
                    cy={300 - value * 2.6}
                    r="4"
                    fill="#ff5c1a"
                    stroke="#000"
                    strokeWidth="2"
                  />
                ))}
                
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5c1a" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#ff5c1a" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
              
              <div className="chart-labels">
                {chartLabels.map((label, i) => (
                  <div key={i} className="chart-label">
                    {label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="chart-insight">
              {metric === 'volume' && (
                <p>📈 Your weekly volume has {volumeChange >= 0 ? 'increased' : 'decreased'} by {Math.abs(volumeChange).toFixed(1)}% over the last {weeklyVolumeData.length} weeks. {volumeChange >= 0 ? 'Keep pushing! 🔥' : 'Time to increase intensity 💪'}</p>
              )}
              {metric === 'prs' && (
                <p>🏆 You've set {prs.length} personal records with {recentPRs} in the last month. {prs.length > 5 ? 'Impressive progress! 🎯' : 'Time to break some records! 🚀'}</p>
              )}
              {metric === 'muscle' && (
                <p>🎯 Your most trained muscle group is <strong>{muscleData[0]?.name || '—'}</strong> with {Math.round(muscleData[0]?.volume || 0).toLocaleString()}kg volume. Focus on {muscleData[muscleData.length - 1]?.name || 'lagging areas'} for balanced development.</p>
              )}
              {metric === 'strength' && (
                <p>💪 Your max strength across {strengthData.length} exercises. <strong>{strengthData[0]?.name || 'Keep training'}</strong> is your strongest lift at {strengthData[0]?.maxWeight || 0}kg.</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="two-columns">
        {/* Personal Records Section */}
        <div className="card">
          <div className="card-label">🏆 Personal Records</div>
          {statsIsError ? (
            <div className="error-message">
              {statsError instanceof Error ? statsError.message : 'Could not load PRs.'}
            </div>
          ) : statsLoading ? (
            <div className="loading-message">Loading PRs…</div>
          ) : prs.length === 0 ? (
            <div className="empty-message">
              <p>No PRs yet.</p>
              <p className="empty-hint">Complete workouts and set new personal records to see them here!</p>
            </div>
          ) : (
            <div className="pr-list">
              {prs.slice(0, 10).map((pr: any, idx) => (
                <div className="pr-item" key={idx}>
                  <div className="pr-info">
                    <div className="pr-name">{pr.exercise_name}</div>
                    <div className="pr-muscle">{pr.muscle_group || 'Compound'}</div>
                  </div>
                  <div className="pr-details">
                    <div className="pr-weight">{pr.weight_kg} kg</div>
                    <div className="pr-reps">× {pr.reps} reps</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muscle Group Distribution */}
        <div className="card">
          <div className="card-label">🎯 Muscle Group Focus</div>
          {progressLoading ? (
            <div className="loading-message">Loading muscle data…</div>
          ) : muscleData.length === 0 ? (
            <div className="empty-message">No muscle data yet. Complete workouts to see distribution.</div>
          ) : (
            <div className="muscle-list">
              {muscleData.slice(0, 8).map((muscle, idx) => (
                <div key={idx} className="muscle-item">
                  <div className="muscle-info">
                    <span className="muscle-name">{muscle.name}</span>
                    <span className="muscle-percent">
                      {Math.round((muscle.volume / (muscleData[0]?.volume || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="muscle-bar-bg">
                    <div 
                      className="muscle-bar-fill"
                      style={{ 
                        width: `${(muscle.volume / (muscleData[0]?.volume || 1)) * 100}%`,
                        background: `linear-gradient(90deg, #ff5c1a, #ff8c42)`
                      }}
                    />
                  </div>
                  <div className="muscle-volume">{Math.round(muscle.volume).toLocaleString()} kg</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strength Progression for Top Lift */}
      {strengthData.length > 0 && (
        <div className="card">
          <div className="card-label">💪 Strength Progression</div>
          <div className="strength-grid">
            {strengthData.slice(0, 3).map((exercise, idx) => (
              <div key={idx} className="strength-card">
                <div className="strength-name">{exercise.name}</div>
                <div className="strength-chart">
                  {exercise.data.slice(-8).map((point, i) => {
                    const height = point.weight ? (point.weight / exercise.maxWeight) * 80 : 0
                    return (
                      <div key={i} className="strength-bar-container">
                        <div 
                          className="strength-bar"
                          style={{ height: `${height}px` }}
                        />
                        <div className="strength-label">
                          {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="strength-stats">
                  <span>Max: {exercise.maxWeight} kg</span>
                  <span>Best: {Math.max(...exercise.data.map(d => d.reps || 0))} reps</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coach Insight */}
      <div className="card accent">
        <div className="card-label">🤖 AI Coach Insight</div>
        <div className="ai-insight">
          <p>Based on your last {weeklyVolumeData.length} weeks of training:</p>
          <ul>
            <li>✅ Consistency score: {Math.min(100, Math.floor((weeklyVolumeData.filter(v => v > 0).length / weeklyVolumeData.length) * 100))}%</li>
            <li>🎯 Total volume milestone: {totalVolume < 50000 ? `${Math.round(50000 - totalVolume)}kg to 50,000kg` : 'You have crushed 50,000kg! 🎉'}</li>
            <li>💡 Recommendation: {weeklyVolumeData.length > 0 && weeklyVolumeData[weeklyVolumeData.length - 1] < avgWeeklyVolume 
              ? "Increase your weekly volume by 15-20% for continued progress." 
              : "You're on track! Add one more working set to your main lifts."}</li>
          </ul>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-icon {
          font-size: 28px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          font-family: var(--font-display);
          color: var(--white);
          margin: 8px 0 4px;
        }

        .stat-unit {
          font-size: 12px;
          color: var(--muted);
          margin-left: 4px;
        }

        .stat-trend {
          font-size: 12px;
          margin-top: 8px;
        }

        .stat-trend.up {
          color: var(--green);
        }

        .stat-trend.down {
          color: var(--red);
        }

        .stat-sub {
          font-size: 11px;
          color: var(--mid);
        }

        .chart-card {
          margin-bottom: 24px;
        }

        .chart-header {
          margin-bottom: 24px;
        }

        .metric-selector {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .metric-btn {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--mid);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .metric-btn:hover {
          border-color: var(--orange);
          color: var(--orange);
        }

        .metric-btn.active {
          background: var(--orange);
          color: #000;
          border-color: var(--orange);
        }

        .chart-container {
          margin-bottom: 16px;
        }

        .chart-svg {
          width: 100%;
          height: auto;
          background: var(--surface2);
          border-radius: 8px;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          padding: 0 8px;
        }

        .chart-label {
          font-size: 10px;
          color: var(--muted);
          text-align: center;
          flex: 1;
        }

        .chart-insight {
          background: var(--surface2);
          padding: 16px;
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: var(--mid);
          border-left: 3px solid var(--orange);
        }

        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .pr-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .pr-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--surface2);
          border-radius: 10px;
          transition: all 0.2s;
        }

        .pr-item:hover {
          background: var(--surface3);
          transform: translateX(4px);
        }

        .pr-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .pr-muscle {
          font-size: 11px;
          color: var(--muted);
        }

        .pr-details {
          text-align: right;
        }

        .pr-weight {
          font-weight: 700;
          color: var(--orange);
          font-size: 18px;
        }

        .pr-reps {
          font-size: 11px;
          color: var(--mid);
        }

        .muscle-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .muscle-item {
          width: 100%;
        }

        .muscle-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .muscle-name {
          font-weight: 500;
        }

        .muscle-percent {
          color: var(--orange);
          font-weight: 600;
        }

        .muscle-bar-bg {
          background: var(--surface3);
          border-radius: 4px;
          height: 8px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .muscle-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .muscle-volume {
          font-size: 11px;
          color: var(--mid);
          text-align: right;
        }

        .strength-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .strength-card {
          background: var(--surface2);
          border-radius: 12px;
          padding: 16px;
        }

        .strength-name {
          font-weight: 700;
          margin-bottom: 16px;
          font-size: 16px;
        }

        .strength-chart {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          height: 120px;
          margin-bottom: 12px;
        }

        .strength-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .strength-bar {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #ff5c1a, #ff8c42);
          border-radius: 4px;
          transition: height 0.3s ease;
        }

        .strength-label {
          font-size: 8px;
          color: var(--muted);
          text-align: center;
          transform: rotate(-45deg);
          white-space: nowrap;
        }

        .strength-stats {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--mid);
          margin-top: 12px;
        }

        .ai-insight {
          font-size: 14px;
          line-height: 1.6;
        }

        .ai-insight ul {
          margin-top: 12px;
          padding-left: 20px;
        }

        .ai-insight li {
          margin: 8px 0;
          color: var(--mid);
        }

        .loading-state, .loading-message, .empty-message {
          text-align: center;
          padding: 40px;
          color: var(--mid);
        }

        .empty-hint {
          font-size: 12px;
          margin-top: 8px;
          color: var(--muted);
        }

        .loader {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--orange);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .two-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .metric-selector {
            justify-content: center;
          }
          
          .strength-grid {
            grid-template-columns: 1fr;
          }
          
          .strength-label {
            font-size: 7px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .stat-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  )
}

// Helper function to generate PR progression based on actual PR count
function generatePRProgression(totalPRs: number) {
  // Distribute PRs across 12 weeks with realistic progression
  const distribution = [0, 0, 1, 0, 1, 2, 1, 2, 3, 2, 3, 4]
  const scaled = distribution.map(d => (d / 4) * Math.min(100, totalPRs * 20))
  return scaled.map(v => Math.min(100, Math.max(5, v)))
}