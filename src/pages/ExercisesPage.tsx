import { useMemo, useState } from 'react'
import { useExercises } from '../hooks/useExercises'

export function ExercisesPage() {
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState('All')
  const [equipment, setEquipment] = useState('All')

  const { data } = useExercises({
    muscleGroup: muscle === 'All' ? undefined : muscle,
    equipment: equipment === 'All' ? undefined : equipment,
    search: q.trim() ? q.trim() : undefined,
  })

  const [selectedId, setSelectedId] = useState<string>('')

  const exercises = useMemo(() => (Array.isArray(data) ? (data as Array<Record<string, unknown>>) : []), [data])

  const muscles = useMemo(
    () => ['All', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'],
    [],
  )
  const equipments = useMemo(
    () => ['All', 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
    [],
  )

  const selected = useMemo(() => {
    if (!exercises.length) return null
    const found = selectedId ? exercises.find((e) => String(e.id) === selectedId) : null
    return found ?? exercises[0] ?? null
  }, [exercises, selectedId])

  return (
    <div className="page" id="page-library">
      <div className="page-header">
        <h1>
          Exercise <em>Library</em>
        </h1>
        <p>Search movements, save favorites, and build workouts faster.</p>
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-label mb-4">Search</div>

          {/* search-grid class replaces inline gridTemplateColumns so media queries can override it */}
          <div className="search-grid">
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search exercises..."
            />
            <select className="input" value={muscle} onChange={(e) => setMuscle(e.target.value)}>
              {muscles.map((m) => (
                <option key={m} value={m}>
                  {m === 'All' ? 'All muscles' : m}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
            >
              {equipments.map((eq) => (
                <option key={eq} value={eq}>
                  {eq === 'All' ? 'All equipment' : eq}
                </option>
              ))}
            </select>
          </div>

          <div className="section-gap">
            <div className="card-label mb-4">Results</div>

            {/* table-wrap enables horizontal scroll on small screens */}
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Muscle</th>
                    <th>Equipment</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {exercises.map((e) => (
                    <tr key={String(e.id)}>
                      <td style={{ fontWeight: 700, color: 'var(--white)' }}>{String(e.name ?? '—')}</td>
                      <td style={{ color: 'var(--mid)' }}>{String(e.muscle_group ?? '—')}</td>
                      <td style={{ color: 'var(--mid)' }}>{String(e.equipment ?? '—')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedId(String(e.id))}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!exercises.length ? (
              <div style={{ marginTop: 12, fontSize: 13, color: 'var(--mid)' }}>
                No matches. Try a broader search.
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card accent">
            <div className="card-label">Selected</div>
            <div style={{ marginTop: 10 }}>
              <div className="card-value orange" style={{ fontSize: 32 }}>
                {selected ? String((selected as Record<string, unknown>).name ?? '—') : '—'}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div className="chip warn">
                  {selected ? String((selected as Record<string, unknown>).muscle_group ?? '—') : '—'}
                </div>
                <div className="chip">
                  {selected ? String((selected as Record<string, unknown>).equipment ?? '—') : '—'}
                </div>
                <div className="chip good">
                  {selected ? String((selected as Record<string, unknown>).category ?? '—') : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-label mb-4">Notes</div>
            <div style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.7 }}>
              {selected && Array.isArray((selected as Record<string, unknown>).instructions) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {((selected as Record<string, unknown>).instructions as Array<unknown>).slice(0, 6).map((line, idx) => (
                    <div key={idx} className="chip">
                      {String(line)}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="chip">No instructions yet.</div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-orange btn-sm">
                Add to Workout
              </button>
              <button type="button" className="btn btn-outline btn-sm">
                Favorite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}