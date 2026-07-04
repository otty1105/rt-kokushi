import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mknqidpqnnfdxaszfomw.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnFpZHBxbm5mZHhhc3pmb213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzc0NzAsImV4cCI6MjA5NjE1MzQ3MH0.GjCSu2gOVKnQCAXGMYb_Ts4XVJpX7sKAGIcuzFWFJAQ'

let client: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return client
}
