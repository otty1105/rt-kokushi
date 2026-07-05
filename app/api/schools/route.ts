import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = cookies()
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value },
      set() {},
      remove() {},
    },
  })

  const { data, error } = await supabase
    .from('schools')
    .select('id, name, program_years, reading')
    .order('reading')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schools: data }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
