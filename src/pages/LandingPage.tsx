import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import '../landing.css'

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const cursor = root.querySelector<HTMLDivElement>('#cursor')
    const ring = root.querySelector<HTMLDivElement>('#cursor-ring')
    const navbar = root.querySelector<HTMLElement>('#navbar')
    if (!cursor || !ring || !navbar) return

    let mx = 0
    let my = 0
    let rx = 0
    let ry = 0

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
    }

    document.addEventListener('mousemove', onMouseMove)

    let raf = 0
    const animCursor = () => {
      cursor.style.left = `${mx}px`
      cursor.style.top = `${my}px`

      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.left = `${rx}px`
      ring.style.top = `${ry}px`

      raf = requestAnimationFrame(animCursor)
    }

    raf = requestAnimationFrame(animCursor)

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40)
    }

    window.addEventListener('scroll', onScroll)
    onScroll()

    const reveals = Array.from(root.querySelectorAll<HTMLElement>('.reveal'))
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        }
      },
      { threshold: 0.15 },
    )

    reveals.forEach((el) => revealObserver.observe(el))

    const floatCards = Array.from(root.querySelectorAll<HTMLElement>('.float-card'))
    const onFloatMove = (card: HTMLElement) => (e: MouseEvent) => {
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      card.style.transform = `perspective(600px) rotateY(${x * 16}deg) rotateX(${-y * 16}deg) translateZ(12px)`
    }

    const clearTransform = (card: HTMLElement) => () => {
      card.style.transform = ''
    }

    const floatHandlers = floatCards.map((card) => {
      const move = onFloatMove(card)
      const leave = clearTransform(card)
      card.addEventListener('mousemove', move)
      card.addEventListener('mouseleave', leave)
      return { card, move, leave }
    })

    const priceCards = Array.from(root.querySelectorAll<HTMLElement>('.price-card'))
    const priceHandlers = priceCards.map((card) => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`
      }
      const leave = () => {
        card.style.transform = card.classList.contains('featured')
          ? 'translateY(-12px)'
          : ''
      }
      card.addEventListener('mousemove', move)
      card.addEventListener('mouseleave', leave)
      return { card, move, leave }
    })

    const anchorLinks = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
    )

    const onAnchorClick = (a: HTMLAnchorElement) => (e: MouseEvent) => {
      const href = a.getAttribute('href')
      if (!href) return
      const target = root.querySelector(href)
      if (!target) return
      e.preventDefault()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const anchorHandlers = anchorLinks.map((a) => {
      const handler = onAnchorClick(a)
      a.addEventListener('click', handler)
      return { a, handler }
    })

    const statNums = Array.from(root.querySelectorAll<HTMLElement>('.stat-num'))

    const animateCounter = (el: HTMLElement, target: number, suffix = '') => {
      let start = 0
      const duration = 1800

      const step = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        el.textContent = `${Math.floor(eased * target)}${suffix}`
        if (progress < 1) requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    }

    const statObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          const text = el.textContent ?? ''

          if (text.includes('%')) {
            animateCounter(el, parseInt(text, 10), '%')
          } else if (text.includes('K+')) {
            animateCounter(el, parseInt(text, 10), 'K+')
          } else if (text.includes('wk')) {
            el.textContent = '4wk'
          }

          statObserver.unobserve(el)
        }
      },
      { threshold: 0.5 },
    )

    statNums.forEach((el) => statObserver.observe(el))

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      revealObserver.disconnect()
      statObserver.disconnect()

      floatHandlers.forEach(({ card, move, leave }) => {
        card.removeEventListener('mousemove', move)
        card.removeEventListener('mouseleave', leave)
      })

      priceHandlers.forEach(({ card, move, leave }) => {
        card.removeEventListener('mousemove', move)
        card.removeEventListener('mouseleave', leave)
      })

      anchorHandlers.forEach(({ a, handler }) => {
        a.removeEventListener('click', handler)
      })
    }
  }, [])

  return (
    <div className="landing" ref={rootRef}>
      <div id="cursor" />
      <div id="cursor-ring" />

      <nav id="navbar">
        <a href="#home" className="nav-logo">
          Fit<span>Forge</span>
        </a>
        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#how">How It Works</a>
          </li>
          <li>
            <a href="#ai">AI Coach</a>
          </li>
        </ul>
        <Link to="/auth" className="nav-cta">
          Start Free Trial
        </Link>
      </nav>

      <section className="hero" id="home">
        <div className="hero-grid">
          <div className="hero-grid-inner" />
        </div>
        <div className="hero-glow" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <div className="hero-eyebrow-dot" />
            <span>AI-Powered Fitness Coaching</span>
          </div>
          <h1 className="hero-title">
            Train
            <span className="line2">Smarter.</span>
            <span className="line3">Push Harder.</span>
          </h1>
          <p className="hero-sub">
            Log workouts, track personal records, and get AI coaching tailored to
            your exact training history. Your personal trainer — at a fraction
            of the cost.
          </p>
          <div className="hero-actions">
            <Link to="/auth" className="btn-primary">
              Start Free Trial
            </Link>
            <a href="#how" className="btn-ghost">
              See How It Works
            </a>
          </div>
        </div>

        <div className="hero-stats-float">
          <div className="float-card">
            <div className="float-num">1K+</div>
            <div className="float-label">Exercises Tracked</div>
          </div>
          <div className="float-card">
            <div className="float-num">90%</div>
            <div className="float-label">Consistency Rate</div>
          </div>
          <div className="float-card">
            <div className="float-num">4+</div>
            <div className="float-label">Weeks to Results</div>
          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-track">
          {[
            'Workout Logging',
            'Personal Records',
            'AI Coaching',
            'Progress Charts',
            'Training Plans',
            'Body Metrics',
            'Smart Insights',
            'Progressive Overload',
          ]
            .concat([
              'Workout Logging',
              'Personal Records',
              'AI Coaching',
              'Progress Charts',
              'Training Plans',
              'Body Metrics',
              'Smart Insights',
              'Progressive Overload',
            ])
            .map((label, idx) => (
              <div className="marquee-item" key={`${label}-${idx}`}>
                <span>◆</span> {label}
              </div>
            ))}
        </div>
      </div>

      <section className="features" id="features">
        <div className="section-label">Core Platform Features</div>
        <h2 className="section-title reveal">
          Track Smarter,
          <br />
          <em>Lift Better</em>
        </h2>

        <div className="features-grid">
          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-number">01</div>
            <div className="feature-icon">📋</div>
            <h3 className="feature-title">Workout Logging</h3>
            <p className="feature-desc">
              Log every exercise, set, rep, and weight in seconds. FitForge
              auto-tracks your personal records and surfaces your best lifts
              without you lifting a finger.
            </p>
          </div>

          <div className="feature-card reveal reveal-delay-2">
            <div className="feature-number">02</div>
            <div className="feature-icon">📈</div>
            <h3 className="feature-title">Progress Tracking</h3>
            <p className="feature-desc">
              Visualize your strength curve over weeks and months. Volume charts,
              PR timelines, and muscle group balance — all in one clean
              dashboard.
            </p>
          </div>

          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-number">03</div>
            <div className="feature-icon">🗓</div>
            <h3 className="feature-title">Training Plans</h3>
            <p className="feature-desc">
              Build weekly training plans from our library of 200+ exercises.
              Set split structures, rest days, and session targets. The AI fills
              the gaps.
            </p>
          </div>

          <div className="feature-card reveal reveal-delay-2">
            <div className="feature-number">04</div>
            <div className="feature-icon">🔥</div>
            <h3 className="feature-title">Streak & Accountability</h3>
            <p className="feature-desc">
              A workout calendar heatmap shows your consistency at a glance.
              Streaks, weekly goals, and smart reminders keep you in the gym on
              the days that matter.
            </p>
          </div>

          <div className="feature-card wide reveal">
            <div style={{ flex: 1 }}>
              <div
                className="feature-number"
                style={{
                  position: 'relative',
                  top: 'unset',
                  right: 'unset',
                  fontSize: 48,
                  color: 'var(--orange-dim)',
                  marginBottom: 16,
                }}
              >
                05
              </div>
              <h3 className="feature-title">Body Metrics & Weight Tracking</h3>
              <p className="feature-desc" style={{ maxWidth: 400 }}>
                Log bodyweight, body fat %, and measurements over time. See how
                your composition changes as your strength increases. Real data,
                real results.
              </p>
            </div>
            <div className="feature-visual">
              <div className="fake-chart">
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--muted)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Weekly Volume (kg)
                </div>
                <div className="chart-bars">
                  <div className="chart-bar" style={{ height: '40%' }} />
                  <div className="chart-bar" style={{ height: '55%' }} />
                  <div className="chart-bar" style={{ height: '48%' }} />
                  <div className="chart-bar" style={{ height: '70%' }} />
                  <div className="chart-bar" style={{ height: '62%' }} />
                  <div className="chart-bar active" style={{ height: '88%' }} />
                  <div className="chart-bar active" style={{ height: '95%' }} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Week 1
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--orange)' }}>
                    ↑ 31% increase
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    This Week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="section-label">How It Works</div>
        <h2 className="section-title reveal">
          Three Steps to
          <br />
          <em>Unstoppable</em>
        </h2>

        <div className="steps">
          <div className="step reveal reveal-delay-1">
            <div className="step-num">01</div>
            <h3 className="step-title">Log Your Workout</h3>
            <p className="step-desc">
              After each session, open FitForge and log your exercises, sets,
              reps, and weights. Takes under 2 minutes. Every entry builds your
              coaching profile.
            </p>
          </div>
          <div className="step reveal reveal-delay-2">
            <div className="step-num">02</div>
            <h3 className="step-title">Track Your Progress</h3>
            <p className="step-desc">
              Your dashboard updates in real time. Personal records get flagged
              automatically. Charts show you exactly how your strength is
              trending across every muscle group.
            </p>
          </div>
          <div className="step reveal reveal-delay-3">
            <div className="step-num">03</div>
            <h3 className="step-title">Get AI Coaching</h3>
            <p className="step-desc">
              Your AI coach analyzes your history, detects imbalances, and tells
              you when to push harder or recover. It learns your body and adapts
              every recommendation to you.
            </p>
          </div>
        </div>
      </section>

      <section className="ai-section" id="ai">
        <div className="section-label">Your AI Coach</div>
        <h2 className="section-title reveal">
          Coaching That
          <br />
          <em>Knows You</em>
        </h2>

        <div className="ai-layout">
          <div className="ai-chat reveal">
            <div className="chat-msg user">Should I go heavier on bench today?</div>
            <div className="chat-msg ai">
              <strong>Yes — and here's why.</strong> You've hit 80kg for 3×5 in
              your last 3 sessions without missing a rep. Your recovery metrics
              look clean and you haven't deloaded in 6 weeks. Try{' '}
              <strong>82.5kg</strong> today. If you get all sets, lock it in for
              next week.
            </div>
            <div className="chat-msg user">What about my shoulder balance?</div>
            <div className="chat-msg ai">
              <strong>Your rear delts are lagging.</strong> You've logged chest
              work 3× per week but only 1 rear delt exercise in the last 30
              days. Add face pulls or band pull-aparts after your next pressing
              session. Two sets is enough to start closing the gap.
            </div>
            <div className="chat-typing">
              <div className="chat-dot" />
              <div className="chat-dot" />
              <div className="chat-dot" />
            </div>
          </div>

          <div className="ai-points">
            <div className="ai-point reveal reveal-delay-1">
              <div className="ai-point-icon">🧠</div>
              <div>
                <h4 className="ai-point-title">Knows Your History</h4>
                <p className="ai-point-desc">
                  Every recommendation is based on your actual logged data — not
                  generic advice. The AI reads your last 30 days before every
                  response.
                </p>
              </div>
            </div>
            <div className="ai-point reveal reveal-delay-2">
              <div className="ai-point-icon">⚡</div>
              <div>
                <h4 className="ai-point-title">Detects Imbalances</h4>
                <p className="ai-point-desc">
                  Muscle group volume tracking catches the imbalances that cause
                  injury before they become a problem. Push/pull ratios,
                  quad/hamstring balance, and more.
                </p>
              </div>
            </div>
            <div className="ai-point reveal reveal-delay-3">
              <div className="ai-point-icon">📊</div>
              <div>
                <h4 className="ai-point-title">Progressive Overload Engine</h4>
                <p className="ai-point-desc">
                  The AI tells you exactly when you're ready to add weight,
                  increase volume, or back off for recovery — based on your
                  performance, not a fixed schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonials">
        <div className="section-label">Real Results</div>
        <h2 className="section-title reveal">
          Lagos Lifters
          <br />
          <em>Speaking Up</em>
        </h2>

        <div className="testi-grid">
          {[{
            avatar: 'C',
            name: 'Chidi Okoro',
            role: 'Gym member, Lagos',
            text: "I was logging workouts in my notes app until I found FitForge. Now I see my actual progress week to week, and the AI tells me when to push harder or dial it back. I'm stronger than I've ever been.",
          },
          {
            avatar: 'A',
            name: 'Amara Adeyemi',
            role: 'Fitness enthusiast, Lagos',
            text: "I log my sets and the app shows me exactly what's next. No guessing, no wasted gym time. FitForge made tracking feel effortless — it's like having a coach in my pocket.",
          },
          {
            avatar: 'T',
            name: 'Tunde Bello',
            role: 'Strength athlete, Lagos',
            text: 'I tried expensive personal trainers for months. FitForge gives me the same data-driven feedback for a fraction of the cost. My lifts are up, and I actually stick to my plan now.',
          },
          {
            avatar: 'Z',
            name: 'Zainab Hassan',
            role: 'Consistent gym goer, Lagos',
            text: 'The AI recommendations caught patterns I never saw. It told me my shoulders were lagging so I adjusted my split. Three months later, I\'m balanced and feeling way better in every lift.',
          }].map((t, idx) => (
            <div
              key={t.name}
              className={`testi-card reveal ${idx % 2 === 0 ? 'reveal-delay-1' : 'reveal-delay-2'}`}
            >
              <span className="testi-quote">"</span>
              <p className="testi-text">{t.text}</p>
              <div className="testi-author">
                <div className="testi-avatar">{t.avatar}</div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="stats-band">
        {[{ num: '90%', label: 'Stay Consistent' },
        { num: '4wk', label: 'To See Results' },
        { num: '1K+', label: 'Exercises Logged' },
        { num: '100%', label: 'AI-Powered' }].map((s, idx) => (
          <div
            key={s.label}
            className={`stat-item reveal ${idx ? `reveal-delay-${idx}` : ''}`}
          >
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="pricing" id="pricing">
        <div className="section-label">Pricing</div>
        <h2 className="section-title reveal">
          FitForge is completely free
          <br />
          <em>while in beta.</em>
        </h2>
        <div style={{ display: 'grid', placeItems: 'center', marginTop: 18 }}>
          <Link to="/auth" className="price-btn">
            Get Started Free
          </Link>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-label" style={{ justifyContent: 'center' }}>
          Your AI Coach Awaits
        </div>
        <h2 className="cta-title reveal">
          Stop Guessing.
          <em>Start Forging.</em>
        </h2>
        <p className="cta-sub reveal reveal-delay-1">
          Get AI-powered workout coaching built on your training history. Start
          free. No credit card. No trainer fees. Just data-driven results.
        </p>
        <div className="cta-actions reveal reveal-delay-2">
          <Link to="/auth" className="btn-primary">
            Start Free Trial
          </Link>
          <a href="#features" className="btn-ghost">
            Explore Features
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              Fit<span>Forge</span>
            </div>
            <p className="footer-tagline">
              AI-powered fitness coaching built for Nigerian gym-goers.
              Data-driven guidance that adapts to your training history — at a
              fraction of the cost of a personal trainer.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#how">How It Works</a>
              </li>
              <li>
                <a href="#ai">AI Coach</a>
              </li>
              <li>
                <a href="#pricing">Pricing</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              <li>
                <a href="#home">About</a>
              </li>
              <li>
                <a href="#home">Blog</a>
              </li>
              <li>
                <a href="#home">Contact</a>
              </li>
              <li>
                <a href="#home">Careers</a>
              </li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Legal</div>
            <ul className="footer-links">
              <li>
                <a href="#home">Privacy Policy</a>
              </li>
              <li>
                <a href="#home">Terms of Service</a>
              </li>
              <li>
                <a href="#home">Cookie Policy</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2025 FitForge. All rights reserved.</div>
          <div className="footer-made">
            Built by <span>Oliveth</span> — Lagos, Nigeria
          </div>
        </div>
      </footer>
    </div>
  )
}
