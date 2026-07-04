import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?returnTo=/profile')

  return (
    <div className="py-6">
      <ProfileClient />
    </div>
  )
}
