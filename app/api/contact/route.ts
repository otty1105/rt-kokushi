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
