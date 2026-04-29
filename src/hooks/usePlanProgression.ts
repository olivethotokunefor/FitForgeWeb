// hooks/usePlanProgression.ts
import { useCallback } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useProgressData } from './useProgress'

type ProgressionRecommendation = {
  type: 'increase_weight' | 'add_set' | 'swap_exercise' | 'deload' | 'maintain'
  exerciseId: string
  exerciseName: string
  recommendation: string
  details: string
  priority: 'high' | 'medium' | 'low'
}

export function usePlanProgression() {
  const { user } = useAuth()
  const { data: progress } = useProgressData(6) // Last 6 weeks

  const analyzeProgression = useCallback(async (planExercises: Array<{ exercise_id: string; exercise_name: string }>) => {
    if (!user?.uid || !progress?.liftData) return []

    const recommendations: ProgressionRecommendation[] = []
    
    for (const exercise of planExercises) {
      const exerciseData = progress.liftData[exercise.exercise_name]
      if (!exerciseData || exerciseData.length < 3) continue

      // Get last 3 performances
      const recent = exerciseData.slice(-3)
      const volumes = recent.map(s => (s.weight || 0) * (s.reps || 0))
      const avgVolume = volumes.reduce((a,b) => a + b, 0) / volumes.length
      const lastVolume = volumes[volumes.length - 1]
      
      // Calculate trend
      const isImproving = lastVolume > avgVolume * 1.05
      const isStalling = Math.abs(lastVolume - avgVolume) / avgVolume < 0.03
      const isDeclining = lastVolume < avgVolume * 0.95
      
      // Get the last weight used
      const lastWeight = recent[recent.length - 1].weight || 0
      
      if (isImproving) {
        // User is improving - recommend weight increase
        const newWeight = lastWeight + 2.5
        recommendations.push({
          type: 'increase_weight',
          exerciseId: exercise.exercise_id,
          exerciseName: exercise.exercise_name,
          recommendation: `Increase weight on ${exercise.exercise_name}`,
          details: `You've been hitting your reps consistently. Try ${newWeight}kg (up from ${lastWeight}kg) for your next session.`,
          priority: 'high'
        })
      } 
      else if (isStalling && recent.length >= 4) {
        // Stalled for multiple sessions - recommend change
        recommendations.push({
          type: 'swap_exercise',
          exerciseId: exercise.exercise_id,
          exerciseName: exercise.exercise_name,
          recommendation: `Try a variation of ${exercise.exercise_name}`,
          details: `Your progress on ${exercise.exercise_name} has stalled. Try a dumbbell or machine variation for 2-3 weeks.`,
          priority: 'medium'
        })
      }
      else if (isDeclining) {
        // Declining performance - might need deload
        recommendations.push({
          type: 'deload',
          exerciseId: exercise.exercise_id,
          exerciseName: exercise.exercise_name,
          recommendation: `Reduce intensity on ${exercise.exercise_name}`,
          details: `Your performance is declining. Consider a deload week or reducing weight by 10-15%.`,
          priority: 'high'
        })
      }
    }
    
    // Check overall volume trend
    const weeklyVolumes = Object.values(progress.weeklyVolume || {}).slice(-4)
    if (weeklyVolumes.length === 4) {
      const volumeTrend = (weeklyVolumes[3] - weeklyVolumes[0]) / weeklyVolumes[0]
      
      if (volumeTrend > 0.2) {
        recommendations.push({
          type: 'maintain',
          exerciseId: 'overall',
          exerciseName: 'Training volume',
          recommendation: 'Great volume increase! 🔥',
          details: `Your total volume is up ${Math.round(volumeTrend * 100)}%. Keep the momentum going!`,
          priority: 'low'
        })
      } else if (volumeTrend < -0.1) {
        recommendations.push({
          type: 'add_set',
          exerciseId: 'overall',
          exerciseName: 'Training frequency',
          recommendation: 'Add extra sets this week',
          details: `Your volume has dropped. Try adding 1-2 sets to your main lifts.`,
          priority: 'medium'
        })
      }
    }
    
    return recommendations
  }, [user?.uid, progress])

  return { analyzeProgression }
}