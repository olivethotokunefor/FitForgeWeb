import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExercises } from '../hooks/useExercises'
import { useFinishSession, useLogSet, useStartSession } from '../hooks/useWorkouts'

type SetRow = { id: string; reps: number; weight: number; done: boolean }

type Exercise = {
  id: string
  name: string
  muscle_group?: string
  equipment?: string
}

function formatSeconds(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function WorkoutNewPage() {
  const navigate = useNavigate()
  const { data: exercisesData, isLoading: exercisesLoading } = useExercises()

  const startSession = useStartSession()
  const logSet = useLogSet()
  const finishSession = useFinishSession()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionStartedAtMs, setSessionStartedAtMs] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)
  const [seconds, setSeconds] = useState(90)
  const [query, setQuery] = useState('')

  // Transform exercises data
  const exercises = useMemo(() => {
    if (!Array.isArray(exercisesData)) return []
    return exercisesData.map((e: any) => ({
      id: String(e.id || e.name?.toLowerCase().replace(/\s+/g, '_')),
      name: String(e.name),
      muscle_group: e.muscle_group,
      equipment: e.equipment,
    }))
  }, [exercisesData])

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>()
    exercises.forEach((e) => map.set(e.id, e))
    return map
  }, [exercises])

  const [plannedExerciseIds, setPlannedExerciseIds] = useState<string[]>([])
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [finishError, setFinishError] = useState<string | null>(null)
  const [setLogError, setSetLogError] = useState<string | null>(null)
  const [sets, setSets] = useState<Record<string, SetRow[]>>({})

  const exerciseList = useMemo(() => plannedExerciseIds, [plannedExerciseIds])

  // Timer logic
  useEffect(() => {
    if (!timerRunning) return
    if (seconds <= 0) return

    const t = window.setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1))
    }, 1000)

    return () => window.clearInterval(t)
  }, [seconds, timerRunning])

  useEffect(() => {
    if (seconds === 0) setTimerRunning(false)
  }, [seconds])

  const activeSets = sets[selectedExerciseId] ?? []

  async function ensureSession() {
    if (sessionId) return sessionId
    const created = await startSession.mutateAsync({ name: 'Workout', notes: notes || null })
    const id = String((created as Record<string, unknown>).id)
    setSessionId(id)
    setSessionStartedAtMs(Date.now())
    return id
  }

  async function toggleSetDone(setId: string) {
    setSetLogError(null)
    const rows = sets[selectedExerciseId] ?? []
    const rowIdx = rows.findIndex((r) => r.id === setId)
    const row = rowIdx >= 0 ? rows[rowIdx] : null
    if (!row) return
    const willBeDone = !row.done

    // Optimistically update UI
    setSets((prev) => ({
      ...prev,
      [selectedExerciseId]: (prev[selectedExerciseId] ?? []).map((s) =>
        s.id === setId ? { ...s, done: !s.done } : s
      ),
    }))

    if (!willBeDone) return
    if (!selectedExerciseId) return

    const ex = exerciseById.get(selectedExerciseId)
    if (!ex) {
      console.error('Exercise not found:', selectedExerciseId)
      return
    }

    try {
      const sid = await ensureSession()
      await logSet.mutateAsync({
        sessionId: sid,
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscle_group,
        setNumber: rowIdx + 1,
        weightKg: row.weight,
        reps: row.reps,
        notes: null,
      })
      console.log(`Set ${rowIdx + 1} logged: ${row.weight}kg x ${row.reps} reps`)
    } catch (e) {
      setSetLogError(e instanceof Error ? e.message : 'Could not save set.')
      // Revert optimistic update
      setSets((prev) => ({
        ...prev,
        [selectedExerciseId]: (prev[selectedExerciseId] ?? []).map((s) =>
          s.id === setId ? { ...s, done: false } : s
        ),
      }))
    }
  }

  function updateSet(setId: string, patch: Partial<Pick<SetRow, 'reps' | 'weight'>>) {
    setSets((prev) => ({
      ...prev,
      [selectedExerciseId]: (prev[selectedExerciseId] ?? []).map((s) =>
        s.id === setId ? { ...s, ...patch } : s
      ),
    }))
  }

  function addSet() {
    setSets((prev) => {
      const rows = prev[selectedExerciseId] ?? []
      const last = rows[rows.length - 1]
      const newSet: SetRow = {
        id: `${selectedExerciseId}-${Date.now()}-${rows.length + 1}`,
        reps: last?.reps ?? 8,
        weight: last?.weight ?? 0,
        done: false,
      }
      return {
        ...prev,
        [selectedExerciseId]: [...rows, newSet],
      }
    })
  }

  function addExercise() {
    const searchQuery = query.trim().toLowerCase()
    if (!searchQuery) return
    
    setQuery('')
    
    // Find matching exercise from library
    const match = exercises.find((e) => 
      e.name.toLowerCase().includes(searchQuery)
    )
    
    let exerciseId: string
    let exerciseName: string
    
    if (match) {
      exerciseId = match.id
      exerciseName = match.name
    } else {
      // Create custom exercise ID
      exerciseId = `custom_${searchQuery.replace(/[^a-z0-9]/g, '_')}_${Date.now()}`
      exerciseName = query.trim()
      // Add to map temporarily
      exerciseById.set(exerciseId, {
        id: exerciseId,
        name: exerciseName,
        muscle_group: 'Other',
      })
    }
    
    // Add to planned exercises if not already there
    if (!plannedExerciseIds.includes(exerciseId)) {
      setPlannedExerciseIds((prev) => [...prev, exerciseId])
      
      // Initialize sets for this exercise if not exists
      setSets((prev) => {
        if (prev[exerciseId]) return prev
        return {
          ...prev,
          [exerciseId]: [{ 
            id: `${exerciseId}-set1`, 
            reps: 10, 
            weight: 0, 
            done: false 
          }],
        }
      })
      
      setSelectedExerciseId(exerciseId)
    }
  }

  // Auto-select first exercise when exercises load
  useEffect(() => {
    if (selectedExerciseId) return
    if (!exercises.length) return
    const first = exercises[0]?.id
    if (!first) return
    setSelectedExerciseId(first)
    // Auto-add first exercise to planned list
    if (plannedExerciseIds.length === 0) {
      setPlannedExerciseIds([first])
      setSets((prev) => ({
        ...prev,
        [first]: [{ id: `${first}-set1`, reps: 10, weight: 0, done: false }],
      }))
    }
  }, [exercises, selectedExerciseId, plannedExerciseIds.length])

  const selectedExerciseName = useMemo(() => {
    const ex = selectedExerciseId ? exerciseById.get(selectedExerciseId) : null
    return ex?.name ?? ''
  }, [exerciseById, selectedExerciseId])

  const isSaving = finishSession.isPending || startSession.isPending || logSet.isPending

  return (
    <div className="page" id="page-logger">
      <div className="page-header">
        <h1>
          Log <em>Workout</em>
        </h1>
        <p>Build your session, record sets, and keep pace with a rest timer.</p>
      </div>

      <div className="workout-grid">
        {/* Left Column - Session Builder */}
        <div className="card workout-builder">
          <div className="card-label mb-4">Session Builder</div>
          
          {exercisesLoading ? (
            <div className="loading-message">Loading exercises...</div>
          ) : null}

          {/* Add Exercise Row */}
          <div className="add-exercise-row">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercise (e.g., Bench Press, Squat...)"
              onKeyDown={(e) => e.key === 'Enter' && query.trim() && addExercise()}
              list="exercise-suggestions"
            />
            <datalist id="exercise-suggestions">
              {exercises.slice(0, 10).map((ex) => (
                <option key={ex.id} value={ex.name} />
              ))}
            </datalist>
            <button
              type="button"
              className="btn btn-orange btn-sm"
              onClick={addExercise}
              disabled={!query.trim()}
            >
              + Add
            </button>
          </div>

          {/* Exercises List */}
          <div className="section-gap">
            <div className="card-label mb-4">Exercises ({exerciseList.length})</div>
            <div className="exercise-pills">
              {exerciseList.map((id) => (
                <div
                  key={id}
                  className={`exercise-pill ${id === selectedExerciseId ? 'active' : ''}`}
                  onClick={() => setSelectedExerciseId(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedExerciseId(id)
                  }}
                >
                  <span className="pill-icon">◈</span>
                  {exerciseById.get(id)?.name ?? 'Exercise'}
                </div>
              ))}
              {exerciseList.length === 0 && (
                <div className="empty-message">No exercises added yet. Search and add above.</div>
              )}
            </div>
          </div>

          {/* Sets Table */}
          {selectedExerciseId && (
            <div className="section-gap">
              <div className="card-label mb-4">Sets — {selectedExerciseName}</div>
              
              {setLogError && (
                <div className="error-message">{setLogError}</div>
              )}

              <div className="sets-table-wrapper">
                <table className="sets-table">
                  <thead>
                    <tr>
                      <th className="col-done">✓</th>
                      <th className="col-reps">Reps</th>
                      <th className="col-weight">Weight (kg)</th>
                      <th className="col-rest">Rest Timer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSets.map((s, idx) => (
                      <tr key={s.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={s.done}
                            onChange={() => void toggleSetDone(s.id)}
                            className="set-checkbox"
                            disabled={isSaving}
                          />
                        </td>
                        <td>
                          <input
                            className="set-input"
                            type="number"
                            min={0}
                            value={s.reps}
                            onChange={(e) => updateSet(s.id, { reps: Number(e.target.value) })}
                            disabled={s.done}
                          />
                        </td>
                        <td>
                          <div className="weight-input-wrapper">
                            <input
                              className="set-input"
                              type="number"
                              min={0}
                              step={2.5}
                              value={s.weight}
                              onChange={(e) => updateSet(s.id, { weight: Number(e.target.value) })}
                              disabled={s.done}
                            />
                            <span className="weight-unit">kg</span>
                          </div>
                        </td>
                        <td className="rest-action">
                          <button
                            type="button"
                            className="btn-rest"
                            onClick={() => {
                              setSeconds(90)
                              setTimerRunning(true)
                            }}
                            disabled={!s.done}
                          >
                            Start Rest
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="add-set-btn">
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm" 
                  onClick={addSet}
                >
                  + Add Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Timer & Notes */}
        <div className="workout-sidebar">
          {/* Rest Timer Card */}
          <div className="card timer-card">
            <div className="card-label mb-4">Rest Timer</div>
            <div className="timer-display">
              <div className="timer-value">{formatSeconds(seconds)}</div>
              <div className={`timer-status ${seconds === 0 ? 'ready' : timerRunning ? 'running' : 'paused'}`}>
                {seconds === 0 ? 'Ready' : timerRunning ? 'Running' : 'Paused'}
              </div>
            </div>
            <div className="timer-controls">
              <button
                type="button"
                className="btn btn-orange btn-sm"
                onClick={() => setTimerRunning((r) => !r)}
              >
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSeconds(90)
                  setTimerRunning(false)
                }}
              >
                Reset 1:30
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSeconds((s) => Math.min(300, s + 30))}
              >
                +30s
              </button>
            </div>
          </div>

          {/* Session Notes Card */}
          <div className="card notes-card">
            <div className="card-label mb-4">Session Notes</div>
            <textarea
              className="notes-textarea"
              placeholder="How did it feel? RPE, cues, tempo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
            
            {finishError && (
              <div className="error-message">{finishError}</div>
            )}
            
            <div className="finish-actions">
              <button
                type="button"
                className="btn btn-orange"
                disabled={isSaving || activeSets.some(s => !s.done)}
                onClick={async () => {
                  setFinishError(null)
                  
                  // Check if all sets are done
                  const allSets = Object.values(sets).flat()
                  const incompleteSets = allSets.filter(s => !s.done)
                  
                  if (incompleteSets.length > 0) {
                    setFinishError(`Please complete all sets (${incompleteSets.length} incomplete) before finishing.`)
                    return
                  }
                  
                  try {
                    const sid = sessionId ?? (await ensureSession())
                    if (!sessionStartedAtMs) setSessionStartedAtMs(Date.now())
                    const started = sessionStartedAtMs ?? Date.now()
                    const durationMins = Math.max(1, Math.round((Date.now() - started) / 60000))
                    await finishSession.mutateAsync({ sessionId: sid, durationMins })
                    navigate('/app/dashboard')
                  } catch (e) {
                    setFinishError(e instanceof Error ? e.message : 'Could not finish workout.')
                  }
                }}
              >
                {finishSession.isPending ? 'Finishing...' : 'Finish Workout'}
              </button>
              <button type="button" className="btn btn-outline" disabled={isSaving}>
                Save Draft
              </button>
            </div>
            {activeSets.some(s => !s.done) && (
              <div className="warning-message">
                ⚠️ Complete all sets before finishing
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .workout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 20px;
        }

        @media (max-width: 900px) {
          .workout-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .workout-sidebar {
            order: 2;
          }
          .workout-builder {
            order: 1;
          }
        }

        .workout-builder {
          min-width: 0;
        }

        .workout-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .add-exercise-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .add-exercise-row .input {
          flex: 1;
        }

        .exercise-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-height: 200px;
          overflow-y: auto;
          padding: 4px;
        }

        .exercise-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--surface2);
          border: 1px solid var(--border2);
          border-radius: 999px;
          font-size: 13px;
          color: var(--mid);
          cursor: pointer;
          transition: all 0.2s;
        }

        .exercise-pill:hover {
          background: var(--surface3);
          border-color: var(--orange);
        }

        .exercise-pill.active {
          background: var(--orange-dim);
          border-color: var(--orange);
          color: var(--white);
        }

        .pill-icon {
          color: var(--orange);
        }

        .sets-table-wrapper {
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .sets-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sets-table th {
          text-align: left;
          padding: 12px 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
        }

        .sets-table td {
          padding: 10px 8px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        .col-done { width: 50px; }
        .col-reps { width: 100px; }
        .col-weight { min-width: 130px; }

        .set-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--orange);
        }

        .set-checkbox:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .set-input {
          width: 100%;
          max-width: 90px;
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--white);
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 13px;
        }

        .set-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .set-input:focus {
          outline: none;
          border-color: var(--orange);
        }

        .weight-input-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .weight-unit {
          color: var(--muted);
          font-size: 12px;
          flex-shrink: 0;
        }

        .btn-rest {
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--mid);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-rest:hover:not(:disabled) {
          background: var(--orange-dim);
          border-color: var(--orange);
          color: var(--orange);
        }

        .btn-rest:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .timer-display {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .timer-value {
          font-family: var(--font-display);
          font-size: 48px;
          font-weight: 700;
          color: var(--orange);
        }

        .timer-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .timer-status.running {
          background: var(--orange-dim);
          color: var(--orange);
        }

        .timer-status.paused {
          background: var(--surface2);
          color: var(--mid);
        }

        .timer-status.ready {
          background: var(--green-dim);
          color: var(--green);
        }

        .timer-controls {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .notes-textarea {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border2);
          color: var(--white);
          padding: 12px;
          border-radius: 12px;
          font-size: 13px;
          resize: vertical;
          font-family: var(--font-body);
        }

        .notes-textarea:focus {
          outline: none;
          border-color: var(--orange);
        }

        .finish-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .error-message {
          background: var(--red-dim);
          border: 1px solid var(--red);
          color: var(--red);
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          margin: 12px 0;
        }

        .warning-message {
          background: var(--orange-dim);
          border: 1px solid var(--orange);
          color: var(--orange);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          margin-top: 12px;
          text-align: center;
        }

        .empty-message, .loading-message {
          padding: 20px;
          text-align: center;
          color: var(--mid);
          font-size: 13px;
        }

        @media (max-width: 640px) {
          .col-reps { width: 80px; }
          .set-input { max-width: 70px; font-size: 12px; }
          .timer-value { font-size: 36px; }
          .btn-rest { padding: 4px 8px; font-size: 10px; }
        }
      `}</style>
    </div>
  )
}