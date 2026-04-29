// pages/PlansPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useActivatePlan, useGeneratePlan, usePlans } from '../hooks/usePlans'
import { useOptimizePlan } from '../hooks/useOptimizePlan'

type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

type PlanExercise = {
  exercise_name?: string
  exercise_id?: string
}

type PlanDay = {
  day_of_week?: number
  name?: string
  is_rest_day?: boolean
  exercises?: PlanExercise[]
}

type PlanRecord = {
  id: string
  name?: string
  description?: string
  is_active?: boolean
  progression_insights?: any[]
  days?: PlanDay[]
}

const DAY_KEYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_INDEX: Record<DayKey, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

const FALLBACK_WEEK = {
  Mon: { title: 'Push A', focus: 'Chest / Shoulders', tag: 'Heavy' },
  Tue: { title: 'Pull A', focus: 'Back / Biceps', tag: 'Volume' },
  Wed: { title: 'Legs A', focus: 'Squat Pattern', tag: 'Heavy' },
  Thu: { title: 'Recovery', focus: 'Mobility + steps', tag: 'Recovery' },
  Fri: { title: 'Push B', focus: 'Triceps / OHP', tag: 'Volume' },
  Sat: { title: 'Pull B', focus: 'Lats + posterior', tag: 'Pump' },
  Sun: { title: 'Recovery', focus: 'Zone 2 optional', tag: 'Recovery' },
} as Record<DayKey, { title: string; focus: string; tag: string }>

