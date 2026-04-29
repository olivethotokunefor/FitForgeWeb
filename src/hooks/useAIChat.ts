// hooks/useAIChat.ts
import { useCallback, useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs,
  deleteDoc,
  limit
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../auth/AuthProvider'
import { useUserContext } from './useUserContext'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Timestamp
  sessionId?: string
}

export function useAIChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const userContext = useUserContext()

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // So we call useAuth, useState, useUserContext, useEffect, useCallback all upfront

  // Load chat history from Firebase (moved to top, no conditional return)
  useEffect(() => {
    // Put the conditional logic INSIDE the effect, not before calling the effect
    if (!user?.uid) return

    const storedSessionId = localStorage.getItem(`fitforge_chat_session_${user.uid}`)
    
    if (storedSessionId) {
      setSessionId(storedSessionId)
    } else {
      const newSessionId = `${user.uid}_${Date.now()}`
      setSessionId(newSessionId)
      localStorage.setItem(`fitforge_chat_session_${user.uid}`, newSessionId)
    }

    const messagesRef = collection(db, 'users', user.uid, 'chat_messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: ChatMessage[] = []
      snapshot.forEach((doc) => {
        loadedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage)
      })
      setMessages(loadedMessages)
    })

    return () => unsubscribe()
  }, [user?.uid])  // ✅ Dependency array is fine, but effect is always called

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || !user?.uid) return

    const userMsg: Omit<ChatMessage, 'id'> = {
      role: 'user',
      content: trimmed,
      createdAt: Timestamp.now(),
      sessionId: sessionId || undefined,
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'chat_messages'), userMsg)
    } catch (error) {
      console.error('Failed to save user message:', error)
    }

    setIsStreaming(true)

    try {
      const recentMessages = messages.slice(-10)
      const history = recentMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))

      const systemPrompt = `You are FitForge AI Coach, a professional fitness coach. 
You have access to the user's REAL training data below. Use it to give personalized advice.

${userContext.getContextPrompt()}

RULES:
- Use their actual numbers (volume, PRs, streak) when relevant
- If they ask about progress, reference their real data
- Keep responses encouraging but honest
- Be concise (2-4 sentences)
- Never give medical advice`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'FitForge AI Coach',
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: trimmed }
          ],
          temperature: 0.7,
          max_tokens: 1045,
        }),
      })
      
      const data = await response.json()
      const reply = data.choices?.[0]?.message?.content || "I couldn't process that. Please try again."

      const aiMsg: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content: reply,
        createdAt: Timestamp.now(),
        sessionId: sessionId || undefined,
      }

      await addDoc(collection(db, 'users', user.uid, 'chat_messages'), aiMsg)

    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMsg: Omit<ChatMessage, 'id'> = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        createdAt: Timestamp.now(),
        sessionId: sessionId || undefined,
      }
      await addDoc(collection(db, 'users', user.uid, 'chat_messages'), errorMsg)
      
    } finally {
      setIsStreaming(false)
    }
  }, [messages, user?.uid, sessionId, userContext])

  const clearHistory = useCallback(async () => {
    if (!user?.uid) return
    
    const messagesRef = collection(db, 'users', user.uid, 'chat_messages')
    const snapshot = await getDocs(messagesRef)
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    
    setMessages([])
  }, [user?.uid])

  // ✅ Return all values in the same order every time
  return { messages, sendMessage, isStreaming, userContext, clearHistory }
}