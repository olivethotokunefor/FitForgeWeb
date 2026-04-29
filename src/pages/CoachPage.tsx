// pages/CoachPage.tsx
import { useMemo, useState } from 'react'
import { useAIChat } from '../hooks/useAIChat'

export function CoachPage() {
  const [draft, setDraft] = useState('')
  const { messages, sendMessage, isStreaming, userContext, clearHistory } = useAIChat()

  const quickPrompts = useMemo(
    () => [
      'Make me a 45-minute push workout',
      'How do I break through my bench plateau?',
      'What should I do for recovery this week?',
      'Build a plan for 3 days/week strength',
    ],
    [],
  )

  // Convert messages from Firebase to display format
  const displayMessages = messages.length === 0 
    ? [{ id: 'welcome', role: 'coach' as const, text: getWelcomeMessage() }]
    : messages.map(msg => ({
        id: msg.id,
        role: msg.role === 'assistant' ? 'coach' as const : 'user' as const,
        text: msg.content
      }))

  function getWelcomeMessage() {
    if (!userContext.hasWorkouts) {
      return `👋 Welcome ${userContext.name}! I see you haven't logged any workouts yet. Log your first workout and I'll give you personalized advice based on your real data.`
    }
    
    let message = `👋 Hey ${userContext.name}! `
    if (userContext.currentStreak > 0) {
      message += `You're on a ${userContext.currentStreak} day streak - awesome! 🔥 `
    }
    if (userContext.topPRs.length > 0) {
      message += `Your ${userContext.topPRs[0].exercise_name} PR is ${userContext.topPRs[0].weight_kg}kg. `
    }
    message += `Ask me anything about your training!`
    return message
  }

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  return (
    <div className="page" id="page-coach">
      <div className="page-header">
        <h1>
          AI <em>Coach</em>
        </h1>
        <p>Personalized advice based on YOUR training data</p>
      </div>

      <div className="grid-1-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Clear history button */}
          {messages.length > 0 && (
            <div className="card">
              <button 
                className="btn btn-outline btn-sm" 
                onClick={clearHistory}
                style={{ width: '100%' }}
              >
                🗑️ Clear Chat History
              </button>
            </div>
          )}

          <div className="card accent">
            <div className="card-label">📊 Your Stats</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>Goal:</span>
                <strong>{userContext.goal?.replace(/_/g, ' ') || 'Not set'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>This month:</span>
                <strong>{Math.round(userContext.totalVolume)}kg / {userContext.totalWorkouts} workouts</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Streak:</span>
                <strong>🔥 {userContext.currentStreak} days</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-label mb-4">Quick Questions</div>
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

          {userContext.topPRs.length > 0 && (
            <div className="card">
              <div className="card-label mb-4">🏆 Your Best Lifts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {userContext.topPRs.slice(0, 3).map((pr, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{pr.exercise_name}</span>
                    <strong style={{ color: 'var(--orange)' }}>{pr.weight_kg}kg × {pr.reps}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-label mb-4">Coach Chat</div>

          <div className="chat">
            <div className="chat-log">
              {displayMessages.map((m) => (
                <div key={m.id} className={`chat-msg ${m.role === 'user' ? 'user' : ''}`}> 
                  <div className="chat-bubble">{m.text}</div>
                </div>
              ))}
              {isStreaming && (
                <div className="chat-msg">
                  <div className="chat-bubble typing-indicator">
                    <span>●</span><span>●</span><span>●</span>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-compose">
              <input
                className="input"
                value={draft}
                placeholder="Ask about training, nutrition, recovery..."
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
              />
              <button 
                type="button" 
                className="btn btn-orange btn-sm" 
                onClick={() => send(draft)}
                disabled={isStreaming || !draft.trim()}
              >
                {isStreaming ? '...' : 'Send'}
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            💬 Chat history is saved and persists across sessions
          </div>
        </div>
      </div>

      <style>{`
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 12px;
        }
        .typing-indicator span {
          animation: blink 1.4s infinite;
          font-size: 20px;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%, 60%, 100% { opacity: 0.3; }
          30% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}