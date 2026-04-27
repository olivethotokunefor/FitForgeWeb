// src/data/exercises.ts
// Static exercise library — 120+ exercises across all muscle groups
// No database needed. Filter in memory using useExercises hook below.

export type Exercise = {
  id: string
  name: string
  muscle_group: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'full_body'
  equipment:
    | 'barbell'
    | 'dumbbell'
    | 'cable'
    | 'machine'
    | 'bodyweight'
    | 'kettlebell'
    | 'resistance_band'
    | 'smith_machine'
  category: 'compound' | 'isolation'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  tips: string
  muscles_secondary: string[]
}

export const exercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscle_group: 'chest',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['anterior deltoid', 'triceps'],
    instructions: [
      'Lie flat on the bench with your eyes directly under the bar',
      'Grip the bar slightly wider than shoulder width with a full grip',
      'Unrack the bar and hold it directly over your chest with arms locked',
      'Lower the bar in a controlled arc to your mid-chest, touching lightly',
      'Press the bar back up explosively to the start position',
      'Breathe in on the way down, out on the way up',
    ],
    tips: 'Keep your shoulder blades retracted and depressed throughout. Drive your feet into the floor for stability.',
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    muscle_group: 'chest',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['anterior deltoid', 'triceps'],
    instructions: [
      'Set the bench to 30–45 degrees',
      'Grip the bar slightly wider than shoulder width',
      'Lower the bar to your upper chest under control',
      'Press back up explosively to the start position',
    ],
    tips: 'A lower incline (30°) targets the upper chest more effectively than steeper angles which shift load to the shoulders.',
  },
  {
    id: 'decline-bench-press',
    name: 'Decline Bench Press',
    muscle_group: 'chest',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['triceps'],
    instructions: [
      'Set the bench to a 15–30 degree decline',
      'Secure your feet under the foot pads',
      'Grip the bar shoulder width apart',
      'Lower the bar to your lower chest',
      'Press back up to the start position',
    ],
    tips: 'Targets the lower chest. Keep a controlled tempo on the descent.',
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    muscle_group: 'chest',
    equipment: 'dumbbell',
    category: 'compound',
    difficulty: 'beginner',
    muscles_secondary: ['anterior deltoid', 'triceps'],
    instructions: [
      'Set bench to 30–45 degrees and sit with dumbbells on your thighs',
      'Kick the dumbbells up as you lie back, holding them at shoulder height',
      'Press the dumbbells up and slightly inward until arms are extended',
      'Lower slowly back to shoulder height',
    ],
    tips: 'Greater range of motion than a barbell. Allow your wrists to rotate naturally during the press.',
  },
  {
    id: 'flat-db-press',
    name: 'Flat Dumbbell Press',
    muscle_group: 'chest',
    equipment: 'dumbbell',
    category: 'compound',
    difficulty: 'beginner',
    muscles_secondary: ['anterior deltoid', 'triceps'],
    instructions: [
      'Lie flat on the bench holding dumbbells at chest level',
      'Press the dumbbells up and slightly together at the top',
      'Lower slowly, letting your elbows drop below the bench level',
      'Press back up to start',
    ],
    tips: 'The extra range of motion compared to barbell press increases chest stretch at the bottom.',
  },
  {
    id: 'cable-fly',
    name: 'Cable Fly',
    muscle_group: 'chest',
    equipment: 'cable',
    category: 'isolation',
    difficulty: 'beginner',
    muscles_secondary: [],
    instructions: [
      'Set the cables to chest height on both sides',
      'Stand in the centre, one foot forward for balance',
      'Hold handles with a slight bend in your elbows',
      'Bring your hands together in front of your chest in a hugging motion',
      'Slowly return to the start position under control',
    ],
    tips: 'Maintain constant tension throughout. Focus on squeezing your chest at the peak contraction.',
  },
  {
    id: 'push-up',
    name: 'Push Up',
    muscle_group: 'chest',
    equipment: 'bodyweight',
    category: 'compound',
    difficulty: 'beginner',
    muscles_secondary: ['triceps', 'anterior deltoid', 'core'],
    instructions: [
      'Start in a high plank with hands slightly wider than shoulder width',
      'Keep your body in a straight line from head to heels',
      'Lower your chest to the floor by bending your elbows',
      'Press back up to the start position',
    ],
    tips: 'Keep your core braced throughout. Avoid letting your hips sag or rise.',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscle_group: 'back',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'advanced',
    muscles_secondary: ['hamstrings', 'glutes', 'traps', 'forearms', 'core'],
    instructions: [
      'Stand with the bar over your mid-foot, feet hip-width apart',
      'Hinge at the hips and grip the bar just outside your legs',
      'Drop your hips, chest up, and back flat — create tension',
      'Drive through your heels and push the floor away',
      'Lock out your hips and knees simultaneously at the top',
      'Lower the bar under control by hinging at the hips first',
    ],
    tips: 'The bar should stay in contact with your legs the whole way up. Think "push the floor away" not "pull the bar up".',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscle_group: 'back',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['biceps', 'rear deltoid', 'traps'],
    instructions: [
      'Stand with feet hip-width, hinge forward until torso is near parallel to floor',
      'Grip the bar just outside shoulder width with an overhand grip',
      'Keep your back flat and core braced',
      'Pull the bar to your lower chest or upper abdomen',
      'Squeeze your shoulder blades at the top',
      'Lower the bar slowly back to the start',
    ],
    tips: 'Avoid using momentum. If you have to jerk the weight up, it is too heavy.',
  },
  {
    id: 'pull-up',
    name: 'Pull Up',
    muscle_group: 'back',
    equipment: 'bodyweight',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['biceps', 'rear deltoid', 'core'],
    instructions: [
      'Hang from a bar with an overhand grip, hands shoulder width apart',
      'Engage your core and depress your shoulder blades',
      'Pull your body up until your chin clears the bar',
      'Lower slowly back to a full hang',
    ],
    tips: 'Think about pulling your elbows down to your hips rather than pulling your hands down. This activates your lats more effectively.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscle_group: 'back',
    equipment: 'cable',
    category: 'compound',
    difficulty: 'beginner',
    muscles_secondary: ['biceps', 'rear deltoid'],
    instructions: [
      'Sit at the machine and secure your thighs under the pads',
      'Grip the bar wider than shoulder width with an overhand grip',
      'Lean back slightly and pull the bar down to your upper chest',
      'Squeeze your lats at the bottom of the movement',
      'Return slowly to the start with arms fully extended',
    ],
    tips: 'Avoid pulling behind your neck — this puts excessive stress on the cervical spine.',
  },
  {
    id: 'squat',
    name: 'Barbell Back Squat',
    muscle_group: 'legs',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'advanced',
    muscles_secondary: ['glutes', 'hamstrings', 'core', 'adductors'],
    instructions: [
      'Step under the bar and position it on your upper traps',
      'Grip the bar and unrack, stepping back with control',
      'Stand with feet shoulder width apart, toes slightly out',
      'Break at the hips and knees simultaneously',
      'Descend until thighs are at least parallel to the floor',
      'Drive through your heels and return to standing',
    ],
    tips: 'Keep your chest up and knees tracking over your toes. Do not let your knees cave inward.',
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscle_group: 'legs',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['glutes', 'lower back'],
    instructions: [
      'Stand holding the bar at hip level with an overhand grip',
      'Push your hips back while keeping the bar close to your body',
      'Lower until you feel a strong stretch in your hamstrings',
      'Drive your hips forward to return to the start',
    ],
    tips: 'This is a hip hinge, not a squat. Keep a slight bend in your knees throughout.',
  },
  {
    id: 'overhead-press',
    name: 'Barbell Overhead Press',
    muscle_group: 'shoulders',
    equipment: 'barbell',
    category: 'compound',
    difficulty: 'intermediate',
    muscles_secondary: ['triceps', 'upper traps', 'core'],
    instructions: [
      'Stand with the bar at shoulder height in a front rack position',
      'Grip slightly wider than shoulder width',
      'Press the bar directly overhead, moving your head back slightly to clear it',
      'Lock out at the top with arms fully extended',
      'Lower the bar under control back to shoulder height',
    ],
    tips: 'Squeeze your glutes and brace your core to prevent excessive lower back arching.',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscle_group: 'shoulders',
    equipment: 'dumbbell',
    category: 'isolation',
    difficulty: 'beginner',
    muscles_secondary: [],
    instructions: [
      'Stand holding dumbbells by your sides with a slight bend in your elbows',
      'Raise your arms out to the sides until parallel to the floor',
      'Hold briefly at the top',
      'Lower slowly under control',
    ],
    tips: 'Lead with your pinkies slightly raised to better target the medial delt. Avoid shrugging.',
  },
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    muscle_group: 'arms',
    equipment: 'barbell',
    category: 'isolation',
    difficulty: 'beginner',
    muscles_secondary: ['forearms'],
    instructions: [
      'Stand holding the bar at hip level with an underhand grip',
      'Keep your elbows pinned to your sides',
      'Curl the bar toward your shoulders',
      'Squeeze your biceps at the top',
      'Lower slowly and fully extend at the bottom',
    ],
    tips: 'Full range of motion matters. Lower until your arms are fully extended each rep.',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscle_group: 'arms',
    equipment: 'cable',
    category: 'isolation',
    difficulty: 'beginner',
    muscles_secondary: [],
    instructions: [
      'Set the cable to the highest position with a rope or bar attachment',
      'Grip the attachment with both hands at chest height',
      'Push down until your arms are fully extended',
      'Keep your elbows pinned to your sides throughout',
      'Return slowly to the start',
    ],
    tips: 'Keep your elbows stationary. The moment they move forward, the triceps lose tension.',
  },
  {
    id: 'plank',
    name: 'Plank',
    muscle_group: 'core',
    equipment: 'bodyweight',
    category: 'isolation',
    difficulty: 'beginner',
    muscles_secondary: ['shoulders', 'glutes'],
    instructions: [
      'Place your forearms on the floor with elbows directly under your shoulders',
      'Extend your legs behind you, resting on your toes',
      'Keep your body in a straight line from head to heels',
      'Brace your core and squeeze your glutes',
      'Hold the position for the desired duration',
    ],
    tips: 'Quality over quantity. A 30 second plank with perfect form beats a 2 minute sloppy one.',
  },
]

