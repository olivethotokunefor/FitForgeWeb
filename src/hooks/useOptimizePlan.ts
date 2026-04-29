// Add to your existing useGeneratePlan or create a new mutation
// hooks/useOptimizePlan.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { usePlanProgression } from './usePlanProgression'

export function useOptimizePlan() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { analyzeProgression } = usePlanProgression()

  return useMutation({
    mutationFn: async ({ planId, exercises }: { planId: string; exercises: Array<{ exercise_id: string; exercise_name: string }> }) => {
      if (!user?.uid) throw new Error('Not signed in')

      // Get AI recommendations based on user's performance
      const recommendations = await analyzeProgression(exercises)
      
      // Store recommendations in the plan document
      const planRef = doc(db, 'users', user.uid, 'plans', planId)
      await updateDoc(planRef, {
        progression_insights: recommendations,
        last_analyzed_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      
      return recommendations
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}