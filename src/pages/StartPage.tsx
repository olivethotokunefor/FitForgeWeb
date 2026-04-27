// ─────────────────────────────────────────────────────────────
// StartPage.tsx
// Handles the post-OAuth redirect (?code=...) and the initial
// auth check. Reloads the Firebase token so emailVerified is
// fresh before deciding where to send the user.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, reload } from 'firebase/auth'
import { auth } from '../lib/firebase'
 
export function StartPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'error'>('working')
  const [slow,   setSlow]   = useState(false)
  const [error,  setError]  = useState<string | null>(null)
 
  // FIX: show a "taking longer than usual" hint after 3 s so users
  // aren't left staring at a blank spinner indefinitely.
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 3000)
    return () => clearTimeout(t)
  }, [])
 
  useEffect(() => {
    let cancelled = false
 
    async function run() {
      try {
        await new Promise<void>((resolve) => {
          const unsub = onAuthStateChanged(auth, async (u) => {
            unsub()
            if (cancelled) return
 
            if (u) {
              // FIX: reload the token so emailVerified reflects the latest
              // state — without this, a user who just clicked the verification
              // link will still see emailVerified=false and get redirected back
              // to /auth?verify=1 in a loop.
              try { await reload(u) } catch { /* non-fatal */ }
 
              navigate(
                u.emailVerified ? '/app/dashboard' : '/auth?verify=1',
                { replace: true },
              )
            } else {
              navigate('/auth', { replace: true })
            }
 
            resolve()
          })
        })
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        const anyErr = e as { message?: string; status?: number; code?: string }
        const parts = [
          anyErr?.message ? String(anyErr.message) : 'Sign-in failed',
          anyErr?.status  ? `status=${String(anyErr.status)}`  : null,
          anyErr?.code    ? `code=${String(anyErr.code)}`      : null,
        ].filter(Boolean)
        setError(parts.join(' · '))
      }
    }
 
    void run()
    return () => { cancelled = true }
  }, [navigate])
 
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center">
      <div className="text-center">
        <div className="text-sm text-neutral-300">
          {status === 'error'
            ? 'Could not sign you in'
            : slow
            ? 'Taking longer than usual — check your connection'
            : 'Signing you in…'}
        </div>
        {error ? <div className="mt-2 text-xs text-rose-300">{error}</div> : null}
        {status === 'error' ? (
          <button
            type="button"
            className="mt-4 h-10 rounded-xl bg-neutral-900 px-4 text-sm text-neutral-200 ring-1 ring-neutral-800 hover:bg-neutral-800"
            onClick={() => navigate('/auth', { replace: true })}
          >
            Back to sign in
          </button>
        ) : null}
      </div>
    </div>
  )
}