import { useMemo, useState } from 'react'

type ChatMsg = { id: string; role: 'user' | 'coach'; text: string }

export function CoachPage() {
  const [draft, setDraft] = useState('')
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      id: 'c-1',
      role: 'coach',
      text:
        "I reviewed your last 3 sessions. You're repeating 80kg bench smoothly — you're ready to try 82.5kg for your top set today.",
    },
  ])

  const quickPrompts = useMemo(
    () => [
      'Make me a 45-minute push workout',
      'How do I break through my bench plateau?',
      'What should I do for recovery this week?',
      'Build a plan for 3 days/week strength',
    ],
    [],
  )

  function send(text: string) {
    const t = text.trim()
    if (!t) return

    setMsgs((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: t }])
    setDraft('')

    window.setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          id: `c-${Date.now()}`,
          role: 'coach',
          text:
            "Got it. I’d start with one heavy top set, then back-off volume. Keep rest at 2–3 minutes, and stop 1 rep shy of failure.",
        },
      ])
    }, 450)
  }

  return (
    <div className="page" id="page-coach">
      <div className="page-header">
        <h1>
          AI <em>Coach</em>
        </h1>
        <p>Ask for workout design, progression strategy, and recovery guidance.</p>
      </div>

      <div className="grid-1-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card accent">
            <div className="card-label">Today’s Focus</div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: 'var(--white)' }}>
              Your push strength is trending up. Prioritize:
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="chip warn">Top set + back-offs</div>
                <div className="chip good">Tight rest times</div>
                <div className="chip">Shoulder-friendly warmup</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-label mb-4">Quick Prompts</div>
            <div className="pill-row">
              {quickPrompts.map((p) => (
                <div
                  key={p}
                  className="pill"
                  role="button"
                  tabIndex={0}
                  onClick={() => send(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') send(p)
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-label mb-4">Coach Chat</div>

          <div className="chat">
            <div className="chat-log">
              {msgs.map((m) => (
                <div key={m.id} className={`chat-msg ${m.role === 'user' ? 'user' : ''}`}> 
                  <div className="chat-bubble">{m.text}</div>
                </div>
              ))}
            </div>

            <div className="chat-compose">
              <input
                className="input"
                value={draft}
                placeholder="Ask about training, nutrition, recovery..."
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send(draft)
                }}
              />
              <button type="button" className="btn btn-orange btn-sm" onClick={() => send(draft)}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
