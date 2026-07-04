import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const SUPABASE_URL = 'https://mknqidpqnnfdxaszfomw.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnFpZHBxbm5mZHhhc3pmb213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzc0NzAsImV4cCI6MjA5NjE1MzQ3MH0.GjCSu2gOVKnQCAXGMYb_Ts4XVJpX7sKAGIcuzFWFJAQ'

function makeClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const questionId = searchParams.get('questionId')
  if (!questionId) return NextResponse.json({ stats: [] })

  const supabase = makeClient()
  const { data } = await supabase
    .from('choice_stats')
    .select('choice_num, count')
    .eq('question_id', questionId)

  return NextResponse.json({ stats: data ?? [] }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { question_id, selected_nums } = body as {
    question_id: string
    selected_nums: number[]
  }

  if (!question_id || !Array.isArray(selected_nums) || selected_nums.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const supabase = makeClient()
  await supabase.rpc('record_choices', { q_id: question_id, c_nums: selected_nums })
  return NextResponse.json({ ok: true })
}
