import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

type FormState = {
  first_name: string
  last_name: string
  age: string
  gender: string
  weight_kg: string
  height_cm: string
  experience: string
  days_per_week: string
  goal: string
  equipment: string
}

const GOALS = [
  { value: 'build_muscle',    icon: '💪', label: 'Build Muscle',    desc: 'Hypertrophy & size' },
  { value: 'get_stronger',    icon: '🏋️', label: 'Get Stronger',    desc: 'Strength & PRs' },
  { value: 'lose_fat',        icon: '🔥', label: 'Lose Fat',         desc: 'Body recomposition' },
  { value: 'general_fitness', icon: '⚡', label: 'General Fitness', desc: 'Health & consistency' },
]

const EQUIPMENT = [
  { value: 'full_gym',   label: 'Full Gym' },
  { value: 'home_gym',   label: 'Home Gym' },
  { value: 'dumbbells',  label: 'Dumbbells Only' },
  { value: 'bodyweight', label: 'Bodyweight Only' },
]

const EXPERIENCE = [
  { value: 'beginner',     label: 'Beginner',     sub: 'Under 1 year' },
  { value: 'intermediate', label: 'Intermediate', sub: '1–3 years' },
  { value: 'advanced',     label: 'Advanced',     sub: '3+ years' },
]

const EMPTY_FORM: FormState = {
  first_name: '', last_name: '', age: '', gender: '',
  weight_kg: '', height_cm: '', experience: '',
  days_per_week: '', goal: '', equipment: '',
}

