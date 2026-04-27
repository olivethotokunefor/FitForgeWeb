import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import '../auth.css'

function useGoogleFonts() {
  useEffect(() => {
    const id = 'ff-auth-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap'
    document.head.appendChild(link)
  }, [])
}

type Tab  = 'signin' | 'signup'
type Step = 1 | 2 | 3
type Goal = 'build_muscle' | 'get_stronger' | 'lose_fat' | 'general_fitness'

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function strengthScore(val: string) {
  let s = 0
  if (val.length >= 8)          s++
  if (/[A-Z]/.test(val))        s++
  if (/[0-9]/.test(val))        s++
  if (/[^A-Za-z0-9]/.test(val)) s++
  return s
}

export function AuthPage() {
  useGoogleFonts()
  const navigate  = useNavigate()
  const location  = useLocation()
  const {
    signInWithPassword,
    signUp,
    resendVerificationEmail,
    resetPasswordForEmail,
    upsertProfile,
    signOut,
    user,
  } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user && user.emailVerified) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [user, navigate])

  // ── Tab state ────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('signin')

  // ── Sign In state ────────────────────────────────────────
  const [signinEmail,      setSigninEmail]      = useState('')
  const [signinPw,         setSigninPw]         = useState('')
  const [signinPwVisible,  setSigninPwVisible]  = useState(false)
  const [rememberMe,       setRememberMe]       = useState(false)
  const [signinLoading,    setSigninLoading]    = useState(false)
  const [signinError,      setSigninError]      = useState<string | null>(null)
  const [forgot,           setForgot]           = useState(false)
  const [resetEmail,       setResetEmail]       = useState('')
  const [resetSent,        setResetSent]        = useState(false)
  const [resetError,       setResetError]       = useState<string | null>(null)

  // ── Sign Up state ────────────────────────────────────────
  const [step,                       setStep]                       = useState<Step>(1)
  const [signupFirst,                setSignupFirst]                = useState('')
  const [signupLast,                 setSignupLast]                 = useState('')
  const [signupEmail,                setSignupEmail]                = useState('')
  const [signupPw,                   setSignupPw]                   = useState('')
  const [signupPwVisible,            setSignupPwVisible]            = useState(false)
  const [terms,                      setTerms]                      = useState(false)
  const [signupError,                setSignupError]                = useState<string | null>(null)
  const [signupLoading,              setSignupLoading]              = useState(false)
  const [signupSuccess,              setSignupSuccess]              = useState(false)
  const [signupSuccessNeedsConfirm,  setSignupSuccessNeedsConfirm]  = useState(false)
  const [verifyResendLoading,        setVerifyResendLoading]        = useState(false)
  const [verifyResendError,          setVerifyResendError]          = useState<string | null>(null)
  const [verifyResent,               setVerifyResent]               = useState(false)

  // ── Profile step state ───────────────────────────────────
  const [age,       setAge]       = useState('')
  const [gender,    setGender]    = useState('')
  const [weight,    setWeight]    = useState('')
  const [height,    setHeight]    = useState('')
  const [experience,setExperience]= useState('')
  const [days,      setDays]      = useState('')
  const [goal,      setGoal]      = useState<Goal>('lose_fat')
  const [equipment, setEquipment] = useState('')

  useEffect(() => {
    const verify = new URLSearchParams(location.search).get('verify')
    if (verify === '1') {
      setTab('signup')
      setSignupSuccess(true)
      setSignupSuccessNeedsConfirm(true)
    }
  }, [location.search])

  const stepLabel  = useMemo(
    () => (step === 1 ? 'Account Details' : step === 2 ? 'Your Profile' : 'Your Goal'),
    [step],
  )
  const pwStrength = useMemo(() => strengthScore(signupPw), [signupPw])

  // ── Helpers ──────────────────────────────────────────────
  function switchTab(next: Tab) {
    setTab(next)
    setSigninError(null)
    setSignupError(null)
    setForgot(false)
    setResetSent(false)
    setResetError(null)
    setVerifyResendError(null)
    setVerifyResent(false)
  }

  async function doResendVerificationEmail() {
    setVerifyResendLoading(true)
    setVerifyResendError(null)
    setVerifyResent(false)
    try {
      await resendVerificationEmail()
      setVerifyResent(true)
    } catch (e) {
      setVerifyResendError(e instanceof Error ? e.message : 'Could not resend verification email.')
    } finally {
      setVerifyResendLoading(false)
    }
  }

  // ── Sign In ──────────────────────────────────────────────
  async function doSignIn() {
    const email = signinEmail.trim()
    if (!isEmail(email) || !signinPw) {
      setSigninError('Please enter a valid email and password.')
      return
    }
    setSigninLoading(true)
    setSigninError(null)
    try {
      await signInWithPassword({ email, password: signinPw, remember: rememberMe })
      // Navigation will happen via the useEffect above when user is set
    } catch (e) {
      setSigninError(e instanceof Error ? e.message : 'Invalid email or password.')
    } finally {
      setSigninLoading(false)
    }
  }

  // ── Forgot Password ──────────────────────────────────────
  async function doReset() {
    const email = resetEmail.trim()
    if (!isEmail(email)) {
      setResetError('Please enter a valid email address.')
      return
    }
    setResetError(null)
    try {
      await resetPasswordForEmail({ email })
      setResetSent(true)
      window.setTimeout(() => {
        setForgot(false)
        setResetSent(false)
      }, 3000)
    } catch (e) {
      setResetError(e instanceof Error ? e.message : 'Could not send reset email. Try again.')
    }
  }

  // ── Sign Up step 1 → 2 ───────────────────────────────────
  function goStep2() {
    const ok =
      Boolean(signupFirst.trim()) &&
      Boolean(signupLast.trim()) &&
      isEmail(signupEmail.trim()) &&
      signupPw.length >= 8
    if (!ok) {
      setSignupError('Please fill all required fields correctly.')
      return
    }
    if (!terms) {
      setSignupError('Please accept the Terms of Service to continue.')
      return
    }
    setSignupError(null)
    setStep(2)
  }

  // ── Sign Up final submit ─────────────────────────────────
  async function doSignUp() {
    setSignupLoading(true)
    setSignupError(null)
    try {
      await signUp({ email: signupEmail.trim(), password: signupPw })

      const profile = {
        email:         signupEmail.trim(),
        first_name:    signupFirst.trim()  || null,
        last_name:     signupLast.trim()   || null,
        age:           age       ? Number(age)       : null,
        gender:        gender    || null,
        weight_kg:     weight    ? Number(weight)    : null,
        height_cm:     height    ? Number(height)    : null,
        experience:    experience || null,
        days_per_week: days      ? Number(days)      : null,
        goal,
        equipment:     equipment || null,
      }

      try {
        await upsertProfile(profile)
      } catch {
        window.localStorage.setItem('ff_pending_profile', JSON.stringify(profile))
      }

      setSignupSuccessNeedsConfirm(true)
      try { await signOut() } catch { /* ignore */ }

      setSignupSuccess(true)
    } catch (e) {
      setSignupError(e instanceof Error ? e.message : 'Could not create account.')
    } finally {
      setSignupLoading(false)
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="ff-auth">
      {/* ── LEFT PANEL ── */}
      <div className="left-panel">
        <div className="left-top">
          <a href="/" className="logo">Fit<span>Forge</span></a>
        </div>

        <div className="left-middle">
          <h1 className="left-headline">
            Your Gains.<br /><em>Quantified.</em>
          </h1>
          <p className="left-sub">
            Stop guessing in the gym. FitForge tracks every rep, detects your weak
            points, and tells you exactly when to push harder — based on your actual data.
          </p>
          <div className="left-stats">
            <div>
              <div className="left-stat-num">90%</div>
              <div className="left-stat-label">Stay Consistent</div>
            </div>
            <div>
              <div className="left-stat-num">1K+</div>
              <div className="left-stat-label">Exercises</div>
            </div>
            <div>
              <div className="left-stat-num">100%</div>
              <div className="left-stat-label">AI-Powered</div>
            </div>
          </div>
        </div>

        <div className="left-bottom">
          <div className="testimonial-quote">
            "I tried expensive personal trainers for months. FitForge gives me the
            same data-driven feedback for a fraction of the cost. My lifts are up,
            and I actually stick to my plan now."
          </div>
          <div className="testimonial-author">Tunde Bello</div>
          <div className="testimonial-role">Strength athlete · Lagos</div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="right-panel">
        <div className="auth-box">

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
              onClick={() => switchTab('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab${tab === 'signup' ? ' active' : ''}`}
              onClick={() => switchTab('signup')}
            >
              Create Account
            </button>
          </div>

          {/* ══════════════════════════════════════
              SIGN IN PANEL
          ══════════════════════════════════════ */}
          <div className={`form-panel${tab === 'signin' ? ' active' : ''}`}>
            {forgot ? (
              <div>
                <div className="form-headline">Reset Password</div>
                <p className="form-sub">
                  Enter your email and we'll send you a link to reset your password.
                </p>

                {resetError && (
                  <div className="alert error show">{resetError}</div>
                )}

                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input
                    className="field-input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void doReset() }}
                    type="email"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  className="submit-btn"
                  type="button"
                  onClick={() => void doReset()}
                >
                  {resetSent ? 'Reset Link Sent ✓' : 'Send Reset Link'}
                </button>
                <div className="switch-link">
                  <a onClick={() => { setForgot(false); setResetError(null) }}>← Back to Sign In</a>
                </div>
              </div>
            ) : (
              <div>
                <div className="form-headline">Welcome Back</div>
                <p className="form-sub">Sign in to your FitForge account to continue training.</p>

                {signinError && (
                  <div className="alert error show">{signinError}</div>
                )}

                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input
                    className={`field-input${signinError && !isEmail(signinEmail.trim()) ? ' error' : ''}`}
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void doSignIn() }}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="field-input-wrap">
                    <input
                      className={`field-input${signinError && !signinPw ? ' error' : ''}`}
                      value={signinPw}
                      onChange={(e) => setSigninPw(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void doSignIn() }}
                      type={signinPwVisible ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      className="pw-toggle"
                      type="button"
                      onClick={() => setSigninPwVisible((v) => !v)}
                    >
                      {signinPwVisible ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <a
                  href="#"
                  className="forgot-link"
                  onClick={(e) => { e.preventDefault(); setForgot(true) }}
                >
                  Forgot password?
                </a>

                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="checkbox-box" />
                  <span className="checkbox-label">Keep me signed in for 30 days</span>
                </label>

                <button
                  className={`submit-btn${signinLoading ? ' loading' : ''}`}
                  type="button"
                  disabled={signinLoading}
                  onClick={() => void doSignIn()}
                >
                  {signinLoading ? 'Signing In…' : 'Sign In to FitForge'}
                </button>

                <div className="switch-link">
                  Don't have an account?{' '}
                  <a onClick={() => switchTab('signup')}>Create one free →</a>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════
              SIGN UP PANEL
          ══════════════════════════════════════ */}
          <div className={`form-panel${tab === 'signup' ? ' active' : ''}`}>

            {!signupSuccess && (
              <div className="step-indicator">
                <div className={`step-dot${step === 1 ? ' active' : step > 1 ? ' done' : ''}`} />
                <div className={`step-dot${step === 2 ? ' active' : step > 2 ? ' done' : ''}`} />
                <div className={`step-dot${step === 3 ? ' active' : ''}`} />
                <span className="step-label">{stepLabel}</span>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {signupSuccess ? (
              <div className="success-state show">
                {signupSuccessNeedsConfirm ? (
                  <>
                    <div className="success-icon">📩</div>
                    <div className="success-title">Check your <em>email</em></div>
                    <div className="success-sub">
                      We sent a verification link to{' '}
                      <strong>{signupEmail.trim() || 'your email'}</strong>.
                      Open it to verify your account, then come back and sign in.
                    </div>

                    {verifyResendError && (
                      <div className="alert error show" style={{ marginTop: 12 }}>
                        {verifyResendError}
                      </div>
                    )}
                    {verifyResent && (
                      <div className="alert success show" style={{ marginTop: 12 }}>
                        Verification email sent.
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                      <button
                        type="button"
                        className="success-btn secondary"
                        onClick={() => void doResendVerificationEmail()}
                        disabled={verifyResendLoading}
                        style={{ flex: 1 }}
                      >
                        {verifyResendLoading ? 'Resending…' : 'Resend email'}
                      </button>
                      <button
                        type="button"
                        className="success-btn"
                        onClick={() => switchTab('signin')}
                        style={{ flex: 1 }}
                      >
                        Back to Sign In →
                      </button>
                    </div>

                    <div className="switch-link" style={{ marginTop: 12 }}>
                      Didn't get it? Check spam/junk, or wait 1–2 minutes.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="success-icon">🔥</div>
                    <div className="success-title">You're <em>In.</em></div>
                    <div className="success-sub">
                      Account created. Your AI coach is already analysing your goals. Let's build something.
                    </div>
                    <button
                      type="button"
                      className="success-btn"
                      onClick={() => navigate('/app/dashboard', { replace: true })}
                    >
                      Go to Dashboard →
                    </button>
                  </>
                )}
              </div>

            ) : step === 1 ? (
              /* ── STEP 1: Account details ── */
              <div>
                <div className="form-headline">Create Account</div>
                <p className="form-sub">Start for free. No credit card required.</p>

                {signupError && (
                  <div className="alert error show">{signupError}</div>
                )}

                <div className="field-row">
                  <div className="field">
                    <label className="field-label">First Name</label>
                    <input
                      className={`field-input${signupError && !signupFirst.trim() ? ' error' : ''}`}
                      value={signupFirst}
                      onChange={(e) => setSignupFirst(e.target.value)}
                      placeholder="Tunde"
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Last Name</label>
                    <input
                      className={`field-input${signupError && !signupLast.trim() ? ' error' : ''}`}
                      value={signupLast}
                      onChange={(e) => setSignupLast(e.target.value)}
                      placeholder="Bello"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Email Address</label>
                  <input
                    className={`field-input${signupError && !isEmail(signupEmail.trim()) ? ' error' : ''}`}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label className="field-label">Password</label>
                  <div className="field-input-wrap">
                    <input
                      className={`field-input${signupError && signupPw.length < 8 ? ' error' : ''}`}
                      value={signupPw}
                      onChange={(e) => setSignupPw(e.target.value)}
                      type={signupPwVisible ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                    />
                    <button
                      className="pw-toggle"
                      type="button"
                      onClick={() => setSignupPwVisible((v) => !v)}
                    >
                      {signupPwVisible ? '🙈' : '👁'}
                    </button>
                  </div>

                  {signupPw && (
                    <div className="pw-strength" style={{ display: 'block' }}>
                      <div className="pw-strength-bars">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`pw-bar${
                              i < pwStrength
                                ? ` ${pwStrength <= 1 ? 'weak' : pwStrength <= 3 ? 'fair' : 'strong'}`
                                : ''
                            }`}
                          />
                        ))}
                      </div>
                      <div
                        className="pw-strength-label"
                        style={{
                          color:
                            pwStrength <= 1 ? 'var(--red)'
                            : pwStrength <= 2 ? '#f59e0b'
                            : 'var(--green)',
                        }}
                      >
                        {pwStrength <= 1 ? 'Weak' : pwStrength <= 2 ? 'Fair' : pwStrength === 3 ? 'Good' : 'Strong'}
                      </div>
                    </div>
                  )}
                </div>

                <label className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                  />
                  <div className="checkbox-box" />
                  <span className="checkbox-label">
                    I agree to the <a href="#">Terms of Service</a> and{' '}
                    <a href="#">Privacy Policy</a>
                  </span>
                </label>

                <button className="submit-btn" type="button" onClick={goStep2}>
                  Continue →
                </button>

                <div className="switch-link">
                  Already have an account?{' '}
                  <a onClick={() => switchTab('signin')}>Sign in</a>
                </div>
              </div>

            ) : step === 2 ? (
              /* ── STEP 2: Body & fitness profile ── */
              <div>
                <div className="form-headline">Your Profile</div>
                <p className="form-sub">
                  Help your AI coach understand your starting point.{' '}
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>All optional.</span>
                </p>

                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Age</label>
                    <input
                      className="field-input"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      type="number"
                      placeholder="25"
                      min={13}
                      max={80}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Gender</label>
                    <select
                      className="field-select"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field">
                    <label className="field-label">Weight (kg)</label>
                    <input
                      className="field-input"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      type="number"
                      placeholder="80"
                      min={30}
                      max={300}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Height (cm)</label>
                    <input
                      className="field-input"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      type="number"
                      placeholder="175"
                      min={100}
                      max={250}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Training Experience</label>
                  <select
                    className="field-select"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option value="">Select your level</option>
                    <option value="beginner">Beginner — Less than 1 year</option>
                    <option value="intermediate">Intermediate — 1 to 3 years</option>
                    <option value="advanced">Advanced — 3+ years</option>
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">How Many Days Per Week Can You Train?</label>
                  <select
                    className="field-select"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    className="submit-btn secondary"
                    type="button"
                    style={{ flex: 0.4 }}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    className="submit-btn"
                    type="button"
                    style={{ flex: 1 }}
                    onClick={() => setStep(3)}
                  >
                    Continue →
                  </button>
                </div>

                <div className="switch-link" style={{ marginTop: 10 }}>
                  <a onClick={() => setStep(3)}>Skip for now →</a>
                </div>
              </div>

            ) : (
              /* ── STEP 3: Goal selection ── */
              <div>
                <div className="form-headline">Your Goal</div>
                <p className="form-sub">
                  Your AI coach will build your plan around this. You can change it anytime.{' '}
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>Equipment is optional.</span>
                </p>

                <div className="goal-grid">
                  {(
                    [
                      { k: 'build_muscle',    icon: '💪', name: 'Build Muscle',    desc: 'Hypertrophy & size' },
                      { k: 'get_stronger',    icon: '🏋️', name: 'Get Stronger',    desc: 'Strength & PRs' },
                      { k: 'lose_fat',        icon: '🔥', name: 'Lose Fat',         desc: 'Body recomposition' },
                      { k: 'general_fitness', icon: '⚡', name: 'General Fitness', desc: 'Health & consistency' },
                    ] as const
                  ).map((g) => (
                    <div
                      key={g.k}
                      className={`goal-card${goal === g.k ? ' selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setGoal(g.k)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setGoal(g.k) }}
                    >
                      <div className="goal-icon">{g.icon}</div>
                      <div className="goal-name">{g.name}</div>
                      <div className="goal-desc">{g.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="field">
                  <label className="field-label">Equipment Available</label>
                  <select
                    className="field-select"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="full_gym">Full Gym</option>
                    <option value="home_gym">Home Gym (Barbell + Rack)</option>
                    <option value="dumbbells">Dumbbells Only</option>
                    <option value="bodyweight">Bodyweight Only</option>
                  </select>
                </div>

                {signupError && (
                  <div className="alert error show" style={{ marginTop: 12 }}>
                    {signupError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button
                    className="submit-btn secondary"
                    type="button"
                    style={{ flex: 0.4 }}
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </button>
                  <button
                    className={`submit-btn${signupLoading ? ' loading' : ''}`}
                    type="button"
                    style={{ flex: 1 }}
                    disabled={signupLoading}
                    onClick={() => void doSignUp()}
                  >
                    {signupLoading ? 'Creating Account…' : 'Create My Account 🔥'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {/* end signup panel */}

        </div>
      </div>
    </div>
  )
}