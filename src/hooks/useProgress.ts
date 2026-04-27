import { useQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'

export function useProgressData(weeks: number = 12) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['progress', user?.uid, weeks],
    enabled: Boolean(user?.uid),
    queryFn: async () => {
      if (!user?.uid) throw new Error('Not signed in')

      const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000)
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const q = query(
        sessionsRef,
        where('started_at', '>=', Timestamp.fromDate(since)),
        orderBy('started_at', 'asc'),
      )
      const sessionsSnap = await getDocs(q)

      const weeklyVolume: Record<string, number> = {}
      const muscleVolume: Record<string, number> = {}
      const liftData: Record<
        string,
        Array<{ date: string; weight: number | null; reps: number | null }>
      > = {}

      for (const sessionDoc of sessionsSnap.docs) {
        const s = sessionDoc.data() as Record<string, unknown>
        if (s.finished_at == null) continue

        const startedAt = s.started_at as Timestamp | undefined
        const startedDate = startedAt?.toDate?.() ?? new Date()
        const week = `Week ${getWeekNumber(startedDate)}`

        weeklyVolume[week] = (weeklyVolume[week] || 0) + Number(s.total_volume_kg ?? 0)

        const setsRef = collection(db, 'users', user.uid, 'sessions', sessionDoc.id, 'sets')
        const setsSnap = await getDocs(setsRef)

        setsSnap.docs.forEach((setDoc: { data: () => Record<string, unknown> }) => {
          const set = setDoc.data() as Record<string, unknown>
          const vol = Number(set.weight_kg ?? 0) * Number(set.reps ?? 0)
          const muscle = typeof set.muscle_group === 'string' ? set.muscle_group : null
          if (muscle) muscleVolume[muscle] = (muscleVolume[muscle] || 0) + vol

          const name = typeof set.exercise_name === 'string' ? set.exercise_name : null
          if (name) {
            if (!liftData[name]) liftData[name] = []
            liftData[name].push({
              date: startedDate.toISOString(),
              weight: (set.weight_kg as number | null) ?? null,
              reps: (set.reps as number | null) ?? null,
            })
          }
        })
      }

      return { weeklyVolume, muscleVolume, liftData }
    },
  })
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((Number(d) - Number(yearStart)) / 86400000 + 1) / 7)
}