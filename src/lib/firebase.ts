import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, initializeFirestore } from 'firebase/firestore'

type FirebaseEnvKey =
  | 'VITE_FIREBASE_API_KEY'
  | 'VITE_FIREBASE_AUTH_DOMAIN'
  | 'VITE_FIREBASE_PROJECT_ID'
  | 'VITE_FIREBASE_STORAGE_BUCKET'
  | 'VITE_FIREBASE_MESSAGING_SENDER_ID'
  | 'VITE_FIREBASE_APP_ID'

function readRequiredEnv(name: FirebaseEnvKey): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${name}`)
  }
  return value
}

const firebaseConfig = {
  apiKey:            readRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain:        readRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId:         readRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket:     readRequiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readRequiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId:             readRequiredEnv('VITE_FIREBASE_APP_ID'),
}

const shouldInitializeApp = getApps().length === 0
const app = shouldInitializeApp ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)

// Fixed: Removed 'useFetchStreams' - it doesn't exist in Firestore settings
export const db = shouldInitializeApp
  ? initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
      // useFetchStreams: false, // ← REMOVE THIS LINE - property doesn't exist
    })
  : getFirestore(app)

auth.useDeviceLanguage()