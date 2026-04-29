import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useEffect, useMemo, useRef, useState } from 'react'
import '../app-ui.css'

function NavItem({
  to,
  label,
  icon,
  badge,
  onClick,
}: {
  to: string
  label: string
  icon: string
  badge?: string
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      onClick={onClick}
    >
      <div className="nav-icon">{icon}</div>
      <div className="nav-label">{label}</div>
      {badge ? <div className="nav-badge">{badge}</div> : null}
    </NavLink>
  )
}

export function AppShell() {
  const { user, signOut, profile, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const appRef = useRef<HTMLDivElement>(null)

  const [navOpen, setNavOpen] = useState(false)

  // Close nav on route change
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Sync data-nav-open attribute for CSS
  useEffect(() => {
    const el = appRef.current
    if (!el) return
    if (navOpen) {
      el.setAttribute('data-nav-open', '')
    } else {
      el.removeAttribute('data-nav-open')
    }
  }, [navOpen])

  // Close nav on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const topbarTitle = useMemo(() => {
    const p = location.pathname
    if (p.startsWith('/app/dashboard')) return 'Dashboard'
    if (p.startsWith('/app/workouts/new')) return 'Log Workout'
    if (p.startsWith('/app/progress')) return 'Progress'
    if (p.startsWith('/app/coach')) return 'AI Coach'
    if (p.startsWith('/app/plans')) return 'Training Plans'
    if (p.startsWith('/app/exercises') || p.startsWith('/app/library')) return 'Exercise Library'
    if (p.startsWith('/app/profile')) return 'Profile'
    return 'FitForge'
  }, [location.pathname])

  const userInitial = useMemo(() => {
    if (profile?.first_name) return profile.first_name.charAt(0).toUpperCase()
    if (profile?.last_name) return profile.last_name.charAt(0).toUpperCase()
    const email = user?.email ?? ''
    const ch = email.trim().charAt(0)
    return ch ? ch.toUpperCase() : 'U'
  }, [user?.email, profile])

  const userDisplayName = useMemo(() => {
    if (profile?.first_name) return profile.first_name
    if (profile?.last_name) return profile.last_name
    const email = user?.email ?? ''
    return email.split('@')[0] || 'User'
  }, [user?.email, profile])

  // Get real streak from profile
  const streak = profile?.streak ?? 0

  const closeNav = () => setNavOpen(false)

  return (
    <div className="app" ref={appRef}>

      {/* ── Hamburger button (mobile only, shown via CSS) ── */}
      <button
        type="button"
        className="nav-toggle"
        aria-label={navOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={navOpen}
        onClick={() => setNavOpen(v => !v)}
      >
        {navOpen ? '✕' : '☰'}
      </button>

      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="sidebar-logo">
          Fit<span>Forge</span>
        </div>

        <div className="sidebar-section-label">Main</div>
        <NavItem to="/app/dashboard"    label="Dashboard"      icon="⊞"  onClick={closeNav} />
        <NavItem to="/app/workouts/new" label="Log Workout"    icon="◉"  badge="Active" onClick={closeNav} />
        <NavItem to="/app/progress"     label="Progress"       icon="↗"  onClick={closeNav} />

        <div className="sidebar-section-label">Tools</div>
        <NavItem to="/app/coach"        label="AI Coach"       icon="⚡" badge="3" onClick={closeNav} />
        <NavItem to="/app/plans"        label="Training Plans" icon="☰"  onClick={closeNav} />
        <NavItem to="/app/exercises"    label="Exercise Library" icon="◈" onClick={closeNav} />

        <div className="sidebar-section-label">Account</div>
        <NavItem to="/app/profile"      label="Profile"        icon="☺"  onClick={closeNav} />

        <div className="sidebar-user">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-info">
            <div className="user-name">{userDisplayName}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* ── Overlay (mobile, closes nav on tap) ── */}
      <div
        className="sidebar-overlay"
        aria-hidden="true"
        onClick={closeNav}
      />

      {/* ── Main content ── */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{topbarTitle}</div>
          <div className="topbar-right">
            <div className="streak-pill">
              {loading ? (
                '🔥 Loading...'
              ) : streak > 0 ? (
                `🔥 ${streak} Day Streak`
              ) : (
                '🔥 Start Your Streak'
              )}
            </div>
            <button
              type="button"
              className="topbar-btn ghost"
              onClick={() => void signOut()}
              title="Sign out"
            >
              Sign Out
            </button>
            <button
              type="button"
              className="topbar-btn"
              onClick={() => navigate('/app/workouts/new')}
            >
              + Log Workout
            </button>
          </div>
        </div>

        <Outlet />
      </div>
    </div>
  )
}