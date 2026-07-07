import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

function isCorrect(selectCount: number, correctNums: number[], selectedNums: number[]): boolean {
  if (selectedNums.length === 0) return false
  // select_count=1 かつ正答が複数件の場合：選んだ1つが正答群に含まれていれば正解
  if (selectCount === 1 && correctNums.length > 1) {
    return selectedNums.length === 1 && correctNums.includes(selectedNums[0])
  }
  // それ以外：完全一致
  const sorted = [...correctNums].sort((a, b) => a - b)
  const selected = [...selectedNums].sort((a, b) => a - b)
  return sorted.length === selected.length && sorted.every((n, i) => n === selected[i])
}

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
  const { session_id, items } = body as {
    session_id?: string
    items: { question_id: string; selected_nums: number[] }[]
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ results: [] })
  }

  const questionIds = items.map((i) => i.question_id)
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id, select_count, correct_choices (num)')
    .in('id', questionIds)

  if (qError || !questions) {
    console.error('[test/submit] fetch questions error:', qError?.message)
    return NextResponse.json({ error: qError?.message ?? 'failed to load questions' }, { status: 500 })
  }

  const qMap = new Map(questions.map((q) => [q.id, q]))
  const itemMap = new Map(items.map((i) => [i.question_id, i]))

  const results = items.map((item) => {
    const q = qMap.get(item.question_id)
    const correctNums = (q?.correct_choices ?? []).map((c) => c.num)
    const correct = q ? isCorrect(q.select_count, correctNums, item.selected_nums) : false
    return { question_id: item.question_id, is_correct: correct, correct_nums: correctNums }
  })

  const rows = results
    .filter((r) => (itemMap.get(r.question_id)?.selected_nums.length ?? 0) > 0)
    .map((r) => ({
      user_id: user.id,
      question_id: r.question_id,
      is_correct: r.is_correct,
      selected: itemMap.get(r.question_id)!.selected_nums,
      source: 'test' as const,
      session_id: session_id ?? null,
    }))

  if (rows.length > 0) {
    const { error } = await supabase.from('user_answers').insert(rows)
    if (error) {
      console.error('[test/submit] insert error:', error.message, error.details, error.code)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
  }

  return NextResponse.json({ results })
}
