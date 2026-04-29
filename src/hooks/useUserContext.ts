// hooks/useUserContext.ts
import { useAuth } from '../auth/AuthProvider'
import { useDashboardStats } from './useWorkouts'
import { useProgressData } from './useProgress'

export function useUserContext() {
  const { user, profile } = useAuth()
  const { data: stats } = useDashboardStats()
  const { data: progress } = useProgressData(8) // Last 8 weeks

  // Get recent workouts (last 5)
  const recentWorkouts = progress?.weeklyVolume 
    ? Object.entries(progress.weeklyVolume).slice(-5).map(([week, volume]) => ({ week, volume }))
    : []

  // Get top 5 PRs
  const topPRs = stats?.personalRecords 
    ? (stats.personalRecords as any[])
        .sort((a, b) => b.weight_kg - a.weight_kg)
        .slice(0, 5)
    : []

  // Calculate recent performance trend
  const recentVolumes = Object.values(progress?.weeklyVolume || {}).slice(-4)
  const volumeTrend = recentVolumes.length === 4 && recentVolumes[0] > 0
    ? ((recentVolumes[3] - recentVolumes[0]) / recentVolumes[0]) * 100
    : 0

  // Find weakest muscle group (lowest volume)
  const muscleVolume = progress?.muscleVolume || {}
  const muscleEntries = Object.entries(muscleVolume)
  const weakestMuscle = muscleEntries.length > 0 
    ? muscleEntries.reduce((a, b) => (a[1] < b[1] ? a : b))[0]
    : null

  // Find strongest muscle group (highest volume)
  const strongestMuscle = muscleEntries.length > 0 
    ? muscleEntries.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
    : null

  return {
    // User identity
    name: profile?.first_name || user?.email?.split('@')[0] || 'Athlete',
    experience: profile?.experience || 'not set',
    goal: profile?.goal || 'not set',
    equipment: profile?.equipment || 'not set',
    daysPerWeek: profile?.days_per_week || 3,
    
    // Performance stats
    totalVolume: stats?.volumeThisMonth || 0,
    totalWorkouts: stats?.workoutsThisMonth || 0,
    currentStreak: stats?.streak || 0,
    volumeTrend: volumeTrend,
    
    // PRs
    topPRs: topPRs,
    totalPRs: topPRs.length,
    
    // Weaknesses/Strengths
    weakestMuscle: weakestMuscle,
    strongestMuscle: strongestMuscle,
    
    // Recent activity
    recentWorkouts: recentWorkouts,
    hasWorkouts: (stats?.workoutsThisMonth || 0) > 0,
    
    // Formatted for AI prompt
    getContextPrompt: () => {
      const prList = topPRs.map(pr => `- ${pr.exercise_name}: ${pr.weight_kg}kg x ${pr.reps} reps`).join('\n')
      const workoutList = recentWorkouts.map(w => `- ${w.week}: ${Math.round(w.volume)}kg volume`).join('\n')
      
      return `
USER CONTEXT:
- Name: ${profile?.first_name || 'Athlete'}
- Experience: ${profile?.experience || 'Not specified'}
- Goal: ${profile?.goal?.replace(/_/g, ' ') || 'Not specified'}
- Equipment: ${profile?.equipment?.replace(/_/g, ' ') || 'Not specified'}
- Training days/week: ${profile?.days_per_week || 'Not specified'}

PERFORMANCE:
- Total volume this month: ${Math.round(stats?.volumeThisMonth || 0)}kg
- Workouts this month: ${stats?.workoutsThisMonth || 0}
- Current streak: ${stats?.streak || 0} days
- Volume trend: ${volumeTrend > 0 ? `+${volumeTrend.toFixed(1)}%` : `${volumeTrend.toFixed(1)}%`}

PERSONAL RECORDS:
${prList || 'No PRs yet'}

MUSCLE BALANCE:
- Strongest: ${strongestMuscle || 'Not enough data'}
- Weakest: ${weakestMuscle || 'Not enough data'}

RECENT WORKOUTS:
${workoutList || 'No recent workouts'}
`
    }
  }
}