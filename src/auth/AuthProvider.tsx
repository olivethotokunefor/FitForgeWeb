import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  reload,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export type ProfileUpsert = {
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  age?: number | null
  gender?: string | null
  weight_kg?: number | null
  height_cm?: number | null
  experience?: string | null
  days_per_week?: number | null
  goal?: string | null
  equipment?: string | null
  created_at?: string
  updated_at?: string
}

export type ProfileRow = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  age: number | null
  gender: string | null
  weight_kg: number | null
  height_cm: number | null
  experience: string | null
  days_per_week: number | null
  goal: string | null
  equipment: string | null
  created_at?: unknown
  updated_at?: unknown
  streak?: number | null
  last_workout_at?: unknown
  longest_streak?: number | null
}

type AuthContextValue = {
  user: User | null
  profile: ProfileRow | null
  loading: boolean
  signInWithPassword: (args: { email: string; password: string; remember?: boolean }) => Promise<void>
  signUp: (args: { email: string; password: string }) => Promise<void>
  resendVerificationEmail: () => Promise<void>
  resetPasswordForEmail: (args: { email: string }) => Promise<void>
  upsertProfile: (args: ProfileUpsert) => Promise<void>
  updateProfile: (updates: Partial<ProfileUpsert>) => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser]       = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  async function loadProfileById(userId: string) {
    const ref  = doc(db, 'users', userId)
    const snap = await getDoc(ref)
    setProfile(
      snap.exists()
        ? ({ id: userId, ...(snap.data() as Record<string, unknown>) } as ProfileRow)
        : null,
    )
  }

  async function ensureProfileDoc(nextUser: User) {
    const ref  = doc(db, 'users', nextUser.uid)
    const snap = await getDoc(ref)

    const nameParts = (nextUser.displayName ?? '').trim().split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] ?? null
    const lastName  = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

    if (snap.exists()) {
      await setDoc(
        ref,
        { email: nextUser.email ?? null, updated_at: serverTimestamp() },
        { merge: true },
      )
    } else {
      await setDoc(
        ref,
        {
          email:          nextUser.email ?? null,
          first_name:     firstName,
          last_name:      lastName,
          streak:         0,
          longest_streak: 0,
          created_at:     serverTimestamp(),
          updated_at:     serverTimestamp(),
        },
        { merge: true },
      )
    }
  }

  async function flushPendingProfile(userId: string, userEmail: string | undefined) {
    const raw = window.localStorage.getItem('ff_pending_profile')
    if (!raw) return
    try {
      const pending = JSON.parse(raw) as ProfileUpsert
      const ref = doc(db, 'users', userId)
      await setDoc(
        ref,
        {
          email:         pending.email         ?? userEmail ?? null,
          first_name:    pending.first_name    ?? null,
          last_name:     pending.last_name     ?? null,
          age:           pending.age           ?? null,
          gender:        pending.gender        ?? null,
          weight_kg:     pending.weight_kg     ?? null,
          height_cm:     pending.height_cm     ?? null,
          experience:    pending.experience    ?? null,
          days_per_week: pending.days_per_week ?? null,
          goal:          pending.goal          ?? null,
          equipment:     pending.equipment     ?? null,
          updated_at:    serverTimestamp(),
        },
        { merge: true },
      )
      window.localStorage.removeItem('ff_pending_profile')
    } catch {
      // ignore parse failures
    }
  }

  // Handle auth state changes
  useEffect(() => {
    let mounted = true

    const loadingFallback = window.setTimeout(() => {
      if (mounted) setLoading(false)
    }, 4000)

    let unsubscribe = () => {}
    try {
      unsubscribe = onAuthStateChanged(auth, async (newUser: User | null) => {
        if (!mounted) return

        window.clearTimeout(loadingFallback)
        console.log('Auth state changed:', newUser?.email, 'Verified:', newUser?.emailVerified)
        setUser(newUser)

        if (newUser) {
          try {
            await ensureProfileDoc(newUser)
            await flushPendingProfile(newUser.uid, newUser.email ?? undefined)
            await loadProfileById(newUser.uid)
          } catch (err) {
            console.error('Profile setup error:', err)
          }
        } else {
          setProfile(null)
        }

        if (mounted) setLoading(false)
      })
    } catch (err) {
      window.clearTimeout(loadingFallback)
      setLoading(false)
    }

    return () => {
      mounted = false
      window.clearTimeout(loadingFallback)
      unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,

      signInWithPassword: async ({ email, password, remember = false }) => {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
        const result = await signInWithEmailAndPassword(auth, email, password)
        console.log('Sign in result:', result.user.email, 'Verified:', result.user.emailVerified)
      },

      signUp: async ({ email, password }) => {
        await setPersistence(auth, browserLocalPersistence)
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await ensureProfileDoc(cred.user)
        await sendEmailVerification(cred.user, { url: `${window.location.origin}/auth` })
        console.log('Sign up successful, verification email sent to:', email)
      },

      resendVerificationEmail: async () => {
        const u = auth.currentUser
        if (!u) throw new Error('Not signed in')
        await reload(u)
        if (u.emailVerified) return
        await sendEmailVerification(u, { url: `${window.location.origin}/auth` })
      },

      resetPasswordForEmail: async ({ email }) => {
        await sendPasswordResetEmail(auth, email, { url: `${window.location.origin}/auth` })
      },

      upsertProfile: async (args) => {
        const userId    = user?.uid
        const userEmail = user?.email
        if (!userId) throw new Error('Not signed in')
        const ref = doc(db, 'users', userId)
        await setDoc(
          ref,
          {
            email:         args.email         ?? userEmail ?? null,
            first_name:    args.first_name    ?? null,
            last_name:     args.last_name     ?? null,
            age:           args.age           ?? null,
            gender:        args.gender        ?? null,
            weight_kg:     args.weight_kg     ?? null,
            height_cm:     args.height_cm     ?? null,
            experience:    args.experience    ?? null,
            days_per_week: args.days_per_week ?? null,
            goal:          args.goal          ?? null,
            equipment:     args.equipment     ?? null,
            updated_at:    serverTimestamp(),
          },
          { merge: true },
        )
        await loadProfileById(userId)
      },

      updateProfile: async (updates) => {
        const userId = user?.uid
        if (!userId) throw new Error('Not signed in')
        const ref = doc(db, 'users', userId)
        await setDoc(ref, { ...updates, updated_at: serverTimestamp() }, { merge: true })
        await loadProfileById(userId)
      },

      loadProfile: async (userId) => {
        await loadProfileById(userId)
      },

      signOut: async () => {
        await firebaseSignOut(auth)
        setProfile(null)
      },
    }),
    [loading, profile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}