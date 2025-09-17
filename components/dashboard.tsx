"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { listenToSession, type SessionData, type ScoreData } from "@/lib/firebase"
import { LogOut, Plus, Star, Flame } from "lucide-react"

interface DashboardProps {
  sessionCode: string
  userId: string
  nickname: string
  onLeaveSession: () => void
  onOpenLogModal: () => void
}

export function Dashboard({ sessionCode, userId, nickname, onLeaveSession, onOpenLogModal }: DashboardProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = listenToSession(sessionCode, (data) => {
      setSessionData(data)
      setLoading(false)
    })

    return unsubscribe
  }, [sessionCode])

  const getCurrentDateString = () => {
    return new Date().toISOString().split("T")[0]
  }

  const calculateWeeklyScore = (scores: Record<string, ScoreData> = {}) => {
    const today = new Date()
    const weekStart = new Date(today.setDate(today.getDate() - today.getDay()))

    let total = 0
    Object.entries(scores).forEach(([date, dayScores]) => {
      const scoreDate = new Date(date)
      if (scoreDate >= weekStart) {
        Object.values(dayScores).forEach((subject) => {
          if (typeof subject === "object" && subject.score) {
            total += subject.score
          }
        })
      }
    })
    return total
  }

  const getTodayScore = (scores: Record<string, ScoreData> = {}) => {
    const today = getCurrentDateString()
    const todayScores = scores[today]
    if (!todayScores) return 0

    let total = 0
    Object.values(todayScores).forEach((subject) => {
      if (typeof subject === "object" && subject.score) {
        total += subject.score
      }
    })
    return total
  }

  const getDailyChampion = () => {
    if (!sessionData?.members || !sessionData?.scores) return null

    let champion = null
    let highestScore = 0

    Object.entries(sessionData.members).forEach(([memberId, member]) => {
      const todayScore = getTodayScore(sessionData.scores[memberId])
      if (todayScore > highestScore) {
        highestScore = todayScore
        champion = { id: memberId, ...member, score: todayScore }
      }
    })

    return champion && champion.score > 0 ? champion : null
  }

  const getTodayLogs = (scores: Record<string, ScoreData> = {}) => {
    const today = getCurrentDateString()
    return scores[today] || {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const champion = getDailyChampion()
  const members = sessionData?.members || {}
  const scores = sessionData?.scores || {}

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mission Scholarship</h1>
          <p className="text-muted-foreground">
            Session: {sessionCode} • Welcome, {nickname}!
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenLogModal} className="btn-hover">
            <Plus className="w-4 h-4 mr-2" />
            Log Today's Progress
          </Button>
          <Button variant="outline" onClick={onLeaveSession} className="btn-hover bg-transparent">
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Daily Champion Banner */}
      {champion && (
        <Card className="champion-card animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Star className="w-8 h-8 text-yellow-400" />
              <div className="text-center">
                <h2 className="text-2xl font-bold">Daily Champion</h2>
                <p className="text-lg">
                  {champion.nickname} with {champion.score} points!
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(members).map(([memberId, member], index) => {
          const memberScores = scores[memberId] || {}
          const weeklyScore = calculateWeeklyScore(memberScores)
          const todayScore = getTodayScore(memberScores)
          const todayLogs = getTodayLogs(memberScores)
          const isChampion = champion?.id === memberId

          return (
            <Card
              key={memberId}
              className={`${isChampion ? "champion-card" : "glass-card"} animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {member.nickname}
                      {isChampion && <Star className="w-5 h-5 text-yellow-400" />}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">{member.streak || 0} day streak</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="animate-count-up">
                    {weeklyScore} pts
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly Progress</span>
                    <span>{Math.min(100, Math.round((weeklyScore / 280) * 100))}%</span>
                  </div>
                  <Progress value={Math.min(100, (weeklyScore / 280) * 100)} className="h-2" />
                </div>

                {/* Today's Logs */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Today's Progress ({todayScore} pts)</h4>
                  <div className="space-y-2">
                    {Object.entries(todayLogs).map(([subject, data]) => {
                      if (typeof data === "object" && data.score !== undefined) {
                        return (
                          <div key={subject} className="flex justify-between items-start text-sm">
                            <div className="flex-1">
                              <span className="capitalize font-medium">{subject}: </span>
                              <span className="text-primary">{data.score}/10</span>
                              {data.note && <p className="text-xs text-muted-foreground mt-1 italic">"{data.note}"</p>}
                            </div>
                          </div>
                        )
                      }
                      return null
                    })}
                    {Object.keys(todayLogs).length === 0 && (
                      <p className="text-xs text-muted-foreground">No logs yet today</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
