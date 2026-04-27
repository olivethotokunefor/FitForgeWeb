import { useCallback, useState } from 'react'

type ChatMessage = {
  id: number
  role: 'user' | 'assistant'
  content: string
}

function buildCoachReply(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('bench')) {
    return 'For your bench plateau: keep one heavy top set at RPE 8, then do 2 to 3 back-off sets at 90% of that load. Add 2.5kg only after you hit every prescribed rep with clean bar speed.'
  }

  if (lower.includes('recovery')) {
    return 'Prioritise sleep, hydration, and an easy walk on rest days. Keep hard sets hard, but keep recovery days genuinely light so you can push performance again in your next session.'
  }

  if (lower.includes('45') || lower.includes('45-minute')) {
    return 'For a 45-minute session, run 1 main lift, 2 secondary movements, and 1 quick finisher. Rest 2 minutes on compounds, 60 to 75 seconds on accessories, and stop most sets with 1 to 2 reps in reserve.'
  }

  if (lower.includes('3 day') || lower.includes('3-day') || lower.includes('3 days')) {
    return 'A solid 3-day split is: Day 1 full body, Day 2 upper focus, Day 3 lower plus core. Build each day around one compound lift first, then add 3 to 4 accessories that match your goal.'
  }

  return 'Keep it simple: focus on one main lift, add 2 to 4 accessories, and progress either reps or load each week. If performance drops for more than two sessions in a row, reduce fatigue before adding more volume.'
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed, id: Date.now() }
    const aiMsgId = Date.now() + 1

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', id: aiMsgId }])
    setIsStreaming(true)

    try {
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 300)
      })

      const reply = buildCoachReply(trimmed)
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, content: reply } : msg)),
      )
    } finally {
      setIsStreaming(false)
    }
  }, [])

  return { messages, sendMessage, isStreaming }
}
