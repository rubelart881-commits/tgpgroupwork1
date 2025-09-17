"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createSession, joinSession } from "@/lib/firebase"

interface SessionManagerProps {
  onJoinSession: (sessionCode: string, nickname: string, userId: string) => void
}

export function SessionManager({ onJoinSession }: SessionManagerProps) {
  const [mode, setMode] = useState<"join" | "create">("join")
  const [sessionCode, setSessionCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const generateUserId = () => {
    return Math.random().toString(36).substr(2, 9)
  }

  const handleCreateSession = async () => {
    if (!nickname.trim()) {
      setError("Please enter a nickname")
      return
    }

    setLoading(true)
    setError("")

    try {
      const newSessionCode = await createSession()
      const userId = generateUserId()
      await joinSession(newSessionCode, userId, nickname.trim())
      onJoinSession(newSessionCode, nickname.trim(), userId)
    } catch (err) {
      setError("Failed to create session. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = async () => {
    if (!sessionCode.trim() || !nickname.trim()) {
      setError("Please enter both session code and nickname")
      return
    }

    setLoading(true)
    setError("")

    try {
      const userId = generateUserId()
      await joinSession(sessionCode.trim().toUpperCase(), userId, nickname.trim())
      onJoinSession(sessionCode.trim().toUpperCase(), nickname.trim(), userId)
    } catch (err) {
      setError("Failed to join session. Please check the session code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card w-full max-w-md animate-slide-up">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Mission Scholarship
        </CardTitle>
        <CardDescription className="text-muted-foreground">The Comeback - Study Journal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "join" ? "default" : "outline"}
            onClick={() => setMode("join")}
            className="flex-1 btn-hover"
          >
            Join Session
          </Button>
          <Button
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => setMode("create")}
            className="flex-1 btn-hover"
          >
            Create Session
          </Button>
        </div>

        <div className="space-y-3">
          {mode === "join" && (
            <Input
              placeholder="Enter session code (e.g., A8X2K4)"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-lg tracking-wider"
            />
          )}

          <Input
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
          />
        </div>

        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <Button
          onClick={mode === "join" ? handleJoinSession : handleCreateSession}
          disabled={loading}
          className="w-full btn-hover"
        >
          {loading ? "Loading..." : mode === "join" ? "Join Session" : "Create Session"}
        </Button>
      </CardContent>
    </Card>
  )
}
