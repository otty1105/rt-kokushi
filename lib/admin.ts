import { createSupabaseServer } from './supabase-server'

export async function getIsAdmin(): Promise<boolean> {
  const sb = createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return false

  const { data } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return data?.is_admin === true
}
