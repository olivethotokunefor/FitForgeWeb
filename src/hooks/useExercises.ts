import { useMemo } from 'react'
import { exercises } from '../data/exercises'

type UseExercisesArgs = {
  muscleGroup?: string
  equipment?: string
  search?: string
}

export function useExercises(args: UseExercisesArgs = {}) {
  const { muscleGroup, equipment, search } = args

  const data = useMemo(() => {
    let result = exercises

    if (muscleGroup) result = result.filter((e) => e.muscle_group === muscleGroup)
    if (equipment) result = result.filter((e) => e.equipment === equipment)

    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.muscle_group.toLowerCase().includes(lower) ||
          e.muscles_secondary.some((m) => m.toLowerCase().includes(lower)),
      )
    }

    return result
  }, [equipment, muscleGroup, search])

  return {
    data,
    isLoading: false,
    isError: false,
    error: null as unknown,
  }
}
