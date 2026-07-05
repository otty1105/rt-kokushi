import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

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
