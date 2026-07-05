import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { questionId, content, tags } = await req.json()
  if (!questionId || !content?.trim()) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/explanations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      question_id: questionId,
      user_id: session.user.id,
      content: content.trim(),
      tags: Array.isArray(tags) ? tags : [],
    }),
  })

  const body = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: body.message ?? body.error, code: body.code }, { status: 500 })
  }

  return NextResponse.json(Array.isArray(body) ? body[0] : body)
}
