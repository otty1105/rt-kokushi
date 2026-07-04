import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://mknqidpqnnfdxaszfomw.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnFpZHBxbm5mZHhhc3pmb213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzc0NzAsImV4cCI6MjA5NjE1MzQ3MH0.GjCSu2gOVKnQCAXGMYb_Ts4XVJpX7sKAGIcuzFWFJAQ'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value },
      set(name, value, options) { cookieStore.set({ name, value, ...options }) },
      remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { answers, source, session_id } = body as {
    answers: { question_id: string; is_correct: boolean; selected_nums?: number[] }[]
    source: 'study' | 'test'
    session_id?: string
  }

  if (!answers || answers.length === 0) {
    return NextResponse.json({ saved: true })
  }

  const rows = answers.map((a) => ({
    user_id: user.id,
    question_id: a.question_id,
    is_correct: a.is_correct,
    selected: a.selected_nums ?? [],
    source: source ?? 'study',
    session_id: session_id ?? null,
  }))

  const { error } = await supabase.from('user_answers').insert(rows)
  if (error) {
    console.error('[answers] insert error:', error.message, error.details, error.code)
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }
  return NextResponse.json({ saved: true })
}
