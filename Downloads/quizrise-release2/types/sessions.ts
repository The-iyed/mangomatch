export interface QuizSession {
  id: string
  quiz_id: string
  admin_id: string
  title: string
  description: string | null
  duration_minutes: number
  access_code: string
  status: "pending" | "active" | "completed"
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string
}

export interface QuizSessionWithQuiz extends QuizSession {
  quiz: {
    id: string
    title: string
    description?: string
    category_id?: string
    difficulty?: string
    questions?: { count: number }[]
  }
  admin?: {
    id: string
    full_name: string
    email: string
  }
  participant_count: number
  question_count?: number
}

export interface SessionParticipant {
  id: string
  session_id: string
  user_id: string | null
  participant_name: string
  score: number
  max_score: number
  time_taken: number
  completed: boolean
  joined_at: string
  completed_at: string | null
}

export interface LeaderboardEntry extends SessionParticipant {
  rank: number
  accuracy: number
}