export function PlansPage() {
  const [activePlanId, setActivePlanId] = useState('')
  const [insights, setInsights] = useState<any[]>([])
  
  const { data, isLoading, isError, error } = usePlans()
  const activatePlan = useActivatePlan()
  const generatePlan = useGeneratePlan()
  const optimizePlan = useOptimizePlan()

  const plans = useMemo(() => (Array.isArray(data) ? (data as PlanRecord[]) : []), [data])

  useEffect(() => {
    if (!plans.length) {
      setActivePlanId('')
      return
    }

    const selected = plans.find((plan) => plan.id === activePlanId)
    if (selected) return

    const active = plans.find((plan) => plan.is_active) ?? plans[0]
    setActivePlanId(active?.id ?? '')
  }, [activePlanId, plans])

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans.find((plan) => plan.is_active) ?? null

  // Load insights from active plan
  useEffect(() => {
    if (activePlan?.progression_insights) {
      setInsights(activePlan.progression_insights)
    } else {
      setInsights([])
    }
  }, [activePlan])

  const week = useMemo(() => {
    const days = Array.isArray(activePlan?.days) ? activePlan.days : []
    if (!days.length) return FALLBACK_WEEK

    return DAY_KEYS.reduce((acc, key) => {
      const day = days.find((item) => Number(item.day_of_week ?? 0) === DAY_INDEX[key])

      if (!day) {
        acc[key] = { title: 'Recovery', focus: 'Mobility + steps', tag: 'Recovery' }
        return acc
      }

      const exerciseSummary = Array.isArray(day.exercises)
        ? day.exercises
            .slice(0, 2)
            .map((exercise) => String(exercise.exercise_name ?? exercise.exercise_id ?? 'Exercise'))
            .join(' · ')
        : ''

      acc[key] = {
        title: String(day.name ?? 'Workout'),
        focus: day.is_rest_day ? 'Mobility + steps' : exerciseSummary || 'Training session',
        tag: day.is_rest_day ? 'Recovery' : 'Training',
      }

      return acc
    }, {} as Record<DayKey, { title: string; focus: string; tag: string }>)
  }, [activePlan])

  async function handleGeneratePlan() {
    try {
      const created = await generatePlan.mutateAsync()
      setActivePlanId(created.id)
    } catch {
      // handled by react-query state below
    }
  }

  async function handleSelectPlan(planId: string) {
    setActivePlanId(planId)
    try {
      await activatePlan.mutateAsync(planId)
    } catch {
      // handled by react-query state below
    }
  }

  async function handleGetInsights() {
    if (!activePlanId || !activePlan?.days) return
    
    // Extract all exercises from the plan
    const allExercises: { exercise_id: string; exercise_name: string }[] = []
    activePlan.days.forEach((day: any) => {
      if (day.exercises) {
        day.exercises.forEach((ex: any) => {
          allExercises.push({
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name
          })
        })
      }
    })
    
    const result = await optimizePlan.mutateAsync({ 
      planId: activePlanId, 
      exercises: allExercises 
    })
    setInsights(result)
  }

  return (
    <div className="page" id="page-plans">
      <div className="page-header">
        <h1>
          Training <em>Plans</em>
        </h1>
        <p>AI-powered plans that adapt to your progress</p>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-label mb-4">Your Plans</div>

          {isError ? (
            <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--red)' }}>
              {error instanceof Error ? error.message : 'Could not load plans.'}
            </div>
          ) : null}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plans.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--mid)' }}>
                {isLoading ? 'Loading plans…' : 'No saved plans yet. Generate one to get started.'}
              </div>
            ) : (
              plans.map((plan) => {
                const name = plan.name ?? 'Training Plan'
                const isActive = plan.id === activePlanId || Boolean(plan.is_active && !activePlanId)
                return (
                  <div
                    key={plan.id}
                    className={`pill${isActive ? ' active' : ''}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleSelectPlan(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') void handleSelectPlan(plan.id)
                    }}
                    style={{ justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--white)' }}>{name}</div>
                      <div style={{ fontSize: 12, color: 'var(--mid)', marginTop: 3 }}>
                        {plan.description ?? 'Personalised weekly split'}
                      </div>
                    </div>
                    <div className={`chip ${isActive ? 'warn' : ''}`}>{isActive ? 'Active' : 'Saved'}</div>
                  </div>
                )
              })
            )}
          </div>

          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-orange"
              onClick={() => void handleGeneratePlan()}
              disabled={generatePlan.isPending}
            >
              {generatePlan.isPending ? 'Generating…' : '+ New Plan'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void handleGeneratePlan()}
              disabled={generatePlan.isPending}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card accent">
            <div className="card-label">Active Plan</div>
            <div style={{ marginTop: 10 }}>
              <div className="card-value orange" style={{ fontSize: 34 }}>
                {activePlan?.name ?? 'Starter Split'}
              </div>
              <div style={{ marginTop: 6, color: 'var(--mid)', fontSize: 13 }}>
                {activePlan?.description ?? 'Week structure preview based on your profile and training goal.'}
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="card">
            <div className="card-label mb-4">🤖 AI Progression Insights</div>
            
            {insights.length === 0 ? (
              <div>
                <div style={{ fontSize: 13, color: 'var(--mid)', marginBottom: 12 }}>
                  Get personalized recommendations based on your recent workout performance.
                </div>
                <button
                  type="button"
                  className="btn btn-orange btn-sm"
                  onClick={() => void handleGetInsights()}
                  disabled={optimizePlan.isPending || !activePlanId}
                >
                  {optimizePlan.isPending ? 'Analyzing...' : 'Analyze My Progress'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {insights.map((insight, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      padding: 12, 
                      background: 'var(--surface2)', 
                      borderRadius: 8,
                      borderLeft: `3px solid ${
                        insight.priority === 'high' ? '#ff5c1a' : 
                        insight.priority === 'medium' ? '#f59e0b' : 
                        '#22c55e'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{insight.recommendation}</div>
                      <div className={`chip ${
                        insight.type === 'increase_weight' ? 'warn' :
                        insight.type === 'deload' ? 'bad' :
                        'good'
                      }`}>
                        {insight.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mid)' }}>{insight.details}</div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => void handleGetInsights()}
                  disabled={optimizePlan.isPending}
                  style={{ marginTop: 8 }}
                >
                  {optimizePlan.isPending ? 'Updating...' : 'Refresh Insights'}
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-label mb-4">This Week</div>
            <div className="grid-2">
              {(Object.keys(week) as DayKey[]).map((d) => {
                const item = week[d]
                const isRest = item.tag === 'Recovery'
                return (
                  <div
                    key={d}
                    style={{
                      padding: 14,
                      border: '1px solid var(--border)',
                      background: 'var(--surface2)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 700 }}>{d}</div>
                      <div className={`chip ${isRest ? '' : 'warn'}`}>{item.tag}</div>
                    </div>
                    <div style={{ marginTop: 10, fontFamily: 'var(--font-display)', color: isRest ? 'var(--mid)' : 'var(--orange)' }}>
                      {item.title}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--mid)' }}>{item.focus}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-orange btn-sm"
                onClick={() => void handleGeneratePlan()}
                disabled={generatePlan.isPending}
              >
                Regenerate Week
              </button>
              <button type="button" className="btn btn-outline btn-sm" disabled>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}