// Firebase configuration and functions
let database: any = null

export function initializeFirebase() {
  // In a real implementation, you would initialize Firebase here
  // For demo purposes, we'll use a mock database
  if (!database) {
    database = new MockFirebaseDatabase()
  }
  return database
}

// Mock Firebase Database for demonstration
class MockFirebaseDatabase {
  private data: any = {
    sessions: {},
  }
  private listeners: Map<string, Function[]> = new Map()

  async set(path: string, value: any) {
    const pathParts = path.split("/")
    let current = this.data

    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {}
      }
      current = current[pathParts[i]]
    }

    current[pathParts[pathParts.length - 1]] = value

    // Notify listeners
    this.notifyListeners(path)
  }

  async get(path: string) {
    const pathParts = path.split("/")
    let current = this.data

    for (const part of pathParts) {
      if (!current[part]) {
        return null
      }
      current = current[part]
    }

    return current
  }

  onValue(path: string, callback: Function) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, [])
    }
    this.listeners.get(path)!.push(callback)

    // Call immediately with current data
    this.get(path).then((data) => callback(data))

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(path)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  private notifyListeners(changedPath: string) {
    // Notify all listeners that might be affected
    for (const [listenerPath, callbacks] of this.listeners.entries()) {
      if (changedPath.startsWith(listenerPath) || listenerPath.startsWith(changedPath)) {
        this.get(listenerPath).then((data) => {
          callbacks.forEach((callback) => callback(data))
        })
      }
    }
  }
}

export interface MemberData {
  nickname: string
  streak: number
}

export interface ScoreEntry {
  score: number
  note: string
}

export interface ScoreData {
  [subject: string]: ScoreEntry
}

export interface SessionData {
  members: Record<string, MemberData>
  scores: Record<string, Record<string, ScoreData>>
}

export async function createSession(): Promise<string> {
  const sessionCode = generateSessionCode()
  const db = initializeFirebase()

  await db.set(`sessions/${sessionCode}`, {
    members: {},
    scores: {},
  })

  return sessionCode
}

export async function joinSession(sessionCode: string, userId: string, nickname: string): Promise<void> {
  const db = initializeFirebase()

  // Check if session exists
  const session = await db.get(`sessions/${sessionCode}`)
  if (!session) {
    throw new Error("Session not found")
  }

  // Add member to session
  await db.set(`sessions/${sessionCode}/members/${userId}`, {
    nickname,
    streak: 0,
  })
}

export function listenToSession(sessionCode: string, callback: (data: SessionData) => void): () => void {
  const db = initializeFirebase()
  return db.onValue(`sessions/${sessionCode}`, callback)
}

export async function updateScore(
  sessionCode: string,
  userId: string,
  scores: Record<string, number>,
  notes: Record<string, string>,
): Promise<void> {
  const db = initializeFirebase()
  const today = new Date().toISOString().split("T")[0]

  // Prepare score data with notes
  const scoreData: ScoreData = {}
  Object.entries(scores).forEach(([subject, score]) => {
    scoreData[subject] = {
      score,
      note: notes[subject] || "",
    }
  })

  await db.set(`sessions/${sessionCode}/scores/${userId}/${today}`, scoreData)

  // Update streak
  const currentStreak = await calculateStreak(sessionCode, userId)
  await db.set(`sessions/${sessionCode}/members/${userId}/streak`, currentStreak)
}

export async function getTodayScores(sessionCode: string, userId: string): Promise<ScoreData> {
  const db = initializeFirebase()
  const today = new Date().toISOString().split("T")[0]

  const scores = await db.get(`sessions/${sessionCode}/scores/${userId}/${today}`)
  return scores || {}
}

async function calculateStreak(sessionCode: string, userId: string): Promise<number> {
  const db = initializeFirebase()
  const userScores = (await db.get(`sessions/${sessionCode}/scores/${userId}`)) || {}

  const dates = Object.keys(userScores).sort().reverse()
  let streak = 0
  const today = new Date()

  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i])
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === i) {
      const dayScores = userScores[dates[i]]
      const hasAnyScore = Object.values(dayScores).some((entry: any) => entry.score > 0)
      if (hasAnyScore) {
        streak++
      } else {
        break
      }
    } else {
      break
    }
  }

  return streak
}

function generateSessionCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
