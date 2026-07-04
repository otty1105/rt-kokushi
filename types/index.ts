export type Period = 'am' | 'pm'

export interface School {
  id: number
  name: string
  program_years: 3 | 4
  reading: string
}

export type UserStatus = 'student' | 'kokushi_ronin' | 'graduate' | 'other'

export interface Profile {
  id: string
  nickname: string | null
  school_id: number | null
  status: UserStatus
  grade: number | null
  is_exam_year: boolean | null
  target_year: number | null
  created_at: string
}

export interface Question {
  id: string
  year: number
  exam_num: number
  question_order: number
  category: string
  question: string
  select_count: number
  is_invalid: boolean
  image_url?: string | null
}

export interface Choice {
  id: string
  question_id: string
  num: number
  text: string
}

export interface CorrectChoice {
  id: string
  question_id: string
  num: number
}

export interface QuestionWithChoices extends Question {
  choices: Choice[]
  correct_choices: CorrectChoice[]
}

export interface UserAnswer {
  questionId: string
  selectedNums: number[]
}

export interface ExplanationImage {
  id: string
  explanation_id: string
  image_url: string
  display_order: number
  created_at: string
}

export interface Explanation {
  id: string
  question_id: string
  user_id: string
  content: string
  tags: string[]
  created_at: string
  explanation_images: ExplanationImage[]
}
