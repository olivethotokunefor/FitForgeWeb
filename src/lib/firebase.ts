import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'  // Remove GoogleAuthProvider
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
export const db = shouldInitializeApp
  ? initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false,
    })
  : getFirestore(app)

// Remove Google Provider entirely
// export const googleProvider = new GoogleAuthProvider()
// googleProvider.setCustomParameters({ prompt: 'select_account' })

auth.useDeviceLanguage()