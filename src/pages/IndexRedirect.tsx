// ─────────────────────────────────────────────────────────────
// IndexRedirect.tsx
// Root "/" — sends authenticated users to the dashboard and
// unauthenticated users to /auth. Shows a slow-connection hint
// after 3 s of loading.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
 
export function IndexRedirect() {
  const { user, loading } = useAuth()
  const [slow, setSlow]   = useState(false)
 
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setSlow(true), 3000)
    return () => clearTimeout(t)
  }, [loading])
 
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 grid place-items-center">
        <div className="text-sm text-neutral-400">
          {slow ? 'Taking longer than usual — check your connection' : 'Loading…'}
        </div>
      </div>
    )
  }
 
  return <Navigate to={user ? '/app/dashboard' : '/auth'} replace />
}
 