export function ProfilePage() {
  const { user, profile, loading, loadProfile } = useAuth()
  const { updateProfile } = useAuth()

  const [form, setForm]     = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [saved, setSaved]   = useState(false)
  const [section, setSection] = useState<'personal' | 'training'>('personal')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!profile) return
    setForm({
      first_name:    profile.first_name    ?? '',
      last_name:     profile.last_name     ?? '',
      age:           profile.age      == null ? '' : String(profile.age),
      gender:        profile.gender        ?? '',
      weight_kg:     profile.weight_kg == null ? '' : String(profile.weight_kg),
      height_cm:     profile.height_cm == null ? '' : String(profile.height_cm),
      experience:    profile.experience    ?? '',
      days_per_week: profile.days_per_week == null ? '' : String(profile.days_per_week),
      goal:          profile.goal          ?? '',
      equipment:     profile.equipment     ?? '',
    })
  }, [profile])

  useEffect(() => {
    if (loading || !user?.uid || profile) return
    void loadProfile(user.uid)
  }, [loading, user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  function set<K extends keyof FormState>(key: K, val: string) {
    setForm(s => ({ ...s, [key]: val }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile({
        first_name:    form.first_name.trim()     || null,
        last_name:     form.last_name.trim()      || null,
        age:           form.age           ? Number(form.age)           : null,
        gender:        form.gender.trim()          || null,
        weight_kg:     form.weight_kg     ? Number(form.weight_kg)     : null,
        height_cm:     form.height_cm     ? Number(form.height_cm)     : null,
        experience:    form.experience.trim()      || null,
        days_per_week: form.days_per_week ? Number(form.days_per_week) : null,
        goal:          form.goal.trim()            || null,
        equipment:     form.equipment.trim()       || null,
      })
      setSaved(true)
      saveTimer.current = setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = [form.first_name[0], form.last_name[0]]
    .filter(Boolean).join('').toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  const completionFields = [
    form.first_name, form.last_name, form.age, form.gender,
    form.weight_kg, form.height_cm, form.experience,
    form.days_per_week, form.goal, form.equipment,
  ]
  const completion = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100,
  )

  if (loading) {
    return (
      <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.orange, fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: '0.08em' }}>
          Loading profile…
        </div>
      </div>
    )
  }

  return (
    /*
     * id="page-profile-shell" — lets the CSS media query override
     * height/overflow on mobile. The inline styles intentionally omit
     * height:'100%' and overflow:'hidden' so that the page scrolls
     * naturally on small screens without needing !important overrides.
     */
    <div style={styles.page} id="page-profile-shell">

      {/* ── TOP HEADER ─────────────────────────────── */}
      <div style={styles.header} id="page-profile-header">
        <div style={styles.headerLeft}>
          <div style={styles.headerLabel}>PROFILE</div>
          <h1 style={styles.headerTitle}>
            {form.first_name || form.last_name
              ? `${form.first_name} ${form.last_name}`.trim()
              : 'Your Profile'}
          </h1>
          <div style={styles.headerEmail}>{user?.email}</div>
        </div>

        <div style={styles.headerRight}>
          {error && <div style={styles.errorPill}>{error}</div>}
          <button
            style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnLoading : {}) }}
            type="button"
            disabled={!user || saving}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── BODY GRID ──────────────────────────────── */}
      <div style={styles.body} id="page-profile-body">

        {/* LEFT COLUMN */}
        <div style={styles.leftCol} id="page-profile-leftcol">

          {/* Avatar card */}
          <div style={styles.avatarCard}>
            <div style={styles.avatarRing}>
              <div style={styles.avatar}>{initials}</div>
            </div>
            <div style={styles.avatarName}>
              {form.first_name || form.last_name
                ? `${form.first_name} ${form.last_name}`.trim()
                : 'Your Name'}
            </div>
            <div style={styles.avatarEmail}>{user?.email ?? '—'}</div>

            {/* Completion bar */}
            <div style={styles.completionWrap}>
              <div style={styles.completionTop}>
                <span style={styles.completionLabel}>Profile completion</span>
                <span style={styles.completionPct}>{completion}%</span>
              </div>
              <div style={styles.completionTrack}>
                <div style={{ ...styles.completionFill, width: `${completion}%` }} />
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div style={styles.sectionTabs}>
            {(['personal', 'training'] as const).map(s => (
              <button
                key={s}
                type="button"
                style={{
                  ...styles.sectionTab,
                  ...(section === s ? styles.sectionTabActive : {}),
                }}
                onClick={() => setSection(s)}
              >
                <span style={styles.sectionTabIcon}>{s === 'personal' ? '◉' : '⚡'}</span>
                {s === 'personal' ? 'Personal Info' : 'Training'}
              </button>
            ))}
          </div>

          {/* Quick stats */}
          <div style={styles.quickStats}>
            {[
              { label: 'Experience', value: form.experience || '—' },
              { label: 'Goal',       value: form.goal?.replace('_', ' ') || '—' },
              { label: 'Days / wk',  value: form.days_per_week || '—' },
            ].map(stat => (
              <div key={stat.label} style={styles.quickStat}>
                <div style={styles.quickStatLabel}>{stat.label}</div>
                <div style={styles.quickStatValue}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightCol} id="page-profile-rightcol">

          {/* ── PERSONAL INFO ── */}
          {section === 'personal' && (
            <div style={styles.formSection} id="page-profile-formsection">
              <div style={styles.formSectionHeader}>
                <div style={styles.formSectionTitle}>Personal Info</div>
                <div style={styles.formSectionSub}>Your basic details</div>
              </div>

              {/*
               * id="page-profile-fieldrow" on every fieldRow div so the
               * CSS media query can collapse the 2-col grid to 1-col on mobile.
               */}
              <div style={styles.fieldRow} id="page-profile-fieldrow">
                <Field label="First Name">
                  <input
                    style={styles.input}
                    value={form.first_name}
                    onChange={e => set('first_name', e.target.value)}
                    placeholder="Tunde"
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Last Name">
                  <input
                    style={styles.input}
                    value={form.last_name}
                    onChange={e => set('last_name', e.target.value)}
                    placeholder="Bello"
                    autoComplete="family-name"
                  />
                </Field>
              </div>

              <div style={styles.fieldRow} id="page-profile-fieldrow">
                <Field label="Age">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.age}
                    onChange={e => set('age', e.target.value)}
                    placeholder="25"
                    min={13} max={80}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    style={styles.select}
                    value={form.gender}
                    onChange={e => set('gender', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </Field>
              </div>

              <div style={styles.fieldRow} id="page-profile-fieldrow">
                <Field label="Weight (kg)">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.weight_kg}
                    onChange={e => set('weight_kg', e.target.value)}
                    placeholder="80"
                    min={30} max={300}
                  />
                </Field>
                <Field label="Height (cm)">
                  <input
                    style={styles.input}
                    type="number"
                    value={form.height_cm}
                    onChange={e => set('height_cm', e.target.value)}
                    placeholder="175"
                    min={100} max={250}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── TRAINING INFO ── */}
          {section === 'training' && (
            <div style={styles.formSection} id="page-profile-formsection">
              <div style={styles.formSectionHeader}>
                <div style={styles.formSectionTitle}>Training Preferences</div>
                <div style={styles.formSectionSub}>
                  Your AI coach uses this to personalise every recommendation
                </div>
              </div>

              <Field label="Experience Level">
                {/*
                 * id="page-profile-optiongrid" so the CSS media query can
                 * collapse to 2-col (mobile) or 1-col (xs) from the 3-col default.
                 */}
                <div style={styles.optionGrid} id="page-profile-optiongrid">
                  {EXPERIENCE.map(exp => (
                    <button
                      key={exp.value}
                      type="button"
                      style={{
                        ...styles.optionCard,
                        ...(form.experience === exp.value ? styles.optionCardActive : {}),
                      }}
                      onClick={() => set('experience', exp.value)}
                    >
                      <div style={styles.optionCardName}>{exp.label}</div>
                      <div style={styles.optionCardSub}>{exp.sub}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Primary Goal">
                <div style={{ ...styles.optionGrid, gridTemplateColumns: 'repeat(2, 1fr)' }} id="page-profile-optiongrid">
                  {GOALS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      style={{
                        ...styles.optionCard,
                        ...(form.goal === g.value ? styles.optionCardActive : {}),
                      }}
                      onClick={() => set('goal', g.value)}
                    >
                      <div style={styles.optionCardIcon}>{g.icon}</div>
                      <div style={styles.optionCardName}>{g.label}</div>
                      <div style={styles.optionCardSub}>{g.desc}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Equipment Available">
                <div style={{ ...styles.optionGrid, gridTemplateColumns: 'repeat(2, 1fr)' }} id="page-profile-optiongrid">
                  {EQUIPMENT.map(eq => (
                    <button
                      key={eq.value}
                      type="button"
                      style={{
                        ...styles.optionCard,
                        ...(form.equipment === eq.value ? styles.optionCardActive : {}),
                        padding: '14px 16px',
                      }}
                      onClick={() => set('equipment', eq.value)}
                    >
                      <div style={styles.optionCardName}>{eq.label}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Training Days Per Week">
                {/* id="page-profile-daybtnrow" so CSS can allow wrapping on xs */}
                <div style={{ display: 'flex', gap: 8 }} id="page-profile-daybtnrow">
                  {['2', '3', '4', '5', '6'].map(d => (
                    <button
                      key={d}
                      type="button"
                      style={{
                        ...styles.dayBtn,
                        ...(form.days_per_week === d ? styles.dayBtnActive : {}),
                      }}
                      onClick={() => set('days_per_week', d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* Bottom save bar */}
          <div style={styles.bottomBar} id="page-profile-bottombar">
            <div style={styles.bottomBarText}>
              {saved
                ? '✓ Profile saved successfully'
                : error
                ? `⚠ ${error}`
                : `${completion}% complete — ${completionFields.filter(Boolean).length} of ${completionFields.length} fields filled`}
            </div>
            <button
              style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnLoading : {}) }}
              type="button"
              disabled={!user || saving}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FIELD WRAPPER ───────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <label style={styles.fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

// ── STYLES ──────────────────────────────────────────────────
const C = {
  black:      '#080808',
  surface:    '#101010',
  surface2:   '#161616',
  surface3:   '#1c1c1c',
  border:     '#222222',
  border2:    '#2a2a2a',
  orange:     '#ff5c1a',
  orangeDim:  'rgba(255,92,26,0.12)',
  orangeGlow: 'rgba(255,92,26,0.35)',
  white:      '#f0ece4',
  mid:        '#888888',
  muted:      '#555555',
  green:      '#22c55e',
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display:       'flex',
    flexDirection: 'column',
    /*
     * Removed: height: '100%' and overflow: 'hidden'
     * These were blocking CSS media-query overrides on mobile.
     * The sidebar/layout shell handles viewport height — the page
     * itself should scroll freely on small screens.
     */
    background:    C.black,
    fontFamily:    "'DM Sans', sans-serif",
    color:         C.white,
  },

  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '24px 36px 20px',
    borderBottom:   `1px solid ${C.border}`,
    background:     C.surface,
    flexShrink:     0,
  },
  headerLeft:  { display: 'flex', flexDirection: 'column', gap: 3 },
  headerLabel: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
    color: C.orange, textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32, letterSpacing: '0.02em', lineHeight: 1,
    margin: 0,
  },
  headerEmail: { fontSize: 13, color: C.muted },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  errorPill: {
    padding: '8px 16px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5',
    fontSize: 13,
  },

  body: { display: 'flex', flex: 1 },
  /*
   * Removed overflow: 'hidden' from body — it was preventing the page
   * from scrolling naturally when the layout goes single-column on mobile.
   */

  leftCol: {
    width:         280,
    minWidth:      280,
    borderRight:   `1px solid ${C.border}`,
    /*
     * Removed overflowY: 'auto' from leftCol — on mobile this column
     * becomes full-width and stacked, so clipping is undesirable.
     * Desktop scroll is handled by the parent .main element.
     */
    padding:       '24px 20px',
    display:       'flex',
    flexDirection: 'column',
    gap:           16,
    background:    C.surface,
  },

  avatarCard: {
    background:    C.surface2,
    border:        `1px solid ${C.border}`,
    padding:       '24px 20px',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           8,
  },
  avatarRing: {
    width: 72, height: 72, borderRadius: '50%',
    background: C.orangeDim,
    border: `2px solid ${C.orange}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatar: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28, color: C.orange, lineHeight: 1,
  },
  avatarName:  { fontSize: 15, fontWeight: 600, textAlign: 'center' },
  avatarEmail: { fontSize: 12, color: C.muted, textAlign: 'center' },
  completionWrap: { width: '100%', marginTop: 12 },
  completionTop: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  completionLabel: { fontSize: 11, color: C.muted },
  completionPct:   { fontSize: 11, color: C.orange, fontWeight: 600 },
  completionTrack: { width: '100%', height: 3, background: C.border2, borderRadius: 2 },
  completionFill:  { height: '100%', borderRadius: 2, background: C.orange, transition: 'width 0.5s ease' },

  sectionTabs: { display: 'flex', flexDirection: 'column', gap: 2 },
  sectionTab: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 16px',
    background: 'transparent', border: 'none',
    color: C.mid, fontSize: 13.5, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', textAlign: 'left',
    borderLeft: `2px solid transparent`,
    transition: 'all 0.15s',
  },
  sectionTabActive: { background: C.orangeDim, borderLeftColor: C.orange, color: C.white },
  sectionTabIcon:   { fontSize: 14, width: 18, textAlign: 'center' },

  quickStats: {
    display: 'flex', flexDirection: 'column', gap: 1,
    borderTop: `1px solid ${C.border}`,
    paddingTop: 16, marginTop: 4,
  },
  quickStat: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: `1px solid ${C.border}`,
  },
  quickStatLabel: { fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' },
  quickStatValue: { fontSize: 13, fontWeight: 500, color: C.white, textTransform: 'capitalize' },

  rightCol: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  /*
   * Added minWidth: 0 — critical for flex children to shrink below content
   * size and prevent horizontal overflow.
   * Removed overflow: 'hidden' — the CSS media query handles this.
   */

  formSection: {
    flex: 1,
    /*
     * Removed overflowY: 'auto' — on mobile this section is full height
     * so clipping it causes content to be unreachable. Page-level scroll
     * handles overflow instead.
     */
    padding: '28px 36px',
    display: 'flex', flexDirection: 'column', gap: 28,
  },
  formSectionHeader: { marginBottom: 4 },
  formSectionTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28, letterSpacing: '0.02em', marginBottom: 4,
  },
  formSectionSub: { fontSize: 13, color: C.mid },

  field:      { display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  fieldRow:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: C.muted,
  },

  input: {
    padding: '12px 16px',
    background: C.surface2, border: `1px solid ${C.border2}`,
    color: C.white, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    outline: 'none', width: '100%', transition: 'border-color 0.2s',
  },
  select: {
    padding: '11px 16px',
    background: C.surface2, border: `1px solid ${C.border2}`,
    color: C.white, fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    outline: 'none', width: '100%', cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
  },

  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  optionCard: {
    padding: '14px 12px',
    background: C.surface2, border: `1px solid ${C.border2}`,
    color: C.mid, fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer', textAlign: 'left' as const,
    transition: 'all 0.2s', display: 'flex',
    flexDirection: 'column' as const, gap: 3,
  },
  optionCardActive: {
    background: C.orangeDim,
    border: `1px solid rgba(255,92,26,0.4)`,
    color: C.white,
  },
  optionCardIcon: { fontSize: 20, marginBottom: 4 },
  optionCardName: { fontSize: 13, fontWeight: 600 },
  optionCardSub:  { fontSize: 11, color: C.muted },

  dayBtn: {
    width: 48, height: 48,
    background: C.surface2, border: `1px solid ${C.border2}`,
    color: C.mid, fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 20, cursor: 'pointer', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dayBtnActive: { background: C.orange, borderColor: C.orange, color: '#000' },

  saveBtn: {
    padding: '10px 28px',
    background: C.orange, color: '#000',
    border: 'none', fontFamily: "'DM Sans', sans-serif",
    fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase' as const, cursor: 'pointer',
    clipPath: 'polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%)',
    transition: 'all 0.2s',
  },
  saveBtnLoading: { opacity: 0.6, cursor: 'not-allowed' },

  bottomBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 36px',
    borderTop: `1px solid ${C.border}`,
    background: C.surface,
    flexShrink: 0,
  },
  bottomBarText: { fontSize: 13, color: C.muted },
}