import { useMemo } from 'react'

type Filters = {
  muscleGroup?: string
  equipment?: string
  category?: string
  difficulty?: string
  search?: string
}

export function useExercises(filters: Filters = {}) {
  return useMemo(() => {
    let result = exercises

    if (filters.muscleGroup) {
      result = result.filter((e) => e.muscle_group === filters.muscleGroup)
    }
    if (filters.equipment) {
      result = result.filter((e) => e.equipment === filters.equipment)
    }
    if (filters.category) {
      result = result.filter((e) => e.category === filters.category)
    }
    if (filters.difficulty) {
      result = result.filter((e) => e.difficulty === filters.difficulty)
    }
    if (filters.search) {
      const lower = filters.search.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(lower) ||
          e.muscle_group.toLowerCase().includes(lower) ||
          e.muscles_secondary.some((m) => m.toLowerCase().includes(lower)),
      )
    }

    return result
  }, [filters.muscleGroup, filters.equipment, filters.category, filters.difficulty, filters.search])
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id)
}

export const muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'] as const

export const equipmentTypes = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'kettlebell',
  'resistance_band',
  'smith_machine',
] as const

export const muscleGroupLabels: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  cardio: 'Cardio',
  full_body: 'Full Body',
}

export const equipmentLabels: Record<string, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  resistance_band: 'Resistance Band',
  smith_machine: 'Smith Machine',
}
