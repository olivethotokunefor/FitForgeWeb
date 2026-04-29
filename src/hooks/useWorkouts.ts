import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  setDoc
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'



type StartSessionArgs = {
  name?: string | null
  notes?: string | null
}

type LogSetArgs = {
  sessionId: string
  exerciseId: string
  exerciseName?: string
  muscleGroup?: string
  setNumber: number
  weightKg: number
  reps: number
  notes?: string | null
}

type FinishSessionArgs = {
  sessionId: string
  durationMins: number
}

function isCompletedSession(session: Record<string, unknown>) {
  return session.finished_at != null
}

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  if (
    typeof value === 'object' &&
    value &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    const parsed = (value as { toDate: () => Date }).toDate()
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null
  }
  return null
}



export function useWorkoutSessions() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['sessions', user?.uid],
    enabled: Boolean(user?.uid),
    queryFn: async () => {
      if (!user?.uid) throw new Error('Not signed in')

      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const q = query(sessionsRef, orderBy('started_at', 'desc'), limit(50))
      const snap = await getDocs(q)

      const sessions = [] as Array<Record<string, unknown>>
      for (const d of snap.docs) {
        const s = d.data() as Record<string, unknown>
        const setsRef = collection(db, 'users', user.uid, 'sessions', d.id, 'sets')
        const setsSnap = await getDocs(setsRef)
        const workout_sets = setsSnap.docs.map((sd) => ({
          id: sd.id,
          ...(sd.data() as Record<string, unknown>),
        }))
        sessions.push({ id: d.id, ...s, workout_sets })
      }
      return sessions
    },
  })
}

export function useDashboardStats() {
  const { user, profile } = useAuth()

  return useQuery({
    queryKey: ['dashboard-stats', user?.uid],
    enabled: Boolean(user?.uid),
    queryFn: async () => {
      if (!user?.uid) throw new Error('Not signed in')

      // Get last 30 days of sessions
      const since = new Date()
      since.setDate(since.getDate() - 30)
      
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const q = query(
        sessionsRef,
        where('started_at', '>=', Timestamp.fromDate(since)),
        orderBy('started_at', 'desc'),
      )
      const snap = await getDocs(q)
      
      const sessions = snap.docs
        .map((d) => d.data() as Record<string, unknown>)
        .filter(isCompletedSession)

      const volume = sessions.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total_volume_kg ?? 0), 0)
      
      const durations = sessions.filter((s: Record<string, unknown>) => Boolean(s.duration_mins))
      const avgDuration = durations.length
        ? durations.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.duration_mins ?? 0), 0) / durations.length
        : 0

      // Get PRs
      const prsRef = collection(db, 'users', user.uid, 'prs')
      const prsSnap = await getDocs(prsRef)
      const personalRecords = prsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, unknown>),
      }))

      return {
        workoutsThisMonth: sessions.length,
        volumeThisMonth: Math.round(volume),
        avgDuration: Math.round(avgDuration),
        streak: Number(profile?.streak ?? 0),
        personalRecords,
        lastWorkout: toDate(profile?.last_workout_at),
      }
    },
  })
}

