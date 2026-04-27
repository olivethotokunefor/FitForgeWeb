// ─────────────────────────────────────────────────────────────
// RequireAuth.tsx
// Guards all /app/* routes.
//
// FIX: removed the emailVerified check from here. Checking it
// in a route guard creates a redirect loop — the verification
// link sends users back to /auth, StartPage reloads the token
// and checks emailVerified there, then redirects correctly to
// /app/dashboard. RequireAuth only needs to know: signed in or
// not.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
 
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location          = useLocation()
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
 
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }
 
  // NOTE: emailVerified is intentionally NOT checked here.
  // StartPage.tsx handles the post-verification redirect with a
  // fresh token reload. Checking it here risks a redirect loop.
  return <Outlet />
}