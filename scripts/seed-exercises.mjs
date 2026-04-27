import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
import fs from 'node:fs'
import path from 'node:path'

function loadEnvFileIfPresent() {
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
  ]

  for (const p of candidates) {
    if (!fs.existsSync(p)) continue
    const raw = fs.readFileSync(p, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const k = trimmed.slice(0, idx).trim()
      let v = trimmed.slice(idx + 1).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      if (!(k in process.env)) process.env[k] = v
    }
    break
  }
}

loadEnvFileIfPresent()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

for (const [k, v] of Object.entries(firebaseConfig)) {
  if (!v) {
    console.error(`Missing env var for Firebase config: ${k}. Make sure VITE_FIREBASE_* vars are set.`)
    process.exit(1)
  }
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const exercises = [
  { name: 'Bench Press',       muscle_group: 'chest',     equipment: 'barbell',    category: 'compound',  instructions: ['Lie flat, eyes under bar', 'Grip slightly wider than shoulders', 'Lower bar to mid-chest under control', 'Press up explosively'] },
  { name: 'Incline DB Press',  muscle_group: 'chest',     equipment: 'dumbbell',   category: 'compound',  instructions: ['Set bench to 30-45°', 'Hold dumbbells at shoulder level', 'Press upward and slightly inward', 'Lower slowly to start'] },
  { name: 'Cable Fly',         muscle_group: 'chest',     equipment: 'cable',      category: 'isolation', instructions: ['Set cables to shoulder height', 'Stand between cables with slight forward lean', 'Bring handles together in front of chest', 'Control the return'] },
  { name: 'Pull Up',           muscle_group: 'back',      equipment: 'bodyweight', category: 'compound',  instructions: ['Hang with overhand grip', 'Pull until chin clears bar', 'Keep core tight', 'Lower slowly to full hang'] },
  { name: 'Barbell Row',       muscle_group: 'back',      equipment: 'barbell',    category: 'compound',  instructions: ['Hinge at hips, back flat', 'Grip bar shoulder width', 'Pull to lower chest', 'Lower under control'] },
  { name: 'Deadlift',          muscle_group: 'back',      equipment: 'barbell',    category: 'compound',  instructions: ['Bar over mid-foot', 'Hinge and grip just outside legs', 'Keep back flat, drive through heels', 'Lock out fully at top'] },
  { name: 'Lat Pulldown',      muscle_group: 'back',      equipment: 'cable',      category: 'compound',  instructions: ['Sit at machine, grab wide bar', 'Pull bar down to upper chest', 'Lean back slightly', 'Control return'] },
  { name: 'Squat',             muscle_group: 'legs',      equipment: 'barbell',    category: 'compound',  instructions: ['Bar on upper traps, feet shoulder width', 'Break at hips and knees simultaneously', 'Drive knees out, descend to parallel', 'Drive through heels back to top'] },
  { name: 'Romanian Deadlift', muscle_group: 'legs',      equipment: 'barbell',    category: 'compound',  instructions: ['Hold bar at hip level', 'Hinge keeping bar close to body', 'Lower until hamstring stretch', 'Drive hips forward to return'] },
  { name: 'Leg Press',         muscle_group: 'legs',      equipment: 'machine',    category: 'compound',  instructions: ['Feet shoulder width on platform', 'Lower platform slowly', 'Do not lock knees at top', 'Keep lower back pressed to seat'] },
  { name: 'Leg Curl',          muscle_group: 'legs',      equipment: 'machine',    category: 'isolation', instructions: ['Lie face down on machine', 'Curl weight toward glutes', 'Hold briefly at top', 'Lower slowly'] },
  { name: 'Hip Thrust',        muscle_group: 'legs',      equipment: 'barbell',    category: 'compound',  instructions: ['Upper back on bench, bar across hips', 'Drive hips upward squeezing glutes', 'Hold one second at top', 'Lower toward floor'] },
  { name: 'Overhead Press',    muscle_group: 'shoulders', equipment: 'barbell',    category: 'compound',  instructions: ['Bar at shoulders, grip slightly wider', 'Press directly overhead', 'Lock out at top', 'Lower under control to shoulders'] },
  { name: 'Lateral Raise',     muscle_group: 'shoulders', equipment: 'dumbbell',   category: 'isolation', instructions: ['Stand holding dumbbells at sides', 'Raise arms out to shoulder height', 'Slight bend at elbows', 'Lower slowly'] },
  { name: 'Face Pull',         muscle_group: 'shoulders', equipment: 'cable',      category: 'isolation', instructions: ['Set cable at head height with rope', 'Pull rope to face, elbows flaring out', 'External rotate at end', 'Control return'] },
  { name: 'Seated DB Press',   muscle_group: 'shoulders', equipment: 'dumbbell',   category: 'compound',  instructions: ['Sit upright, dumbbells at shoulders', 'Press overhead until arms extended', 'Lower slowly to shoulders', 'Keep back straight'] },
  { name: 'Bicep Curl',        muscle_group: 'arms',      equipment: 'barbell',    category: 'isolation', instructions: ['Stand, bar at hip level, underhand grip', 'Curl toward shoulders keeping elbows fixed', 'Squeeze at top', 'Lower fully'] },
  { name: 'Hammer Curl',       muscle_group: 'arms',      equipment: 'dumbbell',   category: 'isolation', instructions: ['Hold dumbbells neutral grip', 'Curl toward shoulder without rotating wrist', 'Squeeze at top', 'Lower fully'] },
  { name: 'Tricep Pushdown',   muscle_group: 'arms',      equipment: 'cable',      category: 'isolation', instructions: ['Grip rope or bar at chest height', 'Push down until arms fully extended', 'Keep elbows pinned to sides', 'Control return'] },
  { name: 'Skull Crusher',     muscle_group: 'arms',      equipment: 'barbell',    category: 'isolation', instructions: ['Lie on bench, bar above chest', 'Lower toward forehead bending at elbows only', 'Extend back to start', 'Keep upper arms vertical'] },
  { name: 'Dips',              muscle_group: 'arms',      equipment: 'bodyweight', category: 'compound',  instructions: ['Support on parallel bars', 'Lower until upper arms parallel to floor', 'Press back to start', 'Keep core tight'] },
  { name: 'Chin Up',           muscle_group: 'arms',      equipment: 'bodyweight', category: 'compound',  instructions: ['Hang with underhand grip', 'Pull until chin clears bar', 'Lower slowly', 'Full arm extension at bottom'] },
  { name: 'Plank',             muscle_group: 'core',      equipment: 'bodyweight', category: 'isolation', instructions: ['Forearms and toes on floor', 'Keep body straight head to heels', 'Brace core and glutes', 'Hold position'] },
  { name: 'Cable Crunch',      muscle_group: 'core',      equipment: 'cable',      category: 'isolation', instructions: ['Kneel below cable with rope', 'Flex at waist curling elbows to knees', 'Squeeze abs at bottom', 'Return under control'] },
  { name: 'Leg Raise',         muscle_group: 'core',      equipment: 'bodyweight', category: 'isolation', instructions: ['Lie flat or hang from bar', 'Raise legs to 90 degrees', 'Lower slowly without touching floor', 'Keep lower back pressed down'] },
  { name: 'Calf Raise',        muscle_group: 'legs',      equipment: 'bodyweight', category: 'isolation', instructions: ['Stand on edge with balls of feet', 'Rise fully onto toes', 'Pause at top', 'Lower slowly past start'] },
  { name: 'Incline Bench',     muscle_group: 'chest',     equipment: 'barbell',    category: 'compound',  instructions: ['Set bench to 30-45°', 'Grip slightly wider than shoulders', 'Lower to upper chest', 'Press back to start'] },
  { name: 'Cable Row',         muscle_group: 'back',      equipment: 'cable',      category: 'compound',  instructions: ['Sit at row machine', 'Pull handle to lower chest', 'Squeeze shoulder blades', 'Return under control'] },
  { name: 'Front Raise',       muscle_group: 'shoulders', equipment: 'dumbbell',   category: 'isolation', instructions: ['Hold dumbbells in front of thighs', 'Raise to shoulder height', 'Slight elbow bend', 'Lower slowly'] },
  { name: 'Russian Twist',     muscle_group: 'core',      equipment: 'bodyweight', category: 'isolation', instructions: ['Sit with knees bent, lean back slightly', 'Hold hands together or hold weight', 'Rotate torso side to side', 'Keep feet off ground for more difficulty'] },
]

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

async function seed() {
  console.log('Seeding exercises...')
  const exercisesRef = collection(db, 'exercises')
  for (const exercise of exercises) {
    const id = slugify(exercise.name)
    await setDoc(doc(exercisesRef, id), exercise, { merge: true })
    console.log('Added:', exercise.name)
  }
  console.log('Done.')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
