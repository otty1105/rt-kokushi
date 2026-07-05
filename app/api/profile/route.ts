import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

function makeClient() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value },
      set(name, value, options) { cookieStore.set({ name, value, ...options }) },
      remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
    },
  })
}

export async function GET() {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('id, status, school_id, grade, is_exam_year, target_year, created_at')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const nickname = (user.user_metadata?.nickname as string) ?? null
  return NextResponse.json({ profile: data ? { ...data, nickname } : null })
}

export async function PUT(request: Request) {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { nickname, status, school_id, grade, is_exam_year, target_year } = body

  if (!nickname || nickname.trim().length === 0) {
    return NextResponse.json({ error: 'ニックネームは必須です' }, { status: 400 })
  }
  if (!['student', 'kokushi_ronin', 'graduate', 'other'].includes(status)) {
    return NextResponse.json({ error: '在籍状況が不正です' }, { status: 400 })
  }

  // ニックネームはauth user_metadataに保存
  const { error: metaError } = await supabase.auth.updateUser({
    data: { nickname: nickname.trim() },
  })
  if (metaError) return NextResponse.json({ error: metaError.message }, { status: 500 })

  const isStudent = status === 'student'
  const isRonin = status === 'kokushi_ronin'

  const payload = {
    id: user.id,
    status,
    school_id: school_id ? Number(school_id) : null,
    grade: isStudent && grade ? Number(grade) : null,
    is_exam_year: isStudent ? (is_exam_year === true) : null,
    target_year: (isStudent && !is_exam_year || isRonin) && target_year ? Number(target_year) : null,
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, status, school_id, grade, is_exam_year, target_year, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: { ...data, nickname: nickname.trim() } })
}
