import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value },
      set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
      remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
    },
  })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  const { name, email, category, message } = body as Record<string, string>

  if (!email || !category || !message) {
    return NextResponse.json({ error: 'required fields missing' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'message too long' }, { status: 400 })
  }

  const { error } = await supabase.from('contact_submissions').insert({
    name: name?.trim() || null,
    email: email.trim(),
    category,
    message: message.trim(),
  })

  if (error) {
    console.error('[contact] insert error:', error.message)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
