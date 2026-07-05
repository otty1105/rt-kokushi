import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function DELETE() {
  const supabase = createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Storageの解説画像を先に削除（DB行はRPC側でCASCADE削除される）
  const { data: explanations } = await supabase
    .from('explanations')
    .select('id')
    .eq('user_id', user.id)

  const explanationIds = (explanations ?? []).map((e) => e.id)

  if (explanationIds.length > 0) {
    const { data: images } = await supabase
      .from('explanation_images')
      .select('image_url')
      .in('explanation_id', explanationIds)

    const paths = (images ?? [])
      .map((img) => {
        try {
          return new URL(img.image_url).pathname.split('/explanation-images/')[1]
        } catch {
          return null
        }
      })
      .filter((p): p is string => !!p)

    if (paths.length > 0) {
      await supabase.storage.from('explanation-images').remove(paths)
    }
  }

  // auth.uid() を使うSECURITY DEFINER関数で自分のデータのみ削除（service_roleキー不使用）
  const { error } = await supabase.rpc('delete_own_account')
  if (error) {
    console.error('[account] delete error:', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