export function useStartSession() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ name, notes }: StartSessionArgs) => {
      if (!user?.uid) throw new Error('Not signed in')

      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const docRef = await addDoc(sessionsRef, {
        name: name ?? 'Workout',
        notes: notes ?? null,
        started_at: serverTimestamp(),
        finished_at: null,
        duration_mins: null,
        total_volume_kg: 0,
      })

      const snap = await getDoc(docRef)
      return { id: docRef.id, ...(snap.data() as Record<string, unknown>) }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['sessions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useLogSet() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({
      sessionId,
      exerciseId,
      exerciseName,
      muscleGroup,
      setNumber,
      weightKg,
      reps,
      notes,
    }: LogSetArgs) => {
      if (!user?.uid) throw new Error('Not signed in')

      // Check for PR
      const prRef = doc(db, 'users', user.uid, 'prs', exerciseId)
      const prSnap = await getDoc(prRef)
      const currentBest = prSnap.exists() ? Number((prSnap.data() as Record<string, unknown>).weight_kg ?? 0) : null
      const isPR = currentBest == null || weightKg > currentBest

      // Add the set
      const setsRef = collection(db, 'users', user.uid, 'sessions', sessionId, 'sets')
      const setRef = await addDoc(setsRef, {
        exercise_id: exerciseId,
        exercise_name: exerciseName ?? null,
        muscle_group: muscleGroup ?? null,
        set_number: setNumber,
        weight_kg: weightKg,
        reps,
        notes: notes ?? null,
        is_pr: isPR,
        created_at: serverTimestamp(),
      })

      // Update PR if needed
      if (isPR) {
        await setDoc(
          prRef,
          {
            exercise_id: exerciseId,
            exercise_name: exerciseName ?? null,
            muscle_group: muscleGroup ?? null,
            weight_kg: weightKg,
            reps,
            session_id: sessionId,
            achieved_at: serverTimestamp(),
          },
          { merge: true },
        )
      }

      // Update session total volume
      const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId)
      const sessionSnap = await getDoc(sessionRef)
      const currentVolume = Number((sessionSnap.data() as Record<string, unknown>)?.total_volume_kg ?? 0)
      const newVolume = currentVolume + (weightKg * reps)
      
      await updateDoc(sessionRef, {
        total_volume_kg: newVolume,
      })

      return { id: setRef.id, isPR, setNumber, weightKg, reps }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['sessions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useFinishSession() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ sessionId, durationMins }: FinishSessionArgs) => {
      if (!user?.uid) throw new Error('Not signed in')

      // Get all sets to calculate total volume
      const setsRef = collection(db, 'users', user.uid, 'sessions', sessionId, 'sets')
      const setsSnap = await getDocs(setsRef)
      let totalVolume = 0
      
      setsSnap.docs.forEach((doc) => {
        const data = doc.data()
        totalVolume += (data.weight_kg || 0) * (data.reps || 0)
      })

      // Update session
      const sessionRef = doc(db, 'users', user.uid, 'sessions', sessionId)
      await updateDoc(sessionRef, {
        finished_at: serverTimestamp(),
        duration_mins: durationMins,
        total_volume_kg: totalVolume,
      })

      // Update user streak
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {}
      
      // Get the last workout date from user document (not from session)
      const lastWorkoutDate = userData.last_workout_at 
        ? toDate(userData.last_workout_at) 
        : null
      
      let currentStreak = Number(userData.streak ?? 0)
      const currentLongest = Number(userData.longest_streak ?? 0)

      // Calculate new streak
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let nextStreak = 1
      
      if (lastWorkoutDate) {
        const lastDate = new Date(lastWorkoutDate)
        lastDate.setHours(0, 0, 0, 0)
        
        const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        
        console.log('Streak calculation:', {
          lastWorkoutDate: lastDate.toISOString(),
          today: today.toISOString(),
          diffDays,
          currentStreak
        })
        
        if (diffDays === 1) {
          // Consecutive day - increase streak
          nextStreak = currentStreak + 1
          console.log(`✅ Streak increased! ${currentStreak} → ${nextStreak}`)
        } else if (diffDays === 0) {
          // Same day - don't increase streak
          nextStreak = currentStreak
          console.log(`⏸️ Same day workout. Streak remains ${currentStreak}`)
        } else if (diffDays > 1) {
          // Missed days - streak broken
          nextStreak = 1
          console.log(`💔 Streak broken! Missed ${diffDays} days. Starting over.`)
        } else {
          // Negative diff (shouldn't happen)
          nextStreak = currentStreak
        }
      } else {
        // First workout ever
        nextStreak = 1
        console.log(`🎉 First workout! Starting streak at 1`)
      }

      // Update user document
      await setDoc(
        userRef,
        {
          last_workout_at: serverTimestamp(),
          streak: nextStreak,
          longest_streak: Math.max(currentLongest, nextStreak),
          updated_at: serverTimestamp(),
        },
        { merge: true },
      )

      console.log(`📊 Final streak: ${nextStreak}, Longest: ${Math.max(currentLongest, nextStreak)}`)

      const snap = await getDoc(sessionRef)
      return { 
        id: sessionId, 
        ...(snap.data() as Record<string, unknown>),
        streak: nextStreak,
        longest_streak: Math.max(currentLongest, nextStreak)
      }
    },
    onSuccess: async () => {
      // Invalidate all relevant queries to refresh UI
      await qc.invalidateQueries({ queryKey: ['sessions'] })
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      await qc.invalidateQueries({ queryKey: ['profile'] })
      // Also invalidate the user query if you have one
      await qc.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

// Add this to your useWorkouts.ts - useful for fixing incorrect streaks
export function useRecalculateStreak() {
  const { user } = useAuth()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error('Not signed in')

      // Get all completed sessions ordered by date
      const sessionsRef = collection(db, 'users', user.uid, 'sessions')
      const q = query(
        sessionsRef,
        where('finished_at', '!=', null),
        orderBy('finished_at', 'asc')
      )
      const snap = await getDocs(q)
      
      let currentStreak = 0
      let longestStreak = 0
      let lastDate: Date | null = null
      
      for (const doc of snap.docs) {
        const data = doc.data()
        const sessionDate = data.finished_at?.toDate()
        
        if (!sessionDate) continue
        
        const workoutDate = new Date(sessionDate)
        workoutDate.setHours(0, 0, 0, 0)
        
        if (lastDate) {
          const diffDays = Math.floor((workoutDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
            currentStreak++
          } else if (diffDays === 0) {
            // Same day, don't change streak
            continue
          } else {
            currentStreak = 1
          }
        } else {
          currentStreak = 1
        }
        
        longestStreak = Math.max(longestStreak, currentStreak)
        lastDate = workoutDate
      }
      
      // Update user document with recalculated streak
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        streak: currentStreak,
        longest_streak: longestStreak,
        updated_at: serverTimestamp(),
      })
      
      return { streak: currentStreak, longest_streak: longestStreak }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      await qc.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}