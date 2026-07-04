import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = 'https://mknqidpqnnfdxaszfomw.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnFpZHBxbm5mZHhhc3pmb213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzc0NzAsImV4cCI6MjA5NjE1MzQ3MH0.GjCSu2gOVKnQCAXGMYb_Ts4XVJpX7sKAGIcuzFWFJAQ'

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        // Server Components are read-only; middleware handles token refresh
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name, options) {
        try { cookieStore.set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}
