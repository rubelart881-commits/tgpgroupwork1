"use client"

import { useState, useEffect } from "react"
import { SessionManager } from "@/components/session-manager"
import { Dashboard } from "@/components/dashboard"
import { LogModal } from "@/components/log-modal"
import { initializeFirebase } from "@/lib/firebase"

export default function Home() {
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase()

    // Check localStorage for existing session
    const savedSession = localStorage.getItem("study_session")
    const savedUserId = localStorage.getItem("user_id")
    const savedNickname = localStorage.getItem("nickname")

    if (savedSession && savedUserId && savedNickname) {
      setCurrentSession(savedSession)
      setUserId(savedUserId)
      setNickname(savedNickname)
    }
  }, [])

  const handleJoinSession = (sessionCode: string, userNickname: string, userIdGenerated: string) => {
    setCurrentSession(sessionCode)
    setUserId(userIdGenerated)
    setNickname(userNickname)

    // Save to localStorage
    localStorage.setItem("study_session", sessionCode)
    localStorage.setItem("user_id", userIdGenerated)
    localStorage.setItem("nickname", userNickname)
  }

  const handleLeaveSession = () => {
    setCurrentSession(null)
    setUserId(null)
    setNickname(null)

    // Clear localStorage
    localStorage.removeItem("study_session")
    localStorage.removeItem("user_id")
    localStorage.removeItem("nickname")
  }

  if (!currentSession || !userId || !nickname) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SessionManager onJoinSession={handleJoinSession} />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <Dashboard
        sessionCode={currentSession}
        userId={userId}
        nickname={nickname}
        onLeaveSession={handleLeaveSession}
        onOpenLogModal={() => setShowLogModal(true)}
      />

      {showLogModal && <LogModal sessionCode={currentSession} userId={userId} onClose={() => setShowLogModal(false)} />}
    </div>
  )
}
