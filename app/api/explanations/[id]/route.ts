import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getIsAdmin } from '@/lib/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAdmin = await getIsAdmin()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sb = createSupabaseServer()

  // 画像も先に削除
  const { data: images } = await sb
    .from('explanation_images')
    .select('image_url')
    .eq('explanation_id', params.id)

  if (images && images.length > 0) {
    const paths = images.map((img) => {
      const url = new URL(img.image_url)
      return url.pathname.split('/explanation-images/')[1]
    }).filter(Boolean)
    if (paths.length > 0) {
      await sb.storage.from('explanation-images').remove(paths)
    }
  }

  const { error } = await sb.from('explanations').delete().eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
