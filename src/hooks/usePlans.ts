import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { useAuth } from '../auth/AuthProvider'
import { exercises, type Exercise } from '../data/exercises'
import { db } from '../lib/firebase'

type PlanExercise = {
  exercise_id: string
  exercise_name: string
  sets: number
  reps_target: string
  order_index: number
}

type PlanDay = {
  day_of_week: number
  name: string
  is_rest_day: boolean
  exercises: PlanExercise[]
}

type GeneratePlanResult = {
  id: string
  name: string
  description: string
  days_per_week: number
  goal: string | null
  is_ai_generated: boolean
  is_active: boolean
  days: PlanDay[]
}

type PlanTemplate = {
  day_of_week: number
  name: string
  muscles: Exercise['muscle_group'][]
}

function matchesEquipment(preference: string | null | undefined, equipment: Exercise['equipment']) {
  switch (preference) {
    case 'bodyweight':
      return equipment === 'bodyweight' || equipment === 'resistance_band'
    case 'dumbbells':
      return equipment === 'dumbbell' || equipment === 'bodyweight' || equipment === 'resistance_band'
    case 'home_gym':
      return ['barbell', 'dumbbell', 'kettlebell', 'bodyweight', 'resistance_band', 'smith_machine'].includes(equipment)
    default:
      return true
  }
}

function repTargetFor(goal: string | null | undefined, category: Exercise['category']) {
  if (goal === 'get_stronger') return category === 'compound' ? '4-6' : '8-10'
  if (goal === 'lose_fat') return category === 'compound' ? '8-10' : '10-15'
  if (goal === 'general_fitness') return category === 'compound' ? '6-10' : '10-12'
  return category === 'compound' ? '6-8' : '10-15'
}

function pickExercises(
  muscles: Exercise['muscle_group'][],
  count: number,
  goal: string | null | undefined,
  equipment: string | null | undefined,
): PlanExercise[] {
  const matching = exercises.filter(
    (exercise) => muscles.includes(exercise.muscle_group) && matchesEquipment(equipment, exercise.equipment),
  )
  const fallback = exercises.filter((exercise) => muscles.includes(exercise.muscle_group))
  const pool = (matching.length >= count ? matching : fallback).slice(0, count)

  return pool.map((exercise, index) => ({
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    sets: exercise.category === 'compound' ? 4 : 3,
    reps_target: repTargetFor(goal, exercise.category),
    order_index: index,
  }))
}

function buildSuggestedPlan(profile: {
  days_per_week?: number | null
  goal?: string | null
  equipment?: string | null
}): Omit<GeneratePlanResult, 'id' | 'is_ai_generated' | 'is_active'> {
  const daysPerWeek = Math.min(5, Math.max(3, Number(profile.days_per_week ?? 3)))
  const goal = profile.goal ?? 'build_muscle'

  const templatesByDays: Record<number, PlanTemplate[]> = {
    3: [
      { day_of_week: 1, name: 'Full Body A', muscles: ['chest', 'back', 'legs'] },
      { day_of_week: 3, name: 'Upper Focus', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { day_of_week: 5, name: 'Lower + Core', muscles: ['legs', 'core', 'full_body'] },
    ],
    4: [
      { day_of_week: 1, name: 'Upper A', muscles: ['chest', 'back', 'shoulders'] },
      { day_of_week: 2, name: 'Lower A', muscles: ['legs', 'core'] },
      { day_of_week: 4, name: 'Upper B', muscles: ['back', 'chest', 'arms'] },
      { day_of_week: 6, name: 'Lower B', muscles: ['legs', 'full_body', 'core'] },
    ],
    5: [
      { day_of_week: 1, name: 'Push', muscles: ['chest', 'shoulders', 'arms'] },
      { day_of_week: 2, name: 'Pull', muscles: ['back', 'arms', 'core'] },
      { day_of_week: 3, name: 'Legs', muscles: ['legs', 'core'] },
      { day_of_week: 5, name: 'Upper Mix', muscles: ['chest', 'back', 'shoulders'] },
      { day_of_week: 6, name: 'Lower + Conditioning', muscles: ['legs', 'full_body', 'cardio'] },
    ],
  }

  const templates = templatesByDays[daysPerWeek] ?? templatesByDays[3]

  const days: PlanDay[] = Array.from({ length: 7 }, (_, index) => {
    const dayOfWeek = index + 1
    const template = templates.find((item) => item.day_of_week === dayOfWeek)

    if (!template) {
      return {
        day_of_week: dayOfWeek,
        name: 'Recovery',
        is_rest_day: true,
        exercises: [],
      }
    }

    return {
      day_of_week: dayOfWeek,
      name: template.name,
      is_rest_day: false,
      exercises: pickExercises(template.muscles, 5, goal, profile.equipment ?? null),
    }
  })

  const goalLabel =
    goal === 'get_stronger'
      ? 'Strength'
      : goal === 'lose_fat'
        ? 'Fat Loss'
        : goal === 'general_fitness'
          ? 'Fitness'
          : 'Hypertrophy'

  return {
    name: `${goalLabel} ${daysPerWeek}-Day Plan`,
    description: `Auto-generated from your FitForge profile for ${daysPerWeek} training day(s) per week.`,
    days_per_week: daysPerWeek,
    goal: profile.goal ?? null,
    days,
  }
}

export function usePlans() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['plans', user?.uid],
    enabled: Boolean(user?.uid),
    queryFn: async () => {
      if (!user?.uid) throw new Error('Not signed in')

      const plansRef = collection(db, 'users', user.uid, 'plans')
      const plansQuery = query(plansRef, orderBy('created_at', 'desc'))
      const snap = await getDocs(plansQuery)

      return snap.docs.map((planDoc) => ({
        id: planDoc.id,
        ...(planDoc.data() as Record<string, unknown>),
      }))
    },
  })
}

export function useActivatePlan() {
  const qc = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!user?.uid) throw new Error('Not signed in')

      const plansRef = collection(db, 'users', user.uid, 'plans')
      const snap = await getDocs(plansRef)
      const batch = writeBatch(db)

      snap.docs.forEach((planDoc) => {
        batch.update(planDoc.ref, {
          is_active: planDoc.id === planId,
          updated_at: serverTimestamp(),
        })
      })

      await batch.commit()
      return { id: planId }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

export function useGeneratePlan() {
  const qc = useQueryClient()
  const { user, profile } = useAuth()

  return useMutation({
    mutationFn: async (): Promise<GeneratePlanResult> => {
      if (!user?.uid) throw new Error('Not signed in')

      const plan = buildSuggestedPlan({
        days_per_week: profile?.days_per_week ?? 3,
        goal: profile?.goal ?? null,
        equipment: profile?.equipment ?? null,
      })

      const plansRef = collection(db, 'users', user.uid, 'plans')
      const existingPlans = await getDocs(plansRef)
      const batch = writeBatch(db)

      existingPlans.docs.forEach((planDoc) => {
        batch.update(planDoc.ref, {
          is_active: false,
          updated_at: serverTimestamp(),
        })
      })

      await batch.commit()

      const ref = await addDoc(plansRef, {
        ...plan,
        is_active: true,
        is_ai_generated: true,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      return {
        id: ref.id,
        ...plan,
        is_active: true,
        is_ai_generated: true,
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}
