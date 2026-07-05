import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

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
