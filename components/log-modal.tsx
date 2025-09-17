"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"
import { updateScore, getTodayScores } from "@/lib/firebase"

interface LogModalProps {
  sessionCode: string
  userId: string
  onClose: () => void
}

const subjects = ["math", "english", "bangla", "science"]

export function LogModal({ sessionCode, userId, onClose }: LogModalProps) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    // Load existing scores for today
    const loadTodayScores = async () => {
      try {
        const todayScores = await getTodayScores(sessionCode, userId)
        const loadedScores: Record<string, number> = {}
        const loadedNotes: Record<string, string> = {}

        subjects.forEach((subject) => {
          if (todayScores[subject]) {
            loadedScores[subject] = todayScores[subject].score || 0
            loadedNotes[subject] = todayScores[subject].note || ""
          } else {
            loadedScores[subject] = 0
            loadedNotes[subject] = ""
          }
        })

        setScores(loadedScores)
        setNotes(loadedNotes)
      } catch (error) {
        console.error("Error loading today scores:", error)
        // Initialize with empty values
        const emptyScores: Record<string, number> = {}
        const emptyNotes: Record<string, string> = {}
        subjects.forEach((subject) => {
          emptyScores[subject] = 0
          emptyNotes[subject] = ""
        })
        setScores(emptyScores)
        setNotes(emptyNotes)
      } finally {
        setInitialLoading(false)
      }
    }

    loadTodayScores()
  }, [sessionCode, userId])

  const handleScoreChange = (subject: string, value: string) => {
    const numValue = Math.max(0, Math.min(10, Number.parseInt(value) || 0))
    setScores((prev) => ({ ...prev, [subject]: numValue }))
  }

  const handleNoteChange = (subject: string, value: string) => {
    setNotes((prev) => ({ ...prev, [subject]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await updateScore(sessionCode, userId, scores, notes)
      onClose()
    } catch (error) {
      console.error("Error updating scores:", error)
      alert("Failed to update scores. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <Card className="glass-card w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center">Loading today's progress...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Log Today's Progress</CardTitle>
              <CardDescription>Enter your scores for each subject (0-10) and optional notes</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((subject) => (
              <div key={subject} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={subject} className="text-sm font-medium capitalize">
                    {subject}
                  </Label>
                  <Input
                    id={subject}
                    type="number"
                    min="0"
                    max="10"
                    value={scores[subject] || ""}
                    onChange={(e) => handleScoreChange(subject, e.target.value)}
                    placeholder="Score (0-10)"
                    className="text-center text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${subject}-note`} className="text-xs text-muted-foreground">
                    Optional Notes
                  </Label>
                  <Textarea
                    id={`${subject}-note`}
                    value={notes[subject] || ""}
                    onChange={(e) => handleNoteChange(subject, e.target.value)}
                    placeholder="Add a note about your study session..."
                    className="min-h-[60px] text-sm"
                    maxLength={200}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium">Total Score:</span>
              <span className="text-2xl font-bold text-primary animate-count-up">{totalScore}/40</span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || totalScore === 0} className="flex-1 btn-hover">
                {loading ? "Saving..." : "Save Progress"